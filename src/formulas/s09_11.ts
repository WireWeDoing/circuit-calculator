import { defineFormula, ex, field, mode } from '../core/define.ts'
import { N, S } from '../core/fmt.ts'
import { micro, milli } from '../core/units.ts'

const C_LIGHT = 3e8
const DEG = 180 / Math.PI

/* ───────── 9. AC & impedance ───────── */

export const zComplex = defineFormula({
  id: 'impedance-complex', section: 's9', title: 'Impedance (complex)', page: 9,
  equation: 'Z = R + jX,   X = XL − XC',
  meaning: 'Total opposition to AC: resistance plus reactance.',
  analogy: 'Resistance and reactance are at right angles (like east and north); the "j" just marks the north axis.',
  fields: [
    field('R', 'R', 'Resistance', 'resistance', { sign: 'nonneg', description: 'resistive part, in ohms' }),
    field('XL', 'XL', 'Inductive reactance', 'resistance', { sign: 'nonneg' }),
    field('XC', 'XC', 'Capacitive reactance', 'resistance', { sign: 'nonneg' }),
    field('X', 'X', 'Net reactance', 'resistance', { description: 'XL − XC (positive = inductive, negative = capacitive)' }),
  ],
  unitsNote: 'All parts in ohms — calculate XL and XC first with f in Hz, L in H, C in F.',
  visual: 'impedance', concepts: ['j'],
  modes: [mode({
    id: 'X', label: 'Find Z = R + jX', inputs: ['R', 'XL', 'XC'], outputs: ['X'], equation: 'X = XL − XC;  Z = R + jX',
    compute: (v) => ({ X: v.XL - v.XC }),
    steps: (v, o) => [`X = XL − XC = ${S('resistance', v.XL)} − ${S('resistance', v.XC)} = ${S('resistance', o.X)}`, `Z = ${N(v.R)} ${o.X < 0 ? '−' : '+'} j${N(Math.abs(o.X))} Ω`, o.X > 0 ? 'X is positive → inductive: current lags voltage.' : o.X < 0 ? 'X is negative → capacitive: current leads voltage.' : 'X = 0 → purely resistive (resonance).'],
    examples: [ex('XL 150 Ω − XC 50 Ω', { R: 100, XL: 150, XC: 50 }, { X: 100 })],
  })],
})

export const zMag = defineFormula({
  id: 'impedance-magnitude', section: 's9', title: 'Impedance magnitude', page: 9,
  equation: '|Z| = √(R² + X²)',
  meaning: 'Single-value size of the impedance. Use it in Ohm\'s law for AC: I = V / |Z|.',
  fields: [
    field('Z', '|Z|', 'Impedance magnitude', 'resistance'),
    field('R', 'R', 'Resistance', 'resistance', { sign: 'nonneg' }),
    field('X', 'X', 'Net reactance', 'resistance'),
  ],
  unitsNote: 'R and X in the same unit.',
  exampleText: 'R = 100 Ω, X = 100 Ω → √(10 000 + 10 000) ≈ 141 Ω. Then I = V / |Z| works like Ohm\'s law.',
  visual: 'impedance', concepts: ['sqrt'],
  modes: [mode({
    id: 'Z', inputs: ['R', 'X'], outputs: ['Z'], equation: '|Z| = √(R² + X²)',
    compute: (v) => ({ Z: Math.hypot(v.R, v.X) }),
    steps: (v, o) => [`R² + X² = ${N(v.R ** 2)} + ${N(v.X ** 2)} = ${N(v.R ** 2 + v.X ** 2)}`, `|Z| = √${N(v.R ** 2 + v.X ** 2)} = ${S('resistance', o.Z)}`],
    examples: [ex('§9 R = X = 100 Ω', { R: 100, X: 100 }, { Z: 141.42 }, 0.001)],
  })],
})

export const phase = defineFormula({
  id: 'phase-angle', section: 's9', title: 'Phase angle', page: 9,
  equation: 'θ = arctan(X / R)',
  meaning: 'Time shift between voltage and current. Positive: current lags (inductive). Negative: current leads (capacitive).',
  fields: [
    field('theta', 'θ', 'Phase angle', 'angle', { description: 'in degrees (or radians: 180° = π rad)' }),
    field('X', 'X', 'Net reactance', 'resistance'),
    field('R', 'R', 'Resistance', 'resistance', { sign: 'pos' }),
  ],
  unitsNote: 'Set your calculator to DEG mode for degrees (180° = π rad).',
  exampleText: 'X = R → arctan(1) = 45°.',
  visual: 'impedance', concepts: ['arctan'],
  modes: [mode({
    id: 'theta', inputs: ['X', 'R'], outputs: ['theta'], equation: 'θ = arctan(X / R)',
    compute: (v) => ({ theta: Math.atan(v.X / v.R) * DEG }),
    steps: (v, o) => [`X / R = ${N(v.X)} / ${N(v.R)} = ${N(v.X / v.R)}`, `θ = arctan(${N(v.X / v.R)}) = ${N(o.theta)}° (${N((o.theta / DEG))} rad)`, o.theta > 0 ? 'Positive: inductive — current lags voltage.' : o.theta < 0 ? 'Negative: capacitive — current leads voltage.' : 'Zero: in phase.'],
    examples: [ex('§9 X = R', { X: 100, R: 100 }, { theta: 45 })],
  })],
})

const sine = (id: string, title: string, equation: string, from: [string, string], to: [string, string], fn: (x: number) => number, example: [number, number], meaning: string, unitsNote: string, steps: (x: number, y: number) => string[], page: number) =>
  defineFormula({
    id, section: 's9', title, equation, meaning, unitsNote, page,
    fields: [
      field(from[0], from[1], from[1], 'voltage', { sign: 'nonneg' }),
      field(to[0], to[1], to[1], 'voltage', { sign: 'nonneg' }),
    ],
    visual: 'sine', concepts: ['rms'],
    modes: [mode({
      id: to[0], inputs: [from[0]], outputs: [to[0]], equation,
      compute: (v) => ({ [to[0]]: fn(v[from[0]]!) }),
      steps: (v, o) => steps(v[from[0]]!, o[to[0]]!),
      examples: [ex(`§9 ${example[0]} → ${example[1]}`, { [from[0]]: example[0] }, { [to[0]]: example[1] }, 0.002)],
    })],
  })

export const vrms = sine('vrms-from-peak', 'RMS from peak', 'Vrms = Vpeak / √2', ['Vpeak', 'Vpeak'], ['Vrms', 'Vrms'], (x) => x / Math.SQRT2, [10, 7.071],
  'RMS is the DC-equivalent value of an AC voltage. Multimeters (AC mode) and mains ratings show RMS.', 'Valid only for pure sine waves — square or distorted waves have different ratios.',
  (x, y) => [`Vrms = Vpeak / √2 = ${N(x)} / ${N(Math.SQRT2)}`, `Vrms = ${S('voltage', y)}`], 9)
export const vpeak = sine('vpeak-from-rms', 'Peak from RMS', 'Vpeak = Vrms × √2', ['Vrms', 'Vrms'], ['Vpeak', 'Vpeak'], (x) => x * Math.SQRT2, [230, 325.27],
  "Peak value of a sine wave from its RMS value. A rectifier's smoothing capacitor charges to this value.", 'Same unit in and out. 12 V AC transformer → ≈ 17 V peak.',
  (x, y) => [`Vpeak = Vrms × √2 = ${N(x)} × ${N(Math.SQRT2)}`, `Vpeak = ${S('voltage', y)}`], 9)
export const vpp = sine('vpp', 'Peak-to-peak', 'Vpp = 2 × Vpeak', ['Vpeak', 'Vpeak'], ['Vpp', 'Vpp'], (x) => 2 * x, [325, 650],
  'Voltage from the lowest to the highest point of the waveform, as read on an oscilloscope.', "Don't confuse Vpp, Vpeak and Vrms when reading specs.",
  (x, y) => [`Vpp = 2 × Vpeak = 2 × ${N(x)}`, `Vpp = ${S('voltage', y)}`], 10)
export const vavg = sine('rectified-average', 'Rectified average', 'Vavg = 0.637 × Vpeak', ['Vpeak', 'Vpeak'], ['Vavg', 'Vavg'], (x) => (2 / Math.PI) * x, [17, 10.83],
  'Average value of a full-wave rectified sine wave before smoothing (0.637 = 2/π).', 'Subtract diode drops (≈ 1.4 V for a bridge) from Vpeak first for a real circuit.',
  (x, y) => [`Vavg = (2/π) × Vpeak = 0.637 × ${N(x)}`, `Vavg = ${S('voltage', y)}`], 10)

/* ───────── 10. 555 timer ───────── */

const f555 = [
  field('R1', 'R1', 'Resistor R1', 'resistance', { sign: 'pos', description: 'resistor between VCC and pin 7 (discharge)' }),
  field('R2', 'R2', 'Resistor R2', 'resistance', { sign: 'pos', description: 'resistor between pin 7 and pins 2/6' }),
  field('C', 'C', 'Timing capacitor', 'capacitance', { sign: 'pos', description: 'from pins 2/6 to ground' }),
]

export const astableF = defineFormula({
  id: '555-astable-frequency', section: 's10', title: 'Astable frequency', page: 10,
  equation: 'f = 1.44 / ((R1 + 2 × R2) × C)',
  meaning: 'Output frequency of a 555 in astable (free-running) mode.',
  fields: [field('f', 'f', 'Output frequency', 'frequency'), ...f555],
  unitsNote: 'R in Ω and C in F give Hz. Shortcut: kΩ and µF give kHz.',
  exampleText: 'R1 = 1 kΩ, R2 = 10 kΩ, C = 10 µF → (1000 + 20 000) × 0.000 01 = 0.21 → f = 1.44 / 0.21 ≈ 6.9 Hz.',
  visual: '555',
  modes: [
    mode({
      id: 'f', inputs: ['R1', 'R2', 'C'], outputs: ['f'], equation: 'f = 1.44 / ((R1 + 2×R2) × C)',
      compute: (v) => ({ f: 1.44 / ((v.R1 + 2 * v.R2) * v.C) }),
      steps: (v, o) => [`R1 + 2×R2 = ${N(v.R1)} + ${N(2 * v.R2)} = ${N(v.R1 + 2 * v.R2)} Ω`, `× C = ${N(v.R1 + 2 * v.R2)} × ${N(v.C)} = ${N((v.R1 + 2 * v.R2) * v.C)} s`, `f = 1.44 / ${N((v.R1 + 2 * v.R2) * v.C)} = ${S('frequency', o.f)}`],
      examples: [ex('§10 1 kΩ, 10 kΩ, 10 µF', { R1: 1000, R2: 10000, C: 10 * micro }, { f: 6.857 }, 0.001)],
    }),
    mode({
      id: 'R2', label: 'Find R2 (design)', inputs: ['f', 'R1', 'C'], outputs: ['R2'], equation: 'R2 = (1.44 / (f × C) − R1) / 2',
      check: (v) => (1.44 / (v.f * v.C) > v.R1 ? undefined : 'R1 is too large for this frequency and capacitor — R2 would be negative. Lower R1 or C, or the frequency.'),
      compute: (v) => ({ R2: (1.44 / (v.f * v.C) - v.R1) / 2 }),
      steps: (v, o) => [`1.44 / (f × C) = 1.44 / (${N(v.f)} × ${N(v.C)}) = ${S('resistance', 1.44 / (v.f * v.C))}`, `Subtract R1: ${S('resistance', 1.44 / (v.f * v.C))} − ${S('resistance', v.R1)}`, `R2 = half of that = ${S('resistance', o.R2)}`],
      examples: [ex('§17 P10 1 kHz, C = 10 nF, R1 = 1 kΩ', { f: 1000, C: 10e-9, R1: 1000 }, { R2: 71500 }, 0.001)],
    }),
  ],
})

export const astableD = defineFormula({
  id: '555-astable-duty', section: 's10', title: 'Astable duty cycle', page: 10,
  equation: 'D = (R1 + R2) / (R1 + 2 × R2)',
  meaning: 'Fraction of each cycle that the output is high. Always above 50% in this basic circuit.',
  fields: [field('D', 'D', 'Duty cycle', 'fraction', { description: 'as a fraction (× 100 for %)' }), f555[0]!, f555[1]!],
  unitsNote: 'R1 and R2 only need the same unit.',
  exampleText: '1 kΩ and 10 kΩ → 11 / 21 = 0.52 = 52%.',
  visual: '555',
  modes: [mode({
    id: 'D', inputs: ['R1', 'R2'], outputs: ['D'], equation: 'D = (R1 + R2) / (R1 + 2×R2)',
    compute: (v) => ({ D: (v.R1 + v.R2) / (v.R1 + 2 * v.R2) }),
    steps: (v, o) => [`D = (R1 + R2) / (R1 + 2×R2) = ${N(v.R1 + v.R2)} / ${N(v.R1 + 2 * v.R2)}`, `D = ${N(o.D)} = ${N(o.D * 100, 3)}%`],
    examples: [ex('§10 1 kΩ, 10 kΩ', { R1: 1000, R2: 10000 }, { D: 11 / 21 })],
  })],
})

export const monostable = defineFormula({
  id: '555-monostable', section: 's10', title: 'Monostable pulse width', page: 10,
  equation: 't = 1.1 × R × C',
  meaning: 'Length of the single output pulse in monostable (one-shot) mode.',
  fields: [
    field('t', 't', 'Pulse length', 'time'),
    field('R', 'R', 'Timing resistor', 'resistance', { sign: 'pos' }),
    field('C', 'C', 'Timing capacitor', 'capacitance', { sign: 'pos' }),
  ],
  unitsNote: 'Ω × F = s. Shortcut: kΩ × µF gives ms.',
  exampleText: '100 kΩ and 10 µF → 1.1 × 100 000 × 0.000 01 = 1.1 s.',
  visual: '555',
  modes: [
    mode({
      id: 't', inputs: ['R', 'C'], outputs: ['t'], equation: 't = 1.1 × R × C',
      compute: (v) => ({ t: 1.1 * v.R * v.C }),
      steps: (v, o) => [`t = 1.1 × ${N(v.R)} Ω × ${N(v.C)} F`, `t = ${S('time', o.t)}`],
      examples: [ex('§10 100 kΩ, 10 µF', { R: 100000, C: 10 * micro }, { t: 1.1 })],
    }),
    mode({
      id: 'R', label: 'Find R (design)', inputs: ['t', 'C'], outputs: ['R'], equation: 'R = t / (1.1 × C)',
      compute: (v) => ({ R: v.t / (1.1 * v.C) }),
      steps: (v, o) => [`R = t / (1.1 × C) = ${N(v.t)} / (1.1 × ${N(v.C)})`, `R = ${S('resistance', o.R)}`],
      examples: [ex('§17 P10 5 s one-shot, C = 100 µF', { t: 5, C: 100 * micro }, { R: 45450 }, 0.001)],
    }),
  ],
})

/* ───────── 11. dB, wavelength, period ───────── */

export const dbPower = defineFormula({
  id: 'db-power', section: 's11', title: 'dB — power ratio', page: 10,
  equation: 'dB = 10 × log₁₀(P2 / P1)',
  meaning: 'Power ratio in decibels. +3 dB ≈ 2×, +10 dB = 10×, −3 dB = ½.',
  fields: [
    field('dB', 'dB', 'Gain / loss', 'dB'),
    field('P1', 'P1', 'Reference power', 'power', { sign: 'pos', description: 'the reference power (input)' }),
    field('P2', 'P2', 'Measured power', 'power', { sign: 'pos', description: 'the power you are measuring (output)' }),
  ],
  unitsNote: 'P1 and P2 must be in the same unit (both W or both mW).',
  exampleText: '1 W in, 10 W out → 10 × log₁₀(10) = +10 dB.',
  visual: 'db', concepts: ['log10', 'db'],
  modes: [mode({
    id: 'dB', inputs: ['P1', 'P2'], outputs: ['dB'], equation: 'dB = 10 × log₁₀(P2 / P1)',
    compute: (v) => ({ dB: 10 * Math.log10(v.P2 / v.P1) }),
    steps: (v, o) => [`Ratio P2 / P1 = ${N(v.P2 / v.P1)}`, `log₁₀(${N(v.P2 / v.P1)}) = ${N(Math.log10(v.P2 / v.P1))}`, `dB = 10 × ${N(Math.log10(v.P2 / v.P1))} = ${N(o.dB)} dB`],
    examples: [ex('§11 1 W → 10 W', { P1: 1, P2: 10 }, { dB: 10 })],
  })],
})

export const dbVoltage = defineFormula({
  id: 'db-voltage', section: 's11', title: 'dB — voltage / current ratio', page: 11,
  equation: 'dB = 20 × log₁₀(V2 / V1)',
  meaning: 'Voltage or current ratio in decibels (same impedance). +6 dB ≈ 2×, +20 dB = 10×.',
  fields: [
    field('dB', 'dB', 'Gain / loss', 'dB'),
    field('V1', 'V1', 'Reference voltage', 'voltage', { sign: 'pos', description: 'reference voltage (input)' }),
    field('V2', 'V2', 'Measured voltage', 'voltage', { sign: 'pos', description: 'measured voltage (output)' }),
  ],
  unitsNote: 'Same unit for both (both V or both mV).',
  exampleText: '10 mV in, 1 V out → 1000 mV / 10 mV = 100 → 20 × 2 = +40 dB.',
  visual: 'db', concepts: ['log10', 'db'],
  modes: [mode({
    id: 'dB', inputs: ['V1', 'V2'], outputs: ['dB'], equation: 'dB = 20 × log₁₀(V2 / V1)',
    compute: (v) => ({ dB: 20 * Math.log10(v.V2 / v.V1) }),
    steps: (v, o) => [`Ratio V2 / V1 = ${N(v.V2 / v.V1)}`, `log₁₀(${N(v.V2 / v.V1)}) = ${N(Math.log10(v.V2 / v.V1))}`, `dB = 20 × ${N(Math.log10(v.V2 / v.V1))} = ${N(o.dB)} dB`],
    examples: [ex('§11 10 mV → 1 V', { V1: 10 * milli, V2: 1 }, { dB: 40 })],
  })],
})

export const wavelength = defineFormula({
  id: 'wavelength', section: 's11', title: 'Wavelength', page: 11,
  equation: 'λ = c / f',
  meaning: 'Physical length of one wave cycle at a given frequency. Used to size antennas.',
  fields: [
    field('lambda', 'λ', 'Wavelength', 'length', { description: 'wavelength, in metres (m)' }),
    field('f', 'f', 'Frequency', 'frequency', { sign: 'pos' }),
  ],
  unitsNote: 'f in Hz for metres. c = 3 × 10⁸ m/s. Shortcut: λ (m) = 300 / f (MHz).',
  exampleText: '100 MHz → 3 m; 433 MHz → 0.69 m.',
  visual: 'wavelength',
  modes: [mode({
    id: 'lambda', inputs: ['f'], outputs: ['lambda'], equation: 'λ = c / f',
    compute: (v) => ({ lambda: C_LIGHT / v.f }),
    steps: (v, o) => [`λ = c / f = ${N(C_LIGHT)} m/s / ${N(v.f)} Hz`, `λ = ${S('length', o.lambda)}`],
    examples: [ex('§11 100 MHz', { f: 100e6 }, { lambda: 3 }), ex('§11 433 MHz', { f: 433e6 }, { lambda: 0.693 }, 0.002)],
  })],
})

export const freqPeriod = defineFormula({
  id: 'frequency-period', section: 's11', title: 'Frequency and period', page: 11,
  equation: 'f = 1 / T   ·   T = 1 / f',
  meaning: 'Frequency and period are reciprocals of each other.',
  fields: [
    field('f', 'f', 'Frequency', 'frequency', { sign: 'pos' }),
    field('T', 'T', 'Period', 'time', { sign: 'pos', description: 'period, in seconds' }),
  ],
  unitsNote: 'Seconds ↔ Hz, milliseconds ↔ kHz, microseconds ↔ MHz.',
  exampleText: 'T = 20 ms → f = 1/0.02 = 50 Hz (mains).',
  visual: 'period',
  modes: [
    mode({
      id: 'f', inputs: ['T'], outputs: ['f'], equation: 'f = 1 / T',
      compute: (v) => ({ f: 1 / v.T }),
      steps: (v, o) => [`f = 1 / T = 1 / ${N(v.T)} s`, `f = ${S('frequency', o.f)}`],
      examples: [ex('§11 T = 20 ms', { T: 20 * milli }, { f: 50 })],
    }),
    mode({
      id: 'T', inputs: ['f'], outputs: ['T'], equation: 'T = 1 / f',
      compute: (v) => ({ T: 1 / v.f }),
      steps: (v, o) => [`T = 1 / f = 1 / ${N(v.f)} Hz`, `T = ${S('time', o.T)}`],
      examples: [ex('§11 50 Hz', { f: 50 }, { T: 0.02 })],
    }),
  ],
})

export const s09 = [zComplex, zMag, phase, vrms, vpeak, vpp, vavg]
export const s10 = [astableF, astableD, monostable]
export const s11 = [dbPower, dbVoltage, wavelength, freqPeriod]
