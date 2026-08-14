import type { Ability, BattleState, CardInstance, EventWindow, PlayerId } from "./types.js";
import { allCreatures } from "./field.js";

export interface EventBag {
  [key: string]: unknown;
}

export interface WindowHandler {
  card: CardInstance;
  ability: Ability;
}

const BLOCKABLE_WINDOWS: ReadonlySet<EventWindow> = new Set([
  "onCanFight",
  "onCanPlay",
  "onCanTrigger",
]);

export function allInPlay(battle: BattleState, player?: PlayerId): CardInstance[] {
  const out: CardInstance[] = [];
  const players: PlayerId[] = player ? [player] : ["p1", "p2"];
  for (const pid of players) {
    out.push(...allCreatures(battle, pid));
    for (const laneState of battle.sides[pid].lanes) {
      if (laneState.building) out.push(laneState.building);
    }
  }
  return out;
}

export function gatherHandlers(
  battle: BattleState,
  window: EventWindow,
  bag: EventBag = {},
): WindowHandler[] {
  const out: WindowHandler[] = [];
  for (const card of allInPlay(battle)) {
    for (const ability of card.abilities) {
      if (ability.window === window) out.push({ card, ability });
    }
  }
  if (window !== "onCanTrigger") {
    return out.filter(h => !isTriggerSuppressed(battle, h.card));
  }
  return out;
}

export function isTriggerSuppressed(battle: BattleState, card: CardInstance): boolean {
  if (card.lane === null) return false;
  const laneIndex = card.lane;
  const opponent: PlayerId = card.owner === "p1" ? "p2" : "p1";
  for (const blocker of allInPlay(battle, opponent)) {
    for (const ability of blocker.abilities) {
      if (ability.window === "onCanTrigger" && ability.effect.op === "block") {
        if (blocker.lane === laneIndex) return true;
      }
    }
  }
  return false;
}

export interface EventResult {
  blocked: boolean;
}

export function runEvent(battle: BattleState, window: EventWindow, bag: EventBag): EventResult {
  let blocked = false;
  const handlers = gatherHandlers(battle, window, bag);
  for (const h of handlers) {
    const effect = h.ability.effect;
    if (effect.op === "unsupported") {
      // Unsupported interactions are declared, never guessed (#22).
      continue;
    }
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
      case "onCanPlay":
        if (effect.op === "require" && effect.discardCount) {
          const need = parseInt(effect.discardCount.replace(/\D/g, ""), 10);
          const discardSize = battle.sides[bag.player as PlayerId].discard.length;
          if (discardSize < need) blocked = true;
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

export function isBlocked(battle: BattleState, window: EventWindow, bag: EventBag): boolean {
  if (!BLOCKABLE_WINDOWS.has(window)) return false;
  return runEvent(battle, window, bag).blocked;
}

export function canFight(battle: BattleState, laneIndex: number, attackerOwner: PlayerId): boolean {
  return !isBlocked(battle, "onCanFight", { lane: laneIndex, player: attackerOwner });
}

export function canPlay(battle: BattleState, player: PlayerId, card: CardInstance): boolean {
  return !isBlocked(battle, "onCanPlay", { player, card });
}

function statHandlers(battle: BattleState, window: EventWindow): WindowHandler[] {
  return gatherHandlers(battle, window).filter(
    h => h.ability.kind === "continuous" || h.ability.kind === "variable-stat",
  );
}

export function calcStat(
  battle: BattleState,
  card: CardInstance,
  stat: "atk" | "def",
  base: number,
): number {
  let value = base;
  const window: EventWindow = stat === "atk" ? "onCalculateATK" : "onCalculateDEF";
  for (const h of statHandlers(battle, window)) {
    const eff = h.ability.effect;
    if (eff.op === "unsupported") continue;
    if (eff.op === "modify") {
      const mod = stat === "atk" ? (eff.atk ?? 0) : (eff.def ?? 0);
      const targets = eff.targets ?? "self";
      if (targets === "self" && h.card.uid === card.uid) value += mod;
      else if (targets === "adjacent-creatures" && h.card.lane !== null && card.lane !== null && Math.abs(h.card.lane - card.lane) === 1) {
        value += mod;
      }
      if (targets.startsWith("creature-in-lane") && h.card.lane === card.lane) value += mod;
    } else if (eff.op === "scale") {
      const per = stat === "atk" ? (eff.atk ?? 0) : (eff.def ?? 0);
      if (eff.per === "cornfield-landscape" && h.card.uid === card.uid) {
        const ownCount = battle.sides[card.owner].lanes.filter(
          l => !l.landscape.faceDown && l.landscape.faction === "cornfield",
        ).length;
        value += per * ownCount;
      } else if (eff.per === "flooped-creatures" && h.card.uid === card.uid) {
        const flooped = allCreatures(battle, card.owner).filter(c => c.flooped).length;
        value += per * flooped;
      } else if (eff.per === "each-cactiball" && h.card.uid === card.uid) {
        const count = allCreatures(battle, card.owner).filter(c => c.id === "green-cactiball").length;
        value += per * count;
      } else if (eff.per === "discard-cards" && h.card.uid === card.uid) {
        const every5 = Math.floor(battle.sides[card.owner].discard.length / 5);
        value += per * every5;
      } else if (eff.per === "different-landscape-types" && h.card.uid === card.uid) {
        const distinct = new Set(
          battle.sides[card.owner].lanes
            .filter(l => !l.landscape.faceDown)
            .map(l => l.landscape.faction),
        ).size;
        value += per * distinct;
      } else if (eff.per === "damage-on-card" && h.card.uid === card.uid) {
        value += per * card.damage;
      } else if (eff.per === "no-damage-check" && h.card.uid === card.uid) {
        if (card.damage === 0) value += per;
      }
    } else if (eff.op === "block") {
      // Protection/immunity effects are handled by blockable windows, not stats.
      void 0;
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
