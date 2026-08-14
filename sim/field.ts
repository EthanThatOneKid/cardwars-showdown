import type { BattleState, CardInstance, CardType, PlayerId, SideState } from "./types.js";
import { side } from "./side.js";

export function lane(battle: BattleState, player: PlayerId, index: number) {
  return side(battle, player).lanes[index];
}

export function firstOpenLane(battle: BattleState, player: PlayerId): number {
  const lanes = side(battle, player).lanes;
  for (let i = 0; i < lanes.length; i += 1) {
    if (!lanes[i].creature) return i;
  }
  return -1;
}

export function occupiedLanes(battle: BattleState, player: PlayerId): number[] {
  const out: number[] = [];
  const lanes = side(battle, player).lanes;
  for (let i = 0; i < lanes.length; i += 1) {
    if (lanes[i].creature) out.push(i);
  }
  return out;
}

export function creatureAt(battle: BattleState, player: PlayerId, index: number): CardInstance | null {
  return side(battle, player).lanes[index].creature ?? null;
}

export function buildingAt(battle: BattleState, player: PlayerId, index: number): CardInstance | null {
  return side(battle, player).lanes[index].building ?? null;
}

export function placeCreature(battle: BattleState, player: PlayerId, card: CardInstance, index: number, replace: CardInstance | null): void {
  if (replace) side(battle, player).discard.push(replace);
  side(battle, player).lanes[index].creature = card;
  card.lane = index;
}

export function placeBuilding(battle: BattleState, player: PlayerId, card: CardInstance, index: number, replace: CardInstance | null): void {
  if (replace) side(battle, player).discard.push(replace);
  side(battle, player).lanes[index].building = card;
  card.lane = index;
}

export function removeCreature(battle: BattleState, player: PlayerId, index: number): CardInstance | null {
  const card = side(battle, player).lanes[index].creature;
  side(battle, player).lanes[index].creature = null;
  if (card) {
    card.lane = null;
    side(battle, player).discard.push(card);
  }
  return card;
}

export function removeBuilding(battle: BattleState, player: PlayerId, index: number): CardInstance | null {
  const card = side(battle, player).lanes[index].building;
  side(battle, player).lanes[index].building = null;
  if (card) {
    card.lane = null;
    side(battle, player).discard.push(card);
  }
  return card;
}

export function moveCreature(battle: BattleState, player: PlayerId, from: number, to: number): void {
  const lanes = side(battle, player).lanes;
  const card = lanes[from].creature;
  if (!card) return;
  lanes[from].creature = null;
  lanes[to].creature = card;
  card.lane = to;
}

export function faceUpFactions(battle: BattleState, player: PlayerId): Partial<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const laneState of side(battle, player).lanes) {
    if (!laneState.landscape.faceDown) counts[laneState.landscape.faction] = (counts[laneState.landscape.faction] ?? 0) + 1;
  }
  return counts;
}

export function distinctFaceUpFactions(battle: BattleState, player: PlayerId): string[] {
  return Object.keys(faceUpFactions(battle, player));
}

export function faceUpCount(battle: BattleState, player: PlayerId): number {
  return side(battle, player).lanes.filter(l => !l.landscape.faceDown).length;
}

export function isAdjacent(a: number, b: number): boolean {
  return Math.abs(a - b) === 1;
}

export function allCreatures(battle: BattleState, player: PlayerId): CardInstance[] {
  const out: CardInstance[] = [];
  for (const laneState of side(battle, player).lanes) {
    if (laneState.creature) out.push(laneState.creature);
  }
  return out;
}
