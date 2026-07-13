import { describe, expect, test } from "bun:test";
import { Battle, FORMATS } from "./index.js";

function formatIds() {
  return FORMATS.map(format => format.id);
}

describe("supported formats", () => {
  test("exposes the currently supported Card Wars format set", () => {
    expect(formatIds()).toEqual(["singles"]);
  });
});

describe("singles tournament flow", () => {
  test("starts deterministically for the singles format", () => {
    const battle = new Battle({
      formatId: "singles",
      startingHandSize: 2,
      startingResources: 0,
      resourcesPerTurn: 2,
      drawPerTurn: 1,
      maxTurns: 5,
    });

    battle.start(
      { cards: ["finn", "jake", "bmo", "rainicorn"] },
      { cards: ["ice-king", "marceline", "pebbles", "wildberry-princess"] },
    );

    const snapshot = battle.snapshot();
    expect(snapshot.phase).toBe("setup");
    expect(snapshot.sides.p1.handSize).toBe(2);
    expect(snapshot.sides.p2.handSize).toBe(2);
    expect(snapshot.sides.p1.health).toBe(25);
    expect(snapshot.sides.p2.health).toBe(25);
  });

  test("advances turns and resolves combat deterministically", () => {
    const battle = new Battle({
      formatId: "singles",
      startingHandSize: 1,
      startingResources: 0,
      resourcesPerTurn: 2,
      drawPerTurn: 0,
      maxTurns: 5,
    });

    battle.start({ cards: ["finn"] }, { cards: ["ice-king"] });

    const first = battle.step();
    expect(first.turn).toBe(1);
    expect(first.phase).toBe("combat");
    expect(first.sides.p1.health).toBe(25);
    expect(first.sides.p2.health).toBeLessThan(25);
    expect(first.log.some(entry => entry.message.includes("deals"))).toBe(true);
  });
});
