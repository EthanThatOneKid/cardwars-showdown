import { Field } from "./field.js";
import { Side } from "./side.js";
import type { BattleLogEntry, BattleOptions, BattleSnapshot, DeckList, PlayerId } from "./types.js";

const DEFAULT_OPTIONS: Required<Pick<BattleOptions, "startingHandSize" | "startingResources" | "resourcesPerTurn" | "drawPerTurn" | "maxTurns" | "laneCount" | "startingHealth">> = {
  startingHandSize: 5,
  startingResources: 0,
  resourcesPerTurn: 2,
  drawPerTurn: 1,
  maxTurns: 50,
  laneCount: 4,
  startingHealth: 25,
};

export class Battle {
  field = new Field();
  readonly p1 = new Side("p1");
  readonly p2 = new Side("p2");
  readonly log: BattleLogEntry[] = [];
  turn = 0;
  phase: "setup" | "draw" | "main" | "combat" | "finished" = "setup";
  activePlayer: PlayerId = "p1";
  winner: PlayerId | null = null;

  constructor(readonly options: BattleOptions = {}) {}

  start(p1Deck: DeckList, p2Deck: DeckList): void {
    const config = { ...DEFAULT_OPTIONS, ...this.options };
    this.field = new Field(config.laneCount);
    this.turn = 0;
    this.phase = "setup";
    this.activePlayer = "p1";
    this.winner = null;
    this.log.length = 0;
    this.p1.loadDeck(p1Deck, "p1", config.startingHealth, p1Deck.cards.length);
    this.p2.loadDeck(p2Deck, "p2", config.startingHealth, p2Deck.cards.length);
    this.p1.resources = config.startingResources;
    this.p2.resources = config.startingResources;
    this.p1.draw(config.startingHandSize);
    this.p2.draw(config.startingHandSize);
    this.logEvent("system", "Battle started", "setup");
  }

  step(): BattleSnapshot {
    if (this.isOver()) {
      this.phase = "finished";
      return this.snapshot();
    }

    const config = { ...DEFAULT_OPTIONS, ...this.options };
    this.turn += 1;
    this.phase = "draw";
    const side = this.side(this.activePlayer);
    const opponent = this.side(this.other(this.activePlayer));

    side.startTurn(config.resourcesPerTurn);
    side.draw(config.drawPerTurn);

    this.phase = "main";
    const lane = this.field.firstOpenLane(this.activePlayer);
    const playableIndex = side.hand.findIndex(card => card.cost <= side.resources);
    if (lane >= 0 && playableIndex >= 0) {
      const card = side.playCard(playableIndex);
      this.field.place(this.activePlayer, lane, card);
      this.logEvent(this.activePlayer, `${card.name} enters lane ${lane + 1}`, "main");
    }

    this.phase = "combat";
    this.resolveCombat();

    if (opponent.isDefeated()) {
      this.winner = this.activePlayer;
      this.phase = "finished";
      this.logEvent("system", `${this.activePlayer} wins`, "finished");
    } else {
      this.activePlayer = this.other(this.activePlayer);
    }

    return this.snapshot();
  }

  resolveCombat(): void {
    for (let laneIndex = 0; laneIndex < this.field.lanes.length; laneIndex += 1) {
      const lane = this.field.lanes[laneIndex];
      const p1Card = lane.p1;
      const p2Card = lane.p2;

      if (p1Card && p2Card) {
        p1Card.applyDamage(p2Card.attack);
        p2Card.applyDamage(p1Card.attack);
        this.logEvent("system", `Lane ${laneIndex + 1} trades blows`, "combat");
      } else if (p1Card) {
        this.p2.takeDamage(p1Card.attack);
        this.logEvent("system", `Lane ${laneIndex + 1} deals ${p1Card.attack} damage to p2`, "combat");
      } else if (p2Card) {
        this.p1.takeDamage(p2Card.attack);
        this.logEvent("system", `Lane ${laneIndex + 1} deals ${p2Card.attack} damage to p1`, "combat");
      }

      if (p1Card && !p1Card.alive) lane.p1 = null;
      if (p2Card && !p2Card.alive) lane.p2 = null;
    }
  }

  isOver(): boolean {
    return this.p1.isDefeated() || this.p2.isDefeated() || this.turn >= (this.options.maxTurns ?? DEFAULT_OPTIONS.maxTurns);
  }

  snapshot(): BattleSnapshot {
    return {
      turn: this.turn,
      phase: this.phase,
      activePlayer: this.activePlayer,
      winner: this.winner,
      lanes: this.field.snapshot(),
      sides: {
        p1: this.p1.snapshot(this.field.forPlayer("p1")),
        p2: this.p2.snapshot(this.field.forPlayer("p2")),
      },
      log: [...this.log],
    };
  }

  private side(player: PlayerId): Side {
    return player === "p1" ? this.p1 : this.p2;
  }

  private other(player: PlayerId): PlayerId {
    return player === "p1" ? "p2" : "p1";
  }

  private logEvent(actor: BattleLogEntry["actor"], message: string, phase?: BattleLogEntry["phase"]): void {
    this.log.push({ turn: this.turn, actor, message, phase });
  }
}
