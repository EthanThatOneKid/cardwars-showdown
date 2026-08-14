import { describe, expect, it } from "bun:test";
import { Battle } from "./battle.js";
import { requireCard } from "./dex.js";
import { makeInstance } from "./side.js";
import type { Faction, PlayerId } from "./types.js";

function legalDeck(name: string, cardId: string): { name: string; cards: string[] } {
  const pool = ["cool-dog", "dragon-claw", "corn-lord", "dark-angel", "sand-knights", "albino-eyebat", "cutie", "cow"];
  const cards = Array.from({ length: 40 }, (_, i) => (i < 35 ? pool[i % pool.length] : cardId));
  return { name, cards };
}

function battleWith(p1Card = "cow", p2Card = "cow"): Battle {
  const b = new Battle({ seed: 0, skipValidation: true });
  b.start(legalDeck("p1", p1Card), legalDeck("p2", p2Card), "p1");
  return b;
}

function placeCreature(battle: Battle, player: PlayerId, cardId: string, laneIndex: number): void {
  const s = battle.state;
  const card = makeInstance(requireCard(cardId), player);
  card.lane = laneIndex;
  card.exhausted = true;
  s.sides[player].lanes[laneIndex].creature = card;
}

function toHand(battle: Battle, player: PlayerId, cardId: string): number {
  const s = battle.state;
  const card = makeInstance(requireCard(cardId), player);
  s.sides[player].hand.push(card);
  return s.sides[player].hand.length - 1;
}

function setLandscapes(battle: Battle, player: PlayerId, factions: string[]): void {
  const lanes = battle.state.sides[player].lanes;
  for (let i = 0; i < factions.length; i += 1) {
    lanes[i].landscape = { faction: factions[i] as Faction, faceDown: false };
  }
}

describe("battle actions", () => {
  it("main-phase gating: cannot play/Floop/draw before main phase", () => {
    const battle = battleWith();
    const handIndex = toHand(battle, "p1", "cow");
    expect(battle.canPlay("p1", handIndex).ok).toBe(false);
    expect(battle.canFloop("p1", 0).ok).toBe(false);
    expect(battle.drawAction("p1").ok).toBe(false);
    battle.beginTurn();
    expect(battle.canPlay("p1", handIndex).ok).toBe(true);
    expect(battle.drawAction("p1").ok).toBe(true);
  });

  it("only the active player's Creatures Fight", () => {
    const battle = battleWith();
    battle.beginTurn();
    placeCreature(battle, "p2", "cow", 0);
    expect(battle.canFight("p2", 0).ok).toBe(false);
    expect(battle.canFight("p1", 0).ok).toBe(false); // p1 lane empty
  });

  it("playCard decrements resources and tracks spells/creatures played", () => {
    const battle = battleWith();
    battle.beginTurn();
    const s = battle.state.sides.p1;
    const spellIdx = toHand(battle, "p1", "gnome-snot");
    const before = s.resources;
    const res = battle.playCard("p1", spellIdx, 0);
    expect(res.ok).toBe(true);
    expect(s.resources).toBe(before - 1);
    expect(s.spellsPlayedThisTurn).toBe(1);
    expect(s.discard.some(c => c.id === "gnome-snot")).toBe(true);
  });

  it("Hot Eyebat play restriction blocks play under 10 discard", () => {
    const battle = battleWith();
    battle.beginTurn();
    setLandscapes(battle, "p1", ["useless-swamp", "useless-swamp", "cow"]);
    const idx = toHand(battle, "p1", "hot-eyebat");
    const res = battle.canPlay("p1", idx);
    expect(res.ok).toBe(false);
    expect("reason" in res ? res.reason : "").toContain("play restriction");
  });

  it("Teeth Leaf costs 2 fewer Actions at 10+ discard", () => {
    const battle = battleWith();
    battle.beginTurn();
    setLandscapes(battle, "p1", ["useless-swamp", "useless-swamp", "cow"]);
    const s = battle.state.sides.p1;
    for (let i = 0; i < 10; i += 1) s.discard.push(makeInstance(requireCard("cow"), "p1"));
    const idx = toHand(battle, "p1", "teeth-leaf");
    const res = battle.playCard("p1", idx, 0);
    expect(res.ok).toBe(true);
    expect(s.resources).toBe(2); // 2 per turn, cost 2 -> reduced to 0
  });

  it("allows replacing a Flooped Building (Ready-restriction is creature-only)", () => {
    const battle = battleWith();
    battle.beginTurn();
    setLandscapes(battle, "p1", ["useless-swamp", "cow"]);
    const building = makeInstance(requireCard("palace-of-bone"), "p1");
    building.exhausted = true;
    building.flooped = true;
    battle.state.sides.p1.lanes[0].building = building;
    const idx = toHand(battle, "p1", "palace-of-bone");
    const res = battle.playCard("p1", idx, 0);
    expect(res.ok).toBe(true);
    expect(battle.state.sides.p1.lanes[0].building!.id).toBe("palace-of-bone");
  });

  it("cannot replace a Flooped Creature", () => {
    const battle = battleWith();
    battle.beginTurn();
    const creature = makeInstance(requireCard("cow"), "p1");
    creature.exhausted = true;
    creature.flooped = true;
    battle.state.sides.p1.lanes[0].creature = creature;
    const idx = toHand(battle, "p1", "cow");
    const res = battle.playCard("p1", idx, 0);
    expect(res.ok).toBe(false);
    expect("reason" in res ? res.reason : "").toContain("Cannot replace a Flooped");
  });

  it("Flooped defender still retaliates when attacked", () => {
    const battle = new Battle({ seed: 0, skipValidation: true });
    battle.start(legalDeck("p1", "cow"), legalDeck("p2", "cow"), "p2");
    battle.beginTurn(); // p2 (first player) turn 1
    battle.endTurn();
    battle.beginTurn(); // p1 turn 2
    placeCreature(battle, "p2", "cow", 0);
    battle.state.sides.p2.lanes[0].creature!.flooped = true;
    battle.state.sides.p2.lanes[0].creature!.exhausted = true;
    const handIdx = toHand(battle, "p1", "cow");
    const played = battle.playCard("p1", handIdx, 0);
    expect(played.ok).toBe(true);
    const before = battle.state.sides.p1.lanes[0].creature!.damage;
    const res = battle.fight("p1", 0);
    expect(res.ok).toBe(true);
    expect(battle.state.sides.p1.lanes[0].creature!.damage).toBe(before + 1);
  });
});
