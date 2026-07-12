# cardwars-showdown

Authentic Adventure Time Card Wars simulator inspired by Pokemon Showdown's battle engine.

## Supported formats

- `cardwars-singles` — the default 1v1 Adventure Time Card Wars format currently scaffolded in this repo.

## Current strategy for verification

- Treat format legality as data-driven: each supported format gets explicit deck-size, lane-count, and starting-state rules.
- Add unit tests that prove turn flow, combat resolution, defeat detection, and format validation for every supported format.
- Keep battle snapshots deterministic so tests can assert exact board, hand, resource, and log states.

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

## Testing status

There is no real unit test suite yet. The next step is to add `bun test` coverage for the battle engine and format rules.
