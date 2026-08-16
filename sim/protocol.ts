import { Battle } from "./battle.js";
import { DEFAULT_SEED } from "./rng.js";
import { other } from "./side.js";
import type {
  BattleLogEntry,
  BattlePhase,
  CardInstance,
  DeckList,
  Faction,
  PlayerId,
} from "./types.js";

export type RequestId = number;

export type Decision =
  | { kind: "mulligan"; mulligan: boolean }
  | { kind: "playCard"; handIndex: number; lane: number }
  | { kind: "floop"; lane: number }
  | { kind: "fight"; lane: number }
  | { kind: "drawAction" }
  | { kind: "endTurn" };

/** A card as rendered on either side of the board: full details, plus an
 * `unsupported` flag so clients can declare "not yet implemented" rather than
 * pretend the rules are covered. */
export interface PublicCard {
  uid: string;
  id: string;
  name: string;
  type: CardInstance["type"];
  faction: Faction;
  actionCost: number;
  atk: number | null;
  def: number | null;
  text: string;
  damage: number;
  exhausted: boolean;
  flooped: boolean;
  lane: number | null;
  unsupported: boolean;
}

export interface LaneView {
  landscape: { faction: Faction; faceDown: boolean };
  creature: PublicCard | null;
  building: PublicCard | null;
}

export type Choice =
  | { type: "mulligan" }
  | { type: "playCard"; handIndex: number; lane: number; cardId: string; cardName: string }
  | { type: "floop"; lane: number }
  | { type: "fight"; lane: number }
  | { type: "drawAction" }
  | { type: "endTurn" };

/** The per-player snapshot a client renders from. Opponent hidden zones
 * (hand/deck) appear as counts only; board cards are public. */
export interface PlayerView {
  requestId: RequestId;
  player: PlayerId;
  turn: number;
  phase: BattlePhase;
  activePlayer: PlayerId;
  winner: PlayerId | null;
  hp: number;
  opponentHp: number;
  maxHp: number;
  resources: number;
  resourcesPerTurn: number;
  hand: PublicCard[];
  opponentHandCount: number;
  deckCount: number;
  opponentDeckCount: number;
  discardCount: number;
  opponentDiscardCount: number;
  lanes: LaneView[];
  opponentLanes: LaneView[];
  mulliganUsed: boolean;
  canMulligan: boolean;
  choices: Choice[];
}

export interface Request {
  player: PlayerId;
  requestId: RequestId;
  view: PlayerView;
}

export type ProtocolEvent =
  | { type: "log"; entries: BattleLogEntry[] }
  | { type: "request"; request: Request }
  | { type: "end"; winner: PlayerId | null };

export interface ProtocolResult {
  ok: boolean;
  error?: string;
  events: ProtocolEvent[];
}

/** The seam's authoritative record: seed + first player + the canonical
 * accepted decisions. Replaying it reproduces the same `state.log`. */
export interface InputLog {
  seed: number;
  firstPlayer: PlayerId;
  decisions: { player: PlayerId; decision: Decision }[];
}

export interface ProtocolBattleOptions {
  seed?: number;
  maxTurns?: number;
  maxHp?: number;
  resourcesPerTurn?: number;
}

export class ProtocolBattle {
  readonly battle: Battle;
  private started = false;
  private finished = false;
  private pendingMulligan = new Set<PlayerId>();
  private requestIds: Record<PlayerId, RequestId> = { p1: 0, p2: 0 };
  private lastRequests: Record<PlayerId, Request | null> = { p1: null, p2: null };
  private nextRequestId = 1;
  private lastLogLength = 0;
  private input: InputLog;

  constructor(options: ProtocolBattleOptions = {}) {
    this.battle = new Battle(options);
    this.input = { seed: options.seed ?? DEFAULT_SEED, firstPlayer: "p1", decisions: [] };
  }

  currentRequestId(player: PlayerId): RequestId {
    return this.requestIds[player];
  }

  lastRequest(player: PlayerId): Request | null {
    const req = this.lastRequests[player];
    return req ? structuredClone(req) : null;
  }

  fullLog(): BattleLogEntry[] {
    return this.battle.state.log.slice();
  }

  inputLog(): InputLog {
    return {
      seed: this.input.seed,
      firstPlayer: this.input.firstPlayer,
      decisions: this.input.decisions.map(d => ({ player: d.player, decision: structuredClone(d.decision) })),
    };
  }

  start(p1Deck: DeckList, p2Deck: DeckList, firstPlayer: PlayerId | null = null): ProtocolResult {
    if (this.started) return this.error("Battle already started.");
    try {
      this.battle.start(p1Deck, p2Deck, firstPlayer);
    } catch (err) {
      return this.error(err instanceof Error ? err.message : String(err));
    }
    this.started = true;
    this.input.firstPlayer = this.battle.state.firstPlayer;
    this.pendingMulligan = new Set(["p1", "p2"]);
    const events: ProtocolEvent[] = [...this.takeLog(), ...this.deriveRequests()];
    return { ok: true, events };
  }

  submit(player: PlayerId, decision: Decision, requestId: RequestId): ProtocolResult {
    if (!this.started) return this.error("Battle not started.");
    if (this.finished) return this.error("Battle over.");
    if (requestId !== this.requestIds[player]) return this.error("Stale request.");

    const s = this.battle.state;
    if (decision.kind !== "mulligan") {
      if (player !== s.activePlayer) return this.error("It is not your turn.");
      if (s.phase !== "main") return this.error("No decisions available in this phase.");
    }

    switch (decision.kind) {
      case "mulligan": {
        if (!this.pendingMulligan.has(player)) return this.error("No mulligan pending.");
        if (decision.mulligan && !this.battle.canMulligan(player)) {
          return this.error("Mulligan not allowed.");
        }
        if (decision.mulligan) this.battle.mulligan(player);
        this.pendingMulligan.delete(player);
        this.record(player, decision);
        if (this.pendingMulligan.size === 0) {
          this.battle.beginTurn();
          return this.dispatch();
        }
        return { ok: true, events: this.takeLog() };
      }
      case "playCard": {
        const res = this.battle.playCard(player, decision.handIndex, decision.lane);
        if (!res.ok) return this.error(res.reason);
        return this.afterDecision(player, decision);
      }
      case "floop": {
        const res = this.battle.floop(player, decision.lane);
        if (!res.ok) return this.error(res.reason);
        return this.afterDecision(player, decision);
      }
      case "fight": {
        const res = this.battle.fight(player, decision.lane);
        if (!res.ok) return this.error(res.reason);
        return this.afterDecision(player, decision);
      }
      case "drawAction": {
        const res = this.battle.drawAction(player);
        if (!res.ok) return this.error(res.reason);
        return this.afterDecision(player, decision);
      }
      case "endTurn": {
        this.battle.endTurn();
        this.record(player, decision);
        if (this.battle.state.phase === "finished") return this.end();
        this.battle.beginTurn();
        if (this.battle.isOver()) return this.end();
        return this.dispatch();
      }
    }
  }

  private afterDecision(player: PlayerId, decision: Decision): ProtocolResult {
    this.record(player, decision);
    if (this.battle.state.phase === "finished") return this.end();
    return this.dispatch();
  }

  private record(player: PlayerId, decision: Decision): void {
    this.input.decisions.push({ player, decision: structuredClone(decision) });
  }

  private dispatch(): ProtocolResult {
    return { ok: true, events: [...this.takeLog(), ...this.deriveRequests()] };
  }

  private end(): ProtocolResult {
    this.finished = true;
    return { ok: true, events: [...this.takeLog(), { type: "end", winner: this.battle.state.winner }] };
  }

  private error(message: string): ProtocolResult {
    return { ok: false, error: message, events: [] };
  }

  private takeLog(): ProtocolEvent[] {
    const entries = this.battle.state.log.slice(this.lastLogLength);
    this.lastLogLength = this.battle.state.log.length;
    return entries.length > 0 ? [{ type: "log", entries }] : [];
  }

  private deriveRequests(): ProtocolEvent[] {
    return (["p1", "p2"] as PlayerId[]).map(player => ({
      type: "request",
      request: this.buildRequest(player),
    }));
  }

  private buildRequest(player: PlayerId): Request {
    const requestId = this.nextRequestId++;
    this.requestIds[player] = requestId;
    const request = { player, requestId, view: this.buildView(player, requestId) };
    this.lastRequests[player] = request;
    return request;
  }

  private buildView(player: PlayerId, requestId: RequestId): PlayerView {
    const s = this.battle.state;
    const mine = s.sides[player];
    const theirs = s.sides[other(player)];
    return {
      requestId,
      player,
      turn: s.turn,
      phase: s.phase,
      activePlayer: s.activePlayer,
      winner: s.winner,
      hp: mine.hp,
      opponentHp: theirs.hp,
      maxHp: s.maxHp,
      resources: mine.resources,
      resourcesPerTurn: s.resourcesPerTurn,
      hand: mine.hand.map(toPublicCard),
      opponentHandCount: theirs.hand.length,
      deckCount: mine.deck.length,
      opponentDeckCount: theirs.deck.length,
      discardCount: mine.discard.length,
      opponentDiscardCount: theirs.discard.length,
      lanes: mine.lanes.map(toLaneView),
      opponentLanes: theirs.lanes.map(toLaneView),
      mulliganUsed: mine.mulliganUsed,
      canMulligan: this.battle.canMulligan(player),
      choices: this.deriveChoices(player),
    };
  }

  private deriveChoices(player: PlayerId): Choice[] {
    const s = this.battle.state;
    if (s.phase === "finished") return [];
    if (this.pendingMulligan.has(player)) return [{ type: "mulligan" }];
    if (player !== s.activePlayer || s.phase !== "main") return [];

    const choices: Choice[] = [];
    const mine = s.sides[player];
    for (let handIndex = 0; handIndex < mine.hand.length; handIndex += 1) {
      const card = mine.hand[handIndex];
      const check = this.battle.canPlay(player, handIndex);
      if (!check.ok) continue;
      if (card.type === "spell") {
        choices.push({ type: "playCard", handIndex, lane: 0, cardId: card.id, cardName: card.name });
        continue;
      }
      for (let lane = 0; lane < mine.lanes.length; lane += 1) {
        if (card.type === "creature" && mine.lanes[lane].creature?.exhausted) continue;
        choices.push({ type: "playCard", handIndex, lane, cardId: card.id, cardName: card.name });
      }
    }
    for (let lane = 0; lane < mine.lanes.length; lane += 1) {
      if (this.battle.canFloop(player, lane).ok) choices.push({ type: "floop", lane });
    }
    for (let lane = 0; lane < mine.lanes.length; lane += 1) {
      if (this.battle.canFight(player, lane).ok) choices.push({ type: "fight", lane });
    }
    if (mine.resources >= 1) choices.push({ type: "drawAction" });
    choices.push({ type: "endTurn" });
    return choices;
  }
}

/** Replays an input log against fresh decks, reproducing the same `state.log`.
 * Request IDs are transport metadata and are not part of the input log. */
export function replayBattle(input: InputLog, p1Deck: DeckList, p2Deck: DeckList): Battle {
  const pb = new ProtocolBattle({ seed: input.seed });
  const start = pb.start(p1Deck, p2Deck, input.firstPlayer);
  if (!start.ok) throw new Error(`Replay failed to start: ${start.error}`);
  for (const { player, decision } of input.decisions) {
    const res = pb.submit(player, decision, pb.currentRequestId(player));
    if (!res.ok) throw new Error(`Replay failed (${player}): ${res.error}`);
  }
  return pb.battle;
}

function toLaneView(lane: { landscape: { faction: Faction; faceDown: boolean }; creature: CardInstance | null; building: CardInstance | null }): LaneView {
  return {
    landscape: { faction: lane.landscape.faction, faceDown: lane.landscape.faceDown },
    creature: lane.creature ? toPublicCard(lane.creature) : null,
    building: lane.building ? toPublicCard(lane.building) : null,
  };
}

function toPublicCard(card: CardInstance): PublicCard {
  return {
    uid: card.uid,
    id: card.id,
    name: card.name,
    type: card.type,
    faction: card.faction,
    actionCost: card.actionCost,
    atk: card.atk,
    def: card.def,
    text: card.text,
    damage: card.damage,
    exhausted: card.exhausted,
    flooped: card.flooped,
    lane: card.lane,
    unsupported: card.abilities.some(
      a => a.kind === "unsupported" || a.effect.op === "unsupported",
    ),
  };
}
