export type PlayerId = "p1" | "p2";
export type BattlePhase = "setup" | "draw" | "main" | "combat" | "finished";
export type CardFaction = string;
export type CardType = "creature" | "spell" | "building" | "hero" | "artifact";
export type CardAbilityTiming = "static" | "triggered" | "activated";

export interface CardAbility {
  id: string;
  name: string;
  text: string;
  timing: CardAbilityTiming;
}

export interface CardTemplate {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  attack: number;
  health: number;
  text: string;
  faction: CardFaction;
  flavor?: string;
  tags?: string[];
  abilities?: CardAbility[];
}

export interface CardInstance extends CardTemplate {
  owner: PlayerId;
  uid: string;
  damage: number;
  exhausted: boolean;
  lane: number | null;
}

export interface CardSummary extends CardTemplate {
  uid: string;
  owner: PlayerId;
  damage: number;
  remainingHealth: number;
  exhausted: boolean;
  lane: number | null;
}

export interface DeckList {
  name: string;
  cards: string[];
}

export interface FormatDefinition {
  id: string;
  name: string;
  description: string;
  mode: "constructed";
  players: number;
  lanes: number;
  startingHealth: number;
  startingHandSize: number;
  startingResources: number;
  resourcesPerTurn: number;
  drawPerTurn: number;
  deckSize: number;
  maxCopiesPerCard: number;
  bannedCardIds: string[];
  restrictedCardIds: string[];
}

export interface BattleLaneSnapshot {
  index: number;
  p1: CardSummary | null;
  p2: CardSummary | null;
}

export interface BattleSideSnapshot {
  player: PlayerId;
  health: number;
  maxHealth: number;
  resources: number;
  deckSize: number;
  maxDeckSize: number;
  hand: CardSummary[];
  handSize: number;
  discardSize: number;
  board: CardSummary[];
}

export interface BattleLogEntry {
  turn: number;
  actor: PlayerId | "system";
  message: string;
  phase?: BattlePhase;
}

export interface BattleSnapshot {
  turn: number;
  phase: BattlePhase;
  activePlayer: PlayerId;
  winner: PlayerId | null;
  lanes: BattleLaneSnapshot[];
  sides: Record<PlayerId, BattleSideSnapshot>;
  log: BattleLogEntry[];
}

export interface BattleOptions {
  formatId?: string;
  startingHandSize?: number;
  startingResources?: number;
  resourcesPerTurn?: number;
  drawPerTurn?: number;
  maxTurns?: number;
  laneCount?: number;
  startingHealth?: number;
}
