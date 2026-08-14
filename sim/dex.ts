import type { CardTemplate } from "./types.js";
import { CARDS } from "./data/cards.js";

const byId = new Map<string, CardTemplate>();
for (const card of CARDS) byId.set(card.id, card);

export function getCard(id: string): CardTemplate | null {
  return byId.get(id) ?? null;
}

export function requireCard(id: string): CardTemplate {
  const card = byId.get(id);
  if (!card) throw new Error(`Unknown card id: ${id}`);
  return card;
}

export function allCardIds(): string[] {
  return [...byId.keys()];
}

export function cardPool(): CardTemplate[] {
  return [...byId.values()];
}

export function hasCard(id: string): boolean {
  return byId.has(id);
}
