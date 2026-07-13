import type { FormatDefinition } from "../types.js";

export const FORMATS: FormatDefinition[] = [
  {
    id: "singles",
    name: "Singles Constructed",
    description: "Official-style 1v1 rules with a deterministic lane battle engine.",
    mode: "constructed",
    players: 2,
    lanes: 4,
    startingHealth: 25,
    startingHandSize: 5,
    startingResources: 0,
    resourcesPerTurn: 2,
    drawPerTurn: 1,
    deckSize: 40,
    maxCopiesPerCard: 4,
    bannedCardIds: [],
    restrictedCardIds: [],
  },
];

export function getFormat(id: string): FormatDefinition {
  const format = FORMATS.find(entry => entry.id === id);
  if (!format) throw new Error(`Unknown format: ${id}`);
  return format;
}