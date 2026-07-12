import type { Card } from "./card.js";
import type { BattleLaneSnapshot, PlayerId } from "./types.js";

export interface LaneState {
  p1: Card | null;
  p2: Card | null;
}

export class Field {
  readonly lanes: LaneState[];

  constructor(laneCount = 4) {
    this.lanes = Array.from({ length: laneCount }, () => ({ p1: null, p2: null }));
  }

  place(player: PlayerId, laneIndex: number, card: Card): void {
    const lane = this.lanes[laneIndex];
    if (!lane) {
      throw new Error(`Invalid lane: ${laneIndex}`);
    }
    if (lane[player]) {
      throw new Error(`Lane ${laneIndex} is occupied for ${player}`);
    }
    lane[player] = card;
    card.lane = laneIndex;
    card.tap();
  }

  remove(player: PlayerId, laneIndex: number): Card | null {
    const lane = this.lanes[laneIndex];
    if (!lane) {
      throw new Error(`Invalid lane: ${laneIndex}`);
    }
    const card = lane[player];
    lane[player] = null;
    if (card) {
      card.lane = null;
    }
    return card;
  }

  ready(player: PlayerId): void {
    for (const lane of this.lanes) {
      lane[player]?.ready();
    }
  }

  forPlayer(player: PlayerId): Card[] {
    return this.lanes.flatMap(lane => lane[player] ? [lane[player]] : []);
  }

  firstOpenLane(player: PlayerId): number {
    for (let i = 0; i < this.lanes.length; i += 1) {
      if (!this.lanes[i][player]) {
        return i;
      }
    }
    return -1;
  }

  snapshot(): BattleLaneSnapshot[] {
    return this.lanes.map((lane, index) => ({
      index,
      p1: lane.p1?.toSummary() ?? null,
      p2: lane.p2?.toSummary() ?? null,
    }));
  }
}
