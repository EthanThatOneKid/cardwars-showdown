import type { BattleState, DeckList } from "./types.js";
import { Battle } from "./battle.js";
import { cardPool } from "./dex.js";
import { makeRng, nextIntBelow } from "./rng.js";
import { validateDeck } from "./validate.js";

export interface RunnerOptions {
  seed?: number;
  count?: number;
  minDeckSize?: number;
  maxCopiesPerCard?: number;
  requireCoverage?: boolean;
}

export interface RunnerStats {
  battles: number;
  decksGenerated: number;
  coverageFailed: string[];
  deterministic: boolean;
  allTerminated: boolean;
  allValidated: boolean;
  allInBounds: boolean;
  unsupportedLogged: boolean;
  failures: string[];
}

export function generateLegalDeck(rng: ReturnType<typeof makeRng>, opts: { minDeckSize?: number; maxCopiesPerCard?: number } = {}): DeckList {
  const minSize = opts.minDeckSize ?? 40;
  const maxCopies = opts.maxCopiesPerCard ?? 3;
  const pool = cardPool();
  for (let attempt = 0; attempt < 2000; attempt += 1) {
    const deck: string[] = [];
    const copies = new Map<string, number>();
    for (const card of pool) {
      const count = nextIntBelow(rng, maxCopies + 1); // 0..3
      copies.set(card.id, count);
    }
    const order = [...pool].sort(() => nextIntBelow(rng, 2) - 0.5);
    for (const card of order) {
      const n = copies.get(card.id) ?? 0;
      for (let i = 0; i < n; i += 1) deck.push(card.id);
    }
    if (deck.length < minSize) continue;
    const result = validateDeck({ name: `deck-${attempt}`, cards: deck }, { minSize, maxCopies });
    if (result.ok) return { name: `deck-${attempt}`, cards: deck };
  }
  throw new Error("generateLegalDeck: failed to produce a legal deck after 2000 attempts.");
}

export function generateCoverageDecks(opts: { minDeckSize?: number; maxCopiesPerCard?: number } = {}): DeckList[] {
  const minSize = opts.minDeckSize ?? 40;
  const maxCopies = opts.maxCopiesPerCard ?? 3;
  const pool = cardPool();
  const ids = pool.map(c => c.id);
  const seeds: string[][] = [ids];
  const kinds = new Set<string>();
  for (const card of pool) {
    for (const ability of card.abilities) kinds.add(ability.kind);
  }
  seeds.push([...kinds].map((k, i) => ids[i % ids.length]));

  const decks: DeckList[] = [];
  for (const seedCards of seeds) {
    const deck: string[] = [...seedCards];
    const countBy = new Map<string, number>();
    for (const id of deck) countBy.set(id, (countBy.get(id) ?? 0) + 1);
    for (const card of pool) {
      if (deck.includes(card.id)) continue;
      const maxAdd = Math.min(maxCopies - (countBy.get(card.id) ?? 0), 1);
      if (maxAdd > 0) {
        deck.push(card.id);
        countBy.set(card.id, (countBy.get(card.id) ?? 0) + 1);
      }
    }
    let fill = 0;
    while (deck.length < minSize) {
      const id = ids[fill % ids.length];
      if ((countBy.get(id) ?? 0) < maxCopies) {
        deck.push(id);
        countBy.set(id, (countBy.get(id) ?? 0) + 1);
      }
      fill += 1;
    }
    decks.push({ name: `coverage-${decks.length}`, cards: deck });
  }
  return decks;
}

export interface BattleRunResult {
  seed: number;
  deckA: DeckList;
  deckB: DeckList;
  log: string[];
  error: string | null;
}

export function runBattle(seed: number, deckA: DeckList, deckB: DeckList, opts: { maxTurns?: number; skipValidation?: boolean } = {}): BattleRunResult {
  try {
    const battle = new Battle({ seed, skipValidation: opts.skipValidation ?? false });
    battle.start(deckA, deckB);
    const maxTurns = opts.maxTurns ?? battle.state.maxTurns;
    let guard = 0;
    while (!battle.isOver() && battle.state.turn < maxTurns && guard < 2000) {
      guard += 1;
      battle.beginTurn();
      const player = battle.state.activePlayer;
      const s = battle.state.sides[player];
      for (let i = 0; i < 4 && s.resources > 0; i += 1) {
        const idx = s.hand.findIndex(c => c.actionCost <= s.resources);
        if (idx < 0) break;
        const lane = s.lanes.findIndex(l => !l.creature);
        const res = battle.playCard(player, idx, lane >= 0 ? lane : 0);
        if (!res.ok) break;
      }
      for (let i = 0; i < 4; i += 1) {
        if (battle.canFight(player, i).ok) battle.fight(player, i);
      }
      battle.endTurn();
    }
    const log = battle.state.log.map(l => `${l.turn}:${l.actor}:${l.message}`);
    return { seed, deckA, deckB, log, error: null };
  } catch (err) {
    return { seed, deckA, deckB, log: [], error: err instanceof Error ? err.message : String(err) };
  }
}

export function runRunner(opts: RunnerOptions = {}): RunnerStats {
  const seed = opts.seed ?? 0xc0ffeeda;
  const count = opts.count ?? 1000;
  const stats: RunnerStats = {
    battles: 0,
    decksGenerated: 0,
    coverageFailed: [],
    deterministic: true,
    allTerminated: true,
    allValidated: true,
    allInBounds: true,
    unsupportedLogged: false,
    failures: [],
  };

  const decks: DeckList[] = [];
  if (opts.requireCoverage ?? true) {
    decks.push(...generateCoverageDecks(opts));
  }

  const rng = makeRng(seed);
  for (let i = 0; i < count; i += 1) {
    const deckA = generateLegalDeck(rng, opts);
    const deckB = generateLegalDeck(rng, opts);
    decks.push(deckA, deckB);
  }
  stats.decksGenerated = decks.length;

  const battleSeed = makeRng(seed);
  for (let i = 0; i < count; i += 1) {
    const battleSeedValue = nextIntBelow(battleSeed, 0xffffffff);
    const a = decks[2 * i];
    const b = decks[2 * i + 1];
    const run = runBattle(battleSeedValue, a, b);
    stats.battles += 1;

    if (run.error) {
      stats.allTerminated = false;
      stats.allValidated = false;
      stats.failures.push(`battle ${i} (seed ${battleSeedValue}): ${run.error}`);
      continue;
    }
    if (run.log.some(l => l.includes("unsupported"))) stats.unsupportedLogged = true;

    const r2 = runBattle(battleSeedValue, a, b);
    if (r2.error || r2.log.join("\n") !== run.log.join("\n")) {
      stats.deterministic = false;
      stats.failures.push(`battle ${i} (seed ${battleSeedValue}): non-deterministic replay.`);
    }

    const json = new Battle({ seed: battleSeedValue }).toJSON();
    if (json.sides.p1.hp > json.maxHp || json.sides.p2.hp > json.maxHp) {
      stats.allInBounds = false;
    }
  }

  const coveredIds = new Set<string>();
  for (const deck of decks) for (const id of deck.cards) coveredIds.add(id);
  for (const card of cardPool()) {
    if (!coveredIds.has(card.id)) stats.coverageFailed.push(card.id);
  }

  return stats;
}

export function summarize(stats: RunnerStats): string {
  const lines = [
    `battles run: ${stats.battles}`,
    `decks generated: ${stats.decksGenerated}`,
    `deterministic: ${stats.deterministic}`,
    `all terminated <= maxTurns: ${stats.allTerminated}`,
    `all validated: ${stats.allValidated}`,
    `stats in bounds: ${stats.allInBounds}`,
    `unsupported declared in logs: ${stats.unsupportedLogged}`,
    `coverage gaps: ${stats.coverageFailed.length === 0 ? "none" : stats.coverageFailed.join(", ")}`,
  ];
  if (stats.failures.length > 0) {
    lines.push(`failures (${stats.failures.length}):`);
    for (const f of stats.failures.slice(0, 20)) lines.push(`  - ${f}`);
  }
  return lines.join("\n");
}
