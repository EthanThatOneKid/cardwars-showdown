import type { CardTemplate, DeckList, Faction } from "./types.js";
import { getCard, requireCard } from "./dex.js";
import { singles } from "./data/formats.js";

export interface DeckIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: DeckIssue[];
  summary: {
    totalCards: number;
    uniqueCards: number;
    factions: Partial<Record<Faction, number>>;
    rainbowOnly: boolean;
    monoFaction: boolean;
  };
}

function countFactions(deck: DeckList): Partial<Record<Faction, number>> {
  const counts: Partial<Record<Faction, number>> = {};
  for (const id of deck.cards) {
    const card = getCard(id);
    if (!card) continue;
    counts[card.faction] = (counts[card.faction] ?? 0) + 1;
  }
  return counts;
}

export function validateDeck(deck: DeckList, opts: { minSize?: number; maxCopies?: number } = {}): ValidationResult {
  const minSize = opts.minSize ?? singles.minDeckSize;
  const maxCopies = opts.maxCopies ?? singles.maxCopiesPerCard;
  const issues: DeckIssue[] = [];

  const unknown = deck.cards.filter(id => !getCard(id));
  if (unknown.length > 0) {
    issues.push({
      severity: "error",
      code: "unknown-card",
      message: `Deck references unknown cards: ${[...new Set(unknown)].join(", ")}.`,
    });
  }

  if (deck.cards.length < minSize) {
    issues.push({
      severity: "error",
      code: "too-small",
      message: `Deck has ${deck.cards.length} cards; minimum is ${minSize}.`,
    });
  }

  const nameCounts = new Map<string, number>();
  for (const id of deck.cards) {
    const card = getCard(id);
    if (!card) continue;
    nameCounts.set(card.name, (nameCounts.get(card.name) ?? 0) + 1);
  }
  for (const [name, count] of nameCounts) {
    if (count > maxCopies) {
      issues.push({
        severity: "error",
        code: "too-many-copies",
        message: `${name} appears ${count} times; maximum is ${maxCopies}.`,
      });
    }
  }

  const factions = countFactions(deck);
  const factionKeys = Object.keys(factions).filter(f => (factions[f as Faction] ?? 0) > 0) as Faction[];
  const rainbowOnly = factionKeys.length === 0 || factionKeys.every(f => f === "rainbow");
  const nonRainbow = factionKeys.filter(f => f !== "rainbow");
  const monoFaction = nonRainbow.length === 1;

  return {
    ok: issues.every(i => i.severity === "warning"),
    issues,
    summary: {
      totalCards: deck.cards.length,
      uniqueCards: nameCounts.size,
      factions,
      rainbowOnly,
      monoFaction,
    },
  };
}

export function requireValidDeck(deck: DeckList, opts?: { minSize?: number; maxCopies?: number }): void {
  const result = validateDeck(deck, opts);
  const errors = result.issues.filter(i => i.severity === "error");
  if (errors.length > 0) {
    throw new Error(`Illegal deck "${deck.name}":\n` + errors.map(e => `- ${e.message}`).join("\n"));
  }
}

export interface LandscapePlan {
  tiles: Faction[];
  rainbowOnly: boolean;
}

export function planLandscapes(deck: DeckList): LandscapePlan {
  const result = validateDeck(deck, { minSize: 0 });
  if (result.summary.rainbowOnly) {
    return { tiles: Array.from({ length: singles.lanes }, () => "nice-lands" as Faction), rainbowOnly: true };
  }
  const counts = new Map<string, number>();
  for (const id of deck.cards) {
    const card = getCard(id);
    if (!card || card.type !== "creature" || card.faction === "rainbow") continue;
    counts.set(card.faction, (counts.get(card.faction) ?? 0) + 1);
  }
  const factionCounts = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const total = factionCounts.reduce((sum, [, n]) => sum + n, 0);
  if (total === 0) return { tiles: Array.from({ length: singles.lanes }, () => "nice-lands" as Faction), rainbowOnly: true };

  const raw = factionCounts.map(([faction, n]) => ({ faction: faction as Faction, n: (n / total) * singles.lanes }));
  const tiles: Faction[] = [];
  for (const { faction, n } of raw) {
    for (let i = 0; i < Math.floor(n) && tiles.length < singles.lanes; i += 1) tiles.push(faction);
  }
  const remainder = factionCounts
    .map(([faction, n], i) => ({ faction: faction as Faction, frac: raw[i].n - Math.floor(raw[i].n) }))
    .sort((a, b) => b.frac - a.frac);
  for (const { faction } of remainder) {
    if (tiles.length >= singles.lanes) break;
    tiles.push(faction);
  }
  while (tiles.length < singles.lanes) tiles.push("rainbow");
  return { tiles, rainbowOnly: false };
}

export function describeDeck(deck: DeckList): string {
  const result = validateDeck(deck);
  const kind = result.summary.rainbowOnly
    ? "all-Rainbow"
    : result.summary.monoFaction
      ? `${Object.keys(result.summary.factions).filter(f => f !== "rainbow").join("/")} mono-faction`
      : "multi-faction";
  return `${deck.name}: ${result.summary.totalCards} cards (${result.summary.uniqueCards} unique), ${kind}.`;
}

export function deckContainsCard(deck: DeckList, id: string): boolean {
  return deck.cards.includes(id);
}

export function listDeckCards(deck: DeckList): CardTemplate[] {
  return deck.cards.map(id => requireCard(id));
}