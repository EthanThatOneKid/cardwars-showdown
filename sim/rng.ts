import type { RngState } from "./types.js";

export const DEFAULT_SEED = 0xc0ffeeda;

export function makeRng(seed: number): RngState {
  const s = seed >>> 0;
  return {
    a: s,
    b: 0x6d2b79f5,
    c: 0x7f4a7c15,
    d: 0x1ad7f7a5,
  };
}

export function nextInt(state: RngState): number {
  state.a = (state.a + 0x6d2b79f5) >>> 0;
  let t = state.b;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const out = ((t ^ (t >>> 14)) + state.a) >>> 0;
  state.b = (state.c + Math.imul(0x9e3779b9, t)) >>> 0;
  state.c = (state.d + Math.imul(0x85ebca77, out)) >>> 0;
  state.d = (t + out) >>> 0;
  return out;
}

export function nextFloat(state: RngState): number {
  return nextInt(state) * 2.3283064365386963e-10;
}

export function nextIntBelow(state: RngState, bound: number): number {
  if (bound <= 0) return 0;
  return Math.floor(nextFloat(state) * bound);
}

export function pick<T>(state: RngState, items: readonly T[]): T {
  return items[nextIntBelow(state, items.length)];
}

export function shuffle<T>(state: RngState, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = nextIntBelow(state, i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function cloneRng(state: RngState): RngState {
  return { ...state };
}
