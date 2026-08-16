import { serve } from "bun";
import type { Server, ServerWebSocket, WebSocketHandler } from "bun";
import { ProtocolBattle } from "../sim/protocol.js";
import type { Decision, ProtocolEvent } from "../sim/protocol.js";
import { other } from "../sim/side.js";
import type { DeckList, PlayerId } from "../sim/types.js";
import { validateDeck } from "../sim/validate.js";
import { decodeWire, encodeWire } from "../sim/wire.js";
import type { WireMessage } from "../sim/wire.js";

export interface RelayOptions {
  /** Port to listen on. `0` picks an ephemeral port (used by tests). */
  port?: number;
  hostname?: string;
  /** Grace window before a disconnected mid-game player loses by abandonment. */
  reconnectGraceMs?: number;
  /** Seed for the authoritative battle (defaults to the engine's default). */
  seed?: number;
}

interface Slot {
  ws: ServerWebSocket | null;
  deck: DeckList | null;
  disconnectedAt: number | null;
  graceTimer: ReturnType<typeof setTimeout> | null;
}

const PLAYERS: PlayerId[] = ["p1", "p2"];

function emptySlot(): Slot {
  return { ws: null, deck: null, disconnectedAt: null, graceTimer: null };
}

/** One authoritative battle between two connections. Only one room exists at a
 * time in v1 (the map's "one singles battle" increment): first connection = p1,
 * second = p2, and a mid-game reconnect resumes the disconnected slot. */
class Room {
  battle: ProtocolBattle | null = null;
  started = false;
  done = false;
  slots: Record<PlayerId, Slot> = { p1: emptySlot(), p2: emptySlot() };

  constructor(readonly seed?: number) {}

  start(): void {
    const p1Deck = this.slots.p1.deck;
    const p2Deck = this.slots.p2.deck;
    if (!p1Deck || !p2Deck) return;
    this.battle = new ProtocolBattle({ seed: this.seed });
    // firstPlayer is null → the seeded RNG decides, as the engine already does.
    const result = this.battle.start(p1Deck, p2Deck, null);
    this.started = true;
    if (!result.ok) {
      // Decks were pre-validated, so this should not happen; treat as no-op.
      this.done = true;
      return;
    }
    this.started = true;
    this.broadcastEvents(result.events);
  }

  broadcastEvents(events: ProtocolEvent[]): void {
    for (const ev of events) {
      if (ev.type === "log") {
        for (const player of PLAYERS) {
          const ws = this.slots[player].ws;
          if (ws) this.send(ws, { type: "log", entries: ev.entries });
        }
      } else if (ev.type === "request") {
        const ws = this.slots[ev.request.player].ws;
        if (ws) this.send(ws, { type: "request", request: ev.request });
      } else if (ev.type === "end") {
        for (const player of PLAYERS) {
          const ws = this.slots[player].ws;
          if (ws) this.send(ws, { type: "end", winner: ev.winner });
        }
        this.done = true;
      }
    }
  }

  send(ws: ServerWebSocket, message: WireMessage): void {
    ws.send(encodeWire(message));
  }
}

export class Relay {
  private room: Room | null = null;

  constructor(private readonly options: RelayOptions = {}) {}

  graceMs(): number {
    return this.options.reconnectGraceMs ?? 60_000;
  }

  /** Fixed seed when `options.seed` is set; otherwise a fresh random seed per
   * room so successive games differ. Either way the seed lands in the input
   * log, so replay determinism is preserved. */
  private nextSeed(): number {
    return this.options.seed ?? Math.floor(Math.random() * 0xffffffff);
  }

  /** Test introspection: which player (if any) is mid-grace and disconnected. */
  disconnectedPlayer(): PlayerId | null {
    const room = this.room;
    if (!room) return null;
    for (const player of PLAYERS) {
      const slot = room.slots[player];
      if (slot.ws === null && slot.disconnectedAt !== null) return player;
    }
    return null;
  }

  onOpen(ws: ServerWebSocket): void {
    const room = this.room;
    if (!room || room.done) {
      this.room = new Room(this.nextSeed());
      this.attach(this.room, "p1", ws);
      return;
    }
    if (this.resumeDisconnected(room, ws)) return;
    const p2 = room.slots.p2;
    if (p2.ws === null && p2.deck === null && p2.disconnectedAt === null) {
      this.attach(room, "p2", ws);
      return;
    }
    room.send(ws, { type: "error", code: "room-full", message: "The room is full." });
    ws.close(4000, "room full");
  }

  onMessage(ws: ServerWebSocket, raw: string): void {
    const room = this.room;
    if (!room || room.done) return;
    const player = this.playerOf(room, ws);
    if (!player) return;

    let message: WireMessage;
    try {
      message = decodeWire(raw);
    } catch {
      room.send(ws, { type: "error", code: "malformed", message: "Malformed message." });
      return;
    }

    if (message.type === "ready") {
      this.onReady(room, player, ws, message.deck);
    } else if (message.type === "decision") {
      this.onDecision(room, player, ws, message.requestId, message.decision);
    }
    // request/log/end/error are server → client only; ignore anything else.
  }

  onClose(ws: ServerWebSocket): void {
    const room = this.room;
    if (!room) return;
    const player = this.playerOf(room, ws);
    if (!player) return;
    const slot = room.slots[player];
    if (slot.ws !== ws) return; // already replaced by a reconnect
    slot.ws = null;

    if (room.done) return;

    if (!room.started) {
      // Before the battle starts there is nothing to preserve: free the slot.
      if (player === "p1") {
        // p1 left before start — abandon the whole room so the next connection
        // begins a fresh game as p1.
        const p2ws = room.slots.p2.ws;
        room.done = true;
        this.room = null;
        if (p2ws) p2ws.close(4000, "opponent left");
      } else {
        room.slots.p2.deck = null;
        room.slots.p2.disconnectedAt = null;
      }
      return;
    }

    slot.disconnectedAt = Date.now();
    slot.graceTimer = setTimeout(() => this.onGraceExpiry(room, player), this.graceMs());
  }

  private onGraceExpiry(room: Room, player: PlayerId): void {
    if (this.room !== room) return; // room was torn down meanwhile
    const slot = room.slots[player];
    slot.graceTimer = null;
    if (slot.ws !== null) return; // reconnected before expiry
    if (room.done) return;
    const winner = other(player);
    for (const p of PLAYERS) {
      const ws = room.slots[p].ws;
      if (ws) room.send(ws, { type: "end", winner });
    }
    room.done = true;
    this.room = null;
  }

  private onReady(room: Room, player: PlayerId, ws: ServerWebSocket, deck: DeckList): void {
    if (room.started) return; // resync already covers a reconnecting player
    const result = validateDeck(deck);
    const errors = result.issues.filter(issue => issue.severity === "error");
    if (errors.length > 0) {
      room.send(ws, {
        type: "error",
        code: "invalid-deck",
        message: "Illegal deck.",
        issues: result.issues,
      });
      return;
    }
    room.slots[player].deck = deck;
    if (room.slots.p1.deck && room.slots.p2.deck && room.slots.p1.ws && room.slots.p2.ws) {
      room.start();
    }
  }

  private onDecision(
    room: Room,
    player: PlayerId,
    ws: ServerWebSocket,
    requestId: number,
    decision: Decision,
  ): void {
    const battle = room.battle;
    if (!room.started || !battle) {
      room.send(ws, { type: "error", code: "invalid-decision", message: "Battle not started." });
      return;
    }
    if (requestId !== battle.currentRequestId(player)) {
      room.send(ws, { type: "error", code: "stale-request", message: "Stale request id." });
      return;
    }
    const result = battle.submit(player, decision, requestId);
    if (!result.ok) {
      room.send(ws, { type: "error", code: "invalid-decision", message: result.error ?? "Invalid decision." });
      return;
    }
    room.broadcastEvents(result.events);
    if (room.done) this.room = null;
  }

  private attach(room: Room, player: PlayerId, ws: ServerWebSocket): void {
    room.slots[player].ws = ws;
    room.slots[player].disconnectedAt = null;
  }

  private resumeDisconnected(room: Room, ws: ServerWebSocket): boolean {
    let candidate: PlayerId | null = null;
    for (const player of PLAYERS) {
      const slot = room.slots[player];
      if (slot.ws !== null || slot.disconnectedAt === null) continue;
      if (candidate === null || slot.disconnectedAt < room.slots[candidate].disconnectedAt!) {
        candidate = player;
      }
    }
    if (!candidate) return false;
    const slot = room.slots[candidate];
    if (slot.graceTimer) {
      clearTimeout(slot.graceTimer);
      slot.graceTimer = null;
    }
    this.attach(room, candidate, ws);
    this.resync(room, candidate);
    return true;
  }

  /** Reconnect seam (#38/#42): resend the cumulative log, then the player's
   * last request, in that order. */
  private resync(room: Room, player: PlayerId): void {
    const battle = room.battle;
    const ws = room.slots[player].ws;
    if (!room.started || !battle || !ws) return;
    room.send(ws, { type: "log", entries: battle.fullLog() });
    const last = battle.lastRequest(player);
    if (last) room.send(ws, { type: "request", request: last });
  }

  private playerOf(room: Room, ws: ServerWebSocket): PlayerId | null {
    for (const player of PLAYERS) {
      if (room.slots[player].ws === ws) return player;
    }
    return null;
  }
}

export interface RelayServerHandle {
  server: Server<undefined>;
  relay: Relay;
  port: number;
  url: string;
  close(): Promise<void>;
}

/** Boot a WebSocket-only relay server (no static assets). Used directly by
 * tests and by `server/index.ts` when it composes the static client on top. */
export function startRelayServer(options: RelayOptions = {}): RelayServerHandle {
  const relay = new Relay(options);
  const server = serve({
    port: options.port ?? 8000,
    hostname: options.hostname ?? "localhost",
    fetch(req, srv) {
      if (srv.upgrade(req)) return;
      return new Response("Not Found", { status: 404 });
    },
    websocket: {
      open: ws => relay.onOpen(ws),
      message: (ws, message) => relay.onMessage(ws, String(message)),
      close: ws => relay.onClose(ws),
    } satisfies WebSocketHandler<undefined>,
  });
  return {
    server,
    relay,
    port: server.port ?? 8000,
    url: `ws://localhost:${server.port ?? 8000}`,
    close: () => server.stop(true),
  };
}
