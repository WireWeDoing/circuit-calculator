import { defineFormula, ex, field, mode } from '../core/define.ts'
import { N, S } from '../core/fmt.ts'
import { kilo, mega, micro, milli, nano, pico } from '../core/units.ts'

const TWO_PI = 2 * Math.PI

export const f0 = defineFormula({
  id: 'resonant-frequency', section: 's5', title: 'Resonant frequency', page: 6,
  equation: 'f0 = 1 / (2π√(LC))',
  meaning: 'Frequency at which inductive and capacitive reactance are equal. This sets the frequency of LC tanks and oscillators.',
  analogy: 'A swing: it has one natural rhythm. The coil (L) is the heavy swing seat, the capacitor (C) is the spring; together they set the tempo.',
  fields: [
    field('f0', 'f0', 'Resonant frequency', 'frequency'),
    field('L', 'L', 'Inductance', 'inductance', { sign: 'pos', description: 'inductance, in henries (H)' }),
    field('C', 'C', 'Capacitance', 'capacitance', { sign: 'pos', description: 'capacitance, in farads (F)' }),
  ],
  unitsNote: 'L and C must be in H and F. Shortcut: f0(MHz) ≈ 159 / √(L in µH × C in pF).',
  exampleText: '10 µH and 100 pF → LC = 10⁻¹⁵; √ = 3.16×10⁻⁸; f0 = 1 / (6.283 × 3.16×10⁻⁸) ≈ 5.03 MHz.',
  visual: 'resonance', concepts: ['sqrt', 'pi'],
  modes: [mode({
    id: 'f0', inputs: ['L', 'C'], outputs: ['f0'], equation: 'f0 = 1 / (2π × √(L × C))',
    compute: (v) => ({ f0: 1 / (TWO_PI * Math.sqrt(v.L * v.C)) }),
    steps: (v, o) => [`L × C = ${N(v.L)} × ${N(v.C)} = ${N(v.L * v.C)}`, `√(LC) = ${N(Math.sqrt(v.L * v.C))}`, `2π × √(LC) = ${N(TWO_PI * Math.sqrt(v.L * v.C))}`, `f0 = 1 / ${N(TWO_PI * Math.sqrt(v.L * v.C))} = ${S('frequency', o.f0)}`],
    examples: [ex('§5 10 µH and 100 pF', { L: 10 * micro, C: 100 * pico }, { f0: 5.033e6 }, 0.001)],
  })],
})

export const qSeries = defineFormula({
  id: 'q-series', section: 's5', title: 'Q factor, series RLC', page: 6,
  equation: 'Q = (1/R) × √(L/C)',
  meaning: 'Sharpness of resonance in a series RLC circuit. Higher Q means a narrower frequency response.',
  fields: [
    field('Q', 'Q', 'Quality factor', 'ratio', { description: 'no unit' }),
    field('R', 'R', 'Series resistance', 'resistance', { sign: 'pos', description: "total series resistance, including the coil's own wire resistance" }),
    field('L', 'L', 'Inductance', 'inductance', { sign: 'pos' }),
    field('C', 'C', 'Capacitance', 'capacitance', { sign: 'pos' }),
  ],
  unitsNote: 'L and C in base units (H, F); units cancel so Q has no unit.',
  exampleText: 'R = 10 Ω, L = 10 µH, C = 100 pF → √(10⁻⁵/10⁻¹⁰) = √10⁵ = 316 → Q = 31.6.',
  visual: 'resonance', concepts: ['sqrt'],
  modes: [mode({
    id: 'Q', inputs: ['R', 'L', 'C'], outputs: ['Q'], equation: 'Q = (1/R) × √(L/C)',
    compute: (v) => ({ Q: Math.sqrt(v.L / v.C) / v.R }),
    steps: (v, o) => [`L / C = ${N(v.L / v.C)}`, `√(L/C) = ${N(Math.sqrt(v.L / v.C))} Ω`, `Q = ${N(Math.sqrt(v.L / v.C))} / ${N(v.R)} = ${N(o.Q)}`],
    examples: [ex('§5 10 Ω, 10 µH, 100 pF', { R: 10, L: 10 * micro, C: 100 * pico }, { Q: 31.62 }, 0.001)],
  })],
})

export const qParallel = defineFormula({
  id: 'q-parallel', section: 's5', title: 'Q factor, parallel RLC', page: 6,
  equation: 'Q = R × √(C/L)',
  meaning: 'Sharpness of resonance in a parallel RLC circuit. A higher parallel R gives a higher Q.',
  fields: [
    field('Q', 'Q', 'Quality factor', 'ratio'),
    field('R', 'R', 'Parallel resistance', 'resistance', { sign: 'pos', description: 'resistance in parallel with the tank' }),
    field('L', 'L', 'Inductance', 'inductance', { sign: 'pos' }),
    field('C', 'C', 'Capacitance', 'capacitance', { sign: 'pos' }),
  ],
  unitsNote: 'C and L in F and H.',
  exampleText: 'R = 10 kΩ, L = 10 µH, C = 100 pF → √(10⁻¹⁰/10⁻⁵) = 0.00316 → Q = 10 000 × 0.00316 = 31.6.',
  visual: 'resonance', concepts: ['sqrt'],
  modes: [mode({
    id: 'Q', inputs: ['R', 'L', 'C'], outputs: ['Q'], equation: 'Q = R × √(C/L)',
    compute: (v) => ({ Q: v.R * Math.sqrt(v.C / v.L) }),
    steps: (v, o) => [`C / L = ${N(v.C / v.L)}`, `√(C/L) = ${N(Math.sqrt(v.C / v.L))}`, `Q = ${N(v.R)} × ${N(Math.sqrt(v.C / v.L))} = ${N(o.Q)}`],
    examples: [ex('§5 10 kΩ, 10 µH, 100 pF', { R: 10 * kilo, L: 10 * micro, C: 100 * pico }, { Q: 31.62 }, 0.001)],
  })],
})

export const bandwidth = defineFormula({
  id: 'bandwidth', section: 's5', title: 'Bandwidth', page: 6,
  equation: 'BW = f0 / Q',
  meaning: 'Width of the frequency range between the −3 dB points around resonance.',
  fields: [
    field('BW', 'BW', 'Bandwidth', 'frequency', { description: 'same unit as f0' }),
    field('f0', 'f0', 'Resonant frequency', 'frequency', { sign: 'pos' }),
    field('Q', 'Q', 'Quality factor', 'ratio', { sign: 'pos' }),
  ],
  unitsNote: 'BW comes out in whatever unit f0 is in.',
  exampleText: 'f0 = 10 MHz, Q = 50 → BW = 0.2 MHz = 200 kHz.',
  visual: 'resonance',
  modes: [mode({
    id: 'BW', inputs: ['f0', 'Q'], outputs: ['BW'], equation: 'BW = f0 / Q',
    compute: (v) => ({ BW: v.f0 / v.Q }),
    steps: (v, o) => [`BW = f0 / Q = ${S('frequency', v.f0)} / ${N(v.Q)}`, `BW = ${S('frequency', o.BW)}`],
    examples: [ex('§5 10 MHz, Q = 50', { f0: 10 * mega, Q: 50 }, { BW: 200 * kilo })],
  })],
})

export const rcCutoff = defineFormula({
  id: 'rc-cutoff', section: 's5', title: 'RC filter cutoff', page: 7,
  equation: 'fc = 1 / (2πRC)',
  meaning: 'Cutoff (−3 dB) frequency of an RC low-pass or high-pass filter.',
  analogy: 'The "door" frequency: signals below it pass a low-pass filter nearly untouched; above it they are quieted by half the power (−3 dB).',
  fields: [
    field('fc', 'fc', 'Cutoff frequency', 'frequency'),
    field('R', 'R', 'Resistance', 'resistance', { sign: 'pos' }),
    field('C', 'C', 'Capacitance', 'capacitance', { sign: 'pos' }),
  ],
  unitsNote: 'R in Ω, C in F. Shortcut: kΩ and µF give kHz → 1 / (6.283 × 1 × 0.1) = 1.59 kHz.',
  exampleText: '1 kΩ and 100 nF → 1 / (6.283 × 1000 × 10⁻⁷) ≈ 1592 Hz.',
  visual: 'filter-rc', concepts: ['pi', 'db'],
  modes: [
    mode({
      id: 'fc', inputs: ['R', 'C'], outputs: ['fc'], equation: 'fc = 1 / (2π × R × C)',
      compute: (v) => ({ fc: 1 / (TWO_PI * v.R * v.C) }),
      steps: (v, o) => [`2π × R × C = ${N(TWO_PI)} × ${N(v.R)} × ${N(v.C)} = ${N(TWO_PI * v.R * v.C)}`, `fc = 1 / ${N(TWO_PI * v.R * v.C)} = ${S('frequency', o.fc)}`],
      examples: [ex('§5 1 kΩ and 100 nF', { R: kilo, C: 100 * nano }, { fc: 1591.55 }, 0.001)],
    }),
    mode({
      id: 'C', label: 'Find C (design)', inputs: ['fc', 'R'], outputs: ['C'], equation: 'C = 1 / (2π × R × fc)',
      compute: (v) => ({ C: 1 / (TWO_PI * v.R * v.fc) }),
      steps: (v, o) => [`C = 1 / (2π × R × fc) = 1 / (${N(TWO_PI)} × ${N(v.R)} × ${N(v.fc)})`, `C = ${S('capacitance', o.C)}`, 'Pick the nearest standard value, then recompute fc.'],
      examples: [ex('§17 P10 1 kHz low-pass, R = 10 kΩ', { fc: kilo, R: 10 * kilo }, { C: 15.9e-9 }, 0.005)],
    }),
    mode({
      id: 'R', label: 'Find R (design)', inputs: ['fc', 'C'], outputs: ['R'], equation: 'R = 1 / (2π × C × fc)',
      compute: (v) => ({ R: 1 / (TWO_PI * v.C * v.fc) }),
      steps: (v, o) => [`R = 1 / (2π × C × fc) = 1 / (${N(TWO_PI)} × ${N(v.C)} × ${N(v.fc)})`, `R = ${S('resistance', o.R)}`],
      examples: [ex('inverse', { fc: 1591.55, C: 100 * nano }, { R: 1000 }, 0.001)],
    }),
  ],
})

export const rlCutoff = defineFormula({
  id: 'rl-cutoff', section: 's5', title: 'RL filter cutoff', page: 7,
  equation: 'fc = R / (2πL)',
  meaning: 'Cutoff (−3 dB) frequency of an RL low-pass or high-pass filter.',
  fields: [
    field('fc', 'fc', 'Cutoff frequency', 'frequency'),
    field('R', 'R', 'Resistance', 'resistance', { sign: 'pos' }),
    field('L', 'L', 'Inductance', 'inductance', { sign: 'pos', description: 'inductance, in henries (H)' }),
  ],
  unitsNote: 'L in henries.',
  exampleText: '100 Ω and 10 mH → 100 / (6.283 × 0.01) ≈ 1592 Hz.',
  visual: 'filter-rl', concepts: ['pi', 'db'],
  modes: [mode({
    id: 'fc', inputs: ['R', 'L'], outputs: ['fc'], equation: 'fc = R / (2π × L)',
    compute: (v) => ({ fc: v.R / (TWO_PI * v.L) }),
    steps: (v, o) => [`2π × L = ${N(TWO_PI * v.L)}`, `fc = R / (2πL) = ${N(v.R)} / ${N(TWO_PI * v.L)} = ${S('frequency', o.fc)}`],
    examples: [ex('§5 100 Ω and 10 mH', { R: 100, L: 10 * milli }, { fc: 1591.55 }, 0.001)],
  })],
})

export const s05 = [f0, qSeries, qParallel, bandwidth, rcCutoff, rlCutoff]
