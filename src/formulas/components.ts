/* Component helpers beyond the cheat sheet (Part 4 of the book): preferred values, capacitor codes, op-amps, regulators. */
import { defineFormula, ex, field, mode } from '../core/define.ts'
import { E12, E24, E6, nearestPreferred } from '../core/e12.ts'
import { N, S } from '../core/fmt.ts'
import { kilo, micro, nano, pico } from '../core/units.ts'

const pct = (got: number, want: number) => ((got - want) / want) * 100

export const eSeries = defineFormula({
  id: 'e-series', title: 'Standard resistor values (E12, E24)',
  equation: 'E12: 10 12 15 18 22 27 33 39 47 56 68 82 × 10ⁿ',
  meaning: 'Resistors (and capacitors) are made in preferred values. Each series spaces its values so that, with the part’s tolerance, every value in between is covered. Calculations rarely give a standard value — pick the nearest one and check the error.',
  fields: [
    field('X', 'R', 'Calculated value', 'resistance', { sign: 'pos' }),
    field('E12', 'E12', 'Nearest E12 value (±10 %)', 'resistance'),
    field('err12', 'error E12', 'Difference from your value', 'percent'),
    field('E24', 'E24', 'Nearest E24 value (±5 %)', 'resistance'),
    field('err24', 'error E24', 'Difference from your value', 'percent'),
  ],
  unitsNote: 'The same digits repeat in every decade: 4.7 Ω, 47 Ω, 470 Ω, 4.7 kΩ, 47 kΩ… For current-limiting resistors (LEDs) round up instead, so the current stays below the limit.',
  visual: 'e-series', keywords: ['preferred values', 'e12', 'e24', 'e6', 'standard value', 'nearest resistor'],
  reference: {
    rows: [
      ['E6 (±20 %)', E6.join(' ')],
      ['E12 (±10 %)', E12.join(' ')],
      ['E24 (±5 %)', E24.join(' ')],
    ],
    note: 'E48 and E96 (±2 %, ±1 %) add more values for precision work.',
  },
  modes: [mode({
    id: 'nearest', label: 'Nearest standard value', inputs: ['X'], outputs: ['E12', 'err12', 'E24', 'err24'], equation: 'nearest value on a logarithmic scale',
    compute: (v) => {
      const a = nearestPreferred(E12, v.X), b = nearestPreferred(E24, v.X)
      return { E12: a, err12: pct(a, v.X), E24: b, err24: pct(b, v.X) }
    },
    steps: (v, o) => [
      `Your value: ${S('resistance', v.X)}`,
      `Nearest E12: ${S('resistance', o.E12)} (${o.err12 >= 0 ? '+' : ''}${N(o.err12)} %)`,
      `Nearest E24: ${S('resistance', o.E24)} (${o.err24 >= 0 ? '+' : ''}${N(o.err24)} %)`,
      '“Nearest” is measured in percent, not in ohms, because the series are spaced by equal ratios.',
    ],
    examples: [
      ex('5 kΩ', { X: 5 * kilo }, { E12: 4700, err12: -6, E24: 5100, err24: 2 }),
      ex('exactly 1 kΩ', { X: kilo }, { E12: 1000, err12: 0, E24: 1000, err24: 0 }),
    ],
  })],
})

/** 3-digit EIA code: two digits, then the number of zeros (8 → ×0.01, 9 → ×0.1), in picofarads */
export function capFromCode(code: number): number {
  const d = code % 10, digits = Math.floor(code / 10)
  const mult = d === 8 ? 0.01 : d === 9 ? 0.1 : 10 ** d
  return digits * mult * pico
}
/** the 3-digit code for a capacitance (rounded to two significant digits), and the value that code stands for */
export function codeFromCap(C: number): { code: number; marked: number } {
  const pF = C / pico
  let e = Math.floor(Math.log10(pF)) - 1
  let m = Math.round(pF / 10 ** e)
  if (m >= 100) { m = 10; e += 1 }
  const code = e >= 0 ? m * 10 + e : m * 10 + 9
  return { code, marked: capFromCode(code) }
}

export const capacitorCode = defineFormula({
  id: 'capacitor-code', title: 'Capacitor codes (104 = 100 nF)',
  equation: 'C = first two digits × 10^(third digit) pF',
  meaning: 'Small ceramic and film capacitors are marked with three digits: the value in picofarads is the first two digits followed by as many zeros as the third digit says. A letter after it is the tolerance.',
  fields: [
    field('code', 'code', '3-digit code', 'count', { sign: 'pos', integer: true, min: 100, max: 999, description: 'e.g. 104, 472, 220' }),
    field('C', 'C', 'Capacitance', 'capacitance', { sign: 'pos' }),
    field('marked', 'C (marked)', 'Value the code stands for', 'capacitance'),
  ],
  unitsNote: '1 nF = 1000 pF, 1 µF = 1000 nF. Third digit 9 means ×0.1 (479 = 4.7 pF); 7 is not used. Electrolytic capacitors are printed with the value in µF and the voltage instead.',
  visual: 'cap-code', keywords: ['104', 'capacitor marking', 'ceramic', 'pf', 'tolerance letter'],
  reference: {
    rows: [['101 / 102 / 103 / 104 / 105', '100 pF / 1 nF / 10 nF / 100 nF / 1 µF'], ['J · K · M', '±5 % · ±10 % · ±20 %'], ['Z', '+80 / −20 %'], ['4n7, 2µ2', 'letter = decimal point: 4.7 nF, 2.2 µF'], ['Stripe on an electrolytic', 'minus (−) lead']],
  },
  modes: [
    mode({
      id: 'C', label: 'Code → value', inputs: ['code'], outputs: ['C'], equation: 'C = digits × 10^zeros pF',
      check: (v) => (v.code % 10 === 7 ? 'A third digit of 7 is not used in capacitor codes. Check the marking (it may be a voltage or date code).' : undefined),
      compute: (v) => ({ C: capFromCode(v.code) }),
      steps: (v, o) => {
        const d = v.code % 10
        return [`Digits ${Math.floor(v.code / 10)}, multiplier digit ${d}`, d >= 8 ? `${d} means × ${d === 8 ? '0.01' : '0.1'}: ${N(o.C / pico)} pF` : `${Math.floor(v.code / 10)} followed by ${d} zero${d === 1 ? '' : 's'} = ${N(o.C / pico)} pF`, `C = ${S('capacitance', o.C)}`]
      },
      examples: [ex('104', { code: 104 }, { C: 100 * nano }), ex('472', { code: 472 }, { C: 4.7 * nano }), ex('479 = 4.7 pF', { code: 479 }, { C: 4.7 * pico })],
    }),
    mode({
      id: 'code', label: 'Value → code', inputs: ['C'], outputs: ['code', 'marked'], equation: 'two significant digits + number of zeros',
      check: (v) => (v.C >= 1 * pico && v.C < 99.5 * micro ? undefined : 'Three-digit codes cover 1 pF to 99 µF. Larger capacitors are printed with their value in µF.'),
      compute: (v) => codeFromCap(v.C),
      warn: (v, o) => (Math.abs(o.marked - v.C) > v.C * 1e-6 ? [`Rounded to two digits: the code means ${S('capacitance', o.marked)}.`] : []),
      steps: (v, o) => [`C = ${S('capacitance', v.C)} = ${N(v.C / pico)} pF`, `Two significant digits and the number of zeros: code ${N(o.code)}`, `Check: ${N(o.code)} = ${S('capacitance', o.marked)}`],
      examples: [ex('100 nF', { C: 100 * nano }, { code: 104, marked: 100 * nano }), ex('0.33 µF', { C: 0.33 * micro }, { code: 334, marked: 0.33 * micro }), ex('4.7 pF', { C: 4.7 * pico }, { code: 479, marked: 4.7 * pico })],
    }),
  ],
})

export const opAmpGain = defineFormula({
  id: 'op-amp-gain', title: 'Op-amp amplifier gain',
  equation: 'non-inverting G = 1 + Rf / Rg · inverting G = −Rf / Rin · Vout = G × Vin',
  meaning: 'An op-amp with negative feedback amplifies by a gain set only by two resistors. Non-inverting: the output follows the input, bigger. Inverting: the output is flipped upside down.',
  analogy: 'The op-amp does whatever it takes at its output to make its two inputs equal; the resistors decide how much output that takes.',
  fields: [
    field('Rf', 'Rf', 'Feedback resistor', 'resistance', { sign: 'pos', description: 'from the output to the − input' }),
    field('Rg', 'Rg / Rin', 'Ground / input resistor', 'resistance', { sign: 'pos', description: 'non-inverting: from − input to ground; inverting: from the input signal to − input' }),
    field('Vin', 'Vin', 'Input voltage', 'voltage'),
    field('G', 'G', 'Gain', 'ratio'),
    field('Vout', 'Vout', 'Output voltage', 'voltage'),
  ],
  unitsNote: 'Rf and Rg only need the same unit (their ratio matters). Use 1 kΩ–100 kΩ. Comparator mode (no feedback): the output simply jumps to a supply rail whenever + is higher than −.',
  visual: 'op-amp', keywords: ['op amp', 'operational amplifier', 'non-inverting', 'inverting', 'amplifier'],
  modes: [
    mode({
      id: 'noninv', label: 'Non-inverting', inputs: ['Rf', 'Rg', 'Vin'], outputs: ['G', 'Vout'], equation: 'G = 1 + Rf / Rg',
      compute: (v) => { const G = 1 + v.Rf / v.Rg; return { G, Vout: G * v.Vin } },
      warn: () => ['The output can’t go beyond the supply rails (most op-amps stay 1–2 V inside; “rail-to-rail” types get close). A larger result means the output clips.'],
      steps: (v, o) => [`G = 1 + Rf / Rg = 1 + ${N(v.Rf)} / ${N(v.Rg)} = ${N(o.G)}`, `Vout = G × Vin = ${N(o.G)} × ${S('voltage', v.Vin)} = ${S('voltage', o.Vout)}`],
      examples: [ex('Rf 9 kΩ, Rg 1 kΩ, 0.1 V in', { Rf: 9 * kilo, Rg: kilo, Vin: 0.1 }, { G: 10, Vout: 1 })],
    }),
    mode({
      id: 'inv', label: 'Inverting', inputs: ['Rf', 'Rg', 'Vin'], outputs: ['G', 'Vout'], equation: 'G = −Rf / Rin',
      compute: (v) => { const G = -v.Rf / v.Rg; return { G, Vout: G * v.Vin } },
      warn: () => ['The input sees only Rin as its load, and a negative output needs a negative supply (or a mid-supply reference on the + input).'],
      steps: (v, o) => [`G = −Rf / Rin = −${N(v.Rf)} / ${N(v.Rg)} = ${N(o.G)}`, `Vout = G × Vin = ${N(o.G)} × ${S('voltage', v.Vin)} = ${S('voltage', o.Vout)} (flipped in sign)`],
      examples: [ex('Rf 10 kΩ, Rin 1 kΩ, 0.2 V in', { Rf: 10 * kilo, Rg: kilo, Vin: 0.2 }, { G: -10, Vout: -2 })],
    }),
    mode({
      id: 'Rf', label: 'Find Rf for a gain', inputs: ['G', 'Rg'], outputs: ['Rf'], equation: 'Rf = (G − 1) × Rg',
      check: (v) => (v.G > 1 ? undefined : 'A non-inverting amplifier always has a gain of at least 1 (G = 1 is a plain buffer: no Rf needed).'),
      compute: (v) => ({ Rf: (v.G - 1) * v.Rg }),
      steps: (v, o) => [`From G = 1 + Rf / Rg: Rf = (G − 1) × Rg`, `Rf = (${N(v.G)} − 1) × ${S('resistance', v.Rg)} = ${S('resistance', o.Rf)}`],
      examples: [ex('gain 11 with Rg 1 kΩ', { G: 11, Rg: kilo }, { Rf: 10 * kilo })],
    }),
  ],
})

export const linearRegulator = defineFormula({
  id: 'linear-regulator', title: 'Linear regulator (7805, LDO)',
  equation: 'P = (Vin − Vout) × I · efficiency = Vout / Vin · Vin ≥ Vout + Vdropout',
  meaning: 'A linear regulator makes a steady output by burning the extra voltage as heat. It needs the input to stay a little above the output (the dropout voltage).',
  fields: [
    field('Vin', 'Vin', 'Input voltage', 'voltage', { sign: 'pos' }),
    field('Vout', 'Vout', 'Output voltage', 'voltage', { sign: 'pos' }),
    field('I', 'I', 'Load current', 'current', { sign: 'pos' }),
    field('Vdo', 'Vdropout', 'Dropout voltage', 'voltage', { sign: 'nonneg', description: '7805/LM317 ≈ 2 V; LDOs 0.1–0.5 V (datasheet)', presets: [{ label: '7805 ≈ 2 V', value: 2 }, { label: 'LDO ≈ 0.3 V', value: 0.3 }] }),
    field('P', 'P', 'Heat in the regulator', 'power'),
    field('eff', 'η', 'Efficiency', 'percent'),
    field('VinMin', 'Vin,min', 'Lowest usable input', 'voltage'),
  ],
  unitsNote: 'Ignores the small quiescent current (a few mA). Heat above about 1 W needs a heatsink — size it with P16.',
  visual: 'regulator', keywords: ['7805', 'ldo', 'lm317', 'voltage regulator', 'dropout', 'heat'],
  modes: [mode({
    id: 'P', label: 'Heat & efficiency', inputs: ['Vin', 'Vout', 'I', 'Vdo'], outputs: ['P', 'eff', 'VinMin'], equation: 'P = (Vin − Vout) × I',
    check: (v) => (v.Vin <= v.Vout ? 'The input must be higher than the output: a linear regulator can only reduce the voltage.' : v.Vin < v.Vout + v.Vdo ? `Vin is below Vout + dropout (${N(v.Vout + v.Vdo)} V): the regulator drops out and the output sags. Raise Vin or use an LDO.` : undefined),
    compute: (v) => ({ P: (v.Vin - v.Vout) * v.I, eff: (v.Vout / v.Vin) * 100, VinMin: v.Vout + v.Vdo }),
    warn: (_v, o) => {
      const out: string[] = []
      if (o.P > 1) out.push('More than about 1 W: the regulator needs a heatsink (see P16 · Heat in a linear regulator).')
      if (o.eff < 50) out.push('More than half of the power becomes heat: a switching (buck) regulator would be far more efficient.')
      return out
    },
    steps: (v, o) => [`Voltage dropped = Vin − Vout = ${N(v.Vin)} − ${N(v.Vout)} = ${N(v.Vin - v.Vout)} V`, `Heat = ${N(v.Vin - v.Vout)} V × ${S('current', v.I)} = ${S('power', o.P)}`, `Efficiency = Vout / Vin = ${N(o.eff)} %`, `Lowest input = Vout + dropout = ${S('voltage', o.VinMin)}`],
    examples: [ex('7805: 12 V in, 5 V out, 0.5 A', { Vin: 12, Vout: 5, I: 0.5, Vdo: 2 }, { P: 3.5, eff: 500 / 12, VinMin: 7 })],
  })],
})

export const componentPages = [eSeries, capacitorCode, opAmpGain, linearRegulator]
