import { CARD_POOL } from "./data/cards.js";
import type { CardTemplate } from "./types.js";

export class Dex {
  getCard(id: string): CardTemplate {
    const card = CARD_POOL[id];
    if (!card) {
      throw new Error(`Unknown card: ${id}`);
    }
    return card;
  }

  getAllCards(): CardTemplate[] {
    return Object.values(CARD_POOL).sort((a, b) => a.id.localeCompare(b.id));
  }
}

export const dex = new Dex();
