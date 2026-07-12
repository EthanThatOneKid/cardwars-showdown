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
      lanes: 3,
      deckSize: 20,
    });
  });
});

describe("battle flow", () => {
  test("starts deterministically for the singles format", () => {
    const battle = new Battle({ laneCount: 3, startingHandSize: 1 });
    battle.start(deckWith("finn", 20), deckWith("jake", 20));

    const snapshot = battle.snapshot();

    expect(snapshot.turn).toBe(0);
    expect(snapshot.activePlayer).toBe("p1");
    expect(snapshot.lanes).toHaveLength(3);
    expect(snapshot.sides?.p1?.hand).toHaveLength(1);
    expect(snapshot.sides?.p2?.hand).toHaveLength(1);
    expect(snapshot.sides?.p1?.deckSize).toBe(19);
    expect(snapshot.sides?.p2?.deckSize).toBe(19);
  });

  test("advances turns and resolves combat deterministically", () => {
    const battle = new Battle({ laneCount: 1, startingHandSize: 1 });
    battle.start(deckWith("bmo", 20), deckWith("bmo", 20));

    battle.step();
    battle.step();

    const snapshot = battle.snapshot();

    expect(snapshot.turn).toBe(2);
    expect(snapshot.activePlayer).toBe("p1");
    expect(snapshot.lanes?.[0].p1?.name).toBe("BMO");
    expect(snapshot.lanes?.[0].p2?.name).toBe("BMO");
    expect(snapshot.lanes?.[0].p1?.remainingHealth).toBe(3);
    expect(snapshot.lanes?.[0].p2?.remainingHealth).toBe(3);
    expect(snapshot.sides?.p1?.health).toBe(30);
    expect(snapshot.sides?.p2?.health).toBe(29);
    expect(snapshot.log.some(entry => entry.message.includes("trades blows"))).toBe(true);
  });
});
