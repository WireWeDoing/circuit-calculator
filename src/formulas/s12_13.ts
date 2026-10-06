import { defineFormula, ex, field, mode, sum } from '../core/define.ts'
import { e12Up } from '../core/e12.ts'
import { N, S } from '../core/fmt.ts'
import { nano, pico } from '../core/units.ts'

const COPPER = 1.68e-8
const ALU = 2.65e-8
const rhoPresets = [{ label: 'Copper', value: COPPER }, { label: 'Aluminium', value: ALU }]

/* ───────── 12. Wires, circuits & general laws ───────── */

export const wireR = defineFormula({
  id: 'wire-resistance', section: 's12', title: 'Wire resistance', page: 11,
  equation: 'R = ρ × L / A',
  meaning: 'Resistance of a conductor from its material, length and cross-section.',
  analogy: 'A hose: longer hose = more resistance; fatter hose (bigger area) = less.',
  fields: [
    field('R', 'R', 'Resistance', 'resistance'),
    field('rho', 'ρ', 'Resistivity', 'resistivity', { sign: 'pos', description: 'rho, resistivity: copper 1.68×10⁻⁸ Ω·m, aluminium 2.65×10⁻⁸ Ω·m', presets: rhoPresets }),
    field('L', 'L', 'Length', 'length', { sign: 'pos', description: 'length of the conductor, in metres' }),
    field('A', 'A', 'Cross-section', 'area', { sign: 'pos', description: 'cross-sectional area (type in mm² — it is converted to m² for you)' }),
  ],
  unitsNote: 'Convert mm² → m² by × 10⁻⁶ (1.5 mm² = 1.5×10⁻⁶ m²). Easier: use ρ = 0.0168 Ω·mm²/m for copper, then L in m and A in mm² directly.',
  exampleText: '20 m of 1.5 mm² copper → 0.0168 × 20 / 1.5 = 0.224 Ω.',
  visual: 'wire',
  modes: [mode({
    id: 'R', inputs: ['rho', 'L', 'A'], outputs: ['R'], equation: 'R = ρ × L / A',
    compute: (v) => ({ R: (v.rho * v.L) / v.A }),
    steps: (v, o) => [`Area in m²: ${N(v.A)} m²`, `R = ρ × L / A = ${N(v.rho)} × ${N(v.L)} / ${N(v.A)}`, `R = ${S('resistance', o.R)}`],
    examples: [ex('§12 20 m of 1.5 mm² copper', { rho: COPPER, L: 20, A: 1.5e-6 }, { R: 0.224 })],
  })],
})

export const vDrop = defineFormula({
  id: 'cable-voltage-drop', section: 's12', title: 'Voltage drop in a cable', page: 11,
  equation: 'Vdrop = I × Rwire',
  meaning: 'Voltage lost in the cable between the source and the load.',
  fields: [
    field('Vdrop', 'Vdrop', 'Voltage lost', 'voltage'),
    field('I', 'I', 'Load current', 'current', { sign: 'nonneg' }),
    field('Rwire', 'Rwire', 'Wire resistance', 'resistance', { sign: 'nonneg', description: 'resistance of BOTH conductors — current goes out and back, so use 2 × cable length' }),
    field('rho', 'ρ', 'Resistivity', 'resistivity', { sign: 'pos', presets: rhoPresets }),
    field('L', 'L', 'Cable length (one way)', 'length', { sign: 'pos', description: 'one-way length — the calculator doubles it' }),
    field('A', 'A', 'Cross-section', 'area', { sign: 'pos' }),
    field('Vsrc', 'Vsource', 'Supply voltage', 'voltage', { sign: 'pos' }),
    field('pct', '% lost', 'Share of supply lost', 'fraction'),
  ],
  unitsNote: 'I in amps.',
  exampleText: '10 m two-core 1.5 mm² cable at 10 A → loop is 20 m → 0.224 Ω → 10 × 0.224 = 2.24 V lost. On 12 V that\'s almost 19% — too much; on 230 V it\'s under 1%.',
  visual: 'wire',
  modes: [
    mode({
      id: 'Vdrop', inputs: ['I', 'Rwire'], outputs: ['Vdrop'], equation: 'Vdrop = I × Rwire',
      compute: (v) => ({ Vdrop: v.I * v.Rwire }),
      steps: (v, o) => [`Vdrop = I × Rwire = ${S('current', v.I)} × ${S('resistance', v.Rwire)}`, `Vdrop = ${S('voltage', o.Vdrop)}`],
      examples: [ex('§12 10 A through 0.224 Ω', { I: 10, Rwire: 0.224 }, { Vdrop: 2.24 })],
    }),
    mode({
      id: 'cable', label: 'From cable length & size', inputs: ['I', 'rho', 'L', 'A', 'Vsrc'], outputs: ['Rwire', 'Vdrop', 'pct'],
      equation: 'Rwire = ρ × (2L) / A;  Vdrop = I × Rwire',
      compute: (v) => { const Rwire = (v.rho * 2 * v.L) / v.A; const Vdrop = v.I * Rwire; return { Rwire, Vdrop, pct: Vdrop / v.Vsrc } },
      warn: (_v, o) => (o.pct > 0.05 ? [`${N(o.pct * 100, 3)}% of the supply is lost in the cable — too much. Use a thicker cable or a higher voltage.`] : []),
      steps: (v, o) => [`Loop length = 2 × ${S('length', v.L)} = ${S('length', 2 * v.L)} (out and back)`, `Rwire = ρ × loop / A = ${N(v.rho)} × ${N(2 * v.L)} / ${N(v.A)} = ${S('resistance', o.Rwire)}`, `Vdrop = I × Rwire = ${S('current', v.I)} × ${S('resistance', o.Rwire)} = ${S('voltage', o.Vdrop)}`, `That is ${N(o.pct * 100, 3)}% of ${S('voltage', v.Vsrc)}.`],
      examples: [ex('§12 10 m, 1.5 mm², 10 A, 12 V', { I: 10, rho: COPPER, L: 10, A: 1.5e-6, Vsrc: 12 }, { Rwire: 0.224, Vdrop: 2.24, pct: 0.1867 }, 0.002)],
    }),
  ],
})

export const chargeIt = defineFormula({
  id: 'charge-current-time', section: 's12', title: 'Charge', page: 11,
  equation: 'Q = I × t',
  meaning: 'Charge moved by a current in a given time.',
  fields: [
    field('Q', 'Q', 'Charge', 'charge'),
    field('I', 'I', 'Current', 'current', { sign: 'nonneg' }),
    field('t', 't', 'Time', 'time', { sign: 'nonneg' }),
  ],
  unitsNote: 'Battery link: 1 mAh = 0.001 A × 3600 s = 3.6 C.',
  exampleText: '2 A for 10 s = 20 C.',
  visual: 'charge-flow',
  modes: [mode({
    id: 'Q', inputs: ['I', 't'], outputs: ['Q'], equation: 'Q = I × t',
    compute: (v) => ({ Q: v.I * v.t }),
    steps: (v, o) => [`Q = I × t = ${S('current', v.I)} × ${S('time', v.t)}`, `Q = ${S('charge', o.Q)}`, `(${N(o.Q / 3.6)} mAh)`],
    examples: [ex('§12 2 A for 10 s', { I: 2, t: 10 }, { Q: 20 })],
  })],
})

export const kvl = defineFormula({
  id: 'kvl', section: 's12', title: "Kirchhoff's Voltage Law", page: 11,
  equation: 'ΣV = 0 around any closed loop',
  meaning: 'The sum of all voltages around any closed loop is zero.',
  analogy: 'Walk around a hilly loop and return to the start: climbs and descents cancel out.',
  fields: [
    field('V', 'V', 'Voltages around the loop', 'voltage', { list: true, listMin: 1, description: 'each voltage rise (+) or drop (−) in the loop' }),
    field('sum', 'ΣV', 'Sum', 'voltage'),
    field('Vx', 'Vx', 'Missing voltage', 'voltage'),
  ],
  unitsNote: 'Pick a direction, count rises as + and drops as −.',
  exampleText: '9 V battery, LED drops 2 V, resistor 7 V → 9 − 2 − 7 = 0.',
  visual: 'kvl',
  modes: [
    mode({
      id: 'sum', label: 'Check a loop (ΣV)', inputs: ['V'], outputs: ['sum'], equation: 'ΣV = V1 + V2 + … (should be 0)',
      compute: (_v, l) => ({ sum: sum(l.V!) }),
      warn: (_v, o) => (Math.abs(o.sum) > 1e-9 ? ['The loop does not sum to zero — check your signs or measurements.'] : ['Loop closes: ΣV = 0 ✓']),
      steps: (_v, o, l) => [`ΣV = ${l.V!.map((x) => N(x)).join(' + ')}`, `ΣV = ${S('voltage', o.sum)}`],
      examples: [ex('§12 9 − 2 − 7', {}, { sum: 0 }, undefined, { V: [9, -2, -7] })],
    }),
    mode({
      id: 'Vx', label: 'Find the missing voltage', inputs: ['V'], outputs: ['Vx'], equation: 'Vx = −(sum of the known voltages)',
      compute: (_v, l) => ({ Vx: -sum(l.V!) }),
      steps: (_v, o, l) => [`Known sum = ${N(sum(l.V!))} V`, `Everything must add to 0, so Vx = −(${N(sum(l.V!))}) = ${S('voltage', o.Vx)}`],
      examples: [ex('§12 9 V − 2 V − Vx', {}, { Vx: -7 }, undefined, { V: [9, -2] })],
    }),
  ],
})

export const kcl = defineFormula({
  id: 'kcl', section: 's12', title: "Kirchhoff's Current Law", page: 12,
  equation: 'ΣIin = ΣIout',
  meaning: 'The sum of currents entering a node equals the sum of currents leaving it.',
  analogy: 'A pipe junction: whatever water flows in must flow out — nothing is stored or lost.',
  fields: [
    field('Iin', 'Iin', 'Currents entering', 'current', { sign: 'nonneg', list: true, listMin: 1, description: 'sum of currents entering the node' }),
    field('Iout', 'Iout', 'Currents leaving', 'current', { sign: 'nonneg', list: true, listMin: 1, description: 'sum of currents leaving the node' }),
    field('diff', 'ΣIin − ΣIout', 'Imbalance', 'current'),
  ],
  unitsNote: 'Same unit for all.',
  exampleText: '50 mA in → 30 mA + 20 mA out.',
  visual: 'kcl',
  modes: [mode({
    id: 'diff', label: 'Check a node', inputs: ['Iin', 'Iout'], outputs: ['diff'], equation: 'ΣIin − ΣIout (should be 0)',
    compute: (_v, l) => ({ diff: sum(l.Iin!) - sum(l.Iout!) }),
    warn: (_v, o) => (Math.abs(o.diff) > 1e-12 ? [o.diff > 0 ? `${S('current', o.diff)} more flows in than out — another current must be leaving.` : `${S('current', -o.diff)} more flows out than in — another current must be entering.`] : ['Node balances ✓']),
    steps: (_v, o, l) => [`In: ${S('current', sum(l.Iin!))}`, `Out: ${S('current', sum(l.Iout!))}`, `Difference = ${S('current', o.diff)}`],
    examples: [ex('§12 50 mA = 30 + 20', {}, { diff: 0 }, undefined, { Iin: [0.05], Iout: [0.03, 0.02] })],
  })],
})

export const powerFactor = defineFormula({
  id: 'power-factor', section: 's12', title: 'Power factor', page: 12,
  equation: 'PF = Preal / Papparent',
  meaning: 'Ratio of real power to apparent power in an AC circuit (1 = ideal). Relevant for motors, transformers and switching supplies.',
  fields: [
    field('PF', 'PF', 'Power factor', 'ratio', { description: '0 to 1, no unit' }),
    field('Preal', 'Preal', 'Real power', 'power', { sign: 'nonneg', description: 'what a wattmeter reads' }),
    field('Sapp', 'Papparent', 'Apparent power', 'va', { sign: 'pos', description: 'Vrms × Irms, in volt-amperes (VA)' }),
    field('V', 'Vrms', 'RMS voltage', 'voltage', { sign: 'pos' }),
    field('I', 'Irms', 'RMS current', 'current', { sign: 'pos' }),
  ],
  unitsNote: 'VA and W are the same size unit but mean different things. Generators and UPSs are often rated in VA.',
  exampleText: '230 V × 1 A = 230 VA; wattmeter reads 184 W → PF = 0.8.',
  visual: 'power-factor',
  modes: [
    mode({
      id: 'PF', inputs: ['Preal', 'Sapp'], outputs: ['PF'], equation: 'PF = Preal / Papparent',
      check: (v) => (v.Preal <= v.Sapp ? undefined : 'Real power cannot exceed apparent power (PF would be above 1).'),
      compute: (v) => ({ PF: v.Preal / v.Sapp }),
      steps: (v, o) => [`PF = ${S('power', v.Preal)} / ${N(v.Sapp)} VA`, `PF = ${N(o.PF)}`],
      examples: [ex('§12 184 W / 230 VA', { Preal: 184, Sapp: 230 }, { PF: 0.8 })],
    }),
    mode({
      id: 'PF_VI', label: 'From V, I and watts', inputs: ['V', 'I', 'Preal'], outputs: ['Sapp', 'PF'], equation: 'Papparent = Vrms × Irms;  PF = Preal / Papparent',
      check: (v) => (v.Preal <= v.V * v.I ? undefined : 'Real power cannot exceed V × I.'),
      compute: (v) => ({ Sapp: v.V * v.I, PF: v.Preal / (v.V * v.I) }),
      steps: (v, o) => [`Papparent = ${N(v.V)} V × ${N(v.I)} A = ${N(o.Sapp)} VA`, `PF = ${N(v.Preal)} W / ${N(o.Sapp)} VA = ${N(o.PF)}`],
      examples: [ex('§12 230 V × 1 A, 184 W', { V: 230, I: 1, Preal: 184 }, { Sapp: 230, PF: 0.8 })],
    }),
  ],
})

/* ───────── 13. Microcontrollers & digital ───────── */

const bitsField = field('n', 'n', 'ADC resolution', 'bits', { sign: 'pos', integer: true, min: 1, max: 32, description: 'ADC resolution in bits (10-bit → 0–1023, 12-bit → 0–4095)', placeholder: '12' })
export const adcReading = defineFormula({
  id: 'adc-reading', section: 's13', title: 'ADC reading', page: 12,
  equation: 'Reading = Vin / Vref × (2ⁿ − 1)',
  meaning: 'Raw ADC value for a given input voltage. Reverse: Vin = Reading × Vref / (2ⁿ − 1).',
  analogy: 'A ruler with 2ⁿ ticks laid along 0…Vref: the reading is the tick number your voltage falls on.',
  fields: [
    field('Reading', 'Reading', 'ADC reading', 'count', { sign: 'nonneg', integer: true, description: 'raw ADC value (integer)' }),
    field('Vin', 'Vin', 'Input voltage', 'voltage', { sign: 'nonneg', description: 'voltage on the ADC pin' }),
    field('Vref', 'Vref', 'Reference voltage', 'voltage', { sign: 'pos', description: 'ADC reference / full-scale voltage (often 3.3 V or 5 V)' }),
    bitsField,
  ],
  unitsNote: 'Vin and Vref in the same unit. Note: the ESP32 ADC is noticeably non-linear near its ends.',
  exampleText: '1.65 V on a 12-bit, 3.3 V ADC → 0.5 × 4095 ≈ 2047.',
  visual: 'adc',
  modes: [
    mode({
      id: 'Reading', inputs: ['Vin', 'Vref', 'n'], outputs: ['Reading'], equation: 'Reading = Vin / Vref × (2ⁿ − 1)',
      check: (v) => (v.Vin <= v.Vref ? undefined : 'Vin is above Vref — the ADC would clip at full scale (and may be damaged above the supply).'),
      compute: (v) => ({ Reading: Math.floor((v.Vin / v.Vref) * (2 ** v.n - 1) + 1e-9) }),
      steps: (v, o) => [`Full scale = 2^${v.n} − 1 = ${N(2 ** v.n - 1)}`, `Vin / Vref = ${N(v.Vin)} / ${N(v.Vref)} = ${N(v.Vin / v.Vref)}`, `Reading = ${N(v.Vin / v.Vref)} × ${N(2 ** v.n - 1)} = ${N((v.Vin / v.Vref) * (2 ** v.n - 1))} → whole count ${o.Reading}`],
      examples: [ex('§13 1.65 V, 3.3 V, 12-bit', { Vin: 1.65, Vref: 3.3, n: 12 }, { Reading: 2047 }), ex('§17 P7 Vout 1.10 V', { Vin: 1.1, Vref: 3.3, n: 12 }, { Reading: 1365 }, 0.001)],
    }),
    mode({
      id: 'Vin', label: 'Find Vin from reading', inputs: ['Reading', 'Vref', 'n'], outputs: ['Vin'], equation: 'Vin = Reading × Vref / (2ⁿ − 1)',
      check: (v) => (v.Reading <= 2 ** v.n - 1 ? undefined : `A ${v.n}-bit ADC cannot read above ${2 ** v.n - 1}.`),
      compute: (v) => ({ Vin: (v.Reading * v.Vref) / (2 ** v.n - 1) }),
      steps: (v, o) => [`Vin = ${N(v.Reading)} × ${N(v.Vref)} / ${N(2 ** v.n - 1)}`, `Vin = ${S('voltage', o.Vin)}`],
      examples: [ex('§17 P7 1365 on 12-bit, 3.3 V', { Reading: 1365, Vref: 3.3, n: 12 }, { Vin: 1.1 }, 0.001)],
    }),
  ],
})

export const adcStep = defineFormula({
  id: 'adc-step', section: 's13', title: 'ADC step size', page: 12,
  equation: 'Vstep = Vref / 2ⁿ',
  meaning: 'Smallest voltage change the ADC can detect.',
  fields: [
    field('Vstep', 'Vstep', 'Resolution per count', 'voltage'),
    field('Vref', 'Vref', 'Reference voltage', 'voltage', { sign: 'pos' }),
    bitsField,
  ],
  unitsNote: 'Answer is in volts — × 1000 for mV.',
  exampleText: '10-bit at 3.3 V → 3.3 / 1024 = 0.003 22 V = 3.22 mV.',
  visual: 'adc',
  modes: [mode({
    id: 'Vstep', inputs: ['Vref', 'n'], outputs: ['Vstep'], equation: 'Vstep = Vref / 2ⁿ',
    compute: (v) => ({ Vstep: v.Vref / 2 ** v.n }),
    steps: (v, o) => [`2^${v.n} = ${N(2 ** v.n)} steps`, `Vstep = ${N(v.Vref)} V / ${N(2 ** v.n)} = ${S('voltage', o.Vstep)}`],
    examples: [ex('§13 10-bit at 3.3 V', { Vref: 3.3, n: 10 }, { Vstep: 0.003223 }, 0.001)],
  })],
})

export const nyquist = defineFormula({
  id: 'nyquist', section: 's13', title: 'Nyquist sampling rate', page: 12,
  equation: 'fs ≥ 2 × fmax',
  meaning: 'Minimum sampling rate that avoids aliasing. In practice, sample 5–10× the highest frequency.',
  fields: [
    field('fs', 'fs', 'Sampling rate', 'frequency', { description: 'samples per second (Hz)' }),
    field('fmax', 'fmax', 'Highest signal frequency', 'frequency', { sign: 'pos' }),
  ],
  unitsNote: 'Same unit both sides.',
  exampleText: 'Audio up to 20 kHz → at least 40 kHz (CDs use 44.1 kHz).',
  visual: 'nyquist',
  modes: [mode({
    id: 'fs', inputs: ['fmax'], outputs: ['fs'], equation: 'fs ≥ 2 × fmax',
    compute: (v) => ({ fs: 2 * v.fmax }),
    warn: (v) => [`Practical rate: 5–10× → ${S('frequency', 5 * v.fmax)} to ${S('frequency', 10 * v.fmax)}.`],
    steps: (v, o) => [`Minimum fs = 2 × ${S('frequency', v.fmax)} = ${S('frequency', o.fs)}`, `In practice sample at 5–10×: ${S('frequency', 5 * v.fmax)} – ${S('frequency', 10 * v.fmax)}`],
    examples: [ex('§13 audio 20 kHz', { fmax: 20000 }, { fs: 40000 })],
  })],
})

export const pwm = defineFormula({
  id: 'pwm', section: 's13', title: 'PWM', page: 12,
  equation: 'f = 1/T   ·   D = ton/T   ·   Vavg = D × Vhigh',
  meaning: 'Frequency, duty cycle and average voltage of a PWM signal.',
  analogy: 'Flicking a switch on and off very fast: if it is on a quarter of the time, a lamp looks a quarter as bright.',
  fields: [
    field('f', 'f', 'PWM frequency', 'frequency'),
    field('T', 'T', 'Period', 'time', { sign: 'pos', description: 'period of one on+off cycle' }),
    field('ton', 'ton', 'On time', 'time', { sign: 'nonneg', description: 'time the output is high in each cycle' }),
    field('D', 'D', 'Duty cycle', 'fraction', { description: 'fraction (× 100 for %)' }),
    field('Vhigh', 'Vhigh', 'High voltage', 'voltage', { sign: 'pos', description: "the pin's high voltage (3.3 V / 5 V)" }),
    field('Vavg', 'Vavg', 'Average voltage', 'voltage'),
    field('value', 'value', 'PWM register value', 'count', { sign: 'nonneg', integer: true, placeholder: '64' }),
    field('bits', 'bits', 'PWM resolution', 'bits', { sign: 'pos', integer: true, min: 1, max: 32, placeholder: '8' }),
  ],
  unitsNote: 'ton and T in the same unit.',
  exampleText: 'T = 1 ms (1 kHz), ton = 0.25 ms → D = 25% → Vavg = 0.25 × 3.3 = 0.83 V. 8-bit PWM value 64 → D = 64/255 ≈ 25%.',
  visual: 'pwm',
  modes: [
    mode({
      id: 'time', label: 'From T and ton', inputs: ['T', 'ton', 'Vhigh'], outputs: ['f', 'D', 'Vavg'], equation: 'f = 1/T;  D = ton/T;  Vavg = D × Vhigh',
      check: (v) => (v.ton <= v.T ? undefined : 'ton cannot be longer than the period T.'),
      compute: (v) => ({ f: 1 / v.T, D: v.ton / v.T, Vavg: (v.ton / v.T) * v.Vhigh }),
      steps: (v, o) => [`f = 1 / T = 1 / ${S('time', v.T)} = ${S('frequency', o.f)}`, `D = ton / T = ${S('time', v.ton)} / ${S('time', v.T)} = ${N(o.D)} (${N(o.D * 100, 3)}%)`, `Vavg = D × Vhigh = ${N(o.D)} × ${N(v.Vhigh)} = ${S('voltage', o.Vavg)}`],
      examples: [ex('§13 T = 1 ms, ton = 0.25 ms, 3.3 V', { T: 0.001, ton: 0.00025, Vhigh: 3.3 }, { f: 1000, D: 0.25, Vavg: 0.825 })],
    }),
    mode({
      id: 'register', label: 'From register value', inputs: ['value', 'bits', 'Vhigh'], outputs: ['D', 'Vavg'], equation: 'D = value / (2^bits − 1);  Vavg = D × Vhigh',
      check: (v) => (v.value <= 2 ** v.bits - 1 ? undefined : `A ${v.bits}-bit PWM value cannot exceed ${2 ** v.bits - 1}.`),
      compute: (v) => ({ D: v.value / (2 ** v.bits - 1), Vavg: (v.value / (2 ** v.bits - 1)) * v.Vhigh }),
      steps: (v, o) => [`Full scale = 2^${v.bits} − 1 = ${2 ** v.bits - 1}`, `D = ${v.value} / ${2 ** v.bits - 1} = ${N(o.D)} (${N(o.D * 100, 3)}%)`, `Vavg = ${N(o.D)} × ${N(v.Vhigh)} = ${S('voltage', o.Vavg)}`],
      examples: [ex('§13 8-bit value 64', { value: 64, bits: 8, Vhigh: 3.3 }, { D: 64 / 255, Vavg: (64 / 255) * 3.3 })],
    }),
  ],
})

export const gpioLed = defineFormula({
  id: 'gpio-led-resistor', section: 's13', title: 'GPIO LED resistor', page: 13,
  equation: 'R = (Vgpio − Vf) / Iled',
  meaning: "Series resistor for an LED driven directly from a GPIO pin. Keep the current within the pin's datasheet limit.",
  fields: [
    field('R', 'R', 'Resistor', 'resistance'),
    field('Vgpio', 'Vgpio', 'Pin high voltage', 'voltage', { sign: 'pos' }),
    field('Vf', 'Vf', 'LED forward voltage', 'voltage', { sign: 'pos' }),
    field('Iled', 'Iled', 'LED current', 'current', { sign: 'pos' }),
  ],
  unitsNote: 'mA → A.',
  exampleText: '3.3 V pin, red LED 2 V, 10 mA → (3.3 − 2) / 0.01 = 130 Ω → use 150 Ω.',
  visual: 'led',
  modes: [mode({
    id: 'R', inputs: ['Vgpio', 'Vf', 'Iled'], outputs: ['R'], equation: 'R = (Vgpio − Vf) / Iled',
    check: (v) => (v.Vgpio > v.Vf ? undefined : 'The pin voltage must be higher than the LED forward voltage — a blue/white LED will not light from 3.3 V this way.'),
    compute: (v) => ({ R: (v.Vgpio - v.Vf) / v.Iled }),
    warn: (_v, o) => [`Round up to a standard value: ${S('resistance', e12Up(o.R))}.`],
    steps: (v, o) => [`Voltage across the resistor: ${N(v.Vgpio)} − ${N(v.Vf)} = ${N(v.Vgpio - v.Vf)} V`, `R = ${N(v.Vgpio - v.Vf)} / ${N(v.Iled)} = ${S('resistance', o.R)}`],
    examples: [ex('§13 3.3 V, 2 V, 10 mA', { Vgpio: 3.3, Vf: 2, Iled: 0.01 }, { R: 130 })],
  })],
})

export const decoupling = defineFormula({
  id: 'decoupling', section: 's13', title: 'Decoupling capacitors', page: 13,
  equation: '≈ 100 nF at every IC power pin + 10–100 µF bulk per board',
  meaning: 'Standard practice: a 100 nF ceramic capacitor next to every IC power pin, plus a larger bulk capacitor near the power input.',
  fields: [], unitsNote: '100 nF = 0.1 µF = 100 000 pF — all the same part. Place it within a few mm of the pin, with a short path to ground.',
  visual: 'decoupling', modes: [],
  reference: { rows: [['100 nF', '= 0.1 µF = ceramic marked "104"'], ['bulk', 'an electrolytic or large ceramic near the power input or regulator (10–100 µF)']] },
})

export const crystal = defineFormula({
  id: 'crystal-load', section: 's13', title: 'Crystal load capacitors', page: 13,
  equation: 'CL = (C1 × C2) / (C1 + C2) + Cstray   ·   C1 = C2 = 2 × (CL − Cstray)',
  meaning: 'First formula: total load capacitance seen by the crystal. Second: the value of C1 and C2 to fit for the CL given in the datasheet.',
  fields: [
    field('CL', 'CL', 'Load capacitance', 'capacitance', { sign: 'pos', description: 'load capacitance from the crystal datasheet' }),
    field('C1', 'C1', 'Capacitor C1', 'capacitance', { sign: 'pos', description: 'capacitor from crystal pin 1 to ground' }),
    field('C2', 'C2', 'Capacitor C2', 'capacitance', { sign: 'pos', description: 'capacitor from crystal pin 2 to ground' }),
    field('Cs', 'Cstray', 'Stray capacitance', 'capacitance', { sign: 'nonneg', description: 'PCB and chip-pin capacitance, typically 2–5 pF' }),
  ],
  unitsNote: 'Everything in pF.',
  exampleText: 'CL = 18 pF, Cstray = 3 pF → C1 = C2 = 2 × 15 = 30 pF → use 27 or 33 pF.',
  visual: 'crystal',
  modes: [
    mode({
      id: 'C1', label: 'Find C1 = C2', inputs: ['CL', 'Cs'], outputs: ['C1'], equation: 'C1 = C2 = 2 × (CL − Cstray)',
      check: (v) => (v.CL > v.Cs ? undefined : 'CL must be larger than the stray capacitance.'),
      compute: (v) => ({ C1: 2 * (v.CL - v.Cs) }),
      warn: (_v, o) => [`Use the nearest standard value (e.g. 27 pF or 33 pF for ${S('capacitance', o.C1)}).`],
      steps: (v, o) => [`CL − Cstray = ${S('capacitance', v.CL)} − ${S('capacitance', v.Cs)} = ${S('capacitance', v.CL - v.Cs)}`, `C1 = C2 = 2 × ${S('capacitance', v.CL - v.Cs)} = ${S('capacitance', o.C1)}`],
      examples: [ex('§13 CL = 18 pF, Cstray = 3 pF', { CL: 18 * pico, Cs: 3 * pico }, { C1: 30 * pico })],
    }),
    mode({
      id: 'CL', label: 'Find CL from C1, C2', inputs: ['C1', 'C2', 'Cs'], outputs: ['CL'], equation: 'CL = (C1 × C2) / (C1 + C2) + Cstray',
      compute: (v) => ({ CL: (v.C1 * v.C2) / (v.C1 + v.C2) + v.Cs }),
      steps: (v, o) => [`C1 and C2 in series = ${S('capacitance', (v.C1 * v.C2) / (v.C1 + v.C2))}`, `+ Cstray ${S('capacitance', v.Cs)}`, `CL = ${S('capacitance', o.CL)}`],
      examples: [ex('30 pF + 30 pF, 3 pF stray', { C1: 30 * pico, C2: 30 * pico, Cs: 3 * pico }, { CL: 18 * pico })],
    }),
  ],
})

export const uart = defineFormula({
  id: 'uart-bit-time', section: 's13', title: 'UART bit time', page: 13,
  equation: 'tbit = 1 / baud',
  meaning: 'Duration of one bit. A byte in 8N1 format takes 10 bits.',
  fields: [
    field('baud', 'baud', 'Baud rate', 'baud', { sign: 'pos', description: 'baud rate, in bits per second' }),
    field('tbit', 'tbit', 'Bit time', 'time'),
    field('tbyte', 'tbyte', 'Byte time (8N1)', 'time'),
    field('rate', 'max rate', 'Max bytes per second', 'count'),
  ],
  unitsNote: 'Answer in seconds — × 10⁶ for µs.',
  exampleText: '115 200 baud → 8.68 µs per bit; one byte ≈ 86.8 µs → max ≈ 11 520 bytes/s.',
  visual: 'uart',
  modes: [mode({
    id: 'tbit', inputs: ['baud'], outputs: ['tbit', 'tbyte', 'rate'], equation: 'tbit = 1 / baud',
    compute: (v) => ({ tbit: 1 / v.baud, tbyte: 10 / v.baud, rate: v.baud / 10 }),
    steps: (v, o) => [`tbit = 1 / ${N(v.baud)} = ${S('time', o.tbit)}`, `One 8N1 byte = 10 bits (start + 8 data + stop) = ${S('time', o.tbyte)}`, `Max throughput ≈ ${N(v.baud)} / 10 = ${N(o.rate)} bytes/s`],
    examples: [ex('§13 115200 baud', { baud: 115200 }, { tbit: 8.68e-6, tbyte: 86.8e-6, rate: 11520 }, 0.001)],
  })],
})

export const i2cMin = defineFormula({
  id: 'i2c-pullup-min', section: 's13', title: 'I²C pull-up — minimum', page: 13,
  equation: 'Rmin = (VDD − VOL) / IOL',
  meaning: 'Smallest allowed I²C pull-up resistor.',
  fields: [
    field('Rmin', 'Rmin', 'Minimum pull-up', 'resistance'),
    field('VDD', 'VDD', 'Bus supply voltage', 'voltage', { sign: 'pos' }),
    field('VOL', 'VOL', 'Max "low" level', 'voltage', { sign: 'nonneg', description: '0.4 V in the I²C spec', placeholder: '0.4' }),
    field('IOL', 'IOL', 'Sink current', 'current', { sign: 'pos', description: 'a device must handle 3 mA (standard / fast mode)', placeholder: '3 mA' }),
  ],
  unitsNote: 'IOL in amps.',
  exampleText: '3.3 V bus → (3.3 − 0.4) / 0.003 ≈ 967 Ω minimum.',
  visual: 'i2c',
  modes: [mode({
    id: 'Rmin', inputs: ['VDD', 'VOL', 'IOL'], outputs: ['Rmin'], equation: 'Rmin = (VDD − VOL) / IOL',
    check: (v) => (v.VDD > v.VOL ? undefined : 'VDD must be higher than VOL.'),
    compute: (v) => ({ Rmin: (v.VDD - v.VOL) / v.IOL }),
    steps: (v, o) => [`VDD − VOL = ${N(v.VDD)} − ${N(v.VOL)} = ${N(v.VDD - v.VOL)} V`, `Rmin = ${N(v.VDD - v.VOL)} / ${N(v.IOL)} = ${S('resistance', o.Rmin)}`],
    examples: [ex('§13 3.3 V bus', { VDD: 3.3, VOL: 0.4, IOL: 0.003 }, { Rmin: 966.67 }, 0.001)],
  })],
})

export const i2cMax = defineFormula({
  id: 'i2c-pullup-max', section: 's13', title: 'I²C pull-up — maximum', page: 13,
  equation: 'Rmax = tr / (0.8473 × Cb)',
  meaning: 'Largest allowed I²C pull-up resistor for the bus speed. Choose a value between Rmin and Rmax; typical: 4.7 kΩ (100 kHz), 2.2 kΩ (400 kHz).',
  fields: [
    field('Rmax', 'Rmax', 'Maximum pull-up', 'resistance'),
    field('tr', 'tr', 'Max rise time', 'time', { sign: 'pos', description: '1000 ns (100 kHz) or 300 ns (400 kHz)' }),
    field('Cb', 'Cb', 'Bus capacitance', 'capacitance', { sign: 'pos', description: "total bus capacitance (wires + every device's pins)" }),
  ],
  unitsNote: 'ns → s (× 10⁻⁹), pF → F (× 10⁻¹²).',
  exampleText: '400 kHz, 200 pF → 300×10⁻⁹ / (0.8473 × 200×10⁻¹²) ≈ 1770 Ω.',
  visual: 'i2c',
  modes: [mode({
    id: 'Rmax', inputs: ['tr', 'Cb'], outputs: ['Rmax'], equation: 'Rmax = tr / (0.8473 × Cb)',
    compute: (v) => ({ Rmax: v.tr / (0.8473 * v.Cb) }),
    steps: (v, o) => [`0.8473 × Cb = ${N(0.8473 * v.Cb)}`, `Rmax = ${N(v.tr)} / ${N(0.8473 * v.Cb)} = ${S('resistance', o.Rmax)}`],
    examples: [ex('§13 400 kHz, 200 pF', { tr: 300 * nano, Cb: 200 * pico }, { Rmax: 1770 }, 0.002)],
  })],
})

export const s12 = [wireR, vDrop, chargeIt, kvl, kcl, powerFactor]
export const s13 = [adcReading, adcStep, nyquist, pwm, gpioLed, decoupling, crystal, uart, i2cMin, i2cMax]
