import type { CardAbility, CardFaction, CardInstance, CardSummary, CardTemplate, CardType, PlayerId } from "./types.js";

let nextUid = 1;

export class Card implements CardInstance {
  readonly uid: string;
  readonly owner: PlayerId;
  readonly id: string;
  readonly name: string;
  readonly cost: number;
  readonly attack: number;
  readonly health: number;
  readonly faction?: CardFaction;
  readonly type?: CardType;
  readonly text?: string;
  readonly tags: string[];
  readonly abilities: CardAbility[];
  damage = 0;
  exhausted = false;
  lane: number | null = null;

  constructor(template: CardTemplate, owner: PlayerId = "p1", state: Partial<Pick<CardInstance, "damage" | "exhausted" | "lane">> = {}) {
    this.uid = `card-${nextUid++}`;
    this.owner = owner;
    this.id = template.id;
    this.name = template.name;
    this.cost = template.cost;
    this.attack = template.attack;
    this.health = template.health;
    this.faction = template.faction;
    this.type = template.type;
    this.text = template.text;
    this.tags = [...(template.tags ?? [])];
    this.abilities = [...(template.abilities ?? [])];
    this.damage = state.damage ?? 0;
    this.exhausted = state.exhausted ?? false;
    this.lane = state.lane ?? null;
  }

  clone(): Card {
    return new Card(this.toTemplate(), this.owner, {
      damage: this.damage,
      exhausted: this.exhausted,
      lane: this.lane,
    });
  }

  toTemplate(): CardTemplate {
    return {
      id: this.id,
      name: this.name,
      cost: this.cost,
      attack: this.attack,
      health: this.health,
      faction: this.faction,
      type: this.type,
      text: this.text,
      tags: [...this.tags],
      abilities: [...this.abilities],
    };
  }

  get alive(): boolean {
    return this.remainingHealth > 0;
  }

  get remainingHealth(): number {
    return Math.max(0, this.health - this.damage);
  }

  canAct(): boolean {
    return !this.exhausted && this.alive;
  }

  ready(): void {
    this.exhausted = false;
  }

  tap(): void {
    this.exhausted = true;
  }

  applyDamage(amount: number): number {
    const before = this.remainingHealth;
    this.damage += Math.max(0, amount);
    return before - this.remainingHealth;
  }

  toSummary(): CardSummary {
    return {
      ...this.toTemplate(),
      uid: this.uid,
      owner: this.owner,
      damage: this.damage,
      remainingHealth: this.remainingHealth,
      exhausted: this.exhausted,
      lane: this.lane,
    };
  }
}
