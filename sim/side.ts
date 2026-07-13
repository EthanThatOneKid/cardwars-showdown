import { Card } from "./card.js";
import { dex } from "./dex.js";
import type {
  BattleSideSnapshot,
  DeckList,
  PlayerId,
  SideSnapshot,
} from "./types.js";

export class Side {
  player: PlayerId;
  deck: Card[] = [];
  hand: Card[] = [];
  discard: Card[] = [];
  resources = 0;
  maxHealth = 25;
  health = 25;
  maxDeckSize = 40;

  constructor(player: PlayerId) {
    this.player = player;
  }

  loadDeck(list: DeckList, owner: PlayerId, startingHealth: number, maxDeckSize: number): void {
    this.player = owner;
    this.maxHealth = startingHealth;
    this.health = startingHealth;
    this.maxDeckSize = maxDeckSize;
    this.deck = list.cards.map((id, index) => {
      const template = dex.getCard(id);
      return new Card(template, index);
    });
    this.hand = [];
    this.discard = [];
    this.resources = 0;
  }

  draw(count: number): Card[] {
    const drawn: Card[] = [];
    while (count > 0 && this.deck.length > 0) {
      const card = this.deck.shift();
      if (!card) break;
      this.hand.push(card);
      drawn.push(card);
      count -= 1;
    }
    return drawn;
  }

  startTurn(resourcesPerTurn: number): void {
    this.resources += resourcesPerTurn;
  }

  playCard(index: number): Card {
    const [card] = this.hand.splice(index, 1);
    if (!card) {
      throw new Error(`No card at hand index ${index}`);
    }
    if (card.cost > this.resources) {
      throw new Error(`Not enough resources for ${card.name}`);
    }
    this.resources -= card.cost;
    card.exhausted = true;
    this.discard.push(card);
    return card;
  }

  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
  }

  isDefeated(): boolean {
    return this.health <= 0;
  }

  snapshot(board: Card[]): BattleSideSnapshot {
    return {
      player: this.player,
      health: this.health,
      maxHealth: this.maxHealth,
      deckSize: this.deck.length,
      handSize: this.hand.length,
      discardSize: this.discard.length,
      resources: this.resources,
      board: board.map(card => card.toSummary()),
    };
  }
}
