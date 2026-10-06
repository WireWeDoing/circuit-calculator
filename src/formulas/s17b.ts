import { defineFormula, ex, field, mode } from '../core/define.ts'
import { e12Down, e12Up } from '../core/e12.ts'
import { N, S } from '../core/fmt.ts'

const R_ = (k: string, s: string, n: string, x: object = {}) => field(k, s, n, 'resistance', { sign: 'pos', ...x })
const V_ = (k: string, s: string, n: string, x: object = {}) => field(k, s, n, 'voltage', { sign: 'nonneg', ...x })
const I_ = (k: string, s: string, n: string, x: object = {}) => field(k, s, n, 'current', { sign: 'nonneg', ...x })
const P_ = (k: string, s: string, n: string, x: object = {}) => field(k, s, n, 'power', { sign: 'nonneg', ...x })
const th = (k: string, s: string, n: string, x: object = {}) => field(k, s, n, 'thermal', { sign: 'nonneg', ...x })

/* 17.4 LEDs, Zener, power supplies */
export const p13 = defineFormula({
  id: 'p13-several-leds', section: 's17', title: 'P13 · Several LEDs from one supply', page: 25,
  equation: 'R = (Vs − n × Vf) / I   ·   nmax = (Vs − 1.5 V) / Vf',
  meaning: 'GIVEN supply Vs, LED forward voltage Vf, LED current I, number of LEDs n in series. FIND series resistor R, its power, and the maximum number of LEDs.',
  fields: [V_('Vs', 'Vs', 'Supply voltage', { sign: 'pos' }), V_('Vf', 'Vf', 'LED forward voltage', { sign: 'pos' }), I_('I', 'I', 'LED current', { sign: 'pos' }), field('n', 'n', 'LEDs in series', 'count', { sign: 'pos', integer: true, min: 1, max: 100 }), R_('R', 'R', 'Series resistor'), P_('PR', 'PR', 'Resistor power'), field('nmax', 'nmax', 'Max LEDs in series', 'count')],
  unitsNote: 'Parallel strings: one resistor per string — Vf differs between LEDs; a shared resistor makes one string hog the current. Keep ≥ ~1.5 V across R so current stays stable.',
  exampleText: '12 V, 3 white LEDs (3.1 V), 20 mA → R = (12 − 9.3) / 0.02 = 135 Ω → 150 Ω (I = 18 mA). P = 2.7 V × 0.018 A = 0.05 W. nmax = (12 − 1.5) / 3.1 = 3.',
  visual: 'p13',
  modes: [mode({
    id: 'R', inputs: ['Vs', 'Vf', 'I', 'n'], outputs: ['R', 'PR', 'nmax'], equation: 'R = (Vs − n·Vf) / I;  PR = (Vs − n·Vf) × I;  nmax = floor((Vs − 1.5)/Vf)',
    check: (v) => (v.Vs > v.n * v.Vf ? undefined : `${v.n} LEDs need more than ${N(v.n * v.Vf)} V — the supply is too low. Use fewer LEDs in series or a higher supply.`),
    compute: (v) => ({ R: (v.Vs - v.n * v.Vf) / v.I, PR: (v.Vs - v.n * v.Vf) * v.I, nmax: Math.max(0, Math.floor((v.Vs - 1.5) / v.Vf + 1e-9)) }),
    warn: (v, o) => { const w = [`Round up to a standard value: ${S('resistance', e12Up(o.R))}.`]; if (v.Vs - v.n * v.Vf < 1.5) w.push('Less than ~1.5 V across the resistor: the current will not be stable.'); return w },
    steps: (v, o) => [`1. LEDs take n × Vf = ${v.n} × ${N(v.Vf)} = ${N(v.n * v.Vf)} V;  R drops ${N(v.Vs - v.n * v.Vf)} V (KVL)`, `   R = ${N(v.Vs - v.n * v.Vf)} / ${N(v.I)} = ${S('resistance', o.R)}`, `2. Heat in the resistor: PR = ${N(v.Vs - v.n * v.Vf)} V × ${N(v.I)} A = ${S('power', o.PR)}`, `3. nmax = (Vs − 1.5 V) / Vf = ${N((v.Vs - 1.5) / v.Vf)} → round down = ${o.nmax}`],
    examples: [ex('P13 12 V, 3 × 3.1 V, 20 mA', { Vs: 12, Vf: 3.1, I: 0.02, n: 3 }, { R: 135, PR: 0.054, nmax: 3 })],
  })],
})

export const p14 = defineFormula({
  id: 'p14-zener', section: 's17', title: 'P14 · Zener voltage regulator', page: 25,
  equation: 'R = (Vin,min − Vz) / (IL + Iz,min)',
  meaning: 'GIVEN input range Vin,min–Vin,max, Zener voltage Vz, maximum load current IL, minimum Zener current Iz,min (≈ 5 mA). FIND series resistor R and the power ratings of R and the Zener.',
  fields: [V_('Vmin', 'Vin,min', 'Lowest input', { sign: 'pos' }), V_('Vmax', 'Vin,max', 'Highest input', { sign: 'pos' }), V_('Vz', 'Vz', 'Zener voltage', { sign: 'pos' }), I_('IL', 'IL', 'Max load current'), I_('Izmin', 'Iz,min', 'Min Zener current', { placeholder: '5 mA' }),
    R_('R', 'R', 'Series resistor'), I_('Imax', 'Imax', 'Highest current through R'), P_('Pz', 'Pz', 'Zener power'), P_('PR', 'PR', 'Resistor power'), I_('Izlow', 'Iz(min in)', 'Zener current at lowest input')],
  unitsNote: 'Worst case: lowest input, highest load → round R down. Wasteful above ~50 mA — use a linear or switching regulator instead.',
  exampleText: '9–12 V in, 5.1 V Zener, 20 mA load → R = (9 − 5.1) / 0.025 = 156 Ω → 150 Ω. Imax = 6.9 / 150 = 46 mA → Pz = 0.23 W → 0.5 W Zener. PR = 0.32 W → 1 W resistor (2× margin).',
  visual: 'p14',
  modes: [
    mode({ id: 'R', label: 'Design R', inputs: ['Vmin', 'Vmax', 'Vz', 'IL', 'Izmin'], outputs: ['R', 'Imax', 'Pz', 'PR'], equation: 'R = (Vin,min − Vz)/(IL + Iz,min)',
      check: (v) => (v.Vmin > v.Vz ? (v.Vmax >= v.Vmin ? undefined : 'Vin,max must be ≥ Vin,min.') : 'The lowest input must be above the Zener voltage.'),
      compute: (v) => { const R = (v.Vmin - v.Vz) / (v.IL + v.Izmin); const Imax = (v.Vmax - v.Vz) / R; return { R, Imax, Pz: v.Vz * Imax, PR: (v.Vmax - v.Vz) ** 2 / R } },
      warn: (_v, o) => [`Round R down to a standard value: ${S('resistance', e12Down(o.R))}.`, `Use a Zener rated ≥ 2× ${S('power', o.Pz)} and a resistor rated ≥ 2× ${S('power', o.PR)}.`, ...(o.Imax > 0.05 ? ['Above ~50 mA a Zener is wasteful — use a linear or switching regulator.'] : [])],
      steps: (v, o) => [`1. R = (Vin,min − Vz) / (IL + Iz,min) = ${N(v.Vmin - v.Vz)} / ${N(v.IL + v.Izmin)} = ${S('resistance', o.R)}  (worst case: lowest input, highest load)`, `2. Imax = (Vin,max − Vz) / R = ${S('current', o.Imax)}`, `3. Pz = Vz × Imax = ${S('power', o.Pz)}  (worst case for the Zener: no load)`, `4. PR = (Vin,max − Vz)² / R = ${S('power', o.PR)}  (worst case for the resistor)`],
      examples: [ex('P14 9–12 V, 5.1 V, 20 mA', { Vmin: 9, Vmax: 12, Vz: 5.1, IL: 0.02, Izmin: 0.005 }, { R: 156, Imax: 0.04423, Pz: 0.2256, PR: 0.3050 }, 0.005)] }),
    mode({ id: 'check', label: 'Check a chosen R', inputs: ['Vmin', 'Vmax', 'Vz', 'IL', 'R'], outputs: ['Izlow', 'Imax', 'Pz', 'PR'], equation: 'Imax = (Vin,max − Vz)/R',
      check: (v) => (v.Vmin > v.Vz ? undefined : 'The lowest input must be above the Zener voltage.'),
      compute: (v) => { const Imax = (v.Vmax - v.Vz) / v.R; return { Izlow: (v.Vmin - v.Vz) / v.R - v.IL, Imax, Pz: v.Vz * Imax, PR: (v.Vmax - v.Vz) ** 2 / v.R } },
      warn: (_v, o) => (o.Izlow < 0.005 ? [`At the lowest input only ${S('current', Math.max(o.Izlow, 0))} is left for the Zener (< 5 mA): regulation may fail.`] : []),
      steps: (_v, o) => [`Zener current at lowest input and full load = (Vmin − Vz)/R − IL = ${S('current', o.Izlow)}`, `Imax = ${S('current', o.Imax)}`, `Pz = ${S('power', o.Pz)};  PR = ${S('power', o.PR)}`],
      examples: [ex('P14 R = 150 Ω', { Vmin: 9, Vmax: 12, Vz: 5.1, IL: 0.02, R: 150 }, { Izlow: 0.006, Imax: 0.046, Pz: 0.2346, PR: 0.3174 }, 0.005)] }),
  ],
})

export const p15 = defineFormula({
  id: 'p15-transformer-rectifier', section: 's17', title: 'P15 · Transformer, rectifier and smoothing capacitor', page: 25,
  equation: 'Np/Ns = Vp/Vs   ·   Vpeak = Vs × √2 − 1.4 V   ·   C = I / (fr × ΔV)',
  meaning: 'GIVEN mains voltage Vp, transformer secondary Vs (RMS), DC load current I, allowed ripple ΔV. FIND turns ratio, DC voltage after the rectifier, and smoothing capacitance.',
  fields: [V_('Vp', 'Vp', 'Mains voltage', { sign: 'pos' }), V_('Vs', 'Vs', 'Secondary voltage (RMS)', { sign: 'pos' }), I_('I', 'I', 'DC load current', { sign: 'pos' }), V_('dV', 'ΔV', 'Allowed ripple', { sign: 'pos' }),
    field('fr', 'fr', 'Ripple frequency', 'frequency', { sign: 'pos', placeholder: '100', presets: [{ label: '100 Hz full-wave', value: 100 }, { label: '50 Hz half-wave', value: 50 }], description: '100 Hz full-wave, 50 Hz half-wave (50 Hz mains)' }),
    field('ratio', 'Np/Ns', 'Turns ratio', 'ratio'), V_('Vpeak', 'Vpeak', 'DC peak after the bridge'), field('C', 'C', 'Smoothing capacitor', 'capacitance'), V_('Vtrough', 'Vtrough', 'Ripple trough')],
  unitsNote: 'Bridge rectifier: two diodes conduct at a time (use −0.7 V for one diode). The ripple trough must stay above what a following regulator needs (Vout + dropout). Size the transformer at 1.5–2× the DC power. Mains is lethal — work on the low-voltage side only.',
  exampleText: '230 V → 12 V transformer: ratio 19.2 : 1. Vpeak = 12 × 1.414 − 1.4 = 15.6 V. 0.5 A load, 1.5 V ripple → C = 0.5 / (100 × 1.5) = 3333 µF → 4700 µF, ≥ 25 V. Trough 14.1 V ≥ 5 V + 2 V for a 7805 ✓.',
  visual: 'p15',
  modes: [mode({
    id: 'C', inputs: ['Vp', 'Vs', 'I', 'dV', 'fr'], outputs: ['ratio', 'Vpeak', 'C', 'Vtrough'], equation: 'C = I / (fr × ΔV)',
    check: (v) => (v.Vs * Math.SQRT2 - 1.4 > v.dV ? undefined : 'The secondary voltage is too low for this ripple (the bridge needs ≈1.4 V).'),
    compute: (v) => ({ ratio: v.Vp / v.Vs, Vpeak: v.Vs * Math.SQRT2 - 1.4, C: v.I / (v.fr * v.dV), Vtrough: v.Vs * Math.SQRT2 - 1.4 - v.dV }),
    warn: (_v, o) => [`Use the next standard value up (e.g. ${S('capacitance', o.C * 1.4)}) rated ≥ 1.5× Vpeak (${S('voltage', 1.5 * o.Vpeak)}).`, `The trough ${S('voltage', o.Vtrough)} must stay above regulator Vout + dropout.`],
    steps: (v, o) => [`1. Turns ratio Np/Ns = Vp/Vs = ${N(v.Vp)} / ${N(v.Vs)} = ${N(o.ratio)} : 1  (current scales inversely)`, `2. Vpeak = Vs × √2 − 1.4 V = ${N(v.Vs * Math.SQRT2)} − 1.4 = ${S('voltage', o.Vpeak)}  (a bridge uses two diodes: 2 × 0.7 V)`, `3. C = I / (fr × ΔV) = ${N(v.I)} / (${N(v.fr)} × ${N(v.dV)}) = ${S('capacitance', o.C)}`, `4. Ripple trough = Vpeak − ΔV = ${S('voltage', o.Vtrough)}`],
    examples: [ex('P15 230 → 12 V, 0.5 A, 1.5 V', { Vp: 230, Vs: 12, I: 0.5, dV: 1.5, fr: 100 }, { ratio: 19.167, Vpeak: 15.57, C: 0.003333, Vtrough: 14.07 }, 0.005)],
  })],
})

export const p16 = defineFormula({
  id: 'p16-heat', section: 's17', title: 'P16 · Heat in a linear regulator or transistor (heatsink sizing)', page: 26,
  equation: 'Tj = Ta + P × θJA   ·   θSA = (Tj,max − Ta)/P − θJC − θCS',
  meaning: 'GIVEN power dissipated P, ambient temperature Ta, datasheet Tj,max, θJA, θJC. FIND junction temperature, and whether a heatsink is needed and how good it must be.',
  fields: [V_('Vin', 'Vin', 'Input voltage'), V_('Vout', 'Vout', 'Output voltage'), I_('I', 'I', 'Load current', { sign: 'pos' }), P_('P', 'P', 'Power dissipated'),
    field('Ta', 'Ta', 'Ambient temperature', 'temp'), field('Tjmax', 'Tj,max', 'Max junction temperature', 'temp', { sign: 'pos' }), th('tJA', 'θJA', 'Junction → air'), th('tJC', 'θJC', 'Junction → case'), th('tCS', 'θCS', 'Case → sink', { placeholder: '0.5' }),
    field('Tj', 'Tj', 'Junction temp (no heatsink)', 'temp'), th('ttot', 'θtotal', 'Max total thermal resistance'), th('tSA', 'θSA', 'Heatsink rating needed')],
  unitsNote: 'θ is temperature rise per watt (°C/W). θCS ≈ 0.5 °C/W with thermal paste. Pick a heatsink with a lower θSA. For transistors use PD from sections 7–8.',
  exampleText: '7805 from 12 V at 0.5 A → P = 7 × 0.5 = 3.5 W. TO-220 without heatsink (θJA ≈ 50 °C/W): rise 175 °C → too hot. Tj,max 125 °C, Ta 40 °C → θtotal = 85 / 3.5 = 24.3 → θSA = 24.3 − 5 − 0.5 = ≤ 18.8 °C/W heatsink. Or use a buck regulator.',
  visual: 'p16',
  modes: [
    mode({ id: 'linear', label: 'Linear regulator', inputs: ['Vin', 'Vout', 'I', 'Ta', 'Tjmax', 'tJA', 'tJC', 'tCS'], outputs: ['P', 'Tj', 'ttot', 'tSA'], equation: 'P = (Vin − Vout) × I',
      check: (v) => (v.Vin > v.Vout ? (v.Tjmax > v.Ta ? undefined : 'Tj,max must be above the ambient temperature.') : 'Vin must be higher than Vout for a linear regulator.'),
      compute: (v) => { const P = (v.Vin - v.Vout) * v.I; const ttot = (v.Tjmax - v.Ta) / P; return { P, Tj: v.Ta + P * v.tJA, ttot, tSA: ttot - v.tJC - v.tCS } },
      warn: (v, o) => [o.Tj > v.Tjmax ? `Without a heatsink the junction reaches ${N(o.Tj, 3)} °C — above the ${N(v.Tjmax)} °C limit. A heatsink (or a switching regulator) is needed.` : 'Safe without a heatsink.', ...(o.tSA <= 0 ? ['Even an ideal heatsink is not enough — reduce the power (e.g. use a buck regulator).'] : [])],
      steps: (v, o) => [`1. P = (Vin − Vout) × I = ${N(v.Vin - v.Vout)} V × ${N(v.I)} A = ${S('power', o.P)}  (the voltage difference is burned as heat)`, `2. Tj = Ta + P × θJA = ${N(v.Ta)} + ${N(o.P)} × ${N(v.tJA)} = ${N(o.Tj, 4)} °C (without heatsink)`, `3. θtotal = (Tj,max − Ta) / P = ${N(v.Tjmax - v.Ta)} / ${N(o.P)} = ${N(o.ttot, 4)} °C/W`, `4. θSA = θtotal − θJC − θCS = ${N(o.ttot, 4)} − ${N(v.tJC)} − ${N(v.tCS)} = ${N(o.tSA, 4)} °C/W  (pick a heatsink with a LOWER rating)`],
      examples: [ex('P16 7805, 12 V, 0.5 A', { Vin: 12, Vout: 5, I: 0.5, Ta: 40, Tjmax: 125, tJA: 50, tJC: 5, tCS: 0.5 }, { P: 3.5, Tj: 215, ttot: 24.286, tSA: 18.786 }, 0.002)] }),
    mode({ id: 'power', label: 'Known power', inputs: ['P', 'Ta', 'Tjmax', 'tJA', 'tJC', 'tCS'], outputs: ['Tj', 'ttot', 'tSA'], equation: 'Tj = Ta + P × θJA',
      check: (v) => (v.P > 0 ? (v.Tjmax > v.Ta ? undefined : 'Tj,max must be above the ambient temperature.') : 'P must be greater than 0.'),
      compute: (v) => { const ttot = (v.Tjmax - v.Ta) / v.P; return { Tj: v.Ta + v.P * v.tJA, ttot, tSA: ttot - v.tJC - v.tCS } },
      steps: (v, o) => [`Tj = ${N(v.Ta)} + ${N(v.P)} × ${N(v.tJA)} = ${N(o.Tj, 4)} °C`, `θtotal = ${N(o.ttot, 4)} °C/W`, `θSA = ${N(o.tSA, 4)} °C/W`],
      examples: [ex('3.5 W', { P: 3.5, Ta: 40, Tjmax: 125, tJA: 50, tJC: 5, tCS: 0.5 }, { Tj: 215, ttot: 24.286, tSA: 18.786 }, 0.002)] }),
  ],
})

/* 17.5 Transistor circuits */
export const p17 = defineFormula({
  id: 'p17-bjt-switch', section: 's17', title: 'P17 · BJT switch for a load (relay, motor, LED strip) from a GPIO pin', page: 27,
  equation: 'IC = (Vcc − VCE(sat)) / Rload   ·   IB = IC / 10   ·   RB = (Vgpio − 0.7) / IB',
  meaning: 'GIVEN load supply Vcc, load resistance or current, GPIO voltage, transistor hFE(min). FIND collector current, base current and base resistor RB.',
  fields: [V_('Vcc', 'Vcc', 'Load supply', { sign: 'pos' }), R_('Rload', 'Rload', 'Load resistance'), V_('Vce', 'VCE(sat)', 'Saturation voltage', { placeholder: '0.2' }), V_('Vgpio', 'Vgpio', 'GPIO voltage', { sign: 'pos' }), I_('IC', 'IC', 'Collector current'), I_('IB', 'IB', 'Base current'), R_('RB', 'RB', 'Base resistor')],
  unitsNote: 'Forced gain of 10 guarantees saturation (hFE varies between parts). Round RB down to a standard value (slightly more base current is fine). Inductive loads need a flyback diode across the load, cathode to +Vcc. Check IB ≤ pin limit, IC ≤ IC(max).',
  exampleText: '12 V relay, coil 400 Ω, 3.3 V GPIO → IC = (12 − 0.2) / 400 = 29.5 mA → IB = 2.95 mA → RB = 2.6 / 0.00295 = 881 Ω → 820 Ω (I = 3.2 mA). Add a 1N4148 across the coil.',
  visual: 'bjt-switch',
  modes: [mode({
    id: 'RB', inputs: ['Vcc', 'Rload', 'Vce', 'Vgpio'], outputs: ['IC', 'IB', 'RB'], equation: 'IC = (Vcc − VCE(sat))/Rload;  IB = IC/10;  RB = (Vgpio − 0.7)/IB',
    check: (v) => (v.Vcc > v.Vce ? (v.Vgpio > 0.7 ? undefined : 'The GPIO voltage must be above 0.7 V (VBE) to switch the transistor on.') : 'Vcc must be larger than VCE(sat).'),
    compute: (v) => { const IC = (v.Vcc - v.Vce) / v.Rload; const IB = IC / 10; return { IC, IB, RB: (v.Vgpio - 0.7) / IB } },
    warn: (_v, o) => [`Round RB down to a standard value: ${S('resistance', e12Down(o.RB))}.`, `Check the pin can supply ${S('current', o.IB)} and the transistor handles IC = ${S('current', o.IC)}.`, 'Inductive load (relay, motor)? Add a flyback diode across it, cathode to +Vcc.'],
    steps: (v, o) => [`1. IC = (Vcc − VCE(sat)) / Rload = ${N(v.Vcc - v.Vce)} / ${N(v.Rload)} = ${S('current', o.IC)}  (current the load draws when the transistor is fully on)`, `2. IB = IC / 10 = ${S('current', o.IB)}  (forced gain of 10 guarantees saturation)`, `3. RB = (Vgpio − 0.7) / IB = ${N(v.Vgpio - 0.7)} / ${N(o.IB)} = ${S('resistance', o.RB)}`],
    examples: [ex('P17 12 V relay 400 Ω, 3.3 V', { Vcc: 12, Rload: 400, Vce: 0.2, Vgpio: 3.3 }, { IC: 0.0295, IB: 0.00295, RB: 881.4 }, 0.002)],
  })],
})

export const p18 = defineFormula({
  id: 'p18-bjt-bias', section: 's17', title: 'P18 · BJT amplifier bias point (voltage-divider bias)', page: 27,
  equation: 'VB = Vcc × R2/(R1+R2)  ·  VE = VB − 0.7  ·  IC ≈ IE = VE/RE  ·  VCE = VC − VE',
  meaning: 'GIVEN Vcc, base divider R1 (top) and R2 (bottom), emitter resistor RE, collector resistor RC. FIND the DC voltages and currents — to check the transistor sits in its active region.',
  fields: [V_('Vcc', 'Vcc', 'Supply', { sign: 'pos' }), R_('R1', 'R1', 'Base divider (top)'), R_('R2', 'R2', 'Base divider (bottom)'), R_('RE', 'RE', 'Emitter resistor'), R_('RC', 'RC', 'Collector resistor'),
    field('VB', 'VB', 'Base voltage', 'voltage'), field('VE', 'VE', 'Emitter voltage', 'voltage'), field('IC', 'IC', 'Collector current', 'current'), field('VC', 'VC', 'Collector voltage', 'voltage'), field('VCE', 'VCE', 'Collector-emitter voltage', 'voltage'), field('gain', 'Av', 'Voltage gain ≈ −RC/RE', 'ratio')],
  unitsNote: 'Valid when divider current ≥ 10 × IB (base current barely loads it). Active region if VCE > ~1 V. Best swing when VC is near the middle.',
  exampleText: 'Vcc = 12 V, R1 = 47 kΩ, R2 = 10 kΩ, RE = 1 kΩ, RC = 4.7 kΩ → VB = 2.11 V → VE = 1.41 V → IC = 1.41 mA → VC = 5.4 V → VCE = 4.0 V ✓ active. Voltage gain ≈ −RC/RE = −4.7.',
  visual: 'p18',
  modes: [mode({
    id: 'bias', inputs: ['Vcc', 'R1', 'R2', 'RE', 'RC'], outputs: ['VB', 'VE', 'IC', 'VC', 'VCE', 'gain'], equation: 'VB → VE → IC → VC, VCE',
    check: (v) => ((v.Vcc * v.R2) / (v.R1 + v.R2) > 0.7 ? undefined : 'The base voltage is below 0.7 V: the transistor stays off.'),
    compute: (v) => { const VB = (v.Vcc * v.R2) / (v.R1 + v.R2); const VE = VB - 0.7; const IC = VE / v.RE; const VC = v.Vcc - IC * v.RC; return { VB, VE, IC, VC, VCE: VC - VE, gain: -v.RC / v.RE } },
    warn: (_v, o) => [o.VCE > 1 ? 'VCE > 1 V → active region ✓' : 'VCE ≤ 1 V → the transistor is saturating, not amplifying. Lower RC or RE current.'],
    steps: (v, o) => [`1. VB = Vcc × R2/(R1+R2) = ${N(v.Vcc)} × ${N(v.R2 / (v.R1 + v.R2))} = ${S('voltage', o.VB)}`, `2. VE = VB − 0.7 V = ${S('voltage', o.VE)}  (base-emitter junction drop)`, `3. IC ≈ IE = VE / RE = ${S('current', o.IC)}  (RE sets the current — independent of hFE)`, `4. VC = Vcc − IC × RC = ${S('voltage', o.VC)};  VCE = VC − VE = ${S('voltage', o.VCE)}`, `Voltage gain ≈ −RC / RE = ${N(o.gain)} (with RE not bypassed)`],
    examples: [ex('P18 12 V, 47k/10k, 1k, 4.7k', { Vcc: 12, R1: 47000, R2: 10000, RE: 1000, RC: 4700 }, { VB: 2.105, VE: 1.405, IC: 0.001405, VC: 5.396, VCE: 3.991, gain: -4.7 }, 0.003)],
  })],
})

export const p19 = defineFormula({
  id: 'p19-mosfet-switch', section: 's17', title: 'P19 · Check a MOSFET switch', page: 27,
  equation: 'P = ID² × RDS(on)   ·   ΔT = P × θJA',
  meaning: 'GIVEN load current ID, gate drive voltage, datasheet RDS(on) at that VGS and θJA. FIND power loss and temperature rise.',
  fields: [I_('ID', 'ID', 'Load current'), R_('RDS', 'RDS(on)', 'On-resistance at your VGS'), th('tJA', 'θJA', 'Junction → air', { sign: 'pos' }), P_('P', 'P', 'Conduction loss'), field('dT', 'ΔT', 'Temperature rise', 'temp')],
  unitsNote: 'Read the RDS(on) value specified for your drive voltage (3.3 V drive needs a part rated at 2.5 V). Convert mΩ to Ω. Gate: 10–100 Ω series, 10–100 kΩ gate-to-source pull-down keeps the MOSFET off while the MCU boots.',
  exampleText: '3 A load, RDS(on) = 40 mΩ at 3.3 V → P = 9 × 0.04 = 0.36 W. SOT-23 package, θJA ≈ 125 °C/W → ΔT = 45 °C → acceptable at room temperature; at 5 A (P = 1 W, ΔT = 125 °C) choose a larger package or lower RDS(on).',
  visual: 'mosfet',
  modes: [mode({
    id: 'P', inputs: ['ID', 'RDS', 'tJA'], outputs: ['P', 'dT'], equation: 'P = ID² × RDS(on);  ΔT = P × θJA',
    compute: (v) => ({ P: v.ID ** 2 * v.RDS, dT: v.ID ** 2 * v.RDS * v.tJA }),
    warn: (_v, o) => (o.dT > 60 ? [`A ${N(o.dT, 3)} °C rise is large — choose a larger package or lower RDS(on).`] : ['Temperature rise is acceptable at room temperature.']),
    steps: (v, o) => [`1. Use the RDS(on) value for your gate voltage: ${S('resistance', v.RDS)}`, `2. P = ID² × RDS(on) = ${N(v.ID ** 2)} × ${N(v.RDS)} = ${S('power', o.P)}  (conduction loss)`, `3. ΔT = P × θJA = ${N(o.P)} × ${N(v.tJA)} = ${N(o.dT, 3)} °C above ambient`],
    examples: [ex('P19 3 A, 40 mΩ, 125 °C/W', { ID: 3, RDS: 0.04, tJA: 125 }, { P: 0.36, dT: 45 }), ex('P19 5 A', { ID: 5, RDS: 0.04, tJA: 125 }, { P: 1, dT: 125 })],
  })],
})

/* 17.6 Batteries */
export const p20 = defineFormula({
  id: 'p20-internal-resistance', section: 's17', title: "P20 · Measure a battery's internal resistance", page: 28,
  equation: 'Rint = RL × (Voc − VL) / VL',
  meaning: 'GIVEN open-circuit voltage Voc (no load), voltage VL with a known load RL connected. FIND internal resistance Rint, then voltage sag at any current. Same method works for any supply, power bank or long cable.',
  fields: [V_('Voc', 'Voc', 'Open-circuit voltage', { sign: 'pos' }), V_('VL', 'VL', 'Voltage with load', { sign: 'pos' }), R_('RL', 'RL', 'Known load'), I_('I', 'I', 'Current drawn by the load'), R_('Rint', 'Rint', 'Internal resistance'), I_('Inew', 'Inew', 'Another current'), V_('V', 'V', 'Voltage at that current')],
  unitsNote: 'Measure quickly; voltage recovers after the load is removed.',
  exampleText: 'Voc = 4.10 V, with 10 Ω: VL = 3.95 V → I = 0.395 A → Rint = 0.15 / 0.395 = 0.38 Ω. At 2 A: V = 4.10 − 0.76 = 3.34 V — a 3.3 V regulator would drop out.',
  visual: 'p20',
  modes: [
    mode({ id: 'Rint', inputs: ['Voc', 'VL', 'RL'], outputs: ['I', 'Rint'], equation: 'I = VL/RL;  Rint = (Voc − VL)/I',
      check: (v) => (v.VL < v.Voc ? undefined : 'VL must be lower than Voc (the battery sags under load).'),
      compute: (v) => { const I = v.VL / v.RL; return { I, Rint: (v.Voc - v.VL) / I } },
      steps: (v, o) => [`1. I = VL / RL = ${N(v.VL)} / ${N(v.RL)} = ${S('current', o.I)}  (current drawn by the known load)`, `2. Rint = (Voc − VL) / I = ${N(v.Voc - v.VL)} / ${N(o.I)} = ${S('resistance', o.Rint)}  (the missing voltage is dropped inside the battery)`],
      examples: [ex('P20 4.10 V, 3.95 V with 10 Ω', { Voc: 4.1, VL: 3.95, RL: 10 }, { I: 0.395, Rint: 0.3797 }, 0.002)] }),
    mode({ id: 'sag', label: 'Predict voltage at another current', inputs: ['Voc', 'Rint', 'Inew'], outputs: ['V'], equation: 'V = Voc − Inew × Rint', compute: (v) => ({ V: v.Voc - v.Inew * v.Rint }),
      warn: (_v, o) => (o.V < 3.3 ? ['Below 3.3 V: a 3.3 V regulator would drop out.'] : []),
      steps: (v, o) => [`V = ${N(v.Voc)} − ${N(v.Inew)} × ${N(v.Rint)} = ${S('voltage', o.V)}`],
      examples: [ex('P20 at 2 A', { Voc: 4.1, Rint: 0.38, Inew: 2 }, { V: 3.34 }, 0.002)] }),
  ],
})

export const p21 = defineFormula({
  id: 'p21-battery-packs', section: 's17', title: 'P21 · Battery packs: cells in series and parallel', page: 28,
  equation: 'xSyP: V = x·Vcell · Ah = y·Ahcell · Wh = x·y·Whcell · Rint = Rcell·x/y',
  meaning: 'Series (S) adds voltage and internal resistance; parallel (P) adds capacity and divides internal resistance. Only parallel cells of the same type and charge level; series Li-ion packs need a BMS to balance the cells.',
  fields: [field('x', 'x (S)', 'Cells in series', 'count', { sign: 'pos', integer: true, min: 1, max: 100 }), field('y', 'y (P)', 'Cells in parallel', 'count', { sign: 'pos', integer: true, min: 1, max: 100 }),
    V_('Vcell', 'Vcell', 'Cell voltage', { sign: 'pos' }), field('Ahcell', 'Ahcell', 'Cell capacity', 'capacityAh', { sign: 'pos' }), R_('Rcell', 'Rcell', 'Cell internal resistance', { sign: 'nonneg' }), I_('Iload', 'Iload', 'Load current', { sign: 'pos' }),
    V_('V', 'V pack', 'Pack voltage'), field('Ah', 'Ah pack', 'Pack capacity', 'capacityAh'), field('Wh', 'Wh pack', 'Pack energy', 'energyWh'), R_('Rint', 'Rint pack', 'Pack internal resistance', { sign: 'nonneg' }), field('t', 't', 'Runtime (ideal)', 'hours'), field('treal', 't real', 'Runtime (expected ~80%)', 'hours')],
  unitsNote: 'Series: voltage adds, capacity same as one cell, resistance adds. Parallel: voltage same, capacity adds, resistance divides.',
  exampleText: '3S2P of 3.7 V, 2.5 Ah cells → 11.1 V, 5 Ah, 55.5 Wh. At 1 A load → runtime ≈ 5 h (expect ≈ 4 h).',
  visual: 'pack',
  modes: [mode({
    id: 'pack', inputs: ['x', 'y', 'Vcell', 'Ahcell', 'Rcell', 'Iload'], outputs: ['V', 'Ah', 'Wh', 'Rint', 't', 'treal'], equation: 'V = x·Vcell;  Ah = y·Ahcell;  Wh = V·Ah;  Rint = Rcell·x/y',
    compute: (v) => { const V = v.x * v.Vcell; const Ah = v.y * v.Ahcell; const t = Ah / v.Iload; return { V, Ah, Wh: V * Ah, Rint: (v.Rcell * v.x) / v.y, t, treal: t * 0.8 } },
    steps: (v, o) => [`Voltage: ${v.x} × ${N(v.Vcell)} V = ${S('voltage', o.V)}`, `Capacity: ${v.y} × ${N(v.Ahcell)} Ah = ${N(o.Ah)} Ah`, `Energy: ${N(o.V)} V × ${N(o.Ah)} Ah = ${N(o.Wh)} Wh`, `Internal resistance: Rcell × x / y = ${S('resistance', o.Rint)}`, `Runtime at ${S('current', v.Iload)}: ${N(o.Ah)} / ${N(v.Iload)} = ${N(o.t)} h (expect ≈ ${N(o.treal, 3)} h)`],
    examples: [ex('P21 3S2P 3.7 V 2.5 Ah, 1 A', { x: 3, y: 2, Vcell: 3.7, Ahcell: 2.5, Rcell: 0.05, Iload: 1 }, { V: 11.1, Ah: 5, Wh: 55.5, Rint: 0.075, t: 5, treal: 4 })],
  })],
})

export const s17 = [p13, p14, p15, p16, p17, p18, p19, p20, p21]

p13.modes[0]!.breakdown = (v, o) => [
  ...Array.from({ length: v.n }, (_, i) => ({ label: `LED${i + 1}`, V: v.Vf, I: v.I, P: v.Vf * v.I, share: v.Vf / v.Vs })),
  { label: 'R', value: { dim: 'resistance' as const, x: o.R! }, V: v.Vs - v.n * v.Vf, I: v.I, P: o.PR, share: (v.Vs - v.n * v.Vf) / v.Vs },
]
