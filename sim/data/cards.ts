import type { CardTemplate } from "../types.js";

export const CARDS: CardTemplate[] = [
  {
    id: "cow",
    name: "Cow",
    type: "creature",
    faction: "rainbow",
    actionCost: 0,
    landscapeCost: 0,
    atk: 1,
    def: 5,
    text: "Moo.",
    verified: "verbatim",
    abilities: [],
  },
  {
    id: "cool-dog",
    name: "Cool Dog",
    type: "creature",
    faction: "blue-plains",
    actionCost: 2,
    landscapeCost: 2,
    atk: 2,
    def: 7,
    text: "Your Creatures on adjacent Lanes may not be Attacked.",
    verified: "verbatim",
    abilities: [{ id: "cool-dog-protection", kind: "continuous", window: "onCanFight", effect: { op: "block", lanes: "adjacent" } }],
  },
];
