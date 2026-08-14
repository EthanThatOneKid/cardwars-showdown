#!/usr/bin/env bun
import { Battle } from "./battle.js";
import { describeDeck } from "./validate.js";
import { runBattle, runRunner, summarize } from "./runner.js";
import { requireCard } from "./dex.js";

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      if (value && !value.startsWith("--")) {
        out[key] = value;
        i += 1;
      } else {
        out[key] = "true";
      }
    }
  }
  return out;
}

function deckFromArgs(args: Record<string, string>, prefix: string): { name: string; cards: string[] } {
  const cardArg = args[`${prefix}card`] ?? "cow";
  const count = parseInt(args[`${prefix}count`] ?? "40", 10);
  const cards: string[] = [];
  for (let i = 0; i < count; i += 1) cards.push(cardArg);
  return { name: `${prefix}-deck`, cards };
}

function usage(): void {
  console.log(`Usage: bun sim/cli.ts --seed <n> [--p1card <id>] [--p2card <id>] [--turns <n>]

Runs a Card Wars singles battle and prints the game log.

Options:
  --seed    32-bit seed for deterministic play (default 0xc0ffeeda)
  --p1card  card id for p1's deck (default cow)
  --p2card  card id for p2's deck (default cow)
  --turns   max turns to run (default 10)
  --decks   print deck descriptions then exit
  --cards   list all card ids then exit
  --runner  run the exhaustive runner (--count default 1000)
`);
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  if (args.decks === "true" || args.decks) {
    const d1 = deckFromArgs(args, "p1");
    const d2 = deckFromArgs(args, "p2");
    console.log(describeDeck(d1));
    console.log(describeDeck(d2));
    return;
  }
  if (args.cards === "true" || args.cards) {
    for (const card of require("./dex.js").cardPool() as ReturnType<typeof requireCard>[]) {
      console.log(`${card.id}\t${card.faction}\t${card.type}\t${card.atk ?? "-"}/${card.def ?? "-"}\t${card.name}`);
    }
    return;
  }
  if (args.runner === "true" || args.runner) {
    const count = parseInt(args.count ?? "1000", 10);
    const seed = parseInt(args.seed ?? "0xc0ffeeda", 16) || 0xc0ffeeda;
    const stats = runRunner({ seed, count });
    console.log(summarize(stats));
    if (stats.failures.length > 0 || stats.coverageFailed.length > 0 || !stats.deterministic) {
      process.exit(1);
    }
    return;
  }
  if (args.help === "true" || args.help) {
    usage();
    return;
  }

  const seed = parseInt(args.seed ?? "0xc0ffeeda", 16) || 0xc0ffeeda;
  const turns = parseInt(args.turns ?? "10", 10);
  const d1 = deckFromArgs(args, "p1");
  const d2 = deckFromArgs(args, "p2");

  console.log(describeDeck(d1));
  console.log(describeDeck(d2));

  const battle = new Battle({ seed, skipValidation: args["skip-validation"] === "true" });
  try {
    battle.start(d1, d2);
  } catch (err) {
    console.error(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
  const result = runBattle(seed, d1, d2, { maxTurns: turns, skipValidation: args["skip-validation"] === "true" });
  if (result.error) {
    console.error(`ERROR: ${result.error}`);
    process.exit(1);
  }
  for (const line of result.log) console.log(line);
  const state = battle.state;
  if (state.winner) {
    console.log(`${state.winner} wins.`);
  } else {
    console.log(`Reached turn ${turns} without a winner.`);
  }
}

main();
