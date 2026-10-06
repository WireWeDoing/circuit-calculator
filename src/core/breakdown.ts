import type { BreakdownRow } from './types.ts'
import type { Dim } from './units.ts'

const name = (base: string, i: number) => `${base}${i + 1}`
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

/** Resistors in series: same current, voltage splits in proportion to R. Optional supply voltage V. */
export function seriesRBreakdown(R: number[], V?: number, base = 'R'): BreakdownRow[] {
  const Rt = sum(R)
  const I = V !== undefined && Rt > 0 ? V / Rt : undefined
  return R.map((r, i) => ({
    label: name(base, i), value: { dim: 'resistance' as Dim, x: r }, share: Rt > 0 ? r / Rt : undefined,
    I, V: I !== undefined ? I * r : undefined, P: I !== undefined ? I * I * r : undefined,
  }))
}

/** Resistors in parallel: same voltage, current splits in proportion to 1/R. Optional supply voltage V. */
export function parallelRBreakdown(R: number[], V?: number, base = 'R'): BreakdownRow[] {
  const G = R.reduce((a, r) => a + 1 / r, 0)
  return R.map((r, i) => ({
    label: name(base, i), value: { dim: 'resistance' as Dim, x: r }, share: 1 / r / G,
    V, I: V !== undefined ? V / r : undefined, P: V !== undefined ? (V * V) / r : undefined,
  }))
}

/** Capacitors in series: same charge Q, voltage splits in proportion to 1/C. */
export function seriesCBreakdown(C: number[], V?: number): BreakdownRow[] {
  const inv = C.reduce((a, c) => a + 1 / c, 0)
  const Ct = 1 / inv
  const Q = V !== undefined ? Ct * V : undefined
  return C.map((c, i) => ({
    label: name('C', i), value: { dim: 'capacitance' as Dim, x: c }, share: 1 / c / inv,
    Q, V: Q !== undefined ? Q / c : undefined, E: Q !== undefined ? (Q * Q) / (2 * c) : undefined,
  }))
}

/** Capacitors in parallel: same voltage, charge splits in proportion to C. */
export function parallelCBreakdown(C: number[], V?: number): BreakdownRow[] {
  const Ct = sum(C)
  return C.map((c, i) => ({
    label: name('C', i), value: { dim: 'capacitance' as Dim, x: c }, share: c / Ct,
    V, Q: V !== undefined ? c * V : undefined, E: V !== undefined ? 0.5 * c * V * V : undefined,
  }))
}

/** Totals row helper: sum of the defined numbers in a column. */
export const columnTotal = (rows: BreakdownRow[], key: 'V' | 'I' | 'P' | 'Q' | 'E'): number | undefined =>
  rows.every((r) => r[key] === undefined) ? undefined : rows.reduce((a, r) => a + (r[key] ?? 0), 0)
