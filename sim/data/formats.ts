import type { FormatDefinition } from "../types.js";

export const FORMATS: FormatDefinition[] = [
  {
    id: "cardwars-singles",
    name: "Card Wars Singles",
    description: "The default 1v1 Adventure Time Card Wars format.",
    mode: "constructed",
    players: 2,
    lanes: 4,
    deckSize: 40,
    startingHealth: 25,
    startingHandSize: 5,
    resourcesPerTurn: 2,
    drawPerTurn: 1,
    maxCopiesPerCard: 4,
    bannedCardIds: [],
    restrictedCardIds: [],
  },
];
