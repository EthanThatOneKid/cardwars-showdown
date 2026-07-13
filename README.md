# cardwars-showdown

Authentic Adventure Time Card Wars simulator inspired by the rules engine and determinism discipline of Pokémon Showdown.

## Current scope

- supported format: `singles`
- deterministic 1v1 battle flow
- lane model, health, resources, draw, combat, and logging
- unit test harness via `bun test`

## Project requirements

- Match the official Card Wars ruleset as faithfully as possible
- Keep the engine deterministic and repeatable
- Treat new formats as explicit additions, not assumptions
- Expand coverage with unit tests before adding new mechanics

## Battle engine notes

- `singles` is the only supported format right now
- the engine is a true rules engine only for the mechanics it currently models
- unsupported mechanics should fail loudly rather than silently pretending to be implemented

## Current supported format

- `cardwars-singles`

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
