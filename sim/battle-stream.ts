import { Battle } from "./battle.js";
import type { BattleSnapshot, DeckList } from "./types.js";

export type BattleStreamInput =
  | { type: "start"; p1: DeckList; p2: DeckList }
  | { type: "step" }
  | { type: "snapshot" };

export class BattleStream {
  readonly battle = new Battle();
  private queue: BattleSnapshot[] = [];

  write(input: BattleStreamInput): void {
    if (input.type === "start") {
      this.battle.start(input.p1, input.p2);
      this.queue.push(this.battle.snapshot());
      return;
    }

    if (input.type === "step") {
      this.queue.push(this.battle.step());
      return;
    }

    this.queue.push(this.battle.snapshot());
  }

  read(): BattleSnapshot | undefined {
    return this.queue.shift();
  }
}
