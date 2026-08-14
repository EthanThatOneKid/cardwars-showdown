import type { BattleState, CardInstance, CardTemplate, PlayerId, SideState } from "./types.js";

let nextUid = 1;

export function freshUid(): string {
  return `card-${nextUid++}`;
}

export function makeInstance(template: CardTemplate, owner: PlayerId): CardInstance {
  return {
    ...template,
    abilities: [...template.abilities],
    owner,
    uid: freshUid(),
    damage: 0,
    exhausted: false,
    flooped: false,
    lane: null,
  };
}

export function side(battle: BattleState, player: PlayerId): SideState {
  return battle.sides[player];
}

export function other(player: PlayerId): PlayerId {
  return player === "p1" ? "p2" : "p1";
}

export function draw(battle: BattleState, player: PlayerId): CardInstance | null {
  const s = side(battle, player);
  const card = s.deck.shift();
  if (card) s.hand.push(card);
  return card ?? null;
}

export function discardFromHand(battle: BattleState, player: PlayerId, index: number): CardInstance | null {
  const s = side(battle, player);
  const [card] = s.hand.splice(index, 1);
  if (card) s.discard.push(card);
  return card ?? null;
}

export function randomDiscard(battle: BattleState, player: PlayerId): CardInstance | null {
  const s = side(battle, player);
  const card = s.deck.shift();
  if (card) s.discard.push(card);
  return card ?? null;
}

export function log(battle: BattleState, actor: PlayerId | "system", message: string, phase = battle.phase): void {
  battle.log.push({ turn: battle.turn, actor, message, phase });
}
