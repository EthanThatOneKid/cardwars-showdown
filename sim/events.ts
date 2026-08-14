import type { BattleState, CardInstance, EventWindow, PlayerId } from "./types.js";
import { allCreatures } from "./field.js";

export interface EventBag {
  [key: string]: unknown;
}

export interface WindowHandler {
  card: CardInstance;
  ability: CardInstance["abilities"][number];
}

export function gatherHandlers(battle: BattleState, window: EventWindow, player?: PlayerId): WindowHandler[] {
  const out: WindowHandler[] = [];
  for (const pid of (player ? [player] : ["p1", "p2"]) as PlayerId[]) {
    for (const card of allCreatures(battle, pid)) {
      for (const ability of card.abilities) {
        if (ability.window === window && ability.kind === "continuous") {
          out.push({ card, ability });
        }
      }
    }
    for (const laneState of battle.sides[pid].lanes) {
      if (laneState.building) {
        for (const ability of laneState.building.abilities) {
          if (ability.window === window && ability.kind === "continuous") {
            out.push({ card: laneState.building, ability });
          }
        }
      }
    }
  }
  return out;
}

export interface EventResult {
  blocked: boolean;
}

export function runEvent(battle: BattleState, window: EventWindow, bag: EventBag): EventResult {
  let blocked = false;
  const handlers = gatherHandlers(battle, window);
  for (const h of handlers) {
    const effect = h.ability.effect;
    switch (window) {
      case "onCanFight":
        if (effect.op === "block" && effect.lanes === "adjacent") {
          const targetLane = typeof bag.lane === "number" ? (bag.lane as number) : -1;
          const ownerLane = h.card.lane ?? -1;
          if (targetLane >= 0 && ownerLane >= 0 && Math.abs(targetLane - ownerLane) === 1) {
            blocked = true;
          }
        }
        break;
      case "onCanTrigger":
        if (effect.op === "block") blocked = true;
        break;
      default:
        break;
    }
  }
  return { blocked };
}

export function calcStat(
  battle: BattleState,
  card: CardInstance,
  stat: "atk" | "def",
  base: number,
): number {
  let value = base;
  const window: EventWindow = stat === "atk" ? "onCalculateATK" : "onCalculateDEF";
  for (const pid of ["p1", "p2"] as PlayerId[]) {
    for (const c of allCreatures(battle, pid)) {
      for (const ability of c.abilities) {
        if (ability.window !== window) continue;
        const eff = ability.effect;
        if (eff.op === "modify") {
          const mod = stat === "atk" ? (eff.atk ?? 0) : (eff.def ?? 0);
          if (eff.targets === "self" && c.uid === card.uid) value += mod;
          if (eff.targets === "adjacent-creatures" && c.lane !== null && card.lane !== null && Math.abs(c.lane - card.lane) === 1) {
            value += mod;
          }
        }
        if (eff.op === "scale" && eff.per === "cornfield-landscape" && c.uid === card.uid) {
          const per = stat === "atk" ? (eff.atk ?? 0) : (eff.def ?? 0);
          const ownCount = battle.sides[card.owner].lanes.filter(l => !l.landscape.faceDown && l.landscape.faction === "cornfield").length;
          value += per * ownCount;
        }
      }
    }
  }
  return value;
}

export function atk(battle: BattleState, card: CardInstance): number {
  return calcStat(battle, card, "atk", card.atk ?? 0);
}

export function def(battle: BattleState, card: CardInstance): number {
  return calcStat(battle, card, "def", card.def ?? 0);
}
