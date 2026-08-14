import { describe, expect, it } from "bun:test";
import { Battle } from "./battle.js";
import { makeInstance } from "./side.js";
import { requireCard } from "./dex.js";
import type { PlayerId } from "./types.js";
import { generateLegalDeck, runBattle, runRunner, summarize } from "./runner.js";
import { makeRng } from "./rng.js";
import { validateDeck } from "./validate.js";

function legalDeck(name: string): { name: string; cards: string[] } {
  const pool = ["cool-dog", "dragon-claw", "heavenly-gazer", "psionic-architect", "corn-lord", "corn-ronin", "husker-worm", "dark-angel", "fatapillar", "mouthball", "sand-knights", "sandsnake", "albino-eyebat", "cutie", "cow"];
  return { name, cards: Array.from({ length: 40 }, (_, i) => pool[i % pool.length]) };
}

function placeCreature(battle: Battle, player: PlayerId, cardId: string, laneIndex: number): void {
  const s = battle.state;
  const card = makeInstance(requireCard(cardId), player);
  card.lane = laneIndex;
  card.exhausted = true;
  s.sides[player].lanes[laneIndex].creature = card;
}

function placeReady(battle: Battle, player: PlayerId, cardId: string, laneIndex: number): void {
  const s = battle.state;
  const card = makeInstance(requireCard(cardId), player);
  card.lane = laneIndex;
  card.exhausted = false;
  s.sides[player].lanes[laneIndex].creature = card;
}

describe("runner", () => {
  it("generates legal decks", () => {
    for (let i = 0; i < 20; i += 1) {
      const rng = makeRng(1000 + i);
      const deck = generateLegalDeck(rng);
      const result = validateDeck(deck);
      expect(result.ok).toBe(true);
      expect(deck.cards.length).toBeGreaterThanOrEqual(40);
    }
  });

  it("replays byte-identically for the same seed", () => {
    const d1 = legalDeck("a");
    const d2 = legalDeck("b");
    const a = runBattle(7, d1, d2, { skipValidation: true });
    const b = runBattle(7, d1, d2, { skipValidation: true });
    expect(a.error).toBeNull();
    expect(a.log).toEqual(b.log);
  });

  it("terminates and reports coverage", () => {
    const stats = runRunner({ count: 3 });
    expect(stats.battles).toBe(3);
    expect(stats.allTerminated).toBe(true);
    expect(stats.allValidated).toBe(true);
    expect(stats.coverageFailed).toEqual([]);
    expect(stats.deterministic).toBe(true);
  });

  it("summarize includes key fields", () => {
    const summary = summarize(runRunner({ count: 1 }));
    expect(summary).toContain("battles run: 1");
    expect(summary).toContain("coverage gaps: none");
  });
});

describe("scenario rulings (#27)", () => {
  function scBattle(): Battle {
    const b = new Battle({ seed: 0, skipValidation: true });
    b.start(legalDeck("a"), legalDeck("b"), "p2");
    b.beginTurn(); // p2 turn 1 (first player, Fight banned)
    b.endTurn();
    b.beginTurn(); // p1 turn 2 (active, may Fight)
    return b;
  }

  it("adjacent Cool Dogs protect each other, non-adjacent lanes free", () => {
    const battle = scBattle();
    for (let i = 0; i < 4; i += 1) placeReady(battle, "p1", "cow", i);
    placeCreature(battle, "p2", "cool-dog", 0);
    placeCreature(battle, "p2", "cool-dog", 1);
    expect(battle.canFight("p1", 0).ok).toBe(false);
    expect(battle.canFight("p1", 1).ok).toBe(false);
    expect(battle.canFight("p1", 2).ok).toBe(false); // adjacent to Cool Dog in lane 1
    expect(battle.canFight("p1", 3).ok).toBe(true);
  });

  it("Palace of Bone suppresses opposing triggers in its lane only", () => {
    const battle = scBattle();
    const palace = makeInstance(requireCard("palace-of-bone"), "p2");
    palace.lane = 0;
    battle.state.sides.p2.lanes[0].building = palace;
    placeCreature(battle, "p1", "cow", 0);
    const opp = makeInstance(requireCard("sandwitch"), "p1");
    opp.lane = 0;
    battle.state.sides.p1.lanes[0].creature = opp;
    // SandWitch triggers onEnterPlay; suppressed in lane 0 but not lane 1.
    const offLane = makeInstance(requireCard("sandwitch"), "p1");
    offLane.lane = 1;
    const { isTriggerSuppressed } = require("./events.js") as typeof import("./events.js");
    expect(isTriggerSuppressed(battle.state, opp)).toBe(true);
    expect(isTriggerSuppressed(battle.state, offLane)).toBe(false);
  });

  it("flooped defender retaliates on attack", () => {
    const battle = scBattle();
    placeCreature(battle, "p2", "cow", 0);
    battle.state.sides.p2.lanes[0].creature!.flooped = true;
    battle.state.sides.p2.lanes[0].creature!.exhausted = true;
    const hi = battle.state.sides.p1.hand.length;
    const cow = makeInstance(requireCard("cow"), "p1");
    battle.state.sides.p1.hand.push(cow);
    battle.playCard("p1", hi, 0);
    const res = battle.fight("p1", 0);
    expect(res.ok).toBe(true);
    expect(battle.state.sides.p1.lanes[0].creature!.damage).toBe(1);
  });

  it("simultaneous death destroys both creatures", () => {
    const battle = scBattle();
    placeCreature(battle, "p2", "cow", 0); // DEF 5
    battle.state.sides.p2.lanes[0].creature!.damage = 4;
    const hi = battle.state.sides.p1.hand.length;
    const attacker = makeInstance(requireCard("cow"), "p1"); // ATK 1, DEF 5
    battle.state.sides.p1.hand.push(attacker);
    battle.playCard("p1", hi, 0);
    battle.state.sides.p1.lanes[0].creature!.damage = 4;
    const res = battle.fight("p1", 0);
    expect(res.ok).toBe(true);
    expect(battle.state.sides.p1.lanes[0].creature).toBeNull();
    expect(battle.state.sides.p2.lanes[0].creature).toBeNull();
  });
});

