import { CARD_POOL } from "./data/cards.js";
import type { CardTemplate } from "./types.js";

function normalizeCardId(id: string): string {
  return id.trim().toLowerCase().replace(/[-\s]+/g, "_");
}

export class Dex {
  getCard(id: string): CardTemplate {
    const direct = CARD_POOL[id];
    if (direct) {
      return direct;
    }

    const normalized = CARD_POOL[normalizeCardId(id)];
    if (normalized) {
      return normalized;
    }

    throw new Error(`Unknown card: ${id}`);
  }

  getAllCards(): CardTemplate[] {
    return Object.values(CARD_POOL).sort((a, b) => a.id.localeCompare(b.id));
  }
}

export const dex = new Dex();
