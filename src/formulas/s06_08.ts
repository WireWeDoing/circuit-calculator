import { defineFormula, ex, field, mode } from '../core/define.ts'
import { e12Up } from '../core/e12.ts'
import { N, S } from '../core/fmt.ts'
import { milli, nano } from '../core/units.ts'

/* ───────── 6. Diodes & LEDs ───────── */

export const diodeVf = defineFormula({
  id: 'diode-vf', section: 's6', title: 'Diode forward drop (typical)', page: 7,
  equation: 'Si ≈ 0.6–0.7 V · Schottky ≈ 0.2–0.4 V · Ge ≈ 0.3 V',
  meaning: 'Voltage lost across a conducting diode. Silicon: general use (1N4148, 1N4007). Schottky: lower drop, faster (1N5819). Germanium: RF detectors.',
  analogy: 'A diode is a one-way door with a spring: you must push with ≈0.7 V before it opens.',
  fields: [], unitsNote: 'Vf rises slightly with current and falls with temperature. Use the datasheet graph for the current you actually run.',
  visual: 'diode', modes: [],
  reference: { rows: [['Silicon (1N4148, 1N4007)', '0.6–0.7 V'], ['Schottky (1N5819)', '0.2–0.4 V'], ['Germanium (RF detectors)', '≈ 0.3 V']] },
})

export const ledVf = defineFormula({
  id: 'led-vf', section: 's6', title: 'LED forward voltage (typical)', page: 7,
  equation: 'Red/yellow 1.8–2.2 V · Green 2.0–3.2 V · Blue/white 3.0–3.4 V',
  meaning: 'Minimum voltage needed for the LED to conduct and light, depending on colour. Blue and white LEDs may not light from a 3.3 V pin with a series resistor.',
  fields: [], unitsNote: 'Vf is the LED forward voltage at its rated current (usually 10–20 mA).',
  visual: 'led', modes: [],
  reference: { rows: [['Red / yellow', '1.8–2.2 V'], ['Green', '2.0–3.2 V'], ['Blue / white', '3.0–3.4 V']] },
})

export const ledResistor = defineFormula({
  id: 'led-resistor', section: 's6', title: 'LED series resistor', page: 7,
  equation: 'R = (Vsupply − Vf) / If',
  meaning: 'Resistor that limits LED current. The voltage left after the LED drop appears across the resistor.',
  analogy: 'An LED has almost no resistance of its own, so without a resistor the current runs away. The resistor is the speed limiter.',
  fields: [
    field('R', 'R', 'Resistor', 'resistance'),
    field('Vs', 'Vsupply', 'Supply voltage', 'voltage', { sign: 'pos', description: 'supply or pin voltage' }),
    field('Vf', 'Vf', 'LED forward voltage', 'voltage', { sign: 'pos' }),
    field('If', 'If', 'LED current', 'current', { sign: 'pos', description: 'desired LED current' }),
    field('P', 'P', 'Resistor power', 'power'),
  ],
  unitsNote: 'Convert mA → A: 20 mA = 0.02 A. Or: 3 V ÷ 20 mA = 0.15 kΩ. If the result isn\'t a standard value, round up.',
  exampleText: '5 V supply, red LED 2 V, 20 mA → (5 − 2) / 0.02 = 150 Ω.',
  visual: 'led', keywords: ['led', 'current limiting'],
  modes: [mode({
    id: 'R', inputs: ['Vs', 'Vf', 'If'], outputs: ['R', 'P'], equation: 'R = (Vsupply − Vf) / If',
    check: (v) => (v.Vs > v.Vf ? undefined : 'The supply must be higher than the LED forward voltage (Vsupply > Vf), otherwise the LED will not light.'),
    compute: (v) => ({ R: (v.Vs - v.Vf) / v.If, P: (v.Vs - v.Vf) * v.If }),
    warn: (_v, o) => [`Round up to a standard value: ${S('resistance', e12Up(o.R))} (E12).`, `The resistor dissipates ${S('power', o.P)} — a ¼ W resistor is plenty below 0.125 W.`],
    steps: (v, o) => [`Voltage left for the resistor: ${N(v.Vs)} − ${N(v.Vf)} = ${N(v.Vs - v.Vf)} V`, `R = ${N(v.Vs - v.Vf)} V / ${N(v.If)} A = ${S('resistance', o.R)}`, `Power in resistor: ${N(v.Vs - v.Vf)} V × ${N(v.If)} A = ${S('power', o.P)}`],
    examples: [ex('§6 5 V, red LED 2 V, 20 mA', { Vs: 5, Vf: 2, If: 20 * milli }, { R: 150, P: 0.06 })],
  })],
})

/* ───────── 7. BJT ───────── */

export const bjtGain = defineFormula({
  id: 'bjt-gain', section: 's7', title: 'DC current gain', page: 7,
  equation: 'IC = hFE × IB',
  meaning: 'Collector current is the base current multiplied by the gain. Valid only in the active region, not in saturation.',
  analogy: 'A tap: a tiny twist of the handle (base current) controls a big flow (collector current).',
  fields: [
    field('IC', 'IC', 'Collector current', 'current'),
    field('IB', 'IB', 'Base current', 'current', { sign: 'nonneg' }),
    field('hFE', 'hFE', 'DC current gain', 'ratio', { sign: 'pos', description: 'datasheet value, typically 100–300 for BC547 / 2N2222' }),
  ],
  unitsNote: 'IC comes out in the same unit as IB. Hand-calculation approximation — real hFE varies a lot between parts, with current and with temperature.',
  exampleText: 'IB = 0.1 mA, hFE = 200 → IC = 20 mA.',
  visual: 'bjt',
  modes: [mode({
    id: 'IC', inputs: ['IB', 'hFE'], outputs: ['IC'], equation: 'IC = hFE × IB',
    compute: (v) => ({ IC: v.hFE * v.IB }),
    steps: (v, o) => [`IC = hFE × IB = ${N(v.hFE)} × ${S('current', v.IB)}`, `IC = ${S('current', o.IC)}`],
    examples: [ex('§7 IB = 0.1 mA, hFE = 200', { IB: 0.1 * milli, hFE: 200 }, { IC: 0.02 })],
  })],
})

export const bjtEmitter = defineFormula({
  id: 'bjt-emitter', section: 's7', title: 'Emitter current', page: 8,
  equation: 'IE = IB + IC',
  meaning: 'Emitter current is the sum of base and collector currents.',
  fields: [
    field('IE', 'IE', 'Emitter current', 'current'),
    field('IB', 'IB', 'Base current', 'current', { sign: 'nonneg' }),
    field('IC', 'IC', 'Collector current', 'current', { sign: 'nonneg' }),
  ],
  unitsNote: 'Same unit for all three.',
  exampleText: '0.1 mA + 20 mA = 20.1 mA.',
  visual: 'bjt',
  modes: [mode({
    id: 'IE', inputs: ['IB', 'IC'], outputs: ['IE'], equation: 'IE = IB + IC',
    compute: (v) => ({ IE: v.IB + v.IC }),
    steps: (v, o) => [`IE = ${S('current', v.IB)} + ${S('current', v.IC)}`, `IE = ${S('current', o.IE)}`],
    examples: [ex('§7 0.1 mA + 20 mA', { IB: 0.1 * milli, IC: 20 * milli }, { IE: 0.0201 })],
  })],
})

export const bjtRb = defineFormula({
  id: 'bjt-base-resistor', section: 's7', title: 'Base resistor (switching)', page: 8,
  equation: 'RB = (Vin − VBE) / IB',
  meaning: 'Base resistor for using a BJT as a switch. For reliable saturation, use IB ≈ IC / 10.',
  fields: [
    field('RB', 'RB', 'Base resistor', 'resistance'),
    field('Vin', 'Vin', 'Driving voltage', 'voltage', { sign: 'pos', description: 'e.g. a 3.3 V or 5 V GPIO pin' }),
    field('VBE', 'VBE', 'Base-emitter drop', 'voltage', { sign: 'pos', description: '≈ 0.7 V' }),
    field('IB', 'IB', 'Base current', 'current', { sign: 'pos' }),
  ],
  unitsNote: 'IB in amps. Check the pin can supply that current.',
  exampleText: 'Switch 100 mA from a 3.3 V pin → IB = 10 mA = 0.01 A → RB = (3.3 − 0.7) / 0.01 = 260 Ω → use 270 Ω.',
  visual: 'bjt-switch',
  modes: [mode({
    id: 'RB', inputs: ['Vin', 'VBE', 'IB'], outputs: ['RB'], equation: 'RB = (Vin − VBE) / IB',
    check: (v) => (v.Vin > v.VBE ? undefined : 'Vin must be greater than VBE (≈ 0.7 V) or the transistor never turns on.'),
    compute: (v) => ({ RB: (v.Vin - v.VBE) / v.IB }),
    warn: (_v, o) => [`Nearest standard values (E12): ${S('resistance', e12Up(o.RB))} or round down for a bit more base current.`],
    steps: (v, o) => [`Voltage across RB: ${N(v.Vin)} − ${N(v.VBE)} = ${N(v.Vin - v.VBE)} V`, `RB = ${N(v.Vin - v.VBE)} V / ${N(v.IB)} A = ${S('resistance', o.RB)}`],
    examples: [ex('§7 3.3 V pin, 10 mA base current', { Vin: 3.3, VBE: 0.7, IB: 0.01 }, { RB: 260 })],
  })],
})

export const bjtVoltages = defineFormula({
  id: 'bjt-typical-voltages', section: 's7', title: 'Typical silicon BJT voltages', page: 8,
  equation: 'VBE(on) ≈ 0.6–0.7 V · VCE(sat) ≈ 0.1–0.3 V',
  meaning: 'VBE: needed to turn the transistor on. VCE(sat): voltage remaining across a fully-on transistor.',
  fields: [], unitsNote: '', visual: 'bjt-switch', modes: [],
  reference: { rows: [['VBE(on)', '0.6–0.7 V'], ['VCE(sat)', '0.1–0.3 V']] },
})

export const bjtPd = defineFormula({
  id: 'bjt-power', section: 's7', title: 'Power dissipation', page: 8,
  equation: 'PD = VCE × IC',
  meaning: "Heat generated in the transistor. Must stay below the datasheet's PD(max).",
  fields: [
    field('PD', 'PD', 'Power dissipated', 'power'),
    field('VCE', 'VCE', 'Collector-emitter voltage', 'voltage', { sign: 'nonneg' }),
    field('IC', 'IC', 'Collector current', 'current', { sign: 'nonneg' }),
  ],
  unitsNote: 'IC in amps for watts (V × mA = mW).',
  exampleText: 'Saturated switch, 0.2 V × 0.5 A = 0.1 W — cool. Half-on at 6 V × 0.5 A = 3 W — needs a heatsink.',
  visual: 'bjt',
  modes: [mode({
    id: 'PD', inputs: ['VCE', 'IC'], outputs: ['PD'], equation: 'PD = VCE × IC',
    compute: (v) => ({ PD: v.VCE * v.IC }),
    warn: (_v, o) => (o.PD > 0.5 ? ['More than 0.5 W: this needs a heatsink or a bigger package.'] : []),
    steps: (v, o) => [`PD = ${S('voltage', v.VCE)} × ${S('current', v.IC)}`, `PD = ${S('power', o.PD)}`],
    examples: [ex('§7 0.2 V × 0.5 A', { VCE: 0.2, IC: 0.5 }, { PD: 0.1 }), ex('§7 6 V × 0.5 A', { VCE: 6, IC: 0.5 }, { PD: 3 })],
  })],
})

/* ───────── 8. MOSFET ───────── */

export const vgsTh = defineFormula({
  id: 'mosfet-vgs-th', section: 's8', title: 'Gate threshold voltage', page: 8,
  equation: 'VGS(th)',
  meaning: 'Gate voltage at which the MOSFET starts to conduct (typically at 250 µA). It is not the full turn-on voltage — use the VGS at which RDS(on) is specified.',
  fields: [], unitsNote: 'VGS(th), RDS(on) and Qg are always datasheet values for the specific part.',
  visual: 'mosfet', modes: [],
  reference: { rows: [['VGS', 'voltage between gate and source'], ['(th)', 'threshold — the turn-on starting point']] },
})

export const mosPd = defineFormula({
  id: 'mosfet-power', section: 's8', title: 'On-state power loss', page: 8,
  equation: 'PD = ID² × RDS(on)',
  meaning: 'Heat generated in a fully-on MOSFET due to its on-resistance.',
  fields: [
    field('PD', 'PD', 'Power dissipated', 'power'),
    field('ID', 'ID', 'Drain current', 'current', { sign: 'nonneg' }),
    field('RDS', 'RDS(on)', 'On-resistance', 'resistance', { sign: 'pos', description: 'on-resistance between drain and source' }),
  ],
  unitsNote: 'Datasheets list RDS(on) in milliohms — divide by 1000: 25 mΩ = 0.025 Ω.',
  exampleText: '5 A through 25 mΩ → 5² × 0.025 = 0.625 W.',
  visual: 'mosfet',
  modes: [mode({
    id: 'PD', inputs: ['ID', 'RDS'], outputs: ['PD'], equation: 'PD = ID² × RDS(on)',
    compute: (v) => ({ PD: v.ID ** 2 * v.RDS }),
    steps: (v, o) => [`ID² = ${N(v.ID)}² = ${N(v.ID ** 2)} A²`, `PD = ${N(v.ID ** 2)} × ${N(v.RDS)} Ω`, `PD = ${S('power', o.PD)}`],
    examples: [ex('§8 5 A, 25 mΩ', { ID: 5, RDS: 0.025 }, { PD: 0.625 })],
  })],
})

export const gateDrive = defineFormula({
  id: 'mosfet-gate-current', section: 's8', title: 'Gate drive current', page: 8,
  equation: 'IG ≈ Qg / tsw',
  meaning: 'Current needed to charge the gate in the required switching time. Large MOSFETs need a gate driver, not a GPIO pin.',
  fields: [
    field('IG', 'IG', 'Gate drive current', 'current'),
    field('Qg', 'Qg', 'Total gate charge', 'charge', { sign: 'pos', description: 'datasheet gives nC' }),
    field('tsw', 'tsw', 'Switching time', 'time', { sign: 'pos', description: 'desired switching time' }),
  ],
  unitsNote: 'Shortcut: nC ÷ ns = A.',
  exampleText: 'Qg = 40 nC switched in 100 ns → 40 ÷ 100 = 0.4 A peak.',
  visual: 'mosfet',
  modes: [mode({
    id: 'IG', inputs: ['Qg', 'tsw'], outputs: ['IG'], equation: 'IG ≈ Qg / tsw',
    compute: (v) => ({ IG: v.Qg / v.tsw }),
    warn: (_v, o) => (o.IG > 0.02 ? ['More than ~20 mA: a GPIO pin cannot supply this — use a gate driver.'] : []),
    steps: (v, o) => [`IG = Qg / tsw = ${S('charge', v.Qg)} / ${S('time', v.tsw)}`, `IG = ${S('current', o.IG)}`],
    examples: [ex('§8 40 nC in 100 ns', { Qg: 40 * nano, tsw: 100 * nano }, { IG: 0.4 })],
  })],
})

export const logicLevel = defineFormula({
  id: 'mosfet-logic-level', section: 's8', title: 'Logic-level MOSFETs', page: 9,
  equation: 'Fully on at VGS ≈ 4.5 V (or 2.5 V)',
  meaning: 'Standard MOSFETs (e.g. IRFZ44N) need ≈10 V on the gate. Logic-level MOSFETs (e.g. IRLZ44N, AO3400) fully turn on at 4.5 V or less.',
  fields: [], unitsNote: 'Check the RDS(on) line of the datasheet: it states "@ VGS = 10 V", "@ 4.5 V" or "@ 2.5 V". For 3.3 V drive you want a part rated at 2.5 V.',
  visual: 'mosfet', modes: [],
  reference: { rows: [['Standard (IRFZ44N)', '≈ 10 V on the gate'], ['Logic-level (IRLZ44N, AO3400)', '4.5 V or less'], ['For 3.3 V drive', 'part rated at 2.5 V']] },
})

export const s06 = [diodeVf, ledVf, ledResistor]
export const s07 = [bjtGain, bjtEmitter, bjtRb, bjtVoltages, bjtPd]
export const s08 = [vgsTh, mosPd, gateDrive, logicLevel]
