/**
 * Per-component breakdowns must obey the circuit laws for ANY number of parts (2…12):
 * series: same I, ΣV = V (KVL), ΣP = V·I; parallel: same V, ΣI = I (KCL), ΣP = V·I;
 * series C: same Q, ΣV = V; parallel C: same V, ΣQ = Ct·V; energy adds in both.
 */
import { describe, expect, it } from 'vitest'
import { evaluate } from '../src/core/engine.ts'
import { FORMULAS, formulaById } from '../src/formulas/index.ts'
import { close, logu, rng } from './helpers.ts'

const r = rng(777)
const parts = (n: number, lo: number, hi: number) => Array.from({ length: n }, () => logu(r, lo, hi))
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

function rowsOf(id: string, mode: string, inputs: Record<string, number>, lists: Record<string, number[]> = {}) {
  const res = evaluate(formulaById(id)!, mode, inputs, lists)
  if (res.status !== 'ok') throw new Error(JSON.stringify(res))
  return { rows: res.rows!, out: res.outputs }
}

describe.each([2, 3, 4, 5, 8, 12])('%i resistors', (n) => {
  it('series (supply voltage): KVL, same current, power adds', () => {
    for (let t = 0; t < 20; t++) {
      const R = parts(n, 10, 1e6), V = logu(r, 1, 100)
      const { rows, out } = rowsOf('r-series', 'withV', { V }, { R })
      expect(rows).toHaveLength(n)
      close(sum(rows.map((x) => x.V!)), V, 1e-9)
      for (const x of rows) close(x.I!, out.I!, 1e-12)
      close(sum(rows.map((x) => x.P!)), V * out.I!, 1e-9)
      close(sum(rows.map((x) => x.share!)), 1, 1e-9)
      rows.forEach((x, i) => close(x.V! / V, R[i]! / sum(R), 1e-9)) // voltage divides in proportion to R
    }
  })
  it('series (total current) gives the same table as the equivalent supply voltage', () => {
    const R = parts(n, 10, 1e5), I = 0.01
    const a = rowsOf('r-series', 'withI', { I }, { R })
    const b = rowsOf('r-series', 'withV', { V: a.out.V! }, { R })
    a.rows.forEach((x, i) => { close(x.V!, b.rows[i]!.V!, 1e-9); close(x.I!, b.rows[i]!.I!, 1e-9) })
  })
  it('parallel (supply voltage): KCL, same voltage, power adds', () => {
    for (let t = 0; t < 20; t++) {
      const R = parts(n, 10, 1e6), V = logu(r, 1, 100)
      const { rows, out } = rowsOf('r-parallel-n', 'withV', { V }, { R })
      expect(rows).toHaveLength(n)
      close(sum(rows.map((x) => x.I!)), out.I!, 1e-9)
      for (const x of rows) close(x.V!, V, 1e-12)
      close(sum(rows.map((x) => x.P!)), V * out.I!, 1e-9)
      close(sum(rows.map((x) => x.share!)), 1, 1e-9)
      rows.forEach((x) => close(x.I! * 1, V / x.value!.x, 1e-12)) // Ohm's law on every branch
    }
  })
  it('parallel (total current): branch currents add up to what was put in', () => {
    for (let t = 0; t < 20; t++) {
      const R = parts(n, 10, 1e6), I = logu(r, 1e-3, 2)
      const { rows, out } = rowsOf('r-parallel-n', 'withI', { I }, { R })
      close(sum(rows.map((x) => x.I!)), I, 1e-9)
      close(rows[0]!.V!, out.V!, 1e-12)
    }
  })
  it('capacitors in series: same charge, voltages add, energy adds', () => {
    for (let t = 0; t < 20; t++) {
      const C = parts(n, 1e-9, 1e-3), V = logu(r, 1, 50)
      const { rows, out } = rowsOf('c-series', 'withV', { V }, { C })
      for (const x of rows) close(x.Q!, out.Q!, 1e-12)
      close(sum(rows.map((x) => x.V!)), V, 1e-9)
      close(sum(rows.map((x) => x.E!)), out.E!, 1e-9)
      close(out.E!, 0.5 * out.Q! * V, 1e-9)
    }
  })
  it('capacitors in parallel: same voltage, charges add, energy adds', () => {
    for (let t = 0; t < 20; t++) {
      const C = parts(n, 1e-9, 1e-3), V = logu(r, 1, 50)
      const { rows, out } = rowsOf('c-parallel', 'withV', { V }, { C })
      for (const x of rows) close(x.V!, V, 1e-12)
      close(sum(rows.map((x) => x.Q!)), out.Q!, 1e-9)
      close(sum(rows.map((x) => x.E!)), out.E!, 1e-9)
    }
  })
})

describe('two-resistor and divider breakdowns', () => {
  it('parallel pair agrees with the n-resistor version', () => {
    for (let t = 0; t < 30; t++) {
      const [a, b] = parts(2, 10, 1e6) as [number, number], V = logu(r, 1, 50)
      const two = rowsOf('r-parallel-2', 'withV', { R1: a, R2: b, V }).rows
      const many = rowsOf('r-parallel-n', 'withV', { V }, { R: [a, b] }).rows
      two.forEach((x, i) => { close(x.I!, many[i]!.I!, 1e-12); close(x.P!, many[i]!.P!, 1e-12) })
      const fromI = rowsOf('r-parallel-2', 'withI', { R1: a, R2: b, I: two[0]!.I! + two[1]!.I! }).rows
      close(fromI[0]!.I!, two[0]!.I!, 1e-9)
    }
  })
  it('voltage divider: drops add to Vin and the second one is Vout', () => {
    const { rows, out } = rowsOf('voltage-divider', 'Vout', { Vin: 12, R1: 10000, R2: 3300 })
    close(rows[0]!.V! + rows[1]!.V!, 12); close(rows[1]!.V!, out.Vout!); close(rows[0]!.I!, rows[1]!.I!)
  })
  it('current divider: same voltage on both, currents match I1/I2', () => {
    const { rows, out } = rowsOf('current-divider', 'I1', { It: 0.03, R1: 1000, R2: 2000 })
    close(rows[0]!.I!, out.I1!); close(rows[1]!.I!, out.I2!); close(rows[0]!.V!, rows[1]!.V!)
  })
  it('P1 / P2 / P5 / P13 tables satisfy KCL / KVL', () => {
    const p1 = rowsOf('p1-unknown-parallel', 'A', { V: 12, I: 0.018, R1: 1000 }).rows
    close(p1[0]!.I! + p1[1]!.I!, 0.018)
    const p2 = rowsOf('p2-series-parallel', 'A', { V: 12, I: 0.006, R1: 1000, R2: 2000 }).rows
    close(p2[0]!.V! + p2[1]!.V!, 12); close(p2[1]!.I! + p2[2]!.I!, 0.006)
    const p5 = rowsOf('p5-millman', 'V', { V1: 12, V2: 5, R1: 100, R2: 100, R3: 100 }).rows
    close(p5[0]!.I! + p5[1]!.I!, p5[2]!.I!)
    const p13 = rowsOf('p13-several-leds', 'R', { Vs: 12, Vf: 3.1, I: 0.02, n: 3 }).rows
    expect(p13).toHaveLength(4)
    close(sum(p13.map((x) => x.V!)), 12)
  })
})

describe('every breakdown is well-formed', () => {
  const withRows = FORMULAS.flatMap((f) => f.modes.filter((m) => m.breakdown).map((m) => [`${f.id}/${m.id}`, f, m] as const))
  it('there are breakdowns to check', () => { expect(withRows.length).toBeGreaterThan(15) })
  it.each(withRows)('%s: labels unique, numbers finite, table meaning declared', (_n, f, m) => {
    expect(m.table, 'declare Mode.table via TABLES in formulas/index.ts').toBeDefined()
    for (const s of m.table!.sums) expect(['V', 'I', 'P', 'Q', 'E']).toContain(s)
    for (const e of m.examples) {
      const res = evaluate(f, m.id, e.inputs, e.lists ?? {})
      if (res.status !== 'ok') throw new Error('example rejected')
      const labels = res.rows!.map((x) => x.label)
      expect(new Set(labels).size).toBe(labels.length)
      for (const x of res.rows!) for (const k of ['V', 'I', 'P', 'Q', 'E', 'share'] as const) if (x[k] !== undefined) expect(Number.isFinite(x[k]!), `${x.label}.${k}`).toBe(true)
    }
  })
  it('a dead short is rejected rather than giving infinite current', () => {
    const res = evaluate(formulaById('r-series')!, 'withV', { V: 5 }, { R: [0, 0] })
    expect(res.status).toBe('invalid')
  })
})
