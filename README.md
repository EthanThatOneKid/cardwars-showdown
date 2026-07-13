# cardwars-showdown

Authentic Adventure Time Card Wars simulator inspired by the rules engine and determinism discipline of Pokémon Showdown.

## Current scope

- supported format: `cardwars-singles`
- deterministic 1v1 battle flow
- lane model, health, resources, draw, combat, and logging
- unit test harness via `bun test`

## Project requirement

This project is aiming at an authentic, tournament-legal Card Wars rules engine. If a rule is not implemented yet, the engine should say so clearly rather than pretending coverage is complete.

## What is currently true

- `cardwars-singles` is the only supported format right now.
- The engine is deterministic for the mechanics it currently models.
- The test suite exists, but it is not yet exhaustive for the full official ruleset.

## Current gaps before full tournament legality

- Card-specific abilities, timing windows, and triggered effects.
- Full deck legality validation beyond the format metadata.
- Exhaustive card pool and official card text coverage.
- Full turn structure, replacement effects, and special terrain rules.
- Comprehensive win-condition and edge-case coverage.

## Test status

- `bun test` is wired up.
- The first unit-test harness exists.
- Coverage is still growing, and the simulator is not yet a complete rules oracle.

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
