import { parallelCBreakdown, seriesCBreakdown } from '../core/breakdown.ts'
import { defineFormula, ex, field, mode, recipSum, sum } from '../core/define.ts'
import { N, S } from '../core/fmt.ts'
import { kilo, micro, milli, nano } from '../core/units.ts'

const TWO_PI = 2 * Math.PI
const capExtra = [
  field('V', 'V', 'Supply voltage', 'voltage', { sign: 'pos', description: 'voltage applied across the whole network' }),
  field('Q', 'Q', 'Total charge', 'charge'),
  field('E', 'E', 'Total energy', 'energy'),
]

export const cSeries = defineFormula({
  id: 'c-series', section: 's3', title: 'Series total', page: 4,
  equation: '1/Ct = 1/C1 + 1/C2 + ... + 1/Cn',
  meaning: 'Capacitors in series combine by reciprocals. The total is always smaller than the smallest capacitor. The voltage is divided between them.',
  analogy: 'Stacking two buckets one above the other makes the "storage plate gap" thicker, so the total storage drops — the opposite of resistors.',
  fields: [
    field('C', 'C1…Cn', 'Capacitors', 'capacitance', { sign: 'pos', list: true, description: 'the individual capacitors in series' }),
    field('Ct', 'Ct', 'Total capacitance', 'capacitance'),
    ...capExtra,
  ],
  unitsNote: 'All values in the same unit (all µF or all nF) — the answer is in that unit. Remember to flip the sum at the end. Mixed units: 1 µF with 470 nF → convert 1 µF = 1000 nF first.',
  exampleText: '10 µF + 10 µF in series → 1/10 + 1/10 = 0.2 → Ct = 1/0.2 = 5 µF.',
  visual: 'series-C', concepts: ['prefix'],
  modes: [mode({
    id: 'Ct', inputs: ['C'], outputs: ['Ct'], equation: '1/Ct = Σ 1/Cn',
    compute: (_v, l) => ({ Ct: 1 / recipSum(l.C!) }),
    steps: (_v, o, l) => [`Add reciprocals: ${l.C!.map((c) => `1/${N(c)}`).join(' + ')} = ${N(recipSum(l.C!))}`, `Flip: Ct = 1 / ${N(recipSum(l.C!))} = ${S('capacitance', o.Ct)}`, `Check: Ct is smaller than the smallest capacitor (${S('capacitance', Math.min(...l.C!))}) ✓`],
    breakdown: (_v, _o, l) => seriesCBreakdown(l.C!),
    examples: [ex('§3 10 µF + 10 µF in series', {}, { Ct: 5 * micro }, undefined, { C: [10 * micro, 10 * micro] })],
  }),
  mode({
    id: 'withV', label: 'With supply voltage', inputs: ['C', 'V'], outputs: ['Ct', 'Q', 'E'], equation: 'Q = Ct × V;  Vn = Q / Cn',
    compute: (v, l) => { const Ct = 1 / recipSum(l.C!); return { Ct, Q: Ct * v.V, E: 0.5 * Ct * v.V * v.V } },
    breakdown: (v, _o, l) => seriesCBreakdown(l.C!, v.V),
    steps: (v, o, l) => [`Ct = ${S('capacitance', o.Ct)}`, `The SAME charge sits on every capacitor: Q = Ct × V = ${S('capacitance', o.Ct)} × ${S('voltage', v.V)} = ${S('charge', o.Q)}`, `Voltage across each: Vn = Q / Cn  (${l.C!.map((c) => S('voltage', o.Q / c)).join(', ')}) — the smallest capacitor takes the biggest share`, `Total energy E = ½ × Ct × V² = ${S('energy', o.E)}`],
    examples: [ex('10 µF + 10 µF on 12 V', { V: 12 }, { Ct: 5e-6, Q: 6e-5, E: 3.6e-4 }, undefined, { C: [10 * micro, 10 * micro] })],
  })],
})

export const cParallel = defineFormula({
  id: 'c-parallel', section: 's3', title: 'Parallel total', page: 4,
  equation: 'Ct = C1 + C2 + ... + Cn',
  meaning: 'Capacitors in parallel add. Each one has the same voltage across it.',
  analogy: 'Putting buckets side by side: the total amount you can store is simply the sum.',
  fields: [
    field('C', 'C1…Cn', 'Capacitors', 'capacitance', { sign: 'pos', list: true, description: 'the individual parallel capacitors' }),
    field('Ct', 'Ct', 'Total capacitance', 'capacitance'),
    ...capExtra,
  ],
  unitsNote: 'Same unit for all. Example: 100 nF + 0.1 µF = 100 nF + 100 nF = 200 nF.',
  visual: 'parallel-C',
  modes: [mode({
    id: 'Ct', inputs: ['C'], outputs: ['Ct'], equation: 'Ct = C1 + C2 + … + Cn',
    compute: (_v, l) => ({ Ct: sum(l.C!) }),
    steps: (_v, o, l) => [`Ct = ${l.C!.map((c) => S('capacitance', c)).join(' + ')}`, `Ct = ${S('capacitance', o.Ct)}`],
    breakdown: (_v, _o, l) => parallelCBreakdown(l.C!),
    examples: [ex('§3 100 nF + 0.1 µF', {}, { Ct: 200 * nano }, undefined, { C: [100 * nano, 0.1 * micro] })],
  }),
  mode({
    id: 'withV', label: 'With supply voltage', inputs: ['C', 'V'], outputs: ['Ct', 'Q', 'E'], equation: 'Qn = Cn × V;  Q = ΣQn',
    compute: (v, l) => { const Ct = sum(l.C!); return { Ct, Q: Ct * v.V, E: 0.5 * Ct * v.V * v.V } },
    breakdown: (v, _o, l) => parallelCBreakdown(l.C!, v.V),
    steps: (v, o, l) => [`Ct = ${S('capacitance', o.Ct)}`, `Every capacitor has the full voltage: V = ${S('voltage', v.V)}`, `Charge on each: Qn = Cn × V  (${l.C!.map((c) => S('charge', c * v.V)).join(', ')})`, `Total charge Q = Ct × V = ${S('charge', o.Q)};  energy E = ½ Ct V² = ${S('energy', o.E)}`],
    examples: [ex('100 nF + 220 nF + 330 nF on 5 V', { V: 5 }, { Ct: 650e-9, Q: 3.25e-6, E: 8.125e-6 }, undefined, { C: [100e-9, 220e-9, 330e-9] })],
  })],
})

export const charge = defineFormula({
  id: 'cap-charge', section: 's3', title: 'Charge stored', page: 4,
  equation: 'Q = C × V',
  meaning: 'Charge held by a capacitor at a given voltage.',
  analogy: 'A bucket (C) filled to a water level (V) holds an amount of water (Q).',
  fields: [
    field('Q', 'Q', 'Charge', 'charge', { sign: 'nonneg', description: 'charge, in coulombs (C)' }),
    field('C', 'C', 'Capacitance', 'capacitance', { sign: 'pos', description: 'capacitance, in farads (F)' }),
    field('V', 'V', 'Voltage', 'voltage', { sign: 'nonneg', description: 'voltage across the capacitor' }),
  ],
  unitsNote: 'Convert µF → F by multiplying by 10⁻⁶ (100 µF = 0.0001 F). Shortcut: µF × V gives microcoulombs (100 × 12 = 1200 µC).',
  exampleText: '100 µF at 12 V → 0.0001 × 12 = 0.0012 C.',
  visual: 'cap-charge',
  modes: [
    mode({
      id: 'Q', inputs: ['C', 'V'], outputs: ['Q'], equation: 'Q = C × V',
      compute: (v) => ({ Q: v.C * v.V }),
      steps: (v, o) => [`C in farads: ${N(v.C)} F`, `Q = C × V = ${N(v.C)} × ${N(v.V)}`, `Q = ${S('charge', o.Q)}`],
      examples: [ex('§3 100 µF at 12 V', { C: 100 * micro, V: 12 }, { Q: 0.0012 })],
    }),
    mode({
      id: 'C', inputs: ['Q', 'V'], outputs: ['C'], equation: 'C = Q / V', check: (v) => (v.V > 0 ? undefined : 'V must be greater than 0'),
      compute: (v) => ({ C: v.Q / v.V }),
      steps: (v, o) => [`C = Q / V = ${N(v.Q)} / ${N(v.V)}`, `C = ${S('capacitance', o.C)}`],
      examples: [ex('inverse of 100 µF at 12 V', { Q: 0.0012, V: 12 }, { C: 100 * micro })],
    }),
    mode({
      id: 'V', inputs: ['Q', 'C'], outputs: ['V'], equation: 'V = Q / C',
      compute: (v) => ({ V: v.Q / v.C }),
      steps: (v, o) => [`V = Q / C = ${N(v.Q)} / ${N(v.C)}`, `V = ${S('voltage', o.V)}`],
      examples: [ex('inverse of 100 µF at 12 V', { Q: 0.0012, C: 100 * micro }, { V: 12 })],
    }),
  ],
})

export const cEnergy = defineFormula({
  id: 'cap-energy', section: 's3', title: 'Energy stored', page: 4,
  equation: 'E = ½ × C × V²',
  meaning: 'Energy held by a charged capacitor.',
  analogy: 'Voltage is squared: doubling the voltage stores FOUR times the energy — like pulling a spring twice as far.',
  fields: [
    field('E', 'E', 'Energy', 'energy', { description: 'energy, in joules (J)' }),
    field('C', 'C', 'Capacitance', 'capacitance', { sign: 'pos', description: 'capacitance, in farads (F)' }),
    field('V', 'V', 'Voltage', 'voltage', { sign: 'nonneg', description: 'voltage across the capacitor' }),
  ],
  unitsNote: 'C must be in farads.',
  exampleText: '1000 µF at 25 V → 0.5 × 0.001 × 25² = 0.5 × 0.001 × 625 = 0.31 J.',
  visual: 'cap-energy',
  modes: [mode({
    id: 'E', inputs: ['C', 'V'], outputs: ['E'], equation: 'E = ½ × C × V²',
    compute: (v) => ({ E: 0.5 * v.C * v.V ** 2 }),
    steps: (v, o) => [`V² = ${N(v.V)}² = ${N(v.V ** 2)}`, `E = 0.5 × ${N(v.C)} F × ${N(v.V ** 2)}`, `E = ${S('energy', o.E)}`],
    examples: [ex('§3 1000 µF at 25 V', { C: 1000 * micro, V: 25 }, { E: 0.3125 })],
  })],
})

export const xc = defineFormula({
  id: 'cap-reactance', section: 's3', title: 'Capacitive reactance', page: 4,
  equation: 'XC = 1 / (2πfC)',
  meaning: 'Opposition of a capacitor to AC. It decreases as frequency increases; DC is blocked.',
  analogy: 'A trampoline membrane in a pipe: slow pushes (low f) barely get through, fast wiggles (high f) pass easily.',
  fields: [
    field('XC', 'XC', 'Capacitive reactance', 'resistance', { description: 'in ohms (Ω)' }),
    field('f', 'f', 'Frequency', 'frequency', { sign: 'pos', description: 'signal frequency, in hertz (Hz)' }),
    field('C', 'C', 'Capacitance', 'capacitance', { sign: 'pos', description: 'capacitance, in farads (F)' }),
  ],
  unitsNote: 'Convert f: kHz × 1000, MHz × 1 000 000. Convert C: µF × 10⁻⁶, nF × 10⁻⁹, pF × 10⁻¹².',
  exampleText: '100 nF at 1 kHz → 1 / (6.283 × 1000 × 100×10⁻⁹) = 1 / 0.000628 ≈ 1592 Ω.',
  visual: 'reactance-C', concepts: ['pi'],
  modes: [mode({
    id: 'XC', inputs: ['f', 'C'], outputs: ['XC'], equation: 'XC = 1 / (2π × f × C)',
    compute: (v) => ({ XC: 1 / (TWO_PI * v.f * v.C) }),
    steps: (v, o) => [`2π × f × C = ${N(TWO_PI)} × ${N(v.f)} Hz × ${N(v.C)} F = ${N(TWO_PI * v.f * v.C)}`, `XC = 1 / ${N(TWO_PI * v.f * v.C)}`, `XC = ${S('resistance', o.XC)}`],
    examples: [ex('§3 100 nF at 1 kHz', { f: 1 * kilo, C: 100 * nano }, { XC: 1591.55 }, 0.001)],
  })],
})

export const rcTau = defineFormula({
  id: 'rc-tau', section: 's3', title: 'RC time constant', page: 4,
  equation: 'τ = R × C',
  meaning: 'Time a capacitor takes to charge or discharge through a resistor to 63% of the full change.',
  analogy: 'Filling a bucket through a thin hose: a thinner hose (bigger R) or a bigger bucket (bigger C) takes longer.',
  fields: [
    field('tau', 'τ', 'Time constant', 'time', { description: 'tau, the time constant, in seconds (s)' }),
    field('R', 'R', 'Resistance', 'resistance', { sign: 'pos', description: 'resistance the capacitor charges through' }),
    field('C', 'C', 'Capacitance', 'capacitance', { sign: 'pos', description: 'capacitance, in farads (F)' }),
  ],
  unitsNote: 'Ω × F = seconds. Shortcut: kΩ × µF gives milliseconds (10 × 100 = 1000 ms = 1 s).',
  exampleText: '10 kΩ × 100 µF = 10 000 × 0.0001 = 1 s.',
  visual: 'rc-tau', concepts: ['tau'],
  modes: [
    mode({
      id: 'tau', label: 'Find τ', inputs: ['R', 'C'], outputs: ['tau'], equation: 'τ = R × C',
      compute: (v) => ({ tau: v.R * v.C }),
      steps: (v, o) => [`τ = R × C = ${N(v.R)} Ω × ${N(v.C)} F`, `τ = ${S('time', o.tau)}`],
      examples: [ex('§3 10 kΩ × 100 µF', { R: 10 * kilo, C: 100 * micro }, { tau: 1 })],
    }),
    mode({
      id: 'R', inputs: ['tau', 'C'], outputs: ['R'], equation: 'R = τ / C',
      compute: (v) => ({ R: v.tau / v.C }),
      steps: (v, o) => [`R = τ / C = ${N(v.tau)} s / ${N(v.C)} F`, `R = ${S('resistance', o.R)}`],
      examples: [ex('inverse', { tau: 1, C: 100 * micro }, { R: 10 * kilo })],
    }),
    mode({
      id: 'C', inputs: ['tau', 'R'], outputs: ['C'], equation: 'C = τ / R',
      compute: (v) => ({ C: v.tau / v.R }),
      steps: (v, o) => [`C = τ / R = ${N(v.tau)} s / ${N(v.R)} Ω`, `C = ${S('capacitance', o.C)}`],
      examples: [ex('inverse', { tau: 1, R: 10 * kilo }, { C: 100 * micro })],
    }),
  ],
})

export const rcCharge = defineFormula({
  id: 'rc-charging', section: 's3', title: 'Charging voltage', page: 5,
  equation: 'V(t) = Vs × (1 − e^(−t/RC))',
  meaning: 'Capacitor voltage at time t while charging from 0 V toward the supply voltage.',
  analogy: 'Filling a bucket where the flow slows as the bucket fills: fast at first, then slower and slower. After 1τ it is 63% full, after 5τ virtually full.',
  fields: [
    field('V', 'V(t)', 'Capacitor voltage', 'voltage', { description: 'capacitor voltage at time t' }),
    field('Vs', 'Vs', 'Supply voltage', 'voltage', { sign: 'nonneg', description: 'supply voltage it is charging toward' }),
    field('t', 't', 'Time', 'time', { sign: 'nonneg', description: 'time since charging started' }),
    field('tau', 'RC', 'Time constant', 'time', { sign: 'pos', description: 'the time constant τ = R × C' }),
  ],
  unitsNote: 't and RC must be in the same time unit (both s or both ms) — only their ratio matters.',
  exampleText: 'Vs = 5 V, RC = 1 s, t = 2 s → 5 × (1 − e⁻²) = 5 × (1 − 0.135) = 4.32 V.',
  visual: 'rc-charge', concepts: ['exp'],
  modes: [mode({
    id: 'V', inputs: ['Vs', 't', 'tau'], outputs: ['V'], equation: 'V(t) = Vs × (1 − e^(−t/RC))',
    compute: (v) => ({ V: v.Vs * (1 - Math.exp(-v.t / v.tau)) }),
    steps: (v, o) => [`t / RC = ${N(v.t)} / ${N(v.tau)} = ${N(v.t / v.tau)}`, `e^(−${N(v.t / v.tau)}) = ${N(Math.exp(-v.t / v.tau))}`, `V = ${N(v.Vs)} × (1 − ${N(Math.exp(-v.t / v.tau))}) = ${S('voltage', o.V)}`, `That is ${N((o.V / v.Vs) * 100, 3)}% of the supply.`],
    examples: [ex('§3 Vs = 5 V, RC = 1 s, t = 2 s', { Vs: 5, t: 2, tau: 1 }, { V: 4.3233 }, 0.001)],
  })],
})

export const rcDischarge = defineFormula({
  id: 'rc-discharging', section: 's3', title: 'Discharging voltage', page: 5,
  equation: 'V(t) = V0 × e^(−t/RC)',
  meaning: 'Capacitor voltage at time t while discharging from its starting voltage toward 0 V.',
  analogy: 'A bucket draining through a hole: quickly when full, slowly when nearly empty.',
  fields: [
    field('V', 'V(t)', 'Capacitor voltage', 'voltage', { description: 'capacitor voltage at time t' }),
    field('V0', 'V0', 'Starting voltage', 'voltage', { sign: 'nonneg', description: 'voltage at the moment discharge starts' }),
    field('t', 't', 'Time', 'time', { sign: 'nonneg', description: 'time since discharge started' }),
    field('tau', 'RC', 'Time constant', 'time', { sign: 'pos', description: 'the time constant τ' }),
  ],
  unitsNote: 'Same rule: t and RC in the same unit.',
  exampleText: '12 V, RC = 10 ms, t = 10 ms → 12 × e⁻¹ = 12 × 0.368 = 4.4 V.',
  visual: 'rc-discharge', concepts: ['exp'],
  modes: [mode({
    id: 'V', inputs: ['V0', 't', 'tau'], outputs: ['V'], equation: 'V(t) = V0 × e^(−t/RC)',
    compute: (v) => ({ V: v.V0 * Math.exp(-v.t / v.tau) }),
    steps: (v, o) => [`t / RC = ${N(v.t / v.tau)}`, `e^(−${N(v.t / v.tau)}) = ${N(Math.exp(-v.t / v.tau))}`, `V = ${N(v.V0)} × ${N(Math.exp(-v.t / v.tau))} = ${S('voltage', o.V)}`],
    examples: [ex('§3 12 V, RC = t = 10 ms', { V0: 12, t: 10 * milli, tau: 10 * milli }, { V: 4.4146 }, 0.001)],
  })],
})

export const settle = defineFormula({
  id: 'settling-time', section: 's3', title: '"Fully" settled', page: 5,
  equation: 't ≈ 5τ',
  meaning: 'After 5 time constants the capacitor is more than 99% charged or discharged.',
  fields: [
    field('t', 't', 'Settling time', 'time'),
    field('tau', 'τ', 'Time constant', 'time', { sign: 'pos', description: 'time constant R × C' }),
  ],
  unitsNote: 'Same unit as τ. Example: τ = 1 s → about 5 s to fully charge.',
  visual: 'settle', concepts: ['tau'],
  modes: [mode({
    id: 't', inputs: ['tau'], outputs: ['t'], equation: 't ≈ 5 × τ',
    compute: (v) => ({ t: 5 * v.tau }),
    steps: (v, o) => [`t ≈ 5 × τ = 5 × ${S('time', v.tau)}`, `t ≈ ${S('time', o.t)}`, 'Checkpoints: 63% at 1τ, 86% at 2τ, 95% at 3τ, 99% at 5τ.'],
    examples: [ex('§3 τ = 1 s', { tau: 1 }, { t: 5 })],
  })],
})

export const s03 = [cSeries, cParallel, charge, cEnergy, xc, rcTau, rcCharge, rcDischarge, settle]
