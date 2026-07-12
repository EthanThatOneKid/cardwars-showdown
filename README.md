# cardwars-showdown

Authentic Adventure Time Card Wars simulator inspired by Pokemon Showdown's battle engine.

## Project requirement

The first milestone is a tournament-legal **Card Wars Singles** ruleset. That means the simulator must faithfully model the official 1v1 constructed format before we expand to anything else.

## Current supported format

- `cardwars-singles`

## Verification strategy

- Keep format data explicit and snapshot-friendly.
- Verify singles setup invariants: 2 players, 4 lanes, 40-card decks, 25 HP, 5-card opening hand, 2 resources per turn, 1 draw per turn.
- Verify deterministic battle flow: turn order, placement, lane combat, damage, and win resolution.
- Add regression tests for every rule we implement before expanding the ruleset.

## Status

The test suite now covers the supported singles format and the basic battle loop. The next gap is deeper Card Wars rules fidelity: card text, timing windows, lane-specific effects, hero identity rules, and any official deck-building restrictions that apply to the real tournament format.

## Current gaps before full tournament legality

- Card-specific abilities, timing windows, and triggered effects.
- Full deck legality validation beyond the format metadata.
- Exhaustive card pool and official card text coverage.
- Full turn structure, replacement effects, and special terrain rules.
- Comprehensive win-condition and edge-case coverage.

## Test status

- `bun test` is wired up.
- The first unit-test harness exists.
- Coverage is still growing, but the singles path is now the primary target.

## Scaffold

```text
sim/
  battle.ts
  battle-stream.ts
  card.ts
  dex.ts
  field.ts
  side.ts
  types.ts
  data/
    cards.ts
    formats.ts
```

## What this starter gives you

- a battle-engine-shaped TypeScript skeleton
- a tiny card dex and board model
- a reusable `Battle` entry point for future sim rules
