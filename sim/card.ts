import type { CardInstance, CardSummary, CardTemplate, PlayerId } from "./types.js";

let nextUid = 1;

export class Card implements CardInstance {
  readonly uid: string;
  readonly owner: PlayerId;
  readonly id: string;
  readonly name: string;
  readonly type: CardTemplate["type"];
  readonly cost: number;
  readonly attack: number;
  readonly health: number;
  readonly text: string;
  readonly faction: string;
  readonly flavor?: string;
  readonly tags: string[];
  readonly abilities: CardTemplate["abilities"];
  damage = 0;
  exhausted = false;
  lane: number | null = null;

  constructor(template: CardTemplate, owner: PlayerId = "p1", state: Partial<Pick<CardInstance, "damage" | "exhausted" | "lane">> = {}) {
    this.uid = `card-${nextUid++}`;
    this.owner = owner;
    this.id = template.id;
    this.name = template.name;
    this.type = template.type;
    this.cost = template.cost;
    this.attack = template.attack;
    this.health = template.health;
    this.text = template.text;
    this.faction = template.faction;
    this.flavor = template.flavor;
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
      type: this.type,
      cost: this.cost,
      attack: this.attack,
      health: this.health,
      text: this.text,
      faction: this.faction,
      flavor: this.flavor,
      tags: [...this.tags],
      abilities: this.abilities ? [...this.abilities] : undefined,
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
