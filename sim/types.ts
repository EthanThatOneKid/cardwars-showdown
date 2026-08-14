export type PlayerId = "p1" | "p2";

export type Faction =
  | "cornfield"
  | "blue-plains"
  | "useless-swamp"
  | "sandy-lands"
  | "nice-lands"
  | "rainbow";

export type CardType = "creature" | "building" | "spell";

export const FACTIONS: Faction[] = [
  "cornfield",
  "blue-plains",
  "useless-swamp",
  "sandy-lands",
  "nice-lands",
  "rainbow",
];

export const CARD_TYPES: CardType[] = ["creature", "building", "spell"];

export type AbilityKind =
  | "continuous"
  | "trigger"
  | "activated"
  | "floop"
  | "replacement"
  | "play-restriction"
  | "cost-modifier"
  | "variable-stat"
  | "unsupported";

export type EventWindow =
  | "onCanFight"
  | "onCalculateATK"
  | "onCalculateDEF"
  | "onFloop"
  | "onAfterPlayCard"
  | "onAfterFight"
  | "onLandscapeFlipped"
  | "onDestroyed"
  | "onEnterPlay"
  | "onLeavePlay"
  | "onStartOfTurn"
  | "onEndOfTurn"
  | "onDamageDealt"
  | "onDraw"
  | "onDiscard"
  | "onChangeLane"
  | "onCanPlay"
  | "onCalculateCost"
  | "onCanTrigger";

export type AbilityCost =
  | { type: "exhaust" }
  | { type: "action"; n: number }
  | { type: "discard"; n: number }
  | { type: "destroySelf" }
  | { type: "destroyCreature" }
  | { type: "combine"; parts: AbilityCost[] };

export interface Ability {
  id: string;
  kind: AbilityKind;
  window?: EventWindow;
  cost?: AbilityCost;
  condition?: string;
  repeat?: "once" | "up-to-five" | "any-number" | "per-landscape";
  effect: AbilityEffect;
  note?: string;
}

export type AbilityEffect =
  | { op: "block"; lanes?: "adjacent"; note?: string }
  | { op: "scale"; per: string; atk?: number; def?: number }
  | { op: "flipLandscape"; faction?: string; lane: "this"; face: "up" | "down" }
  | { op: "modify"; targets: string; atk?: number; def?: number; duration?: string }
  | { op: "draw"; n?: number; each?: boolean }
  | { op: "damageHeroPer"; n: number; per: string; target: string }
  | { op: "damageTargetPer"; n: number; per: string; perTargetOnce?: boolean }
  | { op: "damageEachCreature"; n: number; includeSelf?: boolean }
  | { op: "damageEachOpposingCreature"; n: number }
  | { op: "damageCreature"; n: number; target: string }
  | { op: "gainAction"; n: number; restrictedTo?: string }
  | { op: "require"; discardCount?: string }
  | { op: "modifyCost"; per?: string; n: number }
  | { op: "heal"; n: number; target?: string }
  | { op: "moveLane"; to: string }
  | { op: "returnToHand"; target: string }
  | { op: "discardCard"; n?: number; from: string }
  | { op: "unsupported"; reason: string };

export interface CardTemplate {
  id: string;
  name: string;
  type: CardType;
  faction: Faction;
  actionCost: number;
  landscapeCost: number;
  atk: number | null;
  def: number | null;
  text: string;
  verified: "verbatim" | "needs-verification";
  adjudicated?: boolean;
  abilities: Ability[];
}

export interface CardInstance extends CardTemplate {
  owner: PlayerId;
  uid: string;
  damage: number;
  exhausted: boolean;
  flooped: boolean;
  lane: number | null;
}

export interface LandscapeState {
  faction: Faction;
  faceDown: boolean;
}

export interface LaneState {
  landscape: LandscapeState;
  creature: CardInstance | null;
  building: CardInstance | null;
}

export interface SideState {
  player: PlayerId;
  hp: number;
  resources: number;
  deck: CardInstance[];
  hand: CardInstance[];
  discard: CardInstance[];
  lanes: LaneState[];
  mulliganUsed: boolean;
  turnsPlayed: number;
  creaturesPlayedThisTurn: number;
  spellsPlayedThisTurn: number;
}

export type BattlePhase = "setup" | "ready" | "draw" | "main" | "fight" | "end" | "finished";

export interface RngState {
  a: number;
  b: number;
  c: number;
  d: number;
}

export interface BattleLogEntry {
  turn: number;
  actor: PlayerId | "system";
  message: string;
  phase?: BattlePhase;
}

export interface BattleState {
  turn: number;
  phase: BattlePhase;
  activePlayer: PlayerId;
  firstPlayer: PlayerId;
  winner: PlayerId | null;
  maxTurns: number;
  maxHp: number;
  resourcesPerTurn: number;
  sides: Record<PlayerId, SideState>;
  rng: RngState;
  log: BattleLogEntry[];
}

export interface DeckList {
  name: string;
  cards: string[];
}

export interface BattleOptions {
  seed?: number;
  maxTurns?: number;
  maxHp?: number;
  resourcesPerTurn?: number;
  skipValidation?: boolean;
}
