export interface Format {
  id: string;
  name: string;
  players: 2;
  lanes: 4;
  startingHp: 25;
  startingHand: 5;
  resourcesPerTurn: 2;
  drawPerTurn: 1;
  minDeckSize: 40;
  maxCopiesPerCard: 3;
  maxTurns: number;
}

export const singles: Format = {
  id: "singles",
  name: "Singles (official Card Wars 1v1)",
  players: 2,
  lanes: 4,
  startingHp: 25,
  startingHand: 5,
  resourcesPerTurn: 2,
  drawPerTurn: 1,
  minDeckSize: 40,
  maxCopiesPerCard: 3,
  maxTurns: 200,
};
