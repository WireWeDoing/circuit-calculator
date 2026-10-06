import { defineFormula, ex, field, mode } from '../core/define.ts'
import { N, S } from '../core/fmt.ts'
import { micro, milli, nano } from '../core/units.ts'

const TWO_PI = 2 * Math.PI
const C_LIGHT = 3e8
const COPPER = 1.68e-8
const MIL = 25.4e-6 // metres per mil
const OZ_MIL = 1.37 // 1 oz copper thickness in mil

/* ───────── 14. PCB & signal integrity ───────── */

export const ipc2221 = defineFormula({
  id: 'ipc-2221', section: 's14', title: 'Trace current capacity (IPC-2221)', page: 14,
  equation: 'I = k × ΔT^0.44 × A^0.725',
  meaning: 'Current a trace can carry for a given temperature rise. Usually solved for the required trace width.',
  fields: [
    field('I', 'I', 'Current', 'current', { sign: 'pos' }),
    field('k', 'k', 'Layer constant', 'ratio', { sign: 'pos', description: '0.048 for outer layers, 0.024 for inner layers', presets: [{ label: 'Outer 0.048', value: 0.048 }, { label: 'Inner 0.024', value: 0.024 }] }),
    field('dT', 'ΔT', 'Temperature rise', 'temp', { sign: 'pos', description: 'allowed temperature rise, in °C (10 °C is typical)', placeholder: '10' }),
    field('A', 'A', 'Cross-section', 'areaMil', { sign: 'pos', description: 'trace cross-section in square mils (mil² = width × thickness)' }),
    field('oz', 'oz', 'Copper weight', 'ratio', { sign: 'pos', description: '1 oz copper = 1.37 mil (35 µm) thick', presets: [{ label: '0.5 oz', value: 0.5 }, { label: '1 oz', value: 1 }, { label: '2 oz', value: 2 }] }),
    field('w', 'width', 'Trace width', 'length'),
  ],
  unitsNote: 'This one uses imperial units: 1 mil = 0.0254 mm; 1 oz copper = 1.37 mil (35 µm) thick.',
  exampleText: '1 A, 10 °C, outer 1 oz → A ≈ 16 mil² → width = 16 / 1.37 ≈ 12 mil ≈ 0.30 mm.',
  visual: 'trace',
  modes: [
    mode({
      id: 'I', inputs: ['k', 'dT', 'A'], outputs: ['I'], equation: 'I = k × ΔT^0.44 × A^0.725',
      compute: (v) => ({ I: v.k * v.dT ** 0.44 * v.A ** 0.725 }),
      steps: (v, o) => [`ΔT^0.44 = ${N(v.dT ** 0.44)}`, `A^0.725 = ${N(v.A ** 0.725)}`, `I = ${N(v.k)} × ${N(v.dT ** 0.44)} × ${N(v.A ** 0.725)} = ${S('current', o.I)}`],
      examples: [ex('§14 A = 16.4 mil²', { k: 0.048, dT: 10, A: 16.4 }, { I: 1 }, 0.01)],
    }),
    mode({
      id: 'w', label: 'Find trace width', inputs: ['I', 'k', 'dT', 'oz'], outputs: ['A', 'w'], equation: 'A = (I / (k × ΔT^0.44))^(1/0.725);  width = A / thickness',
      compute: (v) => { const A = (v.I / (v.k * v.dT ** 0.44)) ** (1 / 0.725); return { A, w: (A / (OZ_MIL * v.oz)) * MIL } },
      steps: (v, o) => [`Required area A = (${N(v.I)} / (${N(v.k)} × ${N(v.dT ** 0.44)}))^(1/0.725) = ${N(o.A)} mil²`, `Thickness = ${N(OZ_MIL * v.oz)} mil (${N(v.oz)} oz copper)`, `Width = ${N(o.A)} / ${N(OZ_MIL * v.oz)} = ${N(o.A / (OZ_MIL * v.oz))} mil = ${S('length', o.w)}`],
      examples: [ex('§14 1 A, 10 °C, outer, 1 oz', { I: 1, k: 0.048, dT: 10, oz: 1 }, { A: 16.4, w: 0.000304 }, 0.02)],
    }),
  ],
})

export const traceR = defineFormula({
  id: 'trace-resistance', section: 's14', title: 'Trace resistance', page: 14,
  equation: 'R = ρ × L / (W × t)',
  meaning: 'Resistance of a PCB trace.',
  fields: [
    field('R', 'R', 'Resistance', 'resistance'),
    field('rho', 'ρ', 'Copper resistivity', 'resistivity', { sign: 'pos', presets: [{ label: 'Copper', value: COPPER }] }),
    field('L', 'L', 'Trace length', 'length', { sign: 'pos' }),
    field('W', 'W', 'Trace width', 'length', { sign: 'pos' }),
    field('t', 't', 'Copper thickness', 'length', { sign: 'pos', description: '1 oz = 35 µm', presets: [{ label: '1 oz = 35 µm', value: 35e-6 }] }),
  ],
  unitsNote: 'Convert everything to metres: mm × 10⁻³, µm × 10⁻⁶.',
  exampleText: '100 mm × 0.25 mm × 35 µm → 1.68×10⁻⁸ × 0.1 / (0.25×10⁻³ × 35×10⁻⁶) ≈ 0.19 Ω.',
  visual: 'trace',
  modes: [mode({
    id: 'R', inputs: ['rho', 'L', 'W', 't'], outputs: ['R'], equation: 'R = ρ × L / (W × t)',
    compute: (v) => ({ R: (v.rho * v.L) / (v.W * v.t) }),
    steps: (v, o) => [`Cross-section W × t = ${N(v.W)} × ${N(v.t)} = ${N(v.W * v.t)} m²`, `R = ${N(v.rho)} × ${N(v.L)} / ${N(v.W * v.t)} = ${S('resistance', o.R)}`],
    examples: [ex('§14 100 mm × 0.25 mm × 35 µm', { rho: COPPER, L: 0.1, W: 0.25e-3, t: 35 * micro }, { R: 0.192 }, 0.01)],
  })],
})

export const microstrip = defineFormula({
  id: 'microstrip-z0', section: 's14', title: 'Microstrip impedance (IPC-2141)', page: 14,
  equation: 'Z0 ≈ 87 / √(εr + 1.41) × ln(5.98h / (0.8w + t))',
  meaning: 'Characteristic impedance of an outer-layer trace above a ground plane. Required for USB, Ethernet and RF lines (typically 50 Ω, or 90 Ω differential).',
  fields: [
    field('Z0', 'Z0', 'Characteristic impedance', 'resistance'),
    field('er', 'εr', 'Relative permittivity', 'ratio', { sign: 'pos', min: 1, description: 'relative permittivity of the board, ≈ 4.2–4.6 for FR4', presets: [{ label: 'FR4 4.3', value: 4.3 }] }),
    field('h', 'h', 'Dielectric thickness', 'length', { sign: 'pos', description: 'dielectric thickness from trace to ground plane' }),
    field('w', 'w', 'Trace width', 'length', { sign: 'pos' }),
    field('t', 't', 'Copper thickness', 'length', { sign: 'pos' }),
  ],
  unitsNote: 'h, w and t just need the same unit (all mm or all mil) — they appear as a ratio. Roughly accurate for w/h between 0.1 and 2.',
  exampleText: '1.6 mm 2-layer board, w = 3 mm, t = 0.035 mm, εr = 4.3 → ≈ 50 Ω.',
  visual: 'microstrip', concepts: ['ln'],
  modes: [mode({
    id: 'Z0', inputs: ['er', 'h', 'w', 't'], outputs: ['Z0'], equation: 'Z0 = 87 / √(εr + 1.41) × ln(5.98h / (0.8w + t))',
    check: (v) => (5.98 * v.h > 0.8 * v.w + v.t ? undefined : 'The trace is too wide for this formula (ln of a number below 1 gives a negative impedance). The approximation holds for w/h between 0.1 and 2.'),
    warn: (v) => (v.w / v.h < 0.1 || v.w / v.h > 2 ? [`w/h = ${N(v.w / v.h, 3)} is outside 0.1–2: treat the result as rough.`] : []),
    compute: (v) => ({ Z0: (87 / Math.sqrt(v.er + 1.41)) * Math.log((5.98 * v.h) / (0.8 * v.w + v.t)) }),
    steps: (v, o) => [`87 / √(εr + 1.41) = 87 / √${N(v.er + 1.41)} = ${N(87 / Math.sqrt(v.er + 1.41))}`, `5.98h / (0.8w + t) = ${N(5.98 * v.h)} / ${N(0.8 * v.w + v.t)} = ${N((5.98 * v.h) / (0.8 * v.w + v.t))}`, `ln(${N((5.98 * v.h) / (0.8 * v.w + v.t))}) = ${N(Math.log((5.98 * v.h) / (0.8 * v.w + v.t)))}`, `Z0 = ${N(87 / Math.sqrt(v.er + 1.41))} × ${N(Math.log((5.98 * v.h) / (0.8 * v.w + v.t)))} = ${S('resistance', o.Z0)}`],
    examples: [ex('§14 1.6 mm, w = 3 mm, t = 0.035 mm, εr = 4.3', { er: 4.3, h: 1.6e-3, w: 3e-3, t: 0.035e-3 }, { Z0: 49.8 }, 0.01)],
  })],
})

export const tpd = defineFormula({
  id: 'propagation-delay', section: 's14', title: 'Propagation delay (microstrip)', page: 14,
  equation: 'tpd = 85 × √(0.475 × εr + 0.67)',
  meaning: 'Signal travel time per inch of microstrip trace.',
  fields: [
    field('tpd', 'tpd', 'Delay', 'psPerInch', { description: 'delay, in picoseconds per inch' }),
    field('tmm', 'tpd (mm)', 'Delay per mm', 'ratio'),
    field('er', 'εr', 'Board permittivity', 'ratio', { sign: 'pos', min: 1, description: 'FR4 ≈ 4.3', presets: [{ label: 'FR4 4.3', value: 4.3 }] }),
  ],
  unitsNote: 'Result is ps/inch — divide by 25.4 for ps/mm.',
  exampleText: 'εr = 4.3 → ≈ 140 ps/inch ≈ 5.5 ps/mm.',
  visual: 'microstrip',
  modes: [mode({
    id: 'tpd', inputs: ['er'], outputs: ['tpd', 'tmm'], equation: 'tpd = 85 × √(0.475 × εr + 0.67)',
    compute: (v) => { const t = 85 * Math.sqrt(0.475 * v.er + 0.67); return { tpd: t, tmm: t / 25.4 } },
    steps: (v, o) => [`0.475 × εr + 0.67 = ${N(0.475 * v.er + 0.67)}`, `√ = ${N(Math.sqrt(0.475 * v.er + 0.67))}`, `tpd = 85 × ${N(Math.sqrt(0.475 * v.er + 0.67))} = ${N(o.tpd)} ps/inch = ${N(o.tmm)} ps/mm`],
    examples: [ex('§14 εr = 4.3', { er: 4.3 }, { tpd: 140, tmm: 5.5 }, 0.01)],
  })],
})

export const lcrit = defineFormula({
  id: 'critical-length', section: 's14', title: 'Critical trace length', page: 14,
  equation: 'Lcrit ≈ trise / (6 × tpd)',
  meaning: 'Trace length above which the trace must be treated as a transmission line (controlled impedance, termination).',
  fields: [
    field('Lcrit', 'Lcrit', 'Critical length', 'length'),
    field('trise', 'trise', 'Signal rise time', 'time', { sign: 'pos', description: 'signal rise time (datasheet)' }),
    field('tpd', 'tpd', 'Delay per inch', 'psPerInch', { sign: 'pos', description: 'propagation delay per unit length (ps/inch)' }),
  ],
  unitsNote: 'trise and tpd in the same time unit (ps); the length unit comes from tpd.',
  exampleText: '1 ns = 1000 ps rise, 140 ps/inch → 1000 / 840 ≈ 1.2 inch ≈ 30 mm.',
  visual: 'microstrip',
  modes: [mode({
    id: 'Lcrit', inputs: ['trise', 'tpd'], outputs: ['Lcrit'], equation: 'Lcrit ≈ trise / (6 × tpd)',
    compute: (v) => ({ Lcrit: ((v.trise * 1e12) / (6 * v.tpd)) * 0.0254 }),
    steps: (v, o) => [`trise = ${N(v.trise * 1e12)} ps`, `Lcrit = ${N(v.trise * 1e12)} / (6 × ${N(v.tpd)}) = ${N((v.trise * 1e12) / (6 * v.tpd))} inch`, `= ${S('length', o.Lcrit)}`],
    examples: [ex('§14 1 ns, 140 ps/inch', { trise: nano, tpd: 140 }, { Lcrit: 0.0302 }, 0.01)],
  })],
})

export const skin = defineFormula({
  id: 'skin-depth', section: 's14', title: 'Skin depth', page: 14,
  equation: 'δ = √(ρ / (π × f × µ))',
  meaning: 'Depth of the outer layer of a conductor that carries current at a given frequency.',
  fields: [
    field('delta', 'δ', 'Skin depth', 'length'),
    field('rho', 'ρ', 'Resistivity', 'resistivity', { sign: 'pos', presets: [{ label: 'Copper', value: COPPER }] }),
    field('f', 'f', 'Frequency', 'frequency', { sign: 'pos' }),
    field('mu', 'µ', 'Permeability', 'permeability', { sign: 'pos', description: '4π×10⁻⁷ H/m for copper', presets: [{ label: 'Copper 4π×10⁻⁷', value: 4 * Math.PI * 1e-7 }] }),
  ],
  unitsNote: 'f in Hz. Copper shortcut: δ (µm) ≈ 66 / √f (MHz).',
  exampleText: '1 MHz → 66 µm; 100 MHz → 6.6 µm (thinner than 1 oz copper).',
  visual: 'skin', concepts: ['sqrt'],
  modes: [mode({
    id: 'delta', inputs: ['rho', 'f', 'mu'], outputs: ['delta'], equation: 'δ = √(ρ / (π × f × µ))',
    compute: (v) => ({ delta: Math.sqrt(v.rho / (Math.PI * v.f * v.mu)) }),
    steps: (v, o) => [`π × f × µ = ${N(Math.PI * v.f * v.mu)}`, `ρ / that = ${N(v.rho / (Math.PI * v.f * v.mu))}`, `δ = √ = ${S('length', o.delta)}`],
    examples: [ex('§14 copper at 1 MHz', { rho: COPPER, f: 1e6, mu: 4 * Math.PI * 1e-7 }, { delta: 66e-6 }, 0.02)],
  })],
})

export const srf = defineFormula({
  id: 'cap-self-resonance', section: 's14', title: 'Capacitor self-resonance', page: 15,
  equation: 'fSRF = 1 / (2π√(ESL × C))',
  meaning: 'Frequency above which a capacitor acts as an inductor due to its package and trace inductance.',
  fields: [
    field('fsrf', 'fSRF', 'Self-resonant frequency', 'frequency'),
    field('ESL', 'ESL', 'Series inductance', 'inductance', { sign: 'pos', description: 'equivalent series inductance (≈ 0.5–1 nH for 0402/0603, more with long traces)' }),
    field('C', 'C', 'Capacitance', 'capacitance', { sign: 'pos' }),
  ],
  unitsNote: 'nH × 10⁻⁹, nF × 10⁻⁹.',
  exampleText: '100 nF with 1 nH → 1 / (6.283 × √(10⁻⁹ × 10⁻⁷)) ≈ 15.9 MHz.',
  visual: 'resonance',
  modes: [mode({
    id: 'fsrf', inputs: ['ESL', 'C'], outputs: ['fsrf'], equation: 'fSRF = 1 / (2π × √(ESL × C))',
    compute: (v) => ({ fsrf: 1 / (TWO_PI * Math.sqrt(v.ESL * v.C)) }),
    steps: (v, o) => [`ESL × C = ${N(v.ESL * v.C)}`, `√ = ${N(Math.sqrt(v.ESL * v.C))}`, `fSRF = 1 / (2π × ${N(Math.sqrt(v.ESL * v.C))}) = ${S('frequency', o.fsrf)}`],
    examples: [ex('§14 100 nF with 1 nH', { ESL: nano, C: 100 * nano }, { fsrf: 15.9e6 }, 0.002)],
  })],
})

/* ───────── 15. Batteries ───────── */

export const capacityAh = defineFormula({
  id: 'battery-capacity', section: 's15', title: 'Capacity', page: 15,
  equation: 'Ah = I × t',
  meaning: 'Charge a battery delivers: current multiplied by time in hours.',
  fields: [
    field('Ah', 'Ah', 'Capacity', 'capacityAh'),
    field('I', 'I', 'Current', 'current', { sign: 'pos' }),
    field('t', 't', 'Time', 'hours', { sign: 'pos', description: 'time, in hours (h)' }),
  ],
  unitsNote: 'Time here is in hours, not seconds. mAh ÷ 1000 = Ah (2500 mAh = 2.5 Ah).',
  visual: 'battery',
  modes: [mode({
    id: 'Ah', inputs: ['I', 't'], outputs: ['Ah'], equation: 'Ah = I × t',
    compute: (v) => ({ Ah: v.I * v.t }),
    steps: (v, o) => [`Ah = I × t = ${N(v.I)} A × ${N(v.t)} h`, `Ah = ${S('capacityAh', o.Ah)}`],
    examples: [ex('0.5 A for 5 h', { I: 0.5, t: 5 }, { Ah: 2.5 })],
  })],
})

export const cRate = defineFormula({
  id: 'c-rate', section: 's15', title: 'C-rate', page: 15,
  equation: 'C-rate = I / capacity',
  meaning: 'Charge or discharge current relative to battery capacity. 1C ≈ full discharge in 1 hour.',
  fields: [
    field('rate', 'C-rate', 'C-rate', 'ratio'),
    field('I', 'I', 'Current', 'current', { sign: 'pos' }),
    field('cap', 'capacity', 'Battery capacity', 'capacityAh', { sign: 'pos' }),
  ],
  unitsNote: 'Use matching units: A with Ah, or mA with mAh (the app converts for you).',
  exampleText: '1000 mA from a 2000 mAh cell = 0.5C.',
  visual: 'battery',
  modes: [mode({
    id: 'rate', inputs: ['I', 'cap'], outputs: ['rate'], equation: 'C-rate = I / capacity',
    compute: (v) => ({ rate: v.I / v.cap }),
    steps: (v, o) => [`C-rate = ${N(v.I)} A / ${N(v.cap)} Ah = ${N(o.rate)} C`, `Full discharge in about ${N(1 / o.rate)} h`],
    examples: [ex('§15 1000 mA from 2000 mAh', { I: 1, cap: 2 }, { rate: 0.5 })],
  })],
})

export const runtime = defineFormula({
  id: 'battery-runtime', section: 's15', title: 'Runtime estimate', page: 15,
  equation: 't ≈ capacity / Iload',
  meaning: 'Approximate runtime at constant load. Real runtime is typically 70–90% of this value.',
  fields: [
    field('t', 't', 'Runtime', 'hours'),
    field('cap', 'capacity', 'Battery capacity', 'capacityAh', { sign: 'pos' }),
    field('Iload', 'Iload', 'Load current', 'current', { sign: 'pos', description: 'average load current' }),
  ],
  unitsNote: 'mAh with mA, or Ah with A.',
  exampleText: '2000 mAh ÷ 80 mA = 25 h → expect ≈ 20 h.',
  visual: 'battery',
  modes: [mode({
    id: 't', inputs: ['cap', 'Iload'], outputs: ['t'], equation: 't ≈ capacity / Iload',
    compute: (v) => ({ t: v.cap / v.Iload }),
    warn: (_v, o) => [`Real runtime is typically 70–90% of this: about ${N(o.t * 0.7, 3)}–${N(o.t * 0.9, 3)} h.`],
    steps: (v, o) => [`t = ${N(v.cap)} Ah / ${N(v.Iload)} A = ${N(o.t)} h`, `Expect about ${N(o.t * 0.7, 3)}–${N(o.t * 0.9, 3)} h in practice.`],
    examples: [ex('§15 2000 mAh ÷ 80 mA', { cap: 2, Iload: 0.08 }, { t: 25 })],
  })],
})

export const energyWh = defineFormula({
  id: 'battery-energy', section: 's15', title: 'Energy stored', page: 15,
  equation: 'Wh = Ah × V',
  meaning: 'Total energy stored. Used to compare batteries of different voltages.',
  fields: [
    field('Wh', 'Wh', 'Energy', 'energyWh'),
    field('Ah', 'Ah', 'Capacity', 'capacityAh', { sign: 'pos' }),
    field('V', 'V', 'Nominal voltage', 'voltage', { sign: 'pos' }),
  ],
  unitsNote: 'Ah, not mAh (the app converts for you). 1 Wh = 3600 J.',
  exampleText: '3.7 V 2500 mAh = 2.5 × 3.7 = 9.25 Wh; 12 V 7 Ah = 84 Wh.',
  visual: 'battery',
  modes: [mode({
    id: 'Wh', inputs: ['Ah', 'V'], outputs: ['Wh'], equation: 'Wh = Ah × V',
    compute: (v) => ({ Wh: v.Ah * v.V }),
    steps: (v, o) => [`Wh = ${N(v.Ah)} Ah × ${N(v.V)} V = ${N(o.Wh)} Wh`, `(= ${N(o.Wh * 3600)} J)`],
    examples: [ex('§15 3.7 V 2500 mAh', { Ah: 2.5, V: 3.7 }, { Wh: 9.25 }), ex('§15 12 V 7 Ah', { Ah: 7, V: 12 }, { Wh: 84 })],
  })],
})

export const sag = defineFormula({
  id: 'voltage-sag', section: 's15', title: 'Voltage sag under load', page: 15,
  equation: 'Vterminal = Voc − I × Rint',
  meaning: 'Terminal voltage drop under load caused by internal resistance.',
  fields: [
    field('Vt', 'Vterminal', 'Terminal voltage', 'voltage'),
    field('Voc', 'Voc', 'Open-circuit voltage', 'voltage', { sign: 'pos', description: 'open-circuit (no-load) voltage' }),
    field('I', 'I', 'Load current', 'current', { sign: 'nonneg' }),
    field('Rint', 'Rint', 'Internal resistance', 'resistance', { sign: 'nonneg', description: 'quoted in milliohms: 50 mΩ = 0.05 Ω' }),
  ],
  unitsNote: 'Rint is quoted in milliohms: 50 mΩ = 0.05 Ω.',
  exampleText: '4.0 V cell, 50 mΩ, 2 A → 4.0 − 0.1 = 3.9 V.',
  visual: 'battery',
  modes: [mode({
    id: 'Vt', inputs: ['Voc', 'I', 'Rint'], outputs: ['Vt'], equation: 'Vterminal = Voc − I × Rint',
    compute: (v) => ({ Vt: v.Voc - v.I * v.Rint }),
    warn: (_v, o) => (o.Vt <= 0 ? ['The load current is more than this battery can deliver (terminal voltage ≤ 0).'] : []),
    steps: (v, o) => [`Sag = I × Rint = ${N(v.I)} A × ${N(v.Rint)} Ω = ${S('voltage', v.I * v.Rint)}`, `Vterminal = ${N(v.Voc)} − ${N(v.I * v.Rint)} = ${S('voltage', o.Vt)}`],
    examples: [ex('§15 4.0 V, 50 mΩ, 2 A', { Voc: 4, I: 2, Rint: 0.05 }, { Vt: 3.9 })],
  })],
})

export const soc = defineFormula({
  id: 'state-of-charge', section: 's15', title: 'State of charge', page: 15,
  equation: 'Read from a chemistry-specific curve',
  meaning: 'Estimated from resting (no-load) voltage using the chemistry\'s discharge curve. There is no single formula.',
  fields: [], unitsNote: 'Rough Li-ion values — 4.2 V ≈ full, 3.7 V ≈ half, 3.0 V ≈ empty (don\'t go lower).',
  visual: 'battery', tool: 'soc', modes: [],
  reference: { rows: [['4.2 V', '≈ full'], ['3.7 V', '≈ half'], ['3.0 V', '≈ empty (don\'t go lower)']] },
})

/* ───────── 16. RF & antennas ───────── */

export const quarterWave = defineFormula({
  id: 'quarter-wave', section: 's16', title: 'Quarter-wave antenna', page: 16,
  equation: 'L = c / (4 × f)',
  meaning: 'Length of a quarter-wave antenna (whip or ground-plane).',
  fields: [
    field('L', 'L', 'Antenna length', 'length'),
    field('Lp', 'L practical', 'Practical length', 'length', { description: 'cut about 5% shorter (end effect)' }),
    field('f', 'f', 'Frequency', 'frequency', { sign: 'pos' }),
  ],
  unitsNote: 'f in Hz → metres. Shortcut: L (cm) ≈ 7500 / f (MHz). Real antennas are cut about 5% shorter (end effect).',
  exampleText: '433 MHz → 17.3 cm.',
  visual: 'antenna',
  modes: [mode({
    id: 'L', inputs: ['f'], outputs: ['L', 'Lp'], equation: 'L = c / (4 × f)',
    compute: (v) => ({ L: C_LIGHT / (4 * v.f), Lp: 0.95 * C_LIGHT / (4 * v.f) }),
    steps: (v, o) => [`L = ${N(C_LIGHT)} / (4 × ${N(v.f)}) = ${S('length', o.L)}`, `Real antennas are cut ~5% shorter: ${S('length', o.Lp)}`],
    examples: [ex('§16 433 MHz', { f: 433e6 }, { L: 0.1732, Lp: 0.1645 }, 0.002)],
  })],
})

export const halfWave = defineFormula({
  id: 'half-wave-dipole', section: 's16', title: 'Half-wave dipole', page: 16,
  equation: 'L = c / (2 × f)',
  meaning: 'Total length of a half-wave dipole; each arm is a quarter wave.',
  fields: [
    field('L', 'L', 'Total dipole length', 'length'),
    field('arm', 'arm', 'Length per arm', 'length'),
    field('Lp', 'L practical', 'Practical total length', 'length', { description: 'practical ≈ 143 / f (MHz)' }),
    field('f', 'f', 'Frequency', 'frequency', { sign: 'pos' }),
  ],
  unitsNote: 'Shortcut: L (m) ≈ 150 / f (MHz), practical ≈ 143 / f (MHz).',
  exampleText: '100 MHz → about 1.43 m total, 0.71 m per arm.',
  visual: 'antenna',
  modes: [mode({
    id: 'L', inputs: ['f'], outputs: ['L', 'arm', 'Lp'], equation: 'L = c / (2 × f)',
    compute: (v) => ({ L: C_LIGHT / (2 * v.f), arm: C_LIGHT / (4 * v.f), Lp: 143 / (v.f / 1e6) }),
    steps: (v, o) => [`L = ${N(C_LIGHT)} / (2 × ${N(v.f)}) = ${S('length', o.L)}`, `Each arm = L / 2 = ${S('length', o.arm)}`, `Practical: 143 / ${N(v.f / 1e6)} MHz = ${S('length', o.Lp)}`],
    examples: [ex('§16 100 MHz', { f: 100e6 }, { L: 1.5, arm: 0.75, Lp: 1.43 }, 0.001)],
  })],
})

export const fspl = defineFormula({
  id: 'fspl', section: 's16', title: 'Free-space path loss', page: 16,
  equation: 'FSPL = 20·log₁₀(d) + 20·log₁₀(f) + 32.44',
  meaning: 'Signal loss over a distance in free space, without obstacles.',
  fields: [
    field('FSPL', 'FSPL', 'Path loss', 'dB'),
    field('d', 'd', 'Distance', 'length', { sign: 'pos', description: 'distance (the formula uses km — converted for you)' }),
    field('f', 'f', 'Frequency', 'frequency', { sign: 'pos', description: 'frequency (the formula uses MHz — converted for you)' }),
  ],
  unitsNote: 'The constant 32.44 only works with km and MHz (the app converts). With d in metres use −27.55 instead.',
  exampleText: '1 km at 433 MHz → 0 + 52.7 + 32.4 ≈ 85 dB.',
  visual: 'fspl', concepts: ['log10', 'db'],
  modes: [mode({
    id: 'FSPL', inputs: ['d', 'f'], outputs: ['FSPL'], equation: 'FSPL = 20·log₁₀(d km) + 20·log₁₀(f MHz) + 32.44',
    compute: (v) => ({ FSPL: 20 * Math.log10(v.d / 1000) + 20 * Math.log10(v.f / 1e6) + 32.44 }),
    steps: (v, o) => [`d = ${N(v.d / 1000)} km → 20·log₁₀ = ${N(20 * Math.log10(v.d / 1000))} dB`, `f = ${N(v.f / 1e6)} MHz → 20·log₁₀ = ${N(20 * Math.log10(v.f / 1e6))} dB`, `+ 32.44 → FSPL = ${N(o.FSPL)} dB`],
    examples: [ex('§16 1 km at 433 MHz', { d: 1000, f: 433e6 }, { FSPL: 85.17 }, 0.002)],
  })],
})

export const gamma = defineFormula({
  id: 'reflection-coefficient', section: 's16', title: 'Reflection coefficient', page: 16,
  equation: 'Γ = (ZL − Z0) / (ZL + Z0)',
  meaning: 'Fraction of the signal reflected at an impedance mismatch. 0 = matched, 1 = full reflection.',
  analogy: 'Light hitting glass: if the two media match nothing bounces back; the bigger the mismatch, the more reflects.',
  fields: [
    field('G', 'Γ', 'Reflection coefficient', 'ratio', { description: 'gamma, 0–1 (size)' }),
    field('ZL', 'ZL', 'Load impedance', 'resistance', { sign: 'pos', description: 'load impedance (antenna)' }),
    field('Z0', 'Z0', 'Line impedance', 'resistance', { sign: 'pos', description: 'line impedance (coax, usually 50 Ω)', presets: [{ label: '50 Ω', value: 50 }, { label: '75 Ω', value: 75 }] }),
  ],
  unitsNote: 'Both in ohms.',
  exampleText: '75 Ω antenna on 50 Ω coax → (75 − 50) / (75 + 50) = 0.2.',
  visual: 'swr',
  modes: [mode({
    id: 'G', inputs: ['ZL', 'Z0'], outputs: ['G'], equation: 'Γ = (ZL − Z0) / (ZL + Z0)',
    compute: (v) => ({ G: (v.ZL - v.Z0) / (v.ZL + v.Z0) }),
    steps: (v, o) => [`ZL − Z0 = ${N(v.ZL - v.Z0)} Ω;  ZL + Z0 = ${N(v.ZL + v.Z0)} Ω`, `Γ = ${N(v.ZL - v.Z0)} / ${N(v.ZL + v.Z0)} = ${N(o.G)}`],
    examples: [ex('§16 75 Ω on 50 Ω', { ZL: 75, Z0: 50 }, { G: 0.2 })],
  })],
})

export const vswr = defineFormula({
  id: 'vswr', section: 's16', title: 'VSWR', page: 16,
  equation: 'VSWR = (1 + |Γ|) / (1 − |Γ|)',
  meaning: 'Standing wave ratio. 1:1 = perfect match; below 2:1 is usually acceptable.',
  fields: [
    field('S', 'VSWR', 'VSWR', 'ratio', { description: 'written as X:1' }),
    field('G', '|Γ|', 'Reflection magnitude', 'ratio', { sign: 'nonneg', max: 0.999999, description: 'size of the reflection coefficient' }),
  ],
  unitsNote: 'No units.',
  exampleText: 'Γ = 0.2 → 1.2 / 0.8 = 1.5:1.',
  visual: 'swr',
  modes: [mode({
    id: 'S', inputs: ['G'], outputs: ['S'], equation: 'VSWR = (1 + |Γ|) / (1 − |Γ|)',
    compute: (v) => ({ S: (1 + v.G) / (1 - v.G) }),
    warn: (_v, o) => [o.S < 2 ? 'Below 2:1 — usually acceptable.' : 'Above 2:1 — a noticeable mismatch.'],
    steps: (v, o) => [`(1 + |Γ|) / (1 − |Γ|) = ${N(1 + v.G)} / ${N(1 - v.G)}`, `VSWR = ${N(o.S)}:1`],
    examples: [ex('§16 Γ = 0.2', { G: 0.2 }, { S: 1.5 })],
  })],
})

export const returnLoss = defineFormula({
  id: 'return-loss', section: 's16', title: 'Return loss', page: 16,
  equation: 'RL = −20 × log₁₀|Γ|',
  meaning: 'Reflected power expressed in dB. Higher = better match.',
  fields: [
    field('RL', 'RL', 'Return loss', 'dB'),
    field('G', '|Γ|', 'Reflection magnitude', 'ratio', { sign: 'pos', max: 1 }),
  ],
  unitsNote: 'Reflection of 1 (total) gives 0 dB.',
  exampleText: 'Γ = 0.2 → −20 × log₁₀(0.2) = 14 dB.',
  visual: 'swr', concepts: ['log10', 'db'],
  modes: [mode({
    id: 'RL', inputs: ['G'], outputs: ['RL'], equation: 'RL = −20 × log₁₀|Γ|',
    compute: (v) => ({ RL: -20 * Math.log10(v.G) }),
    steps: (v, o) => [`log₁₀(${N(v.G)}) = ${N(Math.log10(v.G))}`, `RL = −20 × ${N(Math.log10(v.G))} = ${N(o.RL)} dB`],
    examples: [ex('§16 Γ = 0.2', { G: 0.2 }, { RL: 13.98 }, 0.001)],
  })],
})

export const dbm = defineFormula({
  id: 'dbm', section: 's16', title: 'dBm ↔ milliwatts', page: 16,
  equation: 'P = 10^(dBm/10)   ·   dBm = 10 × log₁₀(P)',
  meaning: 'Conversion between dBm (power relative to 1 mW) and milliwatts.',
  fields: [
    field('P', 'P', 'Power', 'power', { sign: 'pos', description: 'power (type in mW, W …)' }),
    field('dBm', 'dBm', 'Power in dBm', 'dBm'),
  ],
  unitsNote: 'Examples: 0 dBm = 1 mW, 10 dBm = 10 mW, 20 dBm = 100 mW, 30 dBm = 1 W, −100 dBm = 0.1 pW.',
  visual: 'db', concepts: ['log10', 'db'],
  modes: [
    mode({
      id: 'P', label: 'dBm → power', inputs: ['dBm'], outputs: ['P'], equation: 'P(mW) = 10^(dBm / 10)',
      compute: (v) => ({ P: 10 ** (v.dBm / 10) * milli }),
      steps: (v, o) => [`dBm / 10 = ${N(v.dBm / 10)}`, `P = 10^${N(v.dBm / 10)} mW = ${N(10 ** (v.dBm / 10))} mW`, `= ${S('power', o.P)}`],
      examples: [ex('§16 20 dBm', { dBm: 20 }, { P: 0.1 }), ex('§16 30 dBm', { dBm: 30 }, { P: 1 }), ex('§16 0 dBm', { dBm: 0 }, { P: 0.001 })],
    }),
    mode({
      id: 'dBm', label: 'Power → dBm', inputs: ['P'], outputs: ['dBm'], equation: 'dBm = 10 × log₁₀(P in mW)',
      compute: (v) => ({ dBm: 10 * Math.log10(v.P / milli) }),
      steps: (v, o) => [`P in mW = ${N(v.P / milli)}`, `log₁₀ = ${N(Math.log10(v.P / milli))}`, `dBm = 10 × ${N(Math.log10(v.P / milli))} = ${N(o.dBm)} dBm`],
      examples: [ex('§16 1 W', { P: 1 }, { dBm: 30 }), ex('§16 10 mW', { P: 0.01 }, { dBm: 10 })],
    }),
  ],
})

export const farField = defineFormula({
  id: 'far-field', section: 's16', title: 'Far-field distance', page: 17,
  equation: 'r ≈ 2D² / λ',
  meaning: 'Distance beyond which an antenna is in the far field, where standard radiation formulas apply.',
  fields: [
    field('r', 'r', 'Far-field distance', 'length'),
    field('D', 'D', 'Largest antenna dimension', 'length', { sign: 'pos' }),
    field('lambda', 'λ', 'Wavelength', 'length', { sign: 'pos' }),
  ],
  unitsNote: 'D and λ in the same unit; r comes out in that unit.',
  exampleText: 'D = 1 m, λ = 0.3 m (1 GHz) → 2 × 1 / 0.3 ≈ 6.7 m.',
  visual: 'antenna',
  modes: [mode({
    id: 'r', inputs: ['D', 'lambda'], outputs: ['r'], equation: 'r ≈ 2D² / λ',
    compute: (v) => ({ r: (2 * v.D ** 2) / v.lambda }),
    steps: (v, o) => [`D² = ${N(v.D ** 2)}`, `r = 2 × ${N(v.D ** 2)} / ${N(v.lambda)} = ${S('length', o.r)}`],
    examples: [ex('§16 D = 1 m, λ = 0.3 m', { D: 1, lambda: 0.3 }, { r: 6.667 }, 0.001)],
  })],
})

export const s14 = [ipc2221, traceR, microstrip, tpd, lcrit, skin, srf]
export const s15 = [capacityAh, cRate, runtime, energyWh, sag, soc]
export const s16 = [quarterWave, halfWave, fspl, gamma, vswr, returnLoss, dbm, farField]
