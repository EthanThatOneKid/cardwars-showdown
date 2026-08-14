import { describe, expect, it } from "bun:test";
import { describeDeck, planLandscapes, validateDeck } from "./validate.js";

function deckOf(ids: string[], name = "test"): { name: string; cards: string[] } {
  return { name, cards: [...ids] };
}

const DISTINCT = [
  "cool-dog", "dragon-claw", "heavenly-gazer", "psionic-architect", "ancient-scholar",
  "corn-lord", "corn-ronin", "husker-worm", "wall-of-ears", "archer-dan",
  "dark-angel", "fatapillar", "mouthball", "red-eyeling", "steakchop",
  "sand-knights", "sandsnake", "beach-mummy", "green-cactiball", "shark",
  "albino-eyebat", "cotton-eyebat", "pieclops", "wall-of-chocolate", "cutie",
];

function distinctDeck(n: number): string[] {
  return Array.from({ length: n }, (_, i) => DISTINCT[i % DISTINCT.length]);
}

const legalMix = distinctDeck(40);

describe("deck legality", () => {
  it("accepts a legal 40-card deck", () => {
    const result = validateDeck(deckOf(legalMix));
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.summary.totalCards).toBe(40);
  });

  it("rejects a deck under the 40-card minimum", () => {
    const result = validateDeck(deckOf(["cow", "cow", "cow"]));
    expect(result.ok).toBe(false);
    expect(result.issues.some(i => i.code === "too-small")).toBe(true);
  });

  it("allows a deck larger than 40 cards", () => {
    const big = distinctDeck(60);
    const result = validateDeck(deckOf(big));
    expect(result.ok).toBe(true);
  });

  it("rejects more than 3 copies of a single card", () => {
    const result = validateDeck(deckOf(Array.from({ length: 40 }, () => "cow")));
    expect(result.ok).toBe(false);
    expect(result.issues.some(i => i.code === "too-many-copies")).toBe(true);
    expect(result.issues.some(i => i.message.includes("Cow"))).toBe(true);
  });

  it("allows exactly 3 copies", () => {
    const cards = [...distinctDeck(37), "cow", "cow", "cow"];
    const result = validateDeck(deckOf(cards));
    expect(result.ok).toBe(true);
  });

  it("flags unknown card ids", () => {
    const result = validateDeck(deckOf(["cow", "not-a-real-card"]));
    expect(result.issues.some(i => i.code === "unknown-card")).toBe(true);
  });

  it("detects all-Rainbow decks", () => {
    const result = validateDeck(deckOf(Array.from({ length: 40 }, () => "cow")));
    expect(result.summary.rainbowOnly).toBe(true);
  });

  it("detects mono-faction and multi-faction decks", () => {
    const mono = validateDeck(deckOf(Array.from({ length: 40 }, () => "cool-dog")));
    expect(mono.summary.monoFaction).toBe(true);
    expect(mono.summary.rainbowOnly).toBe(false);

    const multi = validateDeck(deckOf(legalMix));
    expect(multi.summary.monoFaction).toBe(false);
    expect(multi.summary.rainbowOnly).toBe(false);
  });
});

describe("landscape planning", () => {
  it("all-Rainbow decks plan four Nice Lands tiles", () => {
    const plan = planLandscapes(deckOf(Array.from({ length: 40 }, () => "cow")));
    expect(plan.rainbowOnly).toBe(true);
    expect(plan.tiles).toEqual(["nice-lands", "nice-lands", "nice-lands", "nice-lands"]);
  });

  it("mono-faction deck plans four tiles of that faction", () => {
    const plan = planLandscapes(deckOf(Array.from({ length: 40 }, () => "cool-dog")));
    expect(plan.tiles.every(t => t === "blue-plains")).toBe(true);
  });

  it("produces exactly four tiles for any valid deck", () => {
    expect(planLandscapes(deckOf(legalMix)).tiles).toHaveLength(4);
    expect(planLandscapes(deckOf(legalMix)).tiles.every(t => t !== "rainbow")).toBe(true);
  });
});

describe("describeDeck", () => {
  it("describes a legal deck", () => {
    const desc = describeDeck(deckOf(legalMix, "Legacy"));
    expect(desc).toContain("Legacy: 40 cards");
    expect(desc).toContain("multi-faction");
  });
});
