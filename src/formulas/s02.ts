import { parallelRBreakdown, seriesRBreakdown } from '../core/breakdown.ts'
import { defineFormula, ex, field, mode, recipSum, sum } from '../core/define.ts'
import { N, S } from '../core/fmt.ts'
import { kilo, milli } from '../core/units.ts'

const gOf = (l: number[]) => l.reduce((a, b) => a + 1 / b, 0)
const extraFields = [
  field('V', 'V', 'Supply voltage', 'voltage', { sign: 'pos', description: 'voltage applied across the whole network' }),
  field('I', 'I', 'Total current', 'current', { sign: 'pos', description: 'total current entering the network' }),
  field('P', 'P', 'Total power', 'power'),
]

const listStr = (dim: Parameters<typeof S>[0], xs: number[]) => xs.map((x) => S(dim, x)).join(' + ')

export const rSeries = defineFormula({
  id: 'r-series', section: 's2', title: 'Series total', page: 2,
  equation: 'Rt = R1 + R2 + ... + Rn',
  meaning: 'Resistors in series add. The same current flows through each of them.',
  analogy: 'Pipes joined end to end: the water has to squeeze through every narrow part one after another, so the obstacles add up.',
  fields: [
    field('R', 'R1…Rn', 'Resistors', 'resistance', { sign: 'nonneg', list: true, description: 'the individual resistors in the chain' }),
    field('Rt', 'Rt', 'Total resistance', 'resistance', { description: 'total (equivalent) resistance' }),
    ...extraFields,
  ],
  unitsNote: "All values in the same unit — the answer comes out in that unit. Don't mix: 1 kΩ + 470 Ω = 1000 Ω + 470 Ω = 1470 Ω (not 471).",
  visual: 'series-R', concepts: ['prefix'],
  modes: [mode({
    id: 'Rt', inputs: ['R'], outputs: ['Rt'], equation: 'Rt = R1 + R2 + … + Rn',
    compute: (_v, l) => ({ Rt: sum(l.R!) }),
    breakdown: (_v, _o, l) => seriesRBreakdown(l.R!),
    steps: (_v, o, l) => ['Convert every value to ohms first (1 kΩ = 1000 Ω).', `Rt = ${listStr('resistance', l.R!)}`, `Rt = ${S('resistance', o.Rt)}`],
    examples: [ex('§2 1 kΩ + 470 Ω', {}, { Rt: 1470 }, undefined, { R: [1000, 470] })],
  }),
  mode({
    id: 'withV', label: 'With supply voltage', inputs: ['R', 'V'], outputs: ['Rt', 'I', 'P'], equation: 'I = V / Rt;  Vn = I × Rn;  Pn = I² × Rn',
    check: (_v, l) => (sum(l.R!) > 0 ? undefined : 'All resistors are 0 Ω — a dead short, the current would be infinite.'),
    compute: (v, l) => { const Rt = sum(l.R!); const I = v.V / Rt; return { Rt, I, P: v.V * I } },
    breakdown: (v, _o, l) => seriesRBreakdown(l.R!, v.V),
    steps: (v, o, l) => [`Rt = ${listStr('resistance', l.R!)} = ${S('resistance', o.Rt)}`, `The SAME current flows through every resistor: I = V / Rt = ${S('voltage', v.V)} / ${S('resistance', o.Rt)} = ${S('current', o.I)}`, `Voltage across each part: Vn = I × Rn (they add up to the supply — KVL)`, `Power in each part: Pn = I² × Rn; total P = V × I = ${S('power', o.P)}`],
    examples: [ex('4 resistors on 9 V', { V: 9 }, { Rt: 4000, I: 0.00225, P: 0.02025 }, undefined, { R: [1000, 470, 2200, 330] })],
  }),
  mode({
    id: 'withI', label: 'With total current', inputs: ['R', 'I'], outputs: ['Rt', 'V', 'P'], equation: 'V = I × Rt;  Vn = I × Rn;  Pn = I² × Rn',
    compute: (v, l) => { const Rt = sum(l.R!); return { Rt, V: v.I * Rt, P: v.I * v.I * Rt } },
    breakdown: (v, _o, l) => seriesRBreakdown(l.R!, v.I * sum(l.R!)),
    steps: (v, o, l) => [`Rt = ${listStr('resistance', l.R!)} = ${S('resistance', o.Rt)}`, `Supply voltage needed: V = I × Rt = ${S('current', v.I)} × ${S('resistance', o.Rt)} = ${S('voltage', o.V)}`, `Voltage across each part: Vn = I × Rn`, `Total power P = I² × Rt = ${S('power', o.P)}`],
    examples: [ex('2.25 mA through 4 resistors', { I: 0.00225 }, { Rt: 4000, V: 9, P: 0.02025 }, undefined, { R: [1000, 470, 2200, 330] })],
  })],
})

export const rParallel2 = defineFormula({
  id: 'r-parallel-2', section: 's2', title: 'Parallel (two resistors)', page: 3,
  equation: 'Rt = (R1 × R2) / (R1 + R2)',
  meaning: 'Total of exactly two parallel resistors. The result is always smaller than the smaller resistor.',
  analogy: 'Two pipes side by side: the water has two ways through, so it flows more easily than through either one alone.',
  fields: [
    field('R1', 'R1', 'Resistor 1', 'resistance', { sign: 'pos' }),
    field('R2', 'R2', 'Resistor 2', 'resistance', { sign: 'pos' }),
    field('Rt', 'Rt', 'Total resistance', 'resistance', { description: 'total resistance of the pair' }),
    ...extraFields,
  ],
  unitsNote: 'Both in the same unit (both Ω or both kΩ). Two equal resistors always give half.',
  exampleText: '1 kΩ ∥ 1 kΩ = (1 × 1)/(1 + 1) = 0.5 kΩ = 500 Ω.',
  visual: 'parallel-R', keywords: ['product over sum'],
  modes: [mode({
    id: 'Rt', inputs: ['R1', 'R2'], outputs: ['Rt'], equation: 'Rt = (R1 × R2) / (R1 + R2)',
    compute: (v) => ({ Rt: (v.R1 * v.R2) / (v.R1 + v.R2) }),
    steps: (v, o) => [`Product: R1 × R2 = ${N(v.R1 * v.R2)} Ω²`, `Sum: R1 + R2 = ${S('resistance', v.R1 + v.R2)}`, `Rt = ${N(v.R1 * v.R2)} / ${N(v.R1 + v.R2)} = ${S('resistance', o.Rt)}`, `Check: ${S('resistance', o.Rt)} is smaller than the smaller resistor (${S('resistance', Math.min(v.R1, v.R2))}) ✓`],
    breakdown: (v) => parallelRBreakdown([v.R1, v.R2]),
    examples: [ex('§2 1 kΩ ∥ 1 kΩ', { R1: 1000, R2: 1000 }, { Rt: 500 }), ex('§17 P1 1 kΩ ∥ 2 kΩ', { R1: 1000, R2: 2000 }, { Rt: 2000 / 3 })],
  }),
  mode({
    id: 'withV', label: 'With supply voltage', inputs: ['R1', 'R2', 'V'], outputs: ['Rt', 'I', 'P'], equation: 'In = V / Rn;  I = I1 + I2',
    compute: (v) => { const Rt = (v.R1 * v.R2) / (v.R1 + v.R2); return { Rt, I: v.V / Rt, P: (v.V * v.V) / Rt } },
    breakdown: (v) => parallelRBreakdown([v.R1, v.R2], v.V),
    steps: (v, o) => [`Each resistor has the full supply across it: V = ${S('voltage', v.V)}`, `I1 = V / R1 = ${S('current', v.V / v.R1)};  I2 = V / R2 = ${S('current', v.V / v.R2)}`, `Total I = I1 + I2 = ${S('current', o.I)} (= V / Rt, Rt = ${S('resistance', o.Rt)})`, `Total power P = V × I = ${S('power', o.P)}`],
    examples: [ex('12 V on 1 kΩ ∥ 2 kΩ', { R1: 1000, R2: 2000, V: 12 }, { Rt: 2000 / 3, I: 0.018, P: 0.216 })],
  }),
  mode({
    id: 'withI', label: 'With total current', inputs: ['R1', 'R2', 'I'], outputs: ['Rt', 'V', 'P'], equation: 'V = I × Rt;  In = V / Rn',
    compute: (v) => { const Rt = (v.R1 * v.R2) / (v.R1 + v.R2); return { Rt, V: v.I * Rt, P: v.I * v.I * Rt } },
    breakdown: (v) => parallelRBreakdown([v.R1, v.R2], (v.I * v.R1 * v.R2) / (v.R1 + v.R2)),
    steps: (v, o) => [`Rt = ${S('resistance', o.Rt)}`, `Voltage across the pair: V = I × Rt = ${S('current', v.I)} × ${S('resistance', o.Rt)} = ${S('voltage', o.V)}`, `I1 = V / R1 = ${S('current', o.V / v.R1)};  I2 = V / R2 = ${S('current', o.V / v.R2)}`],
    examples: [ex('18 mA into 1 kΩ ∥ 2 kΩ', { R1: 1000, R2: 2000, I: 0.018 }, { Rt: 2000 / 3, V: 12, P: 0.216 })],
  })],
})

export const rParallelN = defineFormula({
  id: 'r-parallel-n', section: 's2', title: 'Parallel (any number)', page: 3,
  equation: '1/Rt = 1/R1 + 1/R2 + ... + 1/Rn',
  meaning: 'Total of any number of parallel resistors. Each added resistor lowers the total.',
  analogy: 'Every extra pipe added side by side is one more path for the water, so the overall resistance drops.',
  fields: [
    field('R', 'R1…Rn', 'Resistors', 'resistance', { sign: 'pos', list: true, description: 'the individual parallel resistors' }),
    field('Rt', 'Rt', 'Total resistance', 'resistance'),
    ...extraFields,
  ],
  unitsNote: "Same unit for all. Don't forget the last step — flip the sum to get Rt. Example: 1 kΩ, 2 kΩ, 2 kΩ → 1/1 + 1/2 + 1/2 = 2 → Rt = 1/2 = 0.5 kΩ = 500 Ω.",
  visual: 'parallel-R',
  modes: [mode({
    id: 'Rt', inputs: ['R'], outputs: ['Rt'], equation: '1/Rt = Σ 1/Rn,   Rt = 1 / Σ(1/Rn)',
    compute: (_v, l) => ({ Rt: 1 / recipSum(l.R!) }),
    steps: (_v, o, l) => [`Add the reciprocals: ${l.R!.map((r) => `1/${N(r)}`).join(' + ')} = ${N(recipSum(l.R!))} S`, 'Flip the sum to get Rt (last step — easy to forget!)', `Rt = 1 / ${N(recipSum(l.R!))} = ${S('resistance', o.Rt)}`],
    breakdown: (_v, _o, l) => parallelRBreakdown(l.R!),
    examples: [ex('§2 1 kΩ, 2 kΩ, 2 kΩ', {}, { Rt: 500 }, undefined, { R: [1000, 2000, 2000] })],
  }),
  mode({
    id: 'withV', label: 'With supply voltage', inputs: ['R', 'V'], outputs: ['Rt', 'I', 'P'], equation: 'In = V / Rn;  I = ΣIn',
    compute: (v, l) => ({ Rt: 1 / gOf(l.R!), I: v.V * gOf(l.R!), P: v.V * v.V * gOf(l.R!) }),
    breakdown: (v, _o, l) => parallelRBreakdown(l.R!, v.V),
    steps: (v, o, l) => [`Every resistor has the full supply across it: V = ${S('voltage', v.V)}`, `Current in each: In = V / Rn  (${l.R!.map((r) => S('current', v.V / r)).join(', ')})`, `Total current I = ΣIn = ${S('current', o.I)}  (KCL: the branches add up)`, `Rt = V / I = ${S('resistance', o.Rt)};  total power P = V × I = ${S('power', o.P)}`],
    examples: [ex('4 resistors on 5 V', { V: 5 }, { Rt: 250, I: 0.02, P: 0.1 }, undefined, { R: [1000, 2000, 2000, 500] })],
  }),
  mode({
    id: 'withI', label: 'With total current', inputs: ['R', 'I'], outputs: ['Rt', 'V', 'P'], equation: 'V = I × Rt;  In = V / Rn',
    compute: (v, l) => { const Rt = 1 / gOf(l.R!); return { Rt, V: v.I * Rt, P: v.I * v.I * Rt } },
    breakdown: (v, _o, l) => parallelRBreakdown(l.R!, v.I / gOf(l.R!)),
    steps: (v, o, l) => [`Rt = ${S('resistance', o.Rt)}`, `Voltage across every branch: V = I × Rt = ${S('current', v.I)} × ${S('resistance', o.Rt)} = ${S('voltage', o.V)}`, `Current in each: In = V / Rn  (${l.R!.map((r) => S('current', o.V / r)).join(', ')})`],
    examples: [ex('20 mA into 4 resistors', { I: 0.02 }, { Rt: 250, V: 5, P: 0.1 }, undefined, { R: [1000, 2000, 2000, 500] })],
  })],
})

export const vDivider = defineFormula({
  id: 'voltage-divider', section: 's2', title: 'Voltage divider', page: 3,
  equation: 'Vout = Vin × R2 / (R1 + R2)',
  meaning: 'Output voltage of two series resistors, taken across R2. Used to scale a voltage down, e.g. for an ADC input.',
  analogy: 'A hill with two slopes: the total height (Vin) is shared between the two resistors in proportion to their size. R2 gets its share.',
  fields: [
    field('Vin', 'Vin', 'Input voltage', 'voltage', { sign: 'nonneg', description: 'voltage across the whole pair' }),
    field('R1', 'R1', 'Top resistor', 'resistance', { sign: 'pos', description: 'between Vin and the midpoint' }),
    field('R2', 'R2', 'Bottom resistor', 'resistance', { sign: 'pos', description: 'between the midpoint and ground' }),
    field('Vout', 'Vout', 'Output voltage', 'voltage', { description: 'voltage at the midpoint, measured across R2 (to ground)' }),
  ],
  unitsNote: 'R1 and R2 only need to be in the same unit (the units cancel). Vout comes out in the unit of Vin.',
  exampleText: '12 V, R1 = 10 kΩ, R2 = 3.3 kΩ → 12 × 3.3 / 13.3 = 2.98 V. Only accurate if the load on Vout is at least ~10× bigger than R2.',
  visual: 'divider', keywords: ['potential divider', 'attenuator', 'adc'],
  modes: [mode({
    id: 'Vout', inputs: ['Vin', 'R1', 'R2'], outputs: ['Vout'], equation: 'Vout = Vin × R2 / (R1 + R2)',
    compute: (v) => ({ Vout: (v.Vin * v.R2) / (v.R1 + v.R2) }),
    warn: (v) => [`Only accurate if the load on Vout is ≥ ~10× R2 (≥ ${S('resistance', 10 * v.R2)}).`],
    steps: (v, o) => [`Ratio R2 / (R1 + R2) = ${N(v.R2)} / ${N(v.R1 + v.R2)} = ${N(v.R2 / (v.R1 + v.R2))}`, `Vout = Vin × ratio = ${S('voltage', v.Vin)} × ${N(v.R2 / (v.R1 + v.R2))}`, `Vout = ${S('voltage', o.Vout)}`],
    breakdown: (v) => seriesRBreakdown([v.R1, v.R2], v.Vin),
    examples: [ex('§2 12 V, 10 kΩ / 3.3 kΩ', { Vin: 12, R1: 10 * kilo, R2: 3.3 * kilo }, { Vout: 2.98 }, 0.002)],
  })],
})

export const iDivider = defineFormula({
  id: 'current-divider', section: 's2', title: 'Current divider (two resistors)', page: 3,
  equation: 'I1 = It × R2 / (R1 + R2)',
  meaning: 'Share of the total current that flows through R1 in a two-resistor parallel pair. Note: the other resistor (R2) is in the numerator.',
  analogy: 'Traffic splitting onto two roads: more cars take the wider (lower-resistance) road. That is why the OTHER resistor appears on top.',
  fields: [
    field('It', 'It', 'Total current', 'current', { sign: 'nonneg', description: 'total current entering the pair' }),
    field('R1', 'R1', 'Resistor 1', 'resistance', { sign: 'pos' }),
    field('R2', 'R2', 'Resistor 2', 'resistance', { sign: 'pos' }),
    field('I1', 'I1', 'Current through R1', 'current'),
    field('I2', 'I2', 'Current through R2', 'current', { description: 'the rest: It − I1' }),
  ],
  unitsNote: 'Resistors in the same unit; I1 comes out in the unit of It (mA in → mA out).',
  exampleText: '30 mA into 1 kΩ ∥ 2 kΩ → I1 (through 1 kΩ) = 30 × 2/3 = 20 mA; the other 10 mA goes through 2 kΩ.',
  visual: 'current-divider',
  modes: [mode({
    id: 'I1', inputs: ['It', 'R1', 'R2'], outputs: ['I1', 'I2'], equation: 'I1 = It × R2 / (R1 + R2)',
    compute: (v) => { const I1 = (v.It * v.R2) / (v.R1 + v.R2); return { I1, I2: v.It - I1 } },
    steps: (v, o) => [`I1 = It × R2 / (R1 + R2) = ${S('current', v.It)} × ${N(v.R2)} / ${N(v.R1 + v.R2)}`, `I1 = ${S('current', o.I1)}`, `The rest flows through R2: I2 = It − I1 = ${S('current', o.I2)}`],
    breakdown: (v) => { const V = (v.It * v.R1 * v.R2) / (v.R1 + v.R2); return parallelRBreakdown([v.R1, v.R2], V) },
    examples: [ex('§2 30 mA into 1 kΩ ∥ 2 kΩ', { It: 30 * milli, R1: 1000, R2: 2000 }, { I1: 0.02, I2: 0.01 })],
  })],
})

export const colorCode = defineFormula({
  id: 'resistor-colour-code', section: 's2', title: 'Resistor colour code', page: 3,
  equation: '4-band: digit, digit, multiplier, tolerance',
  meaning: '4-band: digit, digit, multiplier, tolerance. Brown-black-red-gold = 1, 0, ×100, ±5% → 1000 Ω = 1 kΩ ±5%. 5-band: digit, digit, digit, multiplier, tolerance. Brown-black-black-brown-brown = 100 × 10 = 1 kΩ ±1%.',
  fields: [], unitsNote: 'Read bands from the end that has the bands closest together; the tolerance band is last.',
  visual: 'colour-code', tool: 'colorcode', modes: [], keywords: ['bands', 'decoder'],
})

export const s02 = [rSeries, rParallel2, rParallelN, vDivider, iDivider, colorCode]
