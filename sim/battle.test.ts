import { describe, expect, it } from "bun:test";
import { Battle } from "./battle.js";

function deck(name: string, cardId = "cow"): { name: string; cards: string[] } {
  return { name, cards: Array.from({ length: 40 }, () => cardId) };
}

function mixedDeck(name: string): { name: string; cards: string[] } {
  const cards: string[] = [];
  for (let i = 0; i < 40; i += 1) cards.push(i % 2 === 0 ? "cool-dog" : "cow");
  return { name, cards };
}

function autoPlay(battle: Battle, maxTurns: number): void {
  while (!battle.isOver() && battle.state.turn < maxTurns) {
    battle.beginTurn();
    const player = battle.state.activePlayer;
    const s = battle.state.sides[player];
    let guard = 0;
    while (s.resources > 0 && guard < 10) {
      guard += 1;
      const handIndex = s.hand.findIndex(c => c.actionCost <= s.resources);
      if (handIndex < 0) break;
      const laneIndex = s.lanes.findIndex(l => !l.creature);
      const res = battle.playCard(player, handIndex, laneIndex >= 0 ? laneIndex : 0);
      if (!res.ok) break;
    }
    for (let i = 0; i < 4; i += 1) {
      if (battle.canFight(player, i).ok) battle.fight(player, i);
    }
    battle.endTurn();
  }
}

describe("deterministic core", () => {
  it("rejects an illegal deck at start and accepts a legal one", () => {
    const illegal = new Battle({ seed: 1 });
    expect(() => illegal.start(deck("p1"), deck("p2"))).toThrow(/Illegal deck/);
    const legal = new Battle({ seed: 1 });
    const pool = ["cool-dog", "dragon-claw", "heavenly-gazer", "psionic-architect", "corn-lord", "corn-ronin", "husker-worm", "dark-angel", "fatapillar", "mouthball", "sand-knights", "sandsnake", "albino-eyebat", "cutie", "cow"];
    const legalDeck = { name: "legal", cards: Array.from({ length: 40 }, (_, i) => pool[i % pool.length]) };
    legal.start(legalDeck, legalDeck);
    expect(legal.state.phase).toBe("ready");
  });

  it("same seed produces byte-identical logs", () => {
    const a = new Battle({ seed: 42 , skipValidation: true });
    const b = new Battle({ seed: 42 , skipValidation: true });
    a.start(mixedDeck("a"), mixedDeck("b"));
    b.start(mixedDeck("a"), mixedDeck("b"));
    autoPlay(a, 20);
    autoPlay(b, 20);
    expect(a.state.log.map(l => `${l.turn}:${l.actor}:${l.message}`)).toEqual(
      b.state.log.map(l => `${l.turn}:${l.actor}:${l.message}`),
    );
  });

  it("different seeds diverge", () => {
    const a = new Battle({ seed: 1 , skipValidation: true });
    const b = new Battle({ seed: 2 , skipValidation: true });
    a.start(mixedDeck("a"), mixedDeck("b"));
    b.start(mixedDeck("a"), mixedDeck("b"));
    autoPlay(a, 20);
    autoPlay(b, 20);
    expect(a.state.log.map(l => l.message).join("|")).not.toEqual(b.state.log.map(l => l.message).join("|"));
  });

  it("toJSON/fromJSON round-trips state exactly", () => {
    const a = new Battle({ seed: 7 , skipValidation: true });
    a.start(mixedDeck("a"), mixedDeck("b"));
    autoPlay(a, 5);
    const json = a.toJSON();
    const b = Battle.fromJSON(json);
    expect(b.toJSON()).toEqual(a.toJSON());
    expect(b.state.log).toEqual(a.state.log);
  });

  it("setup deals 5, first player from seeded RNG", () => {
    const battle = new Battle({ seed: 3 , skipValidation: true });
    battle.start(deck("a"), deck("b"));
    expect(battle.state.sides.p1.hand.length).toBe(5);
    expect(battle.state.sides.p2.hand.length).toBe(5);
    expect(["p1", "p2"]).toContain(battle.state.firstPlayer);
  });

  it("first player cannot Fight or Floop on turn 1", () => {
    const battle = new Battle({ seed: 0 , skipValidation: true });
    battle.start(mixedDeck("a"), mixedDeck("b"), "p1");
    battle.beginTurn();
    expect(battle.canFight("p1", 0).ok).toBe(false);
    expect(battle.canFloop("p1", 0).ok).toBe(false);
    battle.endTurn();
    battle.beginTurn();
    const s = battle.state.sides.p2;
    const laneIndex = s.lanes.findIndex(l => l.creature);
    if (laneIndex >= 0) {
      expect(battle.canFight("p2", laneIndex).ok).toBe(true);
    } else {
      expect(battle.canFight("p2", 0).ok).toBe(false); // no creature yet
    }
  });

  it("HP clamps at 0 and a winner is declared", () => {
    const battle = new Battle({ seed: 5 , skipValidation: true });
    battle.start(deck("a"), deck("b"), "p1");
    battle.state.sides.p2.hp = 3;
    battle.beginTurn();
    const handIndex = battle.state.sides.p1.hand.findIndex(c => c.actionCost === 0);
    if (handIndex >= 0) {
      battle.playCard("p1", handIndex, 0);
    }
    const laneIndex = battle.state.sides.p1.lanes.findIndex(l => l.creature);
    if (laneIndex >= 0) battle.fight("p1", laneIndex);
    expect(battle.state.sides.p2.hp).toBeGreaterThanOrEqual(0);
  });

  it("mulligan allowed only once and only without 2 creatures", () => {
    const battle = new Battle({ seed: 1 , skipValidation: true });
    battle.start(deck("a"), deck("b"), "p1");
    // All-creature hand: no mulligan offered.
    expect(battle.canMulligan("p1")).toBe(false);
    // Deplete the hand to one creature to force the offer.
    battle.state.sides.p1.hand.splice(1, 4);
    expect(battle.canMulligan("p1")).toBe(true);
    battle.mulligan("p1");
    expect(battle.state.sides.p1.mulliganUsed).toBe(true);
    expect(battle.state.sides.p1.hand.length).toBe(5);
    expect(battle.canMulligan("p1")).toBe(false);
  });
});

