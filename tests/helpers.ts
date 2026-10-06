import { expect } from 'vitest'
import { evaluate } from '../src/core/engine.ts'
import { formulaById } from '../src/formulas/index.ts'

/** Run a formula mode with base-unit inputs and return outputs; fails the test if it isn't 'ok'. */
export function run(id: string, mode: string, inputs: Record<string, number> = {}, lists: Record<string, number[]> = {}): Record<string, number> {
  const f = formulaById(id)
  if (!f) throw new Error(`unknown formula ${id}`)
  const r = evaluate(f, mode, inputs, lists)
  if (r.status !== 'ok') throw new Error(`${id}/${mode}: ${JSON.stringify(r)}`)
  return r.outputs
}
export const status = (id: string, mode: string, inputs: Record<string, number> = {}, lists: Record<string, number[]> = {}) => {
  const f = formulaById(id)!
  return evaluate(f, mode, inputs, lists)
}

/** Deterministic pseudo-random generator so failures are reproducible. */
export function rng(seed = 12345) {
  let s = seed >>> 0
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2 ** 32 }
}
/** log-uniform sample between lo and hi */
export const logu = (r: () => number, lo: number, hi: number) => 10 ** (Math.log10(lo) + r() * (Math.log10(hi) - Math.log10(lo)))
export const close = (a: number, b: number, rel = 1e-9) => expect(Math.abs(a - b)).toBeLessThanOrEqual(rel * Math.max(Math.abs(a), Math.abs(b), 1e-300))
