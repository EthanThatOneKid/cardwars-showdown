import type { Card } from "./card.js";
import type { BattleLaneSnapshot, PlayerId } from "./types.js";

interface LaneState {
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
    if (!lane) throw new Error(`Invalid lane ${laneIndex}`);
    if (lane[player]) throw new Error(`Lane ${laneIndex + 1} already occupied for ${player}`);
    lane[player] = card;
    card.lane = laneIndex;
  }

  firstOpenLane(player: PlayerId): number {
    return this.lanes.findIndex(lane => lane[player] === null);
  }

  forPlayer(player: PlayerId): Card[] {
    return this.lanes.map(lane => lane[player]).filter((card): card is Card => Boolean(card));
  }

  snapshot(): BattleLaneSnapshot[] {
    return this.lanes.map((lane, index) => ({
      index,
      p1: lane.p1?.toSummary() ?? null,
      p2: lane.p2?.toSummary() ?? null,
    }));
  }
}
