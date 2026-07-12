import { Card } from "./card.js";
import { dex } from "./dex.js";
import type { BattleSideSnapshot, DeckList, PlayerId } from "./types.js";

export class Side {
  readonly id: PlayerId;
  deck: Card[] = [];
  readonly hand: Card[] = [];
  discard: Card[] = [];
  health = 30;
  maxHealth = 30;
  resources = 0;
  maxDeckSize = 40;

  constructor(id: PlayerId) {
    this.id = id;
  }

  loadDeck(decklist: DeckList, owner: PlayerId = this.id, maxHealth = 30, maxDeckSize = decklist.cards.length): void {
    this.deck = decklist.cards.map(cardId => new Card(dex.getCard(cardId), owner));
    this.hand.length = 0;
    this.discard = [];
    this.health = maxHealth;
    this.maxHealth = maxHealth;
    this.maxDeckSize = maxDeckSize;
    this.resources = 0;
  }

  draw(count = 1): Card[] {
    const drawn: Card[] = [];
    for (let i = 0; i < count; i += 1) {
      const card = this.deck.shift();
      if (!card) break;
      this.hand.push(card);
      drawn.push(card);
    }
    return drawn;
  }

  startTurn(resourcesPerTurn = 1): void {
    this.resources += resourcesPerTurn;
  }

  playCard(handIndex: number): Card {
    const [card] = this.hand.splice(handIndex, 1);
    if (!card) {
      throw new Error(`No card in hand index ${handIndex}`);
    }
    if (card.cost > this.resources) {
      throw new Error(`Not enough resources to play ${card.name}`);
    }
    this.resources -= card.cost;
    card.tap();
    return card;
  }

  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - Math.max(0, amount));
  }

  isDefeated(): boolean {
    return this.health <= 0;
  }

  snapshot(board: Card[]): BattleSideSnapshot {
    return {
      id: this.id,
      health: this.health,
      maxHealth: this.maxHealth,
      resources: this.resources,
      deckSize: this.deck.length,
      maxDeckSize: this.maxDeckSize,
      hand: this.hand.map(card => card.toSummary()),
      discardSize: this.discard.length,
      board: board.map(card => card.toSummary()),
    };
  }
}
