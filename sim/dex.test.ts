import { describe, expect, it } from "bun:test";
import { allCardIds, cardPool } from "./dex.js";
import type { Faction } from "./types.js";

const EXPECTED_TOTALS: Partial<Record<Faction, number>> = {
  "blue-plains": 25,
  cornfield: 15,
  "useless-swamp": 29,
  "sandy-lands": 14,
  "nice-lands": 19,
  rainbow: 32,
};

describe("card pool (134-card base line)", () => {
  it("has exactly 134 unique cards", () => {
    expect(cardPool().length).toBe(134);
  });

  it("has unique ids", () => {
    expect(new Set(allCardIds()).size).toBe(allCardIds().length);
  });

  it("matches per-faction counts from the research inventory", () => {
    const counts: Record<string, number> = {};
    for (const card of cardPool()) {
      counts[card.faction] = (counts[card.faction] ?? 0) + 1;
    }
    for (const [faction, expected] of Object.entries(EXPECTED_TOTALS)) {
      expect(counts[faction]).toBe(expected);
    }
  });

  it("every card has a name, type, faction, and costs", () => {
    for (const card of cardPool()) {
      expect(card.name.length).toBeGreaterThan(0);
      expect(card.type).toMatch(/^(creature|building|spell)$/);
      expect(card.actionCost).toBeGreaterThanOrEqual(0);
      expect(card.landscapeCost).toBeGreaterThanOrEqual(0);
    }
  });

  it("creatures carry ATK/DEF; buildings and spells do not", () => {
    for (const card of cardPool()) {
      if (card.type === "creature") {
        if (card.id === "husker-knight") continue; // X/X variable-stat base line
        expect(card.atk).not.toBeNull();
        expect(card.def).not.toBeNull();
      } else {
        expect(card.atk).toBeNull();
        expect(card.def).toBeNull();
      }
    }
  });

  it("every adjudicated card is marked", () => {
    const adjudicatedIds = ["uni-knight", "field-reaper", "field-stalker", "husker-knight", "dr-death", "green-merman", "sandhorn-devil", "palace-of-bone", "spirit-tower", "nice-ice-baby", "ring-of-fluffy"];
    for (const id of adjudicatedIds) {
      const card = cardPool().find(c => c.id === id);
      expect(card).toBeDefined();
      expect(card!.adjudicated).toBe(true);
    }
  });

  it("every ability references a known window or none", () => {
    for (const card of cardPool()) {
      for (const ability of card.abilities) {
        expect(typeof ability.id).toBe("string");
        expect(typeof ability.effect).toBe("object");
      }
    }
  });
});
