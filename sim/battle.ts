import type { BattleOptions, BattleState, CardInstance, CardTemplate, DeckList, PlayerId, RngState } from "./types.js";
import { FACTIONS } from "./types.js";
import { makeRng, nextIntBelow, shuffle } from "./rng.js";
import { requireCard } from "./dex.js";
import { singles } from "./data/formats.js";
import { draw, log, makeInstance, other, side } from "./side.js";
import { faceUpFactions } from "./field.js";
import { atk, canFight as canFightEvent, def, runEvent } from "./events.js";
import { requireValidDeck } from "./validate.js";

export class Battle {
  state: BattleState;

  constructor(readonly options: BattleOptions = {}) {
    const rng = makeRng(options.seed ?? 0xc0ffeeda);
    this.state = {
      turn: 0,
      phase: "setup",
      activePlayer: "p1",
      firstPlayer: "p1",
      winner: null,
      maxTurns: options.maxTurns ?? singles.maxTurns,
      maxHp: options.maxHp ?? singles.startingHp,
      resourcesPerTurn: options.resourcesPerTurn ?? singles.resourcesPerTurn,
      sides: {
        p1: emptySide("p1", singles.lanes),
        p2: emptySide("p2", singles.lanes),
      },
      rng,
      log: [],
    };
  }

  start(p1Deck: DeckList, p2Deck: DeckList, firstPlayer: PlayerId | null = null): void {
    if (!this.options.skipValidation) {
      requireValidDeck(p1Deck);
      requireValidDeck(p2Deck);
    }
    const s = this.state;
    s.turn = 0;
    s.phase = "setup";
    s.winner = null;
    s.log.length = 0;
    s.firstPlayer = firstPlayer ?? (nextIntBelow(s.rng, 2) === 0 ? "p1" : "p2");
    s.activePlayer = s.firstPlayer;

    for (const pid of ["p1", "p2"] as PlayerId[]) {
      const deck = pid === "p1" ? p1Deck : p2Deck;
      const sideState = s.sides[pid];
      sideState.deck = shuffle(s.rng, deck.cards.map(id => makeInstance(requireCard(id), pid)));
      sideState.hand.length = 0;
      sideState.discard.length = 0;
      sideState.hp = s.maxHp;
      sideState.resources = 0;
      sideState.mulliganUsed = false;
      sideState.turnsPlayed = 0;
      sideState.lanes = deriveLandscapes(deck, s.rng);
    }

    for (const pid of ["p1", "p2"] as PlayerId[]) {
      for (let i = 0; i < singles.startingHand; i += 1) draw(s, pid);
    }

    log(s, "system", `Battle started. ${s.firstPlayer} goes first.`, "setup");
    s.phase = "ready";
  }

  canMulligan(player: PlayerId): boolean {
    const s = side(this.state, player);
    return !s.mulliganUsed && s.hand.filter(c => c.type === "creature").length < 2;
  }

  mulligan(player: PlayerId): void {
    const s = side(this.state, player);
    if (s.mulliganUsed) return;
    s.mulliganUsed = true;
    const hand = [...s.hand];
    s.hand.length = 0;
    s.deck.unshift(...hand);
    s.deck = shuffle(this.state.rng, s.deck);
    for (let i = 0; i < singles.startingHand; i += 1) draw(this.state, player);
    log(this.state, player, `${player} mulligans.`, "setup");
  }

  beginTurn(): void {
    const s = this.state;
    if (s.phase === "finished") return;
    s.turn += 1;
    s.phase = "ready";
    for (const pid of ["p1", "p2"] as PlayerId[]) {
      for (const laneState of s.sides[pid].lanes) {
        if (laneState.creature) {
          laneState.creature.exhausted = false;
          laneState.creature.flooped = false;
        }
        if (laneState.building) {
          laneState.building.exhausted = false;
          laneState.building.flooped = false;
        }
      }
    }
    const active = side(s, s.activePlayer);
    active.resources = s.resourcesPerTurn;
    active.turnsPlayed += 1;
    draw(s, s.activePlayer);
    log(s, s.activePlayer, `Turn ${s.turn} begins for ${s.activePlayer}.`, "draw");
    s.phase = "main";
  }

  canPlay(player: PlayerId, handIndex: number): { ok: true } | { ok: false; reason: string } {
    const s = side(this.state, player);
    const card = s.hand[handIndex];
    if (!card) return { ok: false, reason: "No card at that hand index." };
    if (s.resources < card.actionCost) return { ok: false, reason: `Not enough Actions (need ${card.actionCost}).` };
    if (card.actionCost > 0) {
      const control = faceUpFactions(this.state, player)[card.faction] ?? 0;
      if (card.faction !== "rainbow" && control < card.landscapeCost) {
        return { ok: false, reason: `Need ${card.landscapeCost} face-up ${card.faction} Landscape(s).` };
      }
      if (card.faction === "rainbow" && faceUpCountForRainbow(this.state, player) < card.landscapeCost) {
        return { ok: false, reason: `Need ${card.landscapeCost} face-up Landscape(s).` };
      }
    }
    return { ok: true };
  }

  playCard(player: PlayerId, handIndex: number, laneIndex: number): { ok: true } | { ok: false; reason: string } {
    const check = this.canPlay(player, handIndex);
    if (!check.ok) return check;
    const s = side(this.state, player);
    const card = s.hand.splice(handIndex, 1)[0];
    s.resources -= card.actionCost;

    if (card.type === "spell") {
      s.discard.push(card);
      log(this.state, player, `${player} plays spell ${card.name}.`, "main");
      return { ok: true };
    }

    const laneState = s.lanes[laneIndex];
    if (!laneState) {
      s.discard.push(card);
      return { ok: false, reason: "Invalid lane." };
    }

    if (card.type === "creature") {
      const existing = laneState.creature;
      if (existing && existing.exhausted) {
        s.hand.push(card);
        s.resources += card.actionCost;
        return { ok: false, reason: "Cannot replace a Flooped/Activated Creature." };
      }
      laneState.creature = card;
      card.lane = laneIndex;
      card.exhausted = false;
      card.flooped = false;
      if (existing) {
        existing.lane = null;
        s.discard.push(existing);
        log(this.state, player, `${player} replaces ${existing.name} with ${card.name}.`, "main");
      } else {
        log(this.state, player, `${player} plays ${card.name} into lane ${laneIndex + 1}.`, "main");
      }
      return { ok: true };
    }

    if (card.type === "building") {
      const existing = laneState.building;
      laneState.building = card;
      card.lane = laneIndex;
      card.exhausted = false;
      card.flooped = false;
      if (existing) {
        existing.lane = null;
        s.discard.push(existing);
        log(this.state, player, `${player} replaces building ${existing.name} with ${card.name}.`, "main");
      } else {
        log(this.state, player, `${player} plays building ${card.name} under lane ${laneIndex + 1}.`, "main");
      }
      return { ok: true };
    }

    s.discard.push(card);
    return { ok: false, reason: "Unrecognized card type." };
  }

  canFloop(player: PlayerId, laneIndex: number): { ok: true } | { ok: false; reason: string } {
    if (this.state.phase === "finished") return { ok: false, reason: "Battle over." };
    if (this.firstPlayerTurnOne() && player === this.state.firstPlayer) {
      return { ok: false, reason: "First player may not Floop on the first turn." };
    }
    const laneState = side(this.state, player).lanes[laneIndex];
    if (!laneState) return { ok: false, reason: "Invalid lane." };
    const card = laneState.creature ?? laneState.building;
    if (!card) return { ok: false, reason: "No card in that lane." };
    if (!card.abilities.some(a => a.kind === "floop")) return { ok: false, reason: `${card.name} has no Floop ability.` };
    if (card.exhausted) return { ok: false, reason: `${card.name} is already exhausted.` };
    return { ok: true };
  }

  floop(player: PlayerId, laneIndex: number): { ok: true } | { ok: false; reason: string } {
    const check = this.canFloop(player, laneIndex);
    if (!check.ok) return check;
    const laneState = side(this.state, player).lanes[laneIndex];
    const card = laneState!.creature ?? laneState!.building!;
    card.exhausted = true;
    card.flooped = true;
    log(this.state, player, `${player} Floops ${card.name}.`, "main");
    return { ok: true };
  }

  canFight(player: PlayerId, laneIndex: number): { ok: true } | { ok: false; reason: string } {
    if (this.state.phase === "finished") return { ok: false, reason: "Battle over." };
    if (this.firstPlayerTurnOne() && player === this.state.firstPlayer) {
      return { ok: false, reason: "First player may not Fight on the first turn." };
    }
    const card = side(this.state, player).lanes[laneIndex]?.creature;
    if (!card) return { ok: false, reason: "No Creature in that lane." };
    if (card.exhausted) return { ok: false, reason: `${card.name} is exhausted and cannot Fight.` };
    if (card.flooped) return { ok: false, reason: `${card.name} is Flooped and cannot Fight.` };
    if (!canFightEvent(this.state, laneIndex, player)) return { ok: false, reason: `${card.name} cannot be Attacked right now (protection).` };
    return { ok: true };
  }

  fight(player: PlayerId, laneIndex: number): { ok: true } | { ok: false; reason: string } {
    const check = this.canFight(player, laneIndex);
    if (!check.ok) return check;
    const s = this.state;
    const attacker = side(s, player).lanes[laneIndex].creature!;
    const defender = s.sides[other(player)].lanes[laneIndex].creature ?? null;
    const atkValue = atk(s, attacker);
    attacker.exhausted = true;

    if (!defender) {
      s.sides[other(player)].hp = Math.max(0, s.sides[other(player)].hp - atkValue);
      log(s, player, `${attacker.name} attacks directly for ${atkValue}.`, "fight");
      runEvent(s, "onAfterFight", { lane: laneIndex, player });
      this.checkWin();
      return { ok: true };
    }

    const defValue = atk(s, defender);
    defender.damage += atkValue;
    attacker.damage += defValue;
    log(s, player, `${attacker.name} (${atkValue} ATK) fights ${defender.name} (${defValue} ATK) in lane ${laneIndex + 1}.`, "fight");

    const defThreshold = def(s, defender);
    const atkThreshold = def(s, attacker);
    const defenderDead = defender.damage >= defThreshold;
    const attackerDead = attacker.damage >= atkThreshold;
    if (defenderDead) {
      side(s, other(player)).lanes[laneIndex].creature = null;
      defender.lane = null;
      s.sides[other(player)].discard.push(defender);
      log(s, "system", `${defender.name} is destroyed.`, "fight");
    }
    if (attackerDead) {
      side(s, player).lanes[laneIndex].creature = null;
      attacker.lane = null;
      s.sides[player].discard.push(attacker);
      log(s, "system", `${attacker.name} is destroyed.`, "fight");
    }
    runEvent(s, "onAfterFight", { lane: laneIndex, player });
    this.checkWin();
    return { ok: true };
  }

  drawAction(player: PlayerId): { ok: true } | { ok: false; reason: string } {
    const s = side(this.state, player);
    if (s.resources < 1) return { ok: false, reason: "No Actions left." };
    if (this.state.phase === "finished") return { ok: false, reason: "Battle over." };
    s.resources -= 1;
    draw(this.state, player);
    log(this.state, player, `${player} spends 1 Action to draw.`, "main");
    return { ok: true };
  }

  endTurn(): void {
    const s = this.state;
    s.phase = "end";
    if (s.sides[s.activePlayer].hp <= 0) {
      s.winner = other(s.activePlayer);
      s.phase = "finished";
      log(s, "system", `${s.winner} wins.`, "finished");
      return;
    }
    const active = s.activePlayer;
    s.activePlayer = other(active);
    s.phase = "ready";
  }

  private firstPlayerTurnOne(): boolean {
    return this.state.turn === 1 && this.state.activePlayer === this.state.firstPlayer;
  }

  private checkWin(): void {
    const s = this.state;
    for (const pid of ["p1", "p2"] as PlayerId[]) {
      if (s.sides[pid].hp <= 0) {
        s.winner = other(pid);
        s.phase = "finished";
        log(s, "system", `${s.winner} wins.`, "finished");
        return;
      }
    }
  }

  isOver(): boolean {
    return this.state.phase === "finished" || this.state.turn >= this.state.maxTurns;
  }

  toJSON(): BattleState {
    return structuredClone(this.state);
  }

  static fromJSON(json: BattleState): Battle {
    const b = new Battle({ seed: 0 });
    b.state = json;
    return b;
  }
}

function emptySide(player: PlayerId, lanes: number): BattleState["sides"]["p1"] {
  return {
    player,
    hp: 25,
    resources: 0,
    deck: [],
    hand: [],
    discard: [],
    lanes: Array.from({ length: lanes }, () => ({
      landscape: { faction: "rainbow", faceDown: false },
      creature: null,
      building: null,
    })),
    mulliganUsed: false,
    turnsPlayed: 0,
  };
}

function deriveLandscapes(deck: DeckList, rng: RngState): BattleState["sides"]["p1"]["lanes"] {
  const counts = new Map<string, number>();
  for (const id of deck.cards) {
    const card = requireCard(id);
    if (card.type === "creature" && card.faction !== "rainbow") {
      counts.set(card.faction, (counts.get(card.faction) ?? 0) + 1);
    }
  }
  const factionCounts = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const total = factionCounts.reduce((sum, [, n]) => sum + n, 0);
  const tiles: BattleState["sides"]["p1"]["lanes"] = [];
  if (total === 0) {
    for (let i = 0; i < 4; i += 1) {
      tiles.push({ landscape: { faction: "rainbow", faceDown: false }, creature: null, building: null });
    }
    return tiles;
  }
  const raw = factionCounts.map(([faction, n]) => ({ faction, n: (n / total) * 4 }));
  let assigned = 0;
  for (const { faction, n } of raw) {
    const whole = Math.floor(n);
    for (let i = 0; i < whole && assigned < 4; i += 1) {
      tiles.push({ landscape: { faction: faction as (typeof FACTIONS)[number], faceDown: false }, creature: null, building: null });
      assigned += 1;
    }
  }
  const remainder = factionCounts
    .map(([faction, n], i) => ({ faction, frac: raw[i].n - Math.floor(raw[i].n), idx: i }))
    .sort((a, b) => b.frac - a.frac);
  for (const { faction } of remainder) {
    if (assigned >= 4) break;
    tiles.push({ landscape: { faction: faction as (typeof FACTIONS)[number], faceDown: false }, creature: null, building: null });
    assigned += 1;
  }
  while (tiles.length < 4) {
    tiles.push({ landscape: { faction: "rainbow", faceDown: false }, creature: null, building: null });
  }
  return shuffle(rng, tiles);
}

function faceUpCountForRainbow(battle: BattleState, player: PlayerId): number {
  return battle.sides[player].lanes.filter(l => !l.landscape.faceDown).length;
}
