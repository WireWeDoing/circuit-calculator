import { defineFormula, ex, field, mode, recipSum, sum } from '../core/define.ts'
import { N, S } from '../core/fmt.ts'
import { micro, milli, mega } from '../core/units.ts'

const TWO_PI = 2 * Math.PI

export const lSeries = defineFormula({
  id: 'l-series', section: 's4', title: 'Series total', page: 5,
  equation: 'Lt = L1 + L2 + ... + Ln',
  meaning: 'Inductors in series add (when not magnetically coupled).',
  analogy: 'More coils in a row = more "inertia" for the current, so they add up like resistors.',
  fields: [
    field('L', 'L1…Ln', 'Inductors', 'inductance', { sign: 'pos', list: true, description: 'the individual inductors' }),
    field('Lt', 'Lt', 'Total inductance', 'inductance'),
  ],
  unitsNote: 'Same unit for all: 1 mH + 470 µH = 1000 µH + 470 µH = 1470 µH.',
  visual: 'series-L', concepts: ['prefix'],
  modes: [mode({
    id: 'Lt', inputs: ['L'], outputs: ['Lt'], equation: 'Lt = L1 + L2 + … + Ln',
    compute: (_v, l) => ({ Lt: sum(l.L!) }),
    steps: (_v, o, l) => [`Lt = ${l.L!.map((x) => S('inductance', x)).join(' + ')}`, `Lt = ${S('inductance', o.Lt)}`],
    examples: [ex('§4 1 mH + 470 µH', {}, { Lt: 1470 * micro }, undefined, { L: [milli, 470 * micro] })],
  })],
})

export const lParallel = defineFormula({
  id: 'l-parallel', section: 's4', title: 'Parallel total', page: 5,
  equation: '1/Lt = 1/L1 + 1/L2 + ... + 1/Ln',
  meaning: 'Inductors in parallel combine by reciprocals. The total is smaller than the smallest inductor.',
  fields: [
    field('L', 'L1…Ln', 'Inductors', 'inductance', { sign: 'pos', list: true }),
    field('Lt', 'Lt', 'Total inductance', 'inductance'),
  ],
  unitsNote: 'Same unit for all; flip the sum at the end. Example: 10 µH ∥ 10 µH → 1/10 + 1/10 = 0.2 → 5 µH.',
  visual: 'parallel-L',
  modes: [mode({
    id: 'Lt', inputs: ['L'], outputs: ['Lt'], equation: '1/Lt = Σ 1/Ln',
    compute: (_v, l) => ({ Lt: 1 / recipSum(l.L!) }),
    steps: (_v, o, l) => [`Add reciprocals: ${l.L!.map((x) => `1/${N(x)}`).join(' + ')} = ${N(recipSum(l.L!))}`, `Flip: Lt = ${S('inductance', o.Lt)}`],
    examples: [ex('§4 10 µH ∥ 10 µH', {}, { Lt: 5 * micro }, undefined, { L: [10 * micro, 10 * micro] })],
  })],
})

export const xl = defineFormula({
  id: 'ind-reactance', section: 's4', title: 'Inductive reactance', page: 5,
  equation: 'XL = 2πfL',
  meaning: 'Opposition of an inductor to AC. It increases with frequency; DC passes through.',
  analogy: 'A heavy flywheel: slow changes are easy, rapid back-and-forth is strongly resisted.',
  fields: [
    field('XL', 'XL', 'Inductive reactance', 'resistance', { description: 'in ohms (Ω)' }),
    field('f', 'f', 'Frequency', 'frequency', { sign: 'pos', description: 'frequency, in hertz (Hz)' }),
    field('L', 'L', 'Inductance', 'inductance', { sign: 'pos', description: 'inductance, in henries (H)' }),
  ],
  unitsNote: 'Convert L: mH × 10⁻³, µH × 10⁻⁶. Shortcut: MHz × µH works directly (the prefixes cancel): 6.283 × 1 × 10 = 62.8 Ω.',
  exampleText: '10 µH at 1 MHz → 6.283 × 1 000 000 × 0.000 01 = 62.8 Ω.',
  visual: 'reactance-L', concepts: ['pi'],
  modes: [mode({
    id: 'XL', inputs: ['f', 'L'], outputs: ['XL'], equation: 'XL = 2π × f × L',
    compute: (v) => ({ XL: TWO_PI * v.f * v.L }),
    steps: (v, o) => [`XL = 2π × f × L = ${N(TWO_PI)} × ${N(v.f)} Hz × ${N(v.L)} H`, `XL = ${S('resistance', o.XL)}`],
    examples: [ex('§4 10 µH at 1 MHz', { f: mega, L: 10 * micro }, { XL: 62.83 }, 0.001)],
  })],
})

export const lEnergy = defineFormula({
  id: 'ind-energy', section: 's4', title: 'Energy stored', page: 5,
  equation: 'E = ½ × L × I²',
  meaning: "Energy held in an inductor's magnetic field while current flows.",
  fields: [
    field('E', 'E', 'Energy', 'energy'),
    field('L', 'L', 'Inductance', 'inductance', { sign: 'pos' }),
    field('I', 'I', 'Current', 'current', { sign: 'nonneg', description: 'current through the inductor' }),
  ],
  unitsNote: 'L in H, I in A.',
  exampleText: '100 mH at 2 A → 0.5 × 0.1 × 2² = 0.2 J.',
  visual: 'ind-energy',
  modes: [mode({
    id: 'E', inputs: ['L', 'I'], outputs: ['E'], equation: 'E = ½ × L × I²',
    compute: (v) => ({ E: 0.5 * v.L * v.I ** 2 }),
    steps: (v, o) => [`I² = ${N(v.I ** 2)}`, `E = 0.5 × ${N(v.L)} H × ${N(v.I ** 2)} A²`, `E = ${S('energy', o.E)}`],
    examples: [ex('§4 100 mH at 2 A', { L: 0.1, I: 2 }, { E: 0.2 })],
  })],
})

export const rlTau = defineFormula({
  id: 'rl-tau', section: 's4', title: 'RL time constant', page: 6,
  equation: 'τ = L / R',
  meaning: 'Time for the current in an inductor-resistor circuit to reach 63% of its final change.',
  fields: [
    field('tau', 'τ', 'Time constant', 'time'),
    field('L', 'L', 'Inductance', 'inductance', { sign: 'pos' }),
    field('R', 'R', 'Resistance', 'resistance', { sign: 'pos', description: 'total resistance in the loop' }),
  ],
  unitsNote: 'H ÷ Ω = seconds. Shortcut: mH ÷ kΩ gives µs.',
  exampleText: '10 mH with 100 Ω → 0.01 ÷ 100 = 0.0001 s = 100 µs.',
  visual: 'rl-tau', concepts: ['tau'],
  modes: [mode({
    id: 'tau', inputs: ['L', 'R'], outputs: ['tau'], equation: 'τ = L / R',
    compute: (v) => ({ tau: v.L / v.R }),
    steps: (v, o) => [`τ = L / R = ${N(v.L)} H / ${N(v.R)} Ω`, `τ = ${S('time', o.tau)}`],
    examples: [ex('§4 10 mH with 100 Ω', { L: 10 * milli, R: 100 }, { tau: 1e-4 })],
  })],
})

export const induced = defineFormula({
  id: 'induced-voltage', section: 's4', title: 'Induced voltage', page: 6,
  equation: 'V = L × (ΔI / Δt)',
  meaning: 'Voltage produced when the current through an inductor changes. A fast change (switching off) causes a high spike, which is why relay coils need a flyback diode.',
  analogy: 'Stopping a heavy flywheel suddenly: the faster you try to stop it, the harder it pushes back.',
  fields: [
    field('V', 'V', 'Induced voltage', 'voltage'),
    field('L', 'L', 'Inductance', 'inductance', { sign: 'pos' }),
    field('dI', 'ΔI', 'Change in current', 'current', { description: 'change in current, in amps' }),
    field('dt', 'Δt', 'Time of the change', 'time', { sign: 'pos', description: 'time the change takes, in seconds' }),
  ],
  unitsNote: 'Convert µs → s (× 10⁻⁶) or the answer is a million times too small.',
  exampleText: 'A 10 mH relay coil carrying 1 A is switched off in 1 µs → 0.01 × (1 ÷ 0.000 001) = 10 000 V spike.',
  visual: 'induced', keywords: ['flyback', 'spike'],
  modes: [mode({
    id: 'V', inputs: ['L', 'dI', 'dt'], outputs: ['V'], equation: 'V = L × ΔI / Δt',
    compute: (v) => ({ V: (v.L * v.dI) / v.dt }),
    warn: (_v, o) => (Math.abs(o.V) > 50 ? ['Large spike — add a flyback diode across inductive loads.'] : []),
    steps: (v, o) => [`Rate of change ΔI/Δt = ${N(v.dI)} A / ${N(v.dt)} s = ${N(v.dI / v.dt)} A/s`, `V = L × rate = ${N(v.L)} H × ${N(v.dI / v.dt)}`, `V = ${S('voltage', o.V)}`],
    examples: [ex('§4 10 mH, 1 A, 1 µs', { L: 10 * milli, dI: 1, dt: micro }, { V: 10000 })],
  })],
})

export const s04 = [lSeries, lParallel, xl, lEnergy, rlTau, induced]
