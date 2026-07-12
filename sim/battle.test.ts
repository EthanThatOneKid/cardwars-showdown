import { describe, expect, test } from "bun:test";
import { Battle, FORMATS } from "./index.js";

function deckWith(cardId: string, count: number): { cards: string[] } {
  return { cards: Array.from({ length: count }, () => cardId) };
}

function formatCardIds(): string[] {
  return FORMATS.map(format => format.id);
}

describe("supported formats", () => {
  test("exposes the currently supported Card Wars format set", () => {
    expect(formatCardIds()).toEqual(["cardwars-singles"]);
    expect(FORMATS[0]).toMatchObject({
      id: "cardwars-singles",
      name: "Card Wars Singles",
      mode: "constructed",
      players: 2,
      lanes: 4,
      deckSize: 40,
      startingHealth: 25,
      startingHandSize: 5,
      resourcesPerTurn: 2,
      drawPerTurn: 1,
    });
  });
});

describe("singles tournament flow", () => {
  test("starts deterministically for the singles format", () => {
    const battle = new Battle({
      laneCount: 4,
      startingHandSize: 5,
      startingHealth: 25,
      resourcesPerTurn: 2,
      drawPerTurn: 1,
    });
    battle.start(deckWith("finn", 40), deckWith("jake", 40));

    const snapshot = battle.snapshot();

    expect(snapshot.turn).toBe(0);
    expect(snapshot.phase).toBe("setup");
    expect(snapshot.activePlayer).toBe("p1");
    expect(snapshot.lanes).toHaveLength(4);
    expect(snapshot.sides?.p1?.hand).toHaveLength(5);
    expect(snapshot.sides?.p2?.hand).toHaveLength(5);
    expect(snapshot.sides?.p1?.deckSize).toBe(35);
    expect(snapshot.sides?.p2?.deckSize).toBe(35);
    expect(snapshot.sides?.p1?.health).toBe(25);
    expect(snapshot.sides?.p2?.health).toBe(25);
    expect(snapshot.sides?.p1?.maxHealth).toBe(25);
    expect(snapshot.sides?.p1?.maxDeckSize).toBe(40);
  });

  test("advances turns and resolves combat deterministically", () => {
    const battle = new Battle({
      laneCount: 4,
      startingHandSize: 5,
      startingHealth: 25,
      resourcesPerTurn: 2,
      drawPerTurn: 1,
    });
    battle.start(deckWith("bmo", 40), deckWith("bmo", 40));

    battle.step();
    battle.step();

    const snapshot = battle.snapshot();

    expect(snapshot.turn).toBe(2);
    expect(snapshot.phase).toBe("combat");
    expect(snapshot.activePlayer).toBe("p1");
    expect(snapshot.lanes?.[0].p1?.name).toBe("BMO");
    expect(snapshot.lanes?.[0].p2?.name).toBe("BMO");
    expect(snapshot.lanes?.[0].p1?.remainingHealth).toBe(3);
    expect(snapshot.lanes?.[0].p2?.remainingHealth).toBe(3);
    expect(snapshot.sides?.p1?.health).toBe(25);
    expect(snapshot.sides?.p2?.health).toBe(24);
    expect(snapshot.log.some(entry => entry.message.includes("trades blows"))).toBe(true);
  });
});
