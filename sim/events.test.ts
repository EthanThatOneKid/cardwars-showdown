import { describe, expect, it } from "bun:test";
import { Battle } from "./battle.js";
import { requireCard } from "./dex.js";
import { makeInstance } from "./side.js";
import type { PlayerId } from "./types.js";
import { atk, canFight, def, gatherHandlers, isTriggerSuppressed } from "./events.js";

function deck(cardId: string): { name: string; cards: string[] } {
  return { name: cardId, cards: Array.from({ length: 40 }, () => cardId) };
}

function battleWith(seed = 0): Battle {
  const b = new Battle({ seed, skipValidation: true });
  b.start(deck("cow"), deck("cow"));
  return b;
}

function placeCreature(battle: Battle, player: PlayerId, cardId: string, laneIndex: number): void {
  const s = battle.state;
  const card = makeInstance(requireCard(cardId), player);
  card.lane = laneIndex;
  card.exhausted = true;
  s.sides[player].lanes[laneIndex].creature = card;
}

function placeBuilding(battle: Battle, player: PlayerId, cardId: string, laneIndex: number): void {
  const s = battle.state;
  const card = makeInstance(requireCard(cardId), player);
  card.lane = laneIndex;
  s.sides[player].lanes[laneIndex].building = card;
}

describe("event windows", () => {
  it("gatherHandlers matches by window across both sides and card kinds", () => {
    const battle = battleWith();
    placeCreature(battle, "p1", "struzann-jinn", 0);
    placeCreature(battle, "p2", "x-large-spirit-soldier", 1);
    const atkHandlers = gatherHandlers(battle.state, "onCalculateATK");
    expect(atkHandlers.map(h => h.ability.id).sort()).toEqual(["spirit-aura", "struzann-scale"]);
  });

  it("Palace of Bone suppresses opposing triggers in its lane only", () => {
    const battle = battleWith();
    placeBuilding(battle, "p1", "palace-of-bone", 0);
    const opponent = "p2";
    const oppCard = makeInstance(requireCard("cow"), opponent);
    oppCard.lane = 0;
    const ownCard = makeInstance(requireCard("cow"), "p1");
    ownCard.lane = 0;
    expect(isTriggerSuppressed(battle.state, oppCard)).toBe(true);
    expect(isTriggerSuppressed(battle.state, ownCard)).toBe(false);
  });

  it("canFight is blocked for a creature adjacent to Cool Dog", () => {
    const battle = battleWith();
    placeCreature(battle, "p1", "cool-dog", 0);
    const opponent = "p2";
    expect(canFight(battle.state, 1, opponent)).toBe(false);
    expect(canFight(battle.state, 2, opponent)).toBe(true);
  });
});

describe("continuous stat derivation", () => {
  it("Cool Dog blocks adjacency exactly one lane away", () => {
    const battle = battleWith();
    placeCreature(battle, "p1", "cool-dog", 0);
    expect(canFight(battle.state, 1, "p2")).toBe(false);
    expect(canFight(battle.state, 3, "p2")).toBe(true);
  });

  it("X-Large Spirit Soldier grants +1 ATK to adjacent creatures", () => {
    const battle = battleWith();
    placeCreature(battle, "p2", "x-large-spirit-soldier", 1);
    const near = makeInstance(requireCard("cow"), "p2");
    near.lane = 0;
    const far = makeInstance(requireCard("cow"), "p2");
    far.lane = 3;
    battle.state.sides.p2.lanes[0].creature = near;
    battle.state.sides.p2.lanes[3].creature = far;
    expect(atk(battle.state, near)).toBe(2);
    expect(atk(battle.state, far)).toBe(1);
  });

  it("Struzann Jinn scales +2 ATK per Flooped Creature you control", () => {
    const battle = battleWith();
    const jinn = makeInstance(requireCard("struzann-jinn"), "p1");
    jinn.lane = 0;
    battle.state.sides.p1.lanes[0].creature = jinn;
    const floopA = makeInstance(requireCard("cow"), "p1");
    const floopB = makeInstance(requireCard("cow"), "p1");
    floopA.lane = 1;
    floopB.lane = 2;
    floopA.flooped = true;
    floopB.flooped = true;
    battle.state.sides.p1.lanes[1].creature = floopA;
    battle.state.sides.p1.lanes[2].creature = floopB;
    expect(atk(battle.state, jinn)).toBe(1 + 2 * 2);
  });

  it("Husker Knight scales with each face-up Cornfield Landscape", () => {
    const battle = battleWith();
    const knight = makeInstance(requireCard("husker-knight"), "p1");
    knight.lane = 0;
    battle.state.sides.p1.lanes[0].creature = knight;
    battle.state.sides.p1.lanes[1].landscape = { faction: "cornfield", faceDown: false };
    battle.state.sides.p1.lanes[2].landscape = { faction: "cornfield", faceDown: true };
    battle.state.sides.p1.lanes[3].landscape = { faction: "cornfield", faceDown: false };
    expect(atk(battle.state, knight)).toBe(2);
    expect(def(battle.state, knight)).toBe(4);
  });
});
