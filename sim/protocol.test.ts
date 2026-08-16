import { describe, expect, it } from "bun:test";
import { cardPool, requireCard } from "./dex.js";
import { ProtocolBattle, replayBattle } from "./protocol.js";
import type {
  Decision,
  InputLog,
  PlayerView,
  ProtocolEvent,
  PublicCard,
  Request,
} from "./protocol.js";
import { makeRng } from "./rng.js";
import { generateLegalDeck } from "./runner.js";
import type { BattleLogEntry, BattleState, DeckList, PlayerId } from "./types.js";

function legalDecks(seed: number): { p1: DeckList; p2: DeckList } {
  const rng = makeRng(seed);
  return { p1: generateLegalDeck(rng), p2: generateLegalDeck(rng) };
}

interface FullGameOptions {
  maxTurns?: number;
  onRequest?: (view: PlayerView, state: BattleState) => void;
}

interface FullGameResult {
  winner: PlayerId | null;
  turn: number;
  ended: boolean;
  log: BattleLogEntry[];
  input: InputLog;
  p1Deck: DeckList;
  p2Deck: DeckList;
  p1Views: PlayerView[];
  p2Views: PlayerView[];
}

function playFullGame(seed: number, options: FullGameOptions = {}): FullGameResult {
  const { p1: p1Deck, p2: p2Deck } = legalDecks(seed);
  const pb = new ProtocolBattle({ seed, maxTurns: options.maxTurns });
  const start = pb.start(p1Deck, p2Deck, "p1");
  expect(start.ok).toBe(true);

  const latest: Record<PlayerId, Request | null> = { p1: null, p2: null };
  const p1Views: PlayerView[] = [];
  const p2Views: PlayerView[] = [];
  const mulliganed = new Set<PlayerId>();
  let winner: PlayerId | null = null;
  let ended = false;
  let guard = 0;

  const apply = (res: { events: ProtocolEvent[] }): void => {
    for (const ev of res.events) {
      if (ev.type === "request") {
        latest[ev.request.player] = ev.request;
        const views = ev.request.player === "p1" ? p1Views : p2Views;
        views.push(ev.request.view);
        options.onRequest?.(ev.request.view, pb.battle.state);
      } else if (ev.type === "end") {
        ended = true;
        winner = ev.winner;
      }
    }
  };
  apply(start);

  while (!ended && guard++ < 20_000) {
    if (!mulliganed.has("p1") && latest.p1?.view.choices.some(c => c.type === "mulligan")) {
      const req = latest.p1;
      const decision: Decision = { kind: "mulligan", mulligan: req.view.canMulligan };
      const res = pb.submit("p1", decision, req.requestId);
      expect(res.ok).toBe(true);
      mulliganed.add("p1");
      apply(res);
      continue;
    }
    if (!mulliganed.has("p2") && latest.p2?.view.choices.some(c => c.type === "mulligan")) {
      const req = latest.p2;
      const decision: Decision = { kind: "mulligan", mulligan: req.view.canMulligan };
      const res = pb.submit("p2", decision, req.requestId);
      expect(res.ok).toBe(true);
      mulliganed.add("p2");
      apply(res);
      continue;
    }
    const active = pb.battle.state.activePlayer;
    const req = latest[active];
    if (!req || req.view.choices.length === 0) break;
    const choice = req.view.choices[0];
    let decision: Decision;
    if (choice.type === "playCard") decision = { kind: "playCard", handIndex: choice.handIndex, lane: choice.lane };
    else if (choice.type === "floop") decision = { kind: "floop", lane: choice.lane };
    else if (choice.type === "fight") decision = { kind: "fight", lane: choice.lane };
    else if (choice.type === "drawAction") decision = { kind: "drawAction" };
    else decision = { kind: "endTurn" };
    const res = pb.submit(req.view.player, decision, req.requestId);
    expect(res.ok).toBe(true);
    apply(res);
  }

  return {
    winner,
    turn: pb.battle.state.turn,
    ended,
    log: pb.battle.state.log,
    input: pb.inputLog(),
    p1Deck,
    p2Deck,
    p1Views,
    p2Views,
  };
}

function hasUnsupportedAbility(cardId: string): boolean {
  const card = requireCard(cardId);
  return card.abilities.some(a => a.kind === "unsupported" || a.effect.op === "unsupported");
}

function uidsInView(view: PlayerView): Set<string> {
  const uids = new Set<string>();
  for (const c of view.hand) uids.add(c.uid);
  for (const lane of view.lanes) {
    if (lane.creature) uids.add(lane.creature.uid);
    if (lane.building) uids.add(lane.building.uid);
  }
  for (const lane of view.opponentLanes) {
    if (lane.creature) uids.add(lane.creature.uid);
    if (lane.building) uids.add(lane.building.uid);
  }
  return uids;
}

describe("protocol seam", () => {
  it("issues mulligan requests to both players before turn 1", () => {
    const { p1: p1Deck, p2: p2Deck } = legalDecks(1);
    const pb = new ProtocolBattle({ seed: 1 });
    const start = pb.start(p1Deck, p2Deck, "p1");
    expect(start.ok).toBe(true);
    const requests = start.events.filter((e): e is Extract<ProtocolEvent, { type: "request" }> => e.type === "request");
    expect(requests).toHaveLength(2);
    for (const req of requests) {
      expect(req.request.view.turn).toBe(0);
      expect(req.request.view.phase).toBe("ready");
      expect(req.request.view.choices).toEqual([{ type: "mulligan" }]);
      expect(req.request.requestId).toBeGreaterThan(0);
    }
    expect(requests[0].request.view.player).toBe("p1");
    expect(requests[1].request.view.player).toBe("p2");
  });

  it("derives a main-phase request after both mulligans resolve", () => {
    const { p1: p1Deck, p2: p2Deck } = legalDecks(2);
    const pb = new ProtocolBattle({ seed: 2 });
    const start = pb.start(p1Deck, p2Deck, "p1");
    const p1req = start.events.find((e): e is Extract<ProtocolEvent, { type: "request" }> => e.type === "request" && e.request.player === "p1");
    const p2req = start.events.find((e): e is Extract<ProtocolEvent, { type: "request" }> => e.type === "request" && e.request.player === "p2");
    expect(p1req && p2req).toBeTruthy();

    const r1 = pb.submit("p1", { kind: "mulligan", mulligan: false }, p1req!.request.requestId);
    expect(r1.ok).toBe(true);
    // p1's request is not re-issued until both mulligans resolve
    expect(r1.events.some(e => e.type === "request" && e.request.player === "p1")).toBe(false);
    expect(pb.currentRequestId("p1")).toBe(p1req!.request.requestId);

    const r2 = pb.submit("p2", { kind: "mulligan", mulligan: false }, p2req!.request.requestId);
    expect(r2.ok).toBe(true);
    const requests = r2.events.filter((e): e is Extract<ProtocolEvent, { type: "request" }> => e.type === "request");
    expect(requests).toHaveLength(2);
    const p1main = requests.find(r => r.request.player === "p1")!.request;
    expect(p1main.view.phase).toBe("main");
    expect(p1main.view.turn).toBe(1);
    expect(p1main.view.choices.some(c => c.type === "endTurn")).toBe(true);
    expect(p1main.view.hand.length).toBeGreaterThanOrEqual(5);
    const p2wait = requests.find(r => r.request.player === "p2")!.request;
    expect(p2wait.view.choices).toEqual([]);
    expect(p2wait.view.opponentHandCount).toBe(p1main.view.hand.length);
  });

  it("gates decisions to the active player", () => {
    const { p1: p1Deck, p2: p2Deck } = legalDecks(3);
    const pb = new ProtocolBattle({ seed: 3 });
    const start = pb.start(p1Deck, p2Deck, "p1");
    const p1req = start.events.find((e): e is Extract<ProtocolEvent, { type: "request" }> => e.type === "request" && e.request.player === "p1");
    const p2req = start.events.find((e): e is Extract<ProtocolEvent, { type: "request" }> => e.type === "request" && e.request.player === "p2");
    expect(p1req && p2req).toBeTruthy();
    expect(pb.submit("p1", { kind: "mulligan", mulligan: false }, p1req!.request.requestId).ok).toBe(true);
    expect(pb.submit("p2", { kind: "mulligan", mulligan: false }, p2req!.request.requestId).ok).toBe(true);

    const res = pb.submit("p2", { kind: "endTurn" }, pb.currentRequestId("p2"));
    expect(res.ok).toBe(false);
    expect(res.error).toContain("not your turn");
  });

  it("rejects stale request IDs", () => {
    const { p1: p1Deck, p2: p2Deck } = legalDecks(4);
    const pb = new ProtocolBattle({ seed: 4 });
    const start = pb.start(p1Deck, p2Deck, "p1");
    const p1req = start.events.find((e): e is Extract<ProtocolEvent, { type: "request" }> => e.type === "request" && e.request.player === "p1");
    expect(p1req).toBeTruthy();
    const res = pb.submit("p1", { kind: "mulligan", mulligan: false }, p1req!.request.requestId + 7);
    expect(res.ok).toBe(false);
    expect(res.error).toContain("Stale");
  });

  it("never serializes the opponent's hand or deck cards", () => {
    const leaks: string[] = [];
    playFullGame(5, {
      onRequest: (view, state) => {
        const theirs = state.sides[view.player === "p1" ? "p2" : "p1"];
        const hidden = new Set<string>();
        for (const c of theirs.hand) hidden.add(c.uid);
        for (const c of theirs.deck) hidden.add(c.uid);
        for (const uid of uidsInView(view)) {
          if (hidden.has(uid)) leaks.push(`${view.player} saw ${uid} (${state.turn})`);
        }
        expect(view.opponentHandCount).toBe(theirs.hand.length);
        expect(view.opponentDeckCount).toBe(theirs.deck.length);
      },
    });
    expect(leaks).toEqual([]);
  });

  it("flags unsupported cards in every view", () => {
    const unsupportedIds = new Set(cardPool().filter(c => hasUnsupportedAbility(c.id)).map(c => c.id));
    expect(unsupportedIds.size).toBeGreaterThan(0);
    const check = (cards: PublicCard[]): void => {
      for (const c of cards) expect(c.unsupported).toBe(unsupportedIds.has(c.id));
    };
    playFullGame(6, {
      onRequest: (view) => {
        check(view.hand);
        for (const lane of [...view.lanes, ...view.opponentLanes]) {
          if (lane.creature) check([lane.creature]);
          if (lane.building) check([lane.building]);
        }
      },
    });
  });

  it("exposes the opponent's public hp without leaking hidden zones", () => {
    playFullGame(11, {
      onRequest: (view, state) => {
        const theirs = state.sides[view.player === "p1" ? "p2" : "p1"];
        expect(view.opponentHp).toBe(theirs.hp);
      },
    });
  });

  it("tracks lastRequest per player through dispatch", () => {
    const run = playFullGame(8);
    const pb = new ProtocolBattle({ seed: 8 });
    pb.start(run.p1Deck, run.p2Deck, "p1");
    const lastSeen: Record<PlayerId, Request | null> = { p1: null, p2: null };
    for (const { player, decision } of run.input.decisions) {
      const res = pb.submit(player, decision, pb.currentRequestId(player));
      expect(res.ok).toBe(true);
      for (const ev of res.events) {
        if (ev.type === "request") {
          lastSeen[ev.request.player] = ev.request;
          const last = pb.lastRequest(ev.request.player);
          expect(last).toEqual(ev.request);
        }
      }
    }
    expect(pb.lastRequest("p1")).toEqual(lastSeen.p1);
    expect(pb.lastRequest("p2")).toEqual(lastSeen.p2);
  });

  it("fullLog returns cumulative narrative log at game end", () => {
    const run = playFullGame(9);
    const pb = new ProtocolBattle({ seed: 9 });
    pb.start(run.p1Deck, run.p2Deck, "p1");
    for (const { player, decision } of run.input.decisions) {
      pb.submit(player, decision, pb.currentRequestId(player));
    }
    expect(pb.fullLog()).toEqual(run.log);
  });

  it("replays resynced input log to byte-identical state.log", () => {
    const run = playFullGame(10);
    const replayed = replayBattle(run.input, run.p1Deck, run.p2Deck);
    expect(replayed.state.log).toEqual(run.log);
    expect(replayed.state.winner).toBe(run.winner);
  });

  it("plays a full game via decisions and replays to the same state.log", () => {
    const run = playFullGame(7);
    expect(run.ended).toBe(true);
    expect(run.log.length).toBeGreaterThan(0);
    expect(run.input.decisions.length).toBeGreaterThan(0);
    expect(run.input.firstPlayer).toBe("p1");
    expect(run.p1Views.length).toBeGreaterThan(0);
    expect(run.p2Views.length).toBeGreaterThan(0);

    const replayed = replayBattle(run.input, run.p1Deck, run.p2Deck);
    expect(replayed.state.log).toEqual(run.log);
    expect(replayed.state.winner).toBe(run.winner);
    expect(replayed.state.turn).toBe(run.turn);
  });
});
