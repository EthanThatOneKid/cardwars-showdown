export type PlayerId = "p1" | "p2";
export type BattlePhase = "setup" | "draw" | "main" | "combat" | "finished";
export type FormatMode = "constructed" | "sealed" | "draft" | "doubles";
export type CardFaction =
  | "adventure"
  | "fire"
  | "water"
  | "ice"
  | "beast"
  | "candy"
  | "machine"
  | "mystery";
export type CardType = "hero" | "creature" | "spell" | "artifact";

export interface CardAbility {
  id: string;
  name: string;
  text: string;
  timing: "static" | "triggered" | "activated";
}

export interface CardTemplate {
  id: string;
  name: string;
  cost: number;
  attack: number;
  health: number;
  faction?: CardFaction;
  type?: CardType;
  text?: string;
  tags?: string[];
  abilities?: CardAbility[];
}

export interface CardInstance extends CardTemplate {
  uid: string;
  owner: PlayerId;
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
  name?: string;
  cards: string[];
}

export interface BattleOptions {
  startingHandSize?: number;
  startingResources?: number;
  resourcesPerTurn?: number;
  drawPerTurn?: number;
  maxTurns?: number;
  laneCount?: number;
  startingHealth?: number;
}

export interface FormatDefinition {
  id: string;
  name: string;
  description: string;
  mode: FormatMode;
  players: number;
  lanes: number;
  deckSize: number;
  startingHealth: number;
  startingHandSize: number;
  resourcesPerTurn: number;
  drawPerTurn: number;
  maxCopiesPerCard: number;
  bannedCardIds: string[];
  restrictedCardIds: string[];
}

export interface BattleLogEntry {
  turn: number;
  actor: PlayerId | "system";
  message: string;
  phase?: BattlePhase;
}

export interface BattleLaneSnapshot {
  index: number;
  p1: CardSummary | null;
  p2: CardSummary | null;
}

export interface BattleSideSnapshot {
  id: PlayerId;
  health: number;
  maxHealth: number;
  resources: number;
  deckSize: number;
  maxDeckSize: number;
  hand: CardSummary[];
  discardSize: number;
  board: CardSummary[];
}

export interface BattleSnapshot {
  turn?: number;
  phase?: BattlePhase;
  activePlayer?: PlayerId | null;
  winner?: PlayerId | null;
  lanes?: BattleLaneSnapshot[];
  sides?: Record<PlayerId, BattleSideSnapshot>;
  log: BattleLogEntry[];
}
