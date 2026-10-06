import { parallelRBreakdown } from '../core/breakdown.ts'
import { defineFormula, ex, field, mode } from '../core/define.ts'
import type { BreakdownRow } from '../core/types.ts'
import { e12Down, e12Up } from '../core/e12.ts'
import { N, S } from '../core/fmt.ts'
import { micro, milli, nano, pico, mega } from '../core/units.ts'

const R_ = (k: string, s: string, n: string, x: object = {}) => field(k, s, n, 'resistance', { sign: 'pos', ...x })
const V_ = (k: string, s: string, n: string, x: object = {}) => field(k, s, n, 'voltage', { sign: 'nonneg', ...x })
const I_ = (k: string, s: string, n: string, x: object = {}) => field(k, s, n, 'current', { sign: 'nonneg', ...x })
const C_ = (k: string, s: string, n: string, x: object = {}) => field(k, s, n, 'capacitance', { sign: 'pos', ...x })
const L_ = (k: string, s: string, n: string, x: object = {}) => field(k, s, n, 'inductance', { sign: 'pos', ...x })
const TWO_PI = 2 * Math.PI

export const methodGuide = defineFormula({
  id: 'solving-method', section: 's17', title: 'General method for any unknown', page: 18,
  equation: 'Ohm\'s law + KCL + KVL',
  meaning: 'Every circuit problem uses three tools: Ohm\'s law for each component, plus Kirchhoff\'s current law (KCL) and voltage law (KVL) for how components connect.',
  fields: [], unitsNote: 'Units: same prefix for all values — the answer keeps it.',
  visual: 'series-parallel-table', tool: 'method', modes: [], keywords: ['series', 'parallel', 'method', 'steps'],
})

export const reverse = defineFormula({
  id: 'reverse-formulas', section: 's17', title: 'Reverse formulas — remove a known part', page: 18,
  equation: 'Rx = Rt − R1  ·  Rx = (R1 × Rt) / (R1 − Rt)  (and the C / L equivalents)',
  meaning: 'Remove a known component from a measured total. The product-over-difference form comes from 1/Xx = 1/Xt − 1/X1. It only works if the total is smaller than the known part (for parallel R and L, series C). A negative or infinite result means the measurements are wrong.',
  fields: [
    R_('R1', 'R1', 'Known resistor'), R_('Rt', 'Rt', 'Measured total resistance'), R_('Rx', 'Rx', 'Unknown resistor', { sign: 'any' }),
    C_('C1', 'C1', 'Known capacitor'), C_('Ct', 'Ct', 'Measured total capacitance'), C_('Cx', 'Cx', 'Unknown capacitor', { sign: 'any' }),
    L_('L1', 'L1', 'Known inductor'), L_('Lt', 'Lt', 'Measured total inductance'), L_('Lx', 'Lx', 'Unknown inductor', { sign: 'any' }),
  ],
  unitsNote: 'Same prefix for all values — the answer keeps it.',
  visual: 'reverse',
  modes: [
    mode({ id: 'Rs', label: 'Resistor in series', inputs: ['Rt', 'R1'], outputs: ['Rx'], equation: 'Rx = Rt − R1',
      check: (v) => (v.Rt > v.R1 ? undefined : 'The total must be larger than the known resistor in series — recheck the measurements.'),
      compute: (v) => ({ Rx: v.Rt - v.R1 }), steps: (v, o) => [`Rx = Rt − R1 = ${S('resistance', v.Rt)} − ${S('resistance', v.R1)}`, `Rx = ${S('resistance', o.Rx)}`],
      examples: [ex('1470 Ω total, 1 kΩ known', { Rt: 1470, R1: 1000 }, { Rx: 470 })] }),
    mode({ id: 'Rp', label: 'Resistor in parallel', inputs: ['Rt', 'R1'], outputs: ['Rx'], equation: 'Rx = (R1 × Rt) / (R1 − Rt)',
      check: (v) => (v.Rt < v.R1 ? undefined : 'The total of a parallel pair must be smaller than the known resistor — recheck the measurements.'),
      compute: (v) => ({ Rx: (v.R1 * v.Rt) / (v.R1 - v.Rt) }), steps: (v, o) => [`R1 × Rt = ${N(v.R1 * v.Rt)};  R1 − Rt = ${N(v.R1 - v.Rt)}`, `Rx = ${N(v.R1 * v.Rt)} / ${N(v.R1 - v.Rt)} = ${S('resistance', o.Rx)}`],
      examples: [ex('1 kΩ ∥ ? = 666.67 Ω', { Rt: 2000 / 3, R1: 1000 }, { Rx: 2000 })] }),
    mode({ id: 'Cs', label: 'Capacitor in series', inputs: ['Ct', 'C1'], outputs: ['Cx'], equation: 'Cx = (C1 × Ct) / (C1 − Ct)',
      check: (v) => (v.Ct < v.C1 ? undefined : 'The total of series capacitors must be smaller than the known capacitor — recheck the measurements.'),
      compute: (v) => ({ Cx: (v.C1 * v.Ct) / (v.C1 - v.Ct) }), steps: (v, o) => [`C1 × Ct = ${N(v.C1 * v.Ct)};  C1 − Ct = ${N(v.C1 - v.Ct)}`, `Cx = ${S('capacitance', o.Cx)}`],
      examples: [ex('10 µF + ? = 5 µF in series', { Ct: 5 * micro, C1: 10 * micro }, { Cx: 10 * micro })] }),
    mode({ id: 'Cp', label: 'Capacitor in parallel', inputs: ['Ct', 'C1'], outputs: ['Cx'], equation: 'Cx = Ct − C1',
      check: (v) => (v.Ct > v.C1 ? undefined : 'The total of parallel capacitors must be larger than the known capacitor — recheck the measurements.'),
      compute: (v) => ({ Cx: v.Ct - v.C1 }), steps: (v, o) => [`Cx = Ct − C1 = ${S('capacitance', v.Ct)} − ${S('capacitance', v.C1)}`, `Cx = ${S('capacitance', o.Cx)}`],
      examples: [ex('200 nF total, 100 nF known', { Ct: 200 * nano, C1: 100 * nano }, { Cx: 100 * nano })] }),
    mode({ id: 'Ls', label: 'Inductor in series', inputs: ['Lt', 'L1'], outputs: ['Lx'], equation: 'Lx = Lt − L1',
      check: (v) => (v.Lt > v.L1 ? undefined : 'The total must be larger than the known inductor in series — recheck the measurements.'),
      compute: (v) => ({ Lx: v.Lt - v.L1 }), steps: (v, o) => [`Lx = Lt − L1 = ${S('inductance', v.Lt)} − ${S('inductance', v.L1)}`, `Lx = ${S('inductance', o.Lx)}`],
      examples: [ex('1470 µH total, 1 mH known', { Lt: 1470 * micro, L1: milli }, { Lx: 470 * micro })] }),
    mode({ id: 'Lp', label: 'Inductor in parallel', inputs: ['Lt', 'L1'], outputs: ['Lx'], equation: 'Lx = (L1 × Lt) / (L1 − Lt)',
      check: (v) => (v.Lt < v.L1 ? undefined : 'The total of parallel inductors must be smaller than the known inductor — recheck the measurements.'),
      compute: (v) => ({ Lx: (v.L1 * v.Lt) / (v.L1 - v.Lt) }), steps: (v, o) => [`L1 × Lt = ${N(v.L1 * v.Lt)};  L1 − Lt = ${N(v.L1 - v.Lt)}`, `Lx = ${S('inductance', o.Lx)}`],
      examples: [ex('10 µH ∥ ? = 5 µH', { Lt: 5 * micro, L1: 10 * micro }, { Lx: 10 * micro })] }),
  ],
})

/* 17.1 Resistor networks */
export const p1 = defineFormula({
  id: 'p1-unknown-parallel', section: 's17', title: 'P1 · Unknown resistor in parallel', page: 19,
  equation: 'Rt = V / I   ·   R2 = (R1 × Rt) / (R1 − Rt)',
  meaning: 'GIVEN supply voltage V, total current I, resistor R1. FIND R2, connected in parallel with R1.',
  fields: [
    V_('V', 'V', 'Supply voltage', { sign: 'pos' }), I_('I', 'I', 'Total current', { sign: 'pos' }), R_('R1', 'R1', 'Known resistor'),
    I_('I1', 'I1', 'Current in R1'), I_('I2', 'I2', 'Current in R2'), R_('Rt', 'Rt', 'Total resistance'), R_('R2', 'R2', 'Unknown resistor'),
  ],
  unitsNote: 'mA and kΩ work together directly. Requires I > V / R1. If not, R2 would be negative — recheck the measurements.',
  exampleText: 'V = 12 V, I = 18 mA, R1 = 1 kΩ → I1 = 12 mA → I2 = 6 mA → R2 = 2 kΩ. Check: 1 kΩ ∥ 2 kΩ = 0.667 kΩ; 12 V / 0.667 kΩ = 18 mA ✓',
  visual: 'p1',
  modes: [
    mode({ id: 'A', label: 'Method A: branch currents', inputs: ['V', 'I', 'R1'], outputs: ['I1', 'I2', 'R2'], equation: 'I1 = V/R1;  I2 = I − I1;  R2 = V/I2',
      check: (v) => (v.I > v.V / v.R1 ? undefined : 'Requires I > V / R1. Otherwise R2 would be negative — recheck the measurements.'),
      compute: (v) => { const I1 = v.V / v.R1; const I2 = v.I - I1; return { I1, I2, R2: v.V / I2 } },
      steps: (v, o) => [`1. I1 = V / R1 = ${S('voltage', v.V)} / ${S('resistance', v.R1)} = ${S('current', o.I1)}  (parallel: R1 has the full supply voltage)`, `2. I2 = I − I1 = ${S('current', v.I)} − ${S('current', o.I1)} = ${S('current', o.I2)}  (KCL: the rest flows through R2)`, `3. R2 = V / I2 = ${S('voltage', v.V)} / ${S('current', o.I2)} = ${S('resistance', o.R2)}  (R2 also has the full voltage)`],
      examples: [ex('P1 12 V, 18 mA, 1 kΩ', { V: 12, I: 0.018, R1: 1000 }, { I1: 0.012, I2: 0.006, R2: 2000 })] }),
    mode({ id: 'B', label: 'Method B: equivalent resistance', inputs: ['V', 'I', 'R1'], outputs: ['Rt', 'R2'], equation: 'Rt = V/I;  R2 = R1·Rt / (R1 − Rt)',
      check: (v) => (v.V / v.I < v.R1 ? undefined : 'Requires I > V / R1. Otherwise R2 would be negative — recheck the measurements.'),
      compute: (v) => { const Rt = v.V / v.I; return { Rt, R2: (v.R1 * Rt) / (v.R1 - Rt) } },
      steps: (v, o) => [`1. Rt = V / I = ${S('voltage', v.V)} / ${S('current', v.I)} = ${S('resistance', o.Rt)}  (resistance of the whole parallel pair)`, `2. R2 = R1 × Rt / (R1 − Rt) = ${N(v.R1 * o.Rt)} / ${N(v.R1 - o.Rt)} = ${S('resistance', o.R2)}  (removes R1 from the parallel total)`],
      examples: [ex('P1 12 V, 18 mA, 1 kΩ', { V: 12, I: 0.018, R1: 1000 }, { Rt: 666.67, R2: 2000 }, 0.001)] }),
  ],
})

export const p2 = defineFormula({
  id: 'p2-series-parallel', section: 's17', title: 'P2 · Unknown resistor in a series–parallel circuit', page: 19,
  equation: 'Rt = V/I  ·  Rp = Rt − R1  ·  R3 = (R2 × Rp) / (R2 − Rp)',
  meaning: 'GIVEN supply voltage V, total current I, R1 (series), R2 (parallel branch). FIND R3, connected in parallel with R2; the pair is in series with R1.',
  fields: [
    V_('V', 'V', 'Supply voltage', { sign: 'pos' }), I_('I', 'I', 'Total current', { sign: 'pos' }), R_('R1', 'R1', 'Series resistor'), R_('R2', 'R2', 'Parallel branch (known)'),
    V_('V1', 'V1', 'Drop across R1'), V_('Vp', 'Vp', 'Voltage across the parallel pair'), I_('I2', 'I2', 'Current in R2'), I_('I3', 'I3', 'Current in R3'),
    R_('Rt', 'Rt', 'Total resistance'), R_('Rp', 'Rp', 'Parallel-pair resistance'), R_('R3', 'R3', 'Unknown resistor'),
  ],
  unitsNote: 'Requires Rp < R2.',
  exampleText: 'V = 12 V, I = 6 mA, R1 = 1 kΩ, R2 = 2 kΩ → V1 = 6 V → Vp = 6 V → I2 = 3 mA → I3 = 3 mA → R3 = 2 kΩ. Check: 2 kΩ ∥ 2 kΩ = 1 kΩ; + R1 = 2 kΩ; 12 V / 2 kΩ = 6 mA ✓',
  visual: 'p2',
  modes: [
    mode({ id: 'A', label: 'Method A: currents and voltages', inputs: ['V', 'I', 'R1', 'R2'], outputs: ['V1', 'Vp', 'I2', 'I3', 'R3'], equation: 'V1 = I·R1;  Vp = V − V1;  I2 = Vp/R2;  I3 = I − I2;  R3 = Vp/I3',
      check: (v) => { const Vp = v.V - v.I * v.R1; if (!(Vp > 0)) return 'The drop on R1 (I × R1) is not smaller than the supply — recheck the measurements.'; if (!(v.I > Vp / v.R2)) return 'The total current must be larger than the current in R2 — recheck the measurements.'; return undefined },
      compute: (v) => { const V1 = v.I * v.R1; const Vp = v.V - V1; const I2 = Vp / v.R2; const I3 = v.I - I2; return { V1, Vp, I2, I3, R3: Vp / I3 } },
      steps: (v, o) => [`1. V1 = I × R1 = ${S('current', v.I)} × ${S('resistance', v.R1)} = ${S('voltage', o.V1)}  (all current passes through R1: series)`, `2. Vp = V − V1 = ${S('voltage', v.V)} − ${S('voltage', o.V1)} = ${S('voltage', o.Vp)}  (KVL: the remaining voltage is across the parallel pair)`, `3. I2 = Vp / R2 = ${S('current', o.I2)}  (current in the known branch)`, `4. I3 = I − I2 = ${S('current', o.I3)}  (KCL: the rest flows through R3)`, `5. R3 = Vp / I3 = ${S('resistance', o.R3)}  (Ohm's law for R3 alone)`],
      examples: [ex('P2 12 V, 6 mA, 1 kΩ, 2 kΩ', { V: 12, I: 0.006, R1: 1000, R2: 2000 }, { V1: 6, Vp: 6, I2: 0.003, I3: 0.003, R3: 2000 })] }),
    mode({ id: 'B', label: 'Method B: equivalent resistance', inputs: ['V', 'I', 'R1', 'R2'], outputs: ['Rt', 'Rp', 'R3'], equation: 'Rt = V/I;  Rp = Rt − R1;  R3 = R2·Rp / (R2 − Rp)',
      check: (v) => { const Rp = v.V / v.I - v.R1; if (!(Rp > 0)) return 'V / I must be larger than R1 — recheck the measurements.'; if (!(Rp < v.R2)) return 'Requires Rp < R2 — recheck the measurements.'; return undefined },
      compute: (v) => { const Rt = v.V / v.I; const Rp = Rt - v.R1; return { Rt, Rp, R3: (v.R2 * Rp) / (v.R2 - Rp) } },
      steps: (v, o) => [`1. Rt = V / I = ${S('resistance', o.Rt)}  (total resistance of the circuit)`, `2. Rp = Rt − R1 = ${S('resistance', o.Rt)} − ${S('resistance', v.R1)} = ${S('resistance', o.Rp)}  (what's left is R2 ∥ R3)`, `3. R3 = R2 × Rp / (R2 − Rp) = ${S('resistance', o.R3)}  (remove R2 from the parallel pair)`],
      examples: [ex('P2 12 V, 6 mA, 1 kΩ, 2 kΩ', { V: 12, I: 0.006, R1: 1000, R2: 2000 }, { Rt: 2000, Rp: 1000, R3: 2000 })] }),
  ],
})

export const p3 = defineFormula({
  id: 'p3-unknown-series', section: 's17', title: 'P3 · Unknown resistor in series', page: 20,
  equation: 'Rx = V / I − R1   or   Rx = R1 × (V − V1) / V1',
  meaning: 'GIVEN supply voltage V, current I (or the voltage V1 across R1), resistor R1. FIND Rx, in series with R1. At least one resistance must be known — two voltages alone are not enough.',
  fields: [V_('V', 'V', 'Supply voltage', { sign: 'pos' }), I_('I', 'I', 'Current', { sign: 'pos' }), V_('V1', 'V1', 'Voltage across R1', { sign: 'pos' }), R_('R1', 'R1', 'Known resistor'), V_('Vx', 'Vx', 'Voltage across Rx'), R_('Rx', 'Rx', 'Unknown resistor')],
  unitsNote: '',
  exampleText: 'V = 9 V, I = 15 mA, R1 = 330 Ω → V1 = 4.95 V → Vx = 4.05 V → Rx = 270 Ω.',
  visual: 'p3',
  modes: [
    mode({ id: 'I', label: 'Known: current', inputs: ['V', 'I', 'R1'], outputs: ['Vx', 'Rx'], equation: 'Vx = V − I·R1;  Rx = Vx / I',
      check: (v) => (v.V > v.I * v.R1 ? undefined : 'I × R1 must be smaller than V — recheck the measurements.'),
      compute: (v) => { const Vx = v.V - v.I * v.R1; return { Vx, Rx: Vx / v.I } },
      steps: (v, o) => [`1. Voltage across R1: ${N(v.I)} A × ${N(v.R1)} Ω = ${N(v.I * v.R1)} V`, `2. Vx = V − I × R1 = ${N(v.V)} − ${N(v.I * v.R1)} = ${S('voltage', o.Vx)}  (KVL: supply minus the drop on R1)`, `3. Rx = Vx / I = ${S('voltage', o.Vx)} / ${S('current', v.I)} = ${S('resistance', o.Rx)}  (series: same current through Rx)`],
      examples: [ex('P3 9 V, 15 mA, 330 Ω', { V: 9, I: 0.015, R1: 330 }, { Vx: 4.05, Rx: 270 })] }),
    mode({ id: 'V1', label: 'Known: voltage across R1', inputs: ['V', 'V1', 'R1'], outputs: ['I', 'Rx'], equation: 'I = V1 / R1;  Rx = R1 × (V − V1) / V1',
      check: (v) => (v.V > v.V1 ? undefined : 'V1 must be smaller than the supply V.'),
      compute: (v) => ({ I: v.V1 / v.R1, Rx: (v.R1 * (v.V - v.V1)) / v.V1 }),
      steps: (v, o) => [`1. I = V1 / R1 = ${S('voltage', v.V1)} / ${S('resistance', v.R1)} = ${S('current', o.I)}`, `2. Rx = R1 × (V − V1) / V1 = ${N(v.R1)} × ${N(v.V - v.V1)} / ${N(v.V1)} = ${S('resistance', o.Rx)}`],
      examples: [ex('P3 9 V, V1 = 4.95 V, 330 Ω', { V: 9, V1: 4.95, R1: 330 }, { I: 0.015, Rx: 270 })] }),
  ],
})

export const p4 = defineFormula({
  id: 'p4-thevenin', section: 's17', title: 'P4 · Any two-terminal circuit as one source (Thévenin)', page: 20,
  equation: 'VL = Vth × RL / (Rth + RL)',
  meaning: 'GIVEN a circuit feeding a load — e.g. a divider, sensor output, or battery with wiring. FIND load voltage and current for any load RL, without re-solving the whole circuit.',
  analogy: 'Any messy two-wire box acts like one ideal battery (Vth) with one resistor (Rth) in series. Hook the load to that simple model instead.',
  fields: [
    V_('Vth', 'Vth', 'Open-circuit voltage'), R_('Rth', 'Rth', 'Thévenin resistance'), R_('RL', 'RL', 'Load resistor'), I_('IL', 'IL', 'Load current'), V_('VL', 'VL', 'Load voltage'),
    field('Pmax', 'Pmax', 'Max load power (RL = Rth)', 'power'), V_('Vin', 'Vin', 'Divider input', { sign: 'pos' }), R_('R1', 'R1', 'Divider R1'), R_('R2', 'R2', 'Divider R2'),
    V_('Voc', 'Voc', 'Open-circuit voltage'), I_('Isc', 'Isc', 'Short-circuit current', { sign: 'pos' }),
  ],
  unitsNote: 'Rule: a divider output stays within ~10% if RL ≥ 10 × Rth. Maximum power to the load when RL = Rth: PL = Vth² / (4·Rth).',
  exampleText: 'Divider 12 V, R1 = R2 = 10 kΩ: Vth = 6 V, Rth = 5 kΩ. Load 10 kΩ → IL = 0.4 mA → VL = 4 V (not 6 V — the load pulls the divider down).',
  visual: 'p4',
  modes: [
    mode({ id: 'divider', label: 'Divider → Thévenin → load', inputs: ['Vin', 'R1', 'R2', 'RL'], outputs: ['Vth', 'Rth', 'IL', 'VL'], equation: 'Vth = Vin·R2/(R1+R2);  Rth = R1 ∥ R2',
      compute: (v) => { const Vth = (v.Vin * v.R2) / (v.R1 + v.R2); const Rth = (v.R1 * v.R2) / (v.R1 + v.R2); const IL = Vth / (Rth + v.RL); return { Vth, Rth, IL, VL: IL * v.RL } },
      warn: (v, o) => (v.RL < 10 * o.Rth ? [`RL is less than 10 × Rth (${S('resistance', 10 * o.Rth)}): the load pulls the output down noticeably.`] : []),
      steps: (v, o) => [`1. Vth = open-circuit output = Vin × R2/(R1+R2) = ${S('voltage', o.Vth)}`, `2. Rth = R1 ∥ R2 = ${S('resistance', o.Rth)}  (sources off: the supply is a wire)`, `3. IL = Vth / (Rth + RL) = ${S('voltage', o.Vth)} / ${S('resistance', o.Rth + v.RL)} = ${S('current', o.IL)}`, `4. VL = IL × RL = ${S('voltage', o.VL)}`],
      examples: [ex('P4 12 V divider 10k/10k, load 10k', { Vin: 12, R1: 10000, R2: 10000, RL: 10000 }, { Vth: 6, Rth: 5000, IL: 0.0004, VL: 4 })] }),
    mode({ id: 'load', label: 'Known Vth and Rth', inputs: ['Vth', 'Rth', 'RL'], outputs: ['IL', 'VL', 'Pmax'], equation: 'IL = Vth/(Rth+RL);  VL = IL × RL',
      compute: (v) => { const IL = v.Vth / (v.Rth + v.RL); return { IL, VL: IL * v.RL, Pmax: v.Vth ** 2 / (4 * v.Rth) } },
      steps: (v, o) => [`IL = Vth / (Rth + RL) = ${N(v.Vth)} / ${N(v.Rth + v.RL)} = ${S('current', o.IL)}`, `VL = IL × RL = ${S('voltage', o.VL)}`, `Maximum power transfer happens when RL = Rth: Pmax = Vth² / (4·Rth) = ${S('power', o.Pmax)}`],
      examples: [ex('P4 Vth 6 V, Rth 5 kΩ, RL 10 kΩ', { Vth: 6, Rth: 5000, RL: 10000 }, { IL: 0.0004, VL: 4, Pmax: 0.0018 })] }),
    mode({ id: 'rth', label: 'Rth from Voc and Isc', inputs: ['Voc', 'Isc'], outputs: ['Rth'], equation: 'Rth = Voc / Isc',
      compute: (v) => ({ Rth: v.Voc / v.Isc }),
      steps: (v, o) => [`Rth = Voc / Isc = ${S('voltage', v.Voc)} / ${S('current', v.Isc)} = ${S('resistance', o.Rth)}`],
      examples: [ex('6 V open, 1.2 mA short', { Voc: 6, Isc: 0.0012 }, { Rth: 5000 })] }),
  ],
})

export const p5 = defineFormula({
  id: 'p5-millman', section: 's17', title: 'P5 · Two sources feeding one node (Millman)', page: 20,
  equation: 'V = (V1/R1 + V2/R2) / (1/R1 + 1/R2 + 1/R3)',
  meaning: 'GIVEN sources V1, V2 with series resistors R1, R2, and a load R3 — all joined at one node. FIND the node voltage V and each branch current. A weighted average of the sources.',
  fields: [
    field('V1', 'V1', 'Source 1', 'voltage'), field('V2', 'V2', 'Source 2', 'voltage'), R_('R1', 'R1', 'Resistor in series with V1'), R_('R2', 'R2', 'Resistor in series with V2'), R_('R3', 'R3', 'Load resistor'),
    field('V', 'V', 'Node voltage', 'voltage'), field('I1', 'I1', 'Current from source 1', 'current'), field('I2', 'I2', 'Current from source 2', 'current'), field('I3', 'I3', 'Load current', 'current'),
  ],
  unitsNote: 'Negative result = current flows back into that source. This is why two supplies are joined through diodes (diode-OR).',
  exampleText: 'V1 = 12 V, V2 = 5 V, R1 = R2 = R3 = 100 Ω → V = (0.12 + 0.05) / 0.03 = 5.67 V. I1 = 63.3 mA, I2 = −6.7 mA (the 12 V source back-feeds the 5 V one), I3 = 56.7 mA ✓.',
  visual: 'p5',
  modes: [mode({
    id: 'V', inputs: ['V1', 'V2', 'R1', 'R2', 'R3'], outputs: ['V', 'I1', 'I2', 'I3'], equation: 'V = (V1/R1 + V2/R2) / (1/R1 + 1/R2 + 1/R3)',
    compute: (v) => { const V = (v.V1 / v.R1 + v.V2 / v.R2) / (1 / v.R1 + 1 / v.R2 + 1 / v.R3); return { V, I1: (v.V1 - V) / v.R1, I2: (v.V2 - V) / v.R2, I3: V / v.R3 } },
    warn: (_v, o) => [o.I1 < 0 || o.I2 < 0 ? 'A negative current means that source is being charged by the other one.' : 'Both sources deliver current.', `Check (KCL): I1 + I2 = ${S('current', o.I1 + o.I2)} = I3 ✓`],
    steps: (v, o) => [`1. V = (${N(v.V1 / v.R1)} + ${N(v.V2 / v.R2)}) / ${N(1 / v.R1 + 1 / v.R2 + 1 / v.R3)} = ${S('voltage', o.V)}  (weighted average of the sources)`, `2. I1 = (V1 − V) / R1 = ${S('current', o.I1)}`, `3. I2 = (V2 − V) / R2 = ${S('current', o.I2)}`, `4. I3 = V / R3 = ${S('current', o.I3)}   (check: I1 + I2 = I3)`],
    examples: [ex('P5 12 V / 5 V, 100 Ω each', { V1: 12, V2: 5, R1: 100, R2: 100, R3: 100 }, { V: 5.6667, I1: 0.06333, I2: -0.006667, I3: 0.05667 }, 0.001)],
  })],
})

/* 17.2 Dividers, sensors and bridges */
export const p6 = defineFormula({
  id: 'p6-adc-divider', section: 's17', title: 'P6 · Design a divider for an ADC input', page: 21,
  equation: 'R1 = R2 × (Vin,max − Vout) / Vout   ·   Vin = Vadc × (R1 + R2) / R2',
  meaning: 'GIVEN maximum input voltage Vin,max, maximum safe ADC voltage Vout, a chosen R2. FIND R1, and the formula to convert the ADC reading back to the input voltage.',
  fields: [
    V_('Vin', 'Vin,max', 'Max input voltage', { sign: 'pos' }), V_('Vout', 'Vout', 'Target ADC voltage', { sign: 'pos' }), R_('R2', 'R2', 'Bottom resistor'), R_('R1', 'R1', 'Top resistor'),
    field('k', 'factor', 'Readback factor (R1+R2)/R2', 'ratio'), I_('I', 'I', 'Divider current at max input'),
  ],
  unitsNote: 'Keep R1 + R2 ≤ ~100 kΩ for most MCU ADCs; higher values give noisy readings. A larger R1 lowers Vout — safer for the pin.',
  exampleText: 'Measure up to 15 V on a 3.3 V ADC, target 3.0 V, R2 = 10 kΩ → R1 = 10 kΩ × 12 / 3 = 40 kΩ → 39 kΩ (at 15 V: 15 × 10/49 = 3.06 V ✓). 5 V → 3.3 V logic level shift: R1 = 1 kΩ, R2 = 2 kΩ → 3.33 V.',
  visual: 'p6', keywords: ['level shifter', 'adc'],
  modes: [
    mode({ id: 'R1', inputs: ['Vin', 'Vout', 'R2'], outputs: ['R1', 'k', 'I'], equation: 'R1 = R2 × (Vin,max − Vout) / Vout',
      check: (v) => (v.Vin > v.Vout ? undefined : 'Vin,max must be larger than the target Vout (otherwise you need no divider).'),
      compute: (v) => { const R1 = (v.R2 * (v.Vin - v.Vout)) / v.Vout; return { R1, k: (R1 + v.R2) / v.R2, I: v.Vin / (R1 + v.R2) } },
      warn: (v, o) => {
        const up = e12Up(o.R1); const down = e12Down(o.R1)
        const vo = (r: number) => (v.Vin * v.R2) / (r + v.R2)
        const w = [`Round R1 up to a standard value: ${S('resistance', up)} → Vout(max) = ${S('voltage', vo(up))} (safe). Nearest lower value ${S('resistance', down)} → ${S('voltage', vo(down))}${vo(down) > v.Vout ? ' (above target — check the pin limit!)' : ''}.`]
        if (o.R1 + v.R2 > 100e3) w.push('R1 + R2 is above ~100 kΩ: ADC readings may be noisy.')
        return w
      },
      steps: (v, o) => [`1. R1 = R2 × (Vin,max − Vout) / Vout = ${N(v.R2)} × ${N(v.Vin - v.Vout)} / ${N(v.Vout)} = ${S('resistance', o.R1)}`, '2. Round R1 up to a standard value (a larger R1 lowers Vout — safer for the pin).', `3. Readback: Vin = Vadc × (R1 + R2) / R2 = Vadc × ${N(o.k)}`, `4. Divider current at max input: I = Vin / (R1 + R2) = ${S('current', o.I)}`],
      examples: [ex('P6 15 V → 3.0 V, R2 = 10 kΩ', { Vin: 15, Vout: 3, R2: 10000 }, { R1: 40000, k: 5, I: 0.0003 }), ex('§17 P6 5 V → 3.33 V level shift (R1 = 1 kΩ, R2 = 2 kΩ)', { Vin: 5, Vout: 10 / 3, R2: 2000 }, { R1: 1000, k: 1.5, I: 5 / 3000 }, 1e-6)] }),
    mode({ id: 'R2', label: 'Find R2 (R1 chosen)', inputs: ['Vin', 'Vout', 'R1'], outputs: ['R2'], equation: 'R2 = R1 × Vout / (Vin − Vout)',
      check: (v) => (v.Vin > v.Vout ? undefined : 'Vin,max must be larger than the target Vout.'),
      compute: (v) => ({ R2: (v.R1 * v.Vout) / (v.Vin - v.Vout) }),
      steps: (v, o) => [`R2 = R1 × Vout / (Vin − Vout) = ${N(v.R1)} × ${N(v.Vout)} / ${N(v.Vin - v.Vout)} = ${S('resistance', o.R2)}`],
      examples: [ex('R1 = 40 kΩ', { Vin: 15, Vout: 3, R1: 40000 }, { R2: 10000 })] }),
  ],
})

export const p7 = defineFormula({
  id: 'p7-sensor-divider', section: 's17', title: 'P7 · Unknown resistance from a divider reading (NTC, LDR, pot)', page: 21,
  equation: 'Rs = Rf × Vout / (Vin − Vout)   (sensor at bottom)',
  meaning: 'GIVEN supply Vin, known fixed resistor Rf (top), measured Vout across the sensor (bottom). FIND sensor resistance Rs.',
  fields: [
    V_('Vin', 'Vin', 'Supply voltage', { sign: 'pos' }), R_('Rf', 'Rf', 'Fixed resistor'), V_('Vout', 'Vout', 'Measured voltage', { sign: 'pos' }), R_('Rs', 'Rs', 'Sensor resistance'), I_('I', 'I', 'Divider current'),
    field('Reading', 'Reading', 'ADC reading', 'count', { sign: 'nonneg', integer: true }), V_('Vref', 'Vref', 'ADC reference', { sign: 'pos' }), field('n', 'n', 'ADC bits', 'bits', { sign: 'pos', integer: true, min: 1, max: 32 }),
  ],
  unitsNote: 'Best resolution when Rf ≈ sensor value mid-range. It works because Rf is known.',
  exampleText: '3.3 V, Rf = 10 kΩ, 12-bit ADC reads 1365 → Vout = 1365 × 3.3 / 4095 = 1.10 V → I = 0.22 mA → Rs = 1.10 V / 0.22 mA = 5 kΩ.',
  visual: 'p7',
  modes: [
    mode({ id: 'bottom', label: 'Sensor at bottom', inputs: ['Vin', 'Rf', 'Vout'], outputs: ['I', 'Rs'], equation: 'I = (Vin − Vout)/Rf;  Rs = Vout / I',
      check: (v) => (v.Vout < v.Vin ? undefined : 'Vout must be smaller than Vin.'),
      compute: (v) => { const I = (v.Vin - v.Vout) / v.Rf; return { I, Rs: v.Vout / I } },
      steps: (v, o) => [`1. I = (Vin − Vout) / Rf = ${N(v.Vin - v.Vout)} / ${N(v.Rf)} = ${S('current', o.I)}  (voltage across Rf ÷ its value)`, `2. Rs = Vout / I = ${S('voltage', v.Vout)} / ${S('current', o.I)} = ${S('resistance', o.Rs)}  (series: the same current flows through the sensor)`],
      examples: [ex('P7 3.3 V, 10 kΩ, 1.1 V', { Vin: 3.3, Rf: 10000, Vout: 1.1 }, { I: 0.00022, Rs: 5000 })] }),
    mode({ id: 'top', label: 'Sensor at top', inputs: ['Vin', 'Rf', 'Vout'], outputs: ['Rs'], equation: 'Rs = Rf × (Vin − Vout) / Vout',
      check: (v) => (v.Vout < v.Vin ? undefined : 'Vout must be smaller than Vin.'),
      compute: (v) => ({ Rs: (v.Rf * (v.Vin - v.Vout)) / v.Vout }),
      steps: (v, o) => [`Rs = Rf × (Vin − Vout) / Vout = ${N(v.Rf)} × ${N(v.Vin - v.Vout)} / ${N(v.Vout)} = ${S('resistance', o.Rs)}`],
      examples: [ex('P7 sensor at top', { Vin: 3.3, Rf: 10000, Vout: 2.2 }, { Rs: 5000 })] }),
    mode({ id: 'adc', label: 'From an ADC reading', inputs: ['Vin', 'Rf', 'Reading', 'Vref', 'n'], outputs: ['Vout', 'Rs'], equation: 'Vout = Reading × Vref / (2ⁿ − 1);  then sensor at bottom',
      check: (v) => (v.Reading <= 2 ** v.n - 1 ? (v.Reading * v.Vref) / (2 ** v.n - 1) < v.Vin ? undefined : 'The ADC voltage must be below Vin.' : `A ${v.n}-bit ADC cannot read above ${2 ** v.n - 1}.`),
      compute: (v) => { const Vout = (v.Reading * v.Vref) / (2 ** v.n - 1); return { Vout, Rs: (v.Rf * Vout) / (v.Vin - Vout) } },
      steps: (v, o) => [`1. Vout = Reading × Vref / (2^${v.n} − 1) = ${N(v.Reading)} × ${N(v.Vref)} / ${N(2 ** v.n - 1)} = ${S('voltage', o.Vout)}`, `2. I = (Vin − Vout) / Rf = ${S('current', (v.Vin - o.Vout) / v.Rf)}`, `3. Rs = Vout / I = ${S('resistance', o.Rs)}`],
      examples: [ex('P7 12-bit reads 1365', { Vin: 3.3, Rf: 10000, Reading: 1365, Vref: 3.3, n: 12 }, { Vout: 1.1, Rs: 5000 }, 0.001)] }),
  ],
})

export const p8 = defineFormula({
  id: 'p8-wheatstone', section: 's17', title: 'P8 · Wheatstone bridge (precise unknown resistance)', page: 22,
  equation: 'Rx = R2 × R3 / R1',
  meaning: 'GIVEN R1 and R2 (left branch), adjustable R3 (right top), meter between the two midpoints. FIND Rx (right bottom). Adjust R3 until the meter reads 0 V.',
  fields: [R_('R1', 'R1', 'Left top'), R_('R2', 'R2', 'Left bottom'), R_('R3', 'R3', 'Right top (adjustable)'), R_('Rx', 'Rx', 'Unknown (right bottom)'), V_('V', 'V', 'Supply voltage', { sign: 'pos' }), field('Vout', 'Vout', 'Bridge output', 'voltage')],
  unitsNote: 'Used for strain gauges, load cells (HX711 modules) and precise resistance measurement. Accuracy depends on R1, R2, R3 — not on the meter or supply.',
  exampleText: 'R1 = 1 kΩ, R2 = 10 kΩ, balance at R3 = 470 Ω → Rx = 10 kΩ × 470 Ω / 1 kΩ = 4.7 kΩ.',
  visual: 'p8',
  modes: [
    mode({ id: 'Rx', label: 'Balanced: find Rx', inputs: ['R1', 'R2', 'R3'], outputs: ['Rx'], equation: 'R1/R2 = R3/Rx  →  Rx = R2 × R3 / R1',
      compute: (v) => ({ Rx: (v.R2 * v.R3) / v.R1 }),
      steps: (v, o) => ['1. Adjust R3 until the meter reads 0 V (both midpoints at the same voltage).', '2. At balance both branches divide the supply in the same ratio: R1 / R2 = R3 / Rx.', `3. Rx = R2 × R3 / R1 = ${N(v.R2)} × ${N(v.R3)} / ${N(v.R1)} = ${S('resistance', o.Rx)}  (the supply voltage cancels out)`],
      examples: [ex('P8 1 kΩ, 10 kΩ, 470 Ω', { R1: 1000, R2: 10000, R3: 470 }, { Rx: 4700 })] }),
    mode({ id: 'Vout', label: 'Unbalanced output', inputs: ['V', 'R1', 'R2', 'R3', 'Rx'], outputs: ['Vout'], equation: 'Vout = V × (R2/(R1+R2) − Rx/(R3+Rx))',
      compute: (v) => ({ Vout: v.V * (v.R2 / (v.R1 + v.R2) - v.Rx / (v.R3 + v.Rx)) }),
      steps: (v, o) => [`Left midpoint: ${N(v.V)} × ${N(v.R2 / (v.R1 + v.R2))} = ${N(v.V * v.R2 / (v.R1 + v.R2))} V`, `Right midpoint: ${N(v.V)} × ${N(v.Rx / (v.R3 + v.Rx))} = ${N(v.V * v.Rx / (v.R3 + v.Rx))} V`, `Vout = difference = ${S('voltage', o.Vout)}`],
      examples: [ex('balanced bridge reads 0', { V: 5, R1: 1000, R2: 1000, R3: 1000, Rx: 1000 }, { Vout: 0 }), ex('Rx = 1.1 kΩ', { V: 5, R1: 1000, R2: 1000, R3: 1000, Rx: 1100 }, { Vout: 5 * (0.5 - 1100 / 2100) }, 1e-6)] }),
  ],
})

/* 17.3 Capacitors, inductors and timing */
export const p9 = defineFormula({
  id: 'p9-time-to-voltage', section: 's17', title: 'P9 · Time for a capacitor to reach a voltage', page: 23,
  equation: 't = RC × ln(Vs / (Vs − V))   ·   t = RC × ln(V0 / V)',
  meaning: 'GIVEN supply Vs, R, C, threshold voltage V (e.g. MCU reset or logic threshold). FIND time t — or the R (or C) needed for a target delay.',
  fields: [
    V_('Vs', 'Vs', 'Supply voltage', { sign: 'pos' }), V_('V0', 'V0', 'Starting voltage', { sign: 'pos' }), R_('R', 'R', 'Resistance'), C_('C', 'C', 'Capacitance'), V_('V', 'V', 'Threshold voltage', { sign: 'pos' }),
    field('t', 't', 'Time', 'time', { sign: 'pos' }), field('tau', 'τ', 'Time constant', 'time'),
  ],
  unitsNote: 'ln = natural log (the "ln" key). Reference points: 63% at 1τ, 86% at 2τ, 95% at 3τ, 99% at 5τ. To half the supply: t = 0.69 × RC. Electrolytic capacitors have ±20% tolerance — for accurate timing use film or C0G capacitors.',
  exampleText: 'Power-on delay: 3.3 V, R = 10 kΩ, C = 10 µF, threshold 2.0 V → τ = 100 ms → t = 100 ms × ln(3.3/1.3) = 93 ms. For 500 ms: R = 0.5 / (10 µF × 0.93) = 53.7 kΩ → 56 kΩ.',
  visual: 'rc-charge', concepts: ['ln', 'exp', 'tau'],
  modes: [
    mode({ id: 'charge', label: 'Charging: find t', inputs: ['Vs', 'R', 'C', 'V'], outputs: ['tau', 't'], equation: 't = τ × ln(Vs / (Vs − V))',
      check: (v) => (v.V < v.Vs ? undefined : 'The threshold must be below the supply voltage — a charging capacitor never quite reaches Vs.'),
      compute: (v) => { const tau = v.R * v.C; return { tau, t: tau * Math.log(v.Vs / (v.Vs - v.V)) } },
      steps: (v, o) => [`1. τ = R × C = ${S('resistance', v.R)} × ${S('capacitance', v.C)} = ${S('time', o.tau)}`, `2. Vs / (Vs − V) = ${N(v.Vs)} / ${N(v.Vs - v.V)} = ${N(v.Vs / (v.Vs - v.V))}`, `3. ln(${N(v.Vs / (v.Vs - v.V))}) = ${N(Math.log(v.Vs / (v.Vs - v.V)))}`, `4. t = τ × ln(…) = ${S('time', o.tau)} × ${N(Math.log(v.Vs / (v.Vs - v.V)))} = ${S('time', o.t)}`],
      examples: [ex('P9 3.3 V, 10 kΩ, 10 µF, 2.0 V', { Vs: 3.3, R: 10000, C: 10 * micro, V: 2 }, { tau: 0.1, t: 0.09316 }, 0.001)] }),
    mode({ id: 'discharge', label: 'Discharging: find t', inputs: ['V0', 'R', 'C', 'V'], outputs: ['tau', 't'], equation: 't = τ × ln(V0 / V)',
      check: (v) => (v.V < v.V0 ? undefined : 'The target must be below the starting voltage.'),
      compute: (v) => { const tau = v.R * v.C; return { tau, t: tau * Math.log(v.V0 / v.V) } },
      steps: (v, o) => [`1. τ = R × C = ${S('time', o.tau)}`, `2. ln(V0 / V) = ln(${N(v.V0 / v.V)}) = ${N(Math.log(v.V0 / v.V))}`, `3. t = τ × ln(V0 / V) = ${S('time', o.t)}`],
      examples: [ex('12 V → 4.41 V, RC = 10 ms', { V0: 12, R: 10000, C: 1e-6, V: 4.4146 }, { tau: 0.01, t: 0.01 }, 0.001)] }),
    mode({ id: 'R', label: 'Find R for a target delay', inputs: ['Vs', 'C', 'V', 't'], outputs: ['R'], equation: 'R = t / (C × ln(Vs / (Vs − V)))',
      check: (v) => (v.V < v.Vs ? undefined : 'The threshold must be below the supply voltage.'),
      compute: (v) => ({ R: v.t / (v.C * Math.log(v.Vs / (v.Vs - v.V))) }),
      warn: (_v, o) => [`Nearest standard value (E12): ${S('resistance', e12Up(o.R))} or ${S('resistance', e12Down(o.R))}.`],
      steps: (v, o) => [`ln(Vs / (Vs − V)) = ${N(Math.log(v.Vs / (v.Vs - v.V)))}`, `R = t / (C × ln) = ${N(v.t)} / (${N(v.C)} × ${N(Math.log(v.Vs / (v.Vs - v.V)))}) = ${S('resistance', o.R)}`],
      examples: [ex('P9 500 ms with 10 µF', { Vs: 3.3, C: 10 * micro, V: 2, t: 0.5 }, { R: 53670 }, 0.001)] }),
    mode({ id: 'C', label: 'Find C for a target delay', inputs: ['Vs', 'R', 'V', 't'], outputs: ['C'], equation: 'C = t / (R × ln(Vs / (Vs − V)))',
      check: (v) => (v.V < v.Vs ? undefined : 'The threshold must be below the supply voltage.'),
      compute: (v) => ({ C: v.t / (v.R * Math.log(v.Vs / (v.Vs - v.V))) }),
      steps: (v, o) => [`ln(Vs / (Vs − V)) = ${N(Math.log(v.Vs / (v.Vs - v.V)))}`, `C = t / (R × ln) = ${S('capacitance', o.C)}`],
      examples: [ex('inverse', { Vs: 3.3, R: 10000, V: 2, t: 0.09316 }, { C: 10 * micro }, 0.001)] }),
  ],
})

export const p10 = defineFormula({
  id: 'p10-choose-rc', section: 's17', title: 'P10 · Choose R or C for a filter, time constant or 555', page: 23,
  equation: 'C = 1/(2πRfc)  ·  C = τ/R  ·  R2 = (1.44/(fC) − R1)/2  ·  R = t/(1.1C)',
  meaning: 'GIVEN target cutoff fc, time constant τ, 555 frequency f or pulse t, and one chosen component. FIND the other component. Pick C from the standard values first (fewer choices), then calculate R.',
  fields: [
    field('fc', 'fc', 'Cutoff frequency', 'frequency', { sign: 'pos' }), R_('R', 'R', 'Resistor'), C_('C', 'C', 'Capacitor'), field('tau', 'τ', 'Time constant', 'time', { sign: 'pos' }),
    field('f', 'f', '555 frequency', 'frequency', { sign: 'pos' }), R_('R1', 'R1', '555 R1'), R_('R2', 'R2', '555 R2', { sign: 'any' }), field('t', 't', 'Pulse length', 'time', { sign: 'pos' }),
  ],
  unitsNote: 'Electrolytic capacitors have ±20% tolerance — for accurate timing use film or C0G capacitors.',
  exampleText: '1 kHz low-pass, R = 10 kΩ → C = 1 / (6.283 × 10 000 × 1000) = 15.9 nF → 15 nF (fc = 1.06 kHz). 555 at 1 kHz, C = 10 nF, R1 = 1 kΩ → R2 = 71.5 kΩ → 68 kΩ. 555 one-shot 5 s, C = 100 µF → R = 45.5 kΩ → 47 kΩ.',
  visual: 'filter-rc',
  modes: [
    mode({ id: 'C_fc', label: 'Filter: find C', inputs: ['fc', 'R'], outputs: ['C'], equation: 'C = 1 / (2π × R × fc)', compute: (v) => ({ C: 1 / (TWO_PI * v.R * v.fc) }),
      steps: (v, o) => [`C = 1 / (2π × ${N(v.R)} × ${N(v.fc)}) = ${S('capacitance', o.C)}`, `Nearest standard values: ${S('capacitance', e12Down(o.C * 1e9) * 1e-9)} or ${S('capacitance', e12Up(o.C * 1e9) * 1e-9)}`],
      examples: [ex('P10 1 kHz, 10 kΩ', { fc: 1000, R: 10000 }, { C: 15.9e-9 }, 0.005)] }),
    mode({ id: 'R_fc', label: 'Filter: find R', inputs: ['fc', 'C'], outputs: ['R'], equation: 'R = 1 / (2π × C × fc)', compute: (v) => ({ R: 1 / (TWO_PI * v.C * v.fc) }),
      steps: (v, o) => [`R = 1 / (2π × ${N(v.C)} × ${N(v.fc)}) = ${S('resistance', o.R)}`],
      examples: [ex('inverse', { fc: 1000, C: 15.9e-9 }, { R: 10000 }, 0.005)] }),
    mode({ id: 'C_tau', label: 'τ: find C', inputs: ['tau', 'R'], outputs: ['C'], equation: 'C = τ / R', compute: (v) => ({ C: v.tau / v.R }),
      steps: (v, o) => [`C = τ / R = ${N(v.tau)} / ${N(v.R)} = ${S('capacitance', o.C)}`], examples: [ex('τ = 1 s, 10 kΩ', { tau: 1, R: 10000 }, { C: 100 * micro })] }),
    mode({ id: 'R2_555', label: '555 astable: find R2', inputs: ['f', 'C', 'R1'], outputs: ['R2'], equation: 'R2 = (1.44 / (f × C) − R1) / 2',
      check: (v) => (1.44 / (v.f * v.C) > v.R1 ? undefined : 'R1 is too large for this frequency and capacitor — R2 would be negative.'),
      compute: (v) => ({ R2: (1.44 / (v.f * v.C) - v.R1) / 2 }),
      steps: (v, o) => [`1.44 / (f × C) = ${S('resistance', 1.44 / (v.f * v.C))}`, `R2 = (that − R1) / 2 = ${S('resistance', o.R2)}`],
      examples: [ex('P10 555 at 1 kHz, 10 nF, 1 kΩ', { f: 1000, C: 10 * nano, R1: 1000 }, { R2: 71500 })] }),
    mode({ id: 'R_555', label: '555 one-shot: find R', inputs: ['t', 'C'], outputs: ['R'], equation: 'R = t / (1.1 × C)', compute: (v) => ({ R: v.t / (1.1 * v.C) }),
      steps: (v, o) => [`R = t / (1.1 × C) = ${N(v.t)} / (1.1 × ${N(v.C)}) = ${S('resistance', o.R)}`],
      examples: [ex('P10 5 s, 100 µF', { t: 5, C: 100 * micro }, { R: 45454.5 }, 0.001)] }),
  ],
})

export const p11 = defineFormula({
  id: 'p11-choose-lc', section: 's17', title: 'P11 · Choose L or C for a resonant frequency (LC tank, Colpitts)', page: 23,
  equation: 'C = 1 / ((2πf)² × L)   ·   L = 1 / ((2πf)² × C)',
  meaning: 'GIVEN target frequency f and one of L or C. FIND the other component. Colpitts: the two feedback capacitors are in series in the tank.',
  fields: [field('f', 'f', 'Target frequency', 'frequency', { sign: 'pos' }), L_('L', 'L', 'Inductance'), C_('C', 'C', 'Capacitance'), C_('Ctank', 'Ctank', 'Tank capacitance'), C_('C1', 'C1', 'Colpitts C1'), C_('C2', 'C2', 'Colpitts C2')],
  unitsNote: 'Shortcut: C (pF) = 25 330 / (f² × L), with f in MHz and L in µH. Stray capacitance (≈ 5–10 pF) pulls f lower. C1/C2 ratio sets the feedback.',
  exampleText: '7 MHz with L = 10 µH → (2π × 7×10⁶)² = 1.93×10¹⁵ → C = 51.7 pF. Colpitts: C1 = C2 ≈ 103 pF → use 100 pF plus a small trimmer.',
  visual: 'resonance',
  modes: [
    mode({ id: 'C', label: 'Find C', inputs: ['f', 'L'], outputs: ['C'], equation: 'C = 1 / ((2πf)² × L)', compute: (v) => ({ C: 1 / ((TWO_PI * v.f) ** 2 * v.L) }),
      steps: (v, o) => [`(2πf)² = (${N(TWO_PI * v.f)})² = ${N((TWO_PI * v.f) ** 2)}`, `C = 1 / (${N((TWO_PI * v.f) ** 2)} × ${N(v.L)}) = ${S('capacitance', o.C)}`],
      examples: [ex('P11 7 MHz, 10 µH', { f: 7 * mega, L: 10 * micro }, { C: 51.7 * pico }, 0.005)] }),
    mode({ id: 'L', label: 'Find L', inputs: ['f', 'C'], outputs: ['L'], equation: 'L = 1 / ((2πf)² × C)', compute: (v) => ({ L: 1 / ((TWO_PI * v.f) ** 2 * v.C) }),
      steps: (v, o) => [`L = 1 / (${N((TWO_PI * v.f) ** 2)} × ${N(v.C)}) = ${S('inductance', o.L)}`],
      examples: [ex('inverse', { f: 7 * mega, C: 51.7 * pico }, { L: 10 * micro }, 0.005)] }),
    mode({ id: 'colpitts', label: 'Colpitts: C1 = C2', inputs: ['Ctank'], outputs: ['C1'], equation: 'C1 = C2 = 2 × Ctank', compute: (v) => ({ C1: 2 * v.Ctank }),
      steps: (v, o) => [`Two equal capacitors in series give half: C1 = C2 = 2 × ${S('capacitance', v.Ctank)} = ${S('capacitance', o.C1)}`],
      examples: [ex('P11 51.7 pF tank', { Ctank: 51.7 * pico }, { C1: 103.4 * pico }, 0.002)] }),
    mode({ id: 'ctank', label: 'Colpitts: tank capacitance', inputs: ['C1', 'C2'], outputs: ['Ctank'], equation: 'Ctank = C1 × C2 / (C1 + C2)', compute: (v) => ({ Ctank: (v.C1 * v.C2) / (v.C1 + v.C2) }),
      steps: (v, o) => [`Ctank = ${N(v.C1)} × ${N(v.C2)} / ${N(v.C1 + v.C2)} = ${S('capacitance', o.Ctank)}`],
      examples: [ex('100 pF + 100 pF', { C1: 100 * pico, C2: 100 * pico }, { Ctank: 50 * pico })] }),
  ],
})

export const p12 = defineFormula({
  id: 'p12-ac-measurement', section: 's17', title: 'P12 · Find unknown C or L from an AC measurement', page: 24,
  equation: 'X = V / I   ·   C = 1 / (2π f XC)   ·   L = XL / (2π f)',
  meaning: 'GIVEN AC voltage V and current I (RMS, from a multimeter), frequency f. FIND capacitance C or inductance L. Works for sine waves only; use V and I as RMS values.',
  fields: [V_('V', 'V', 'AC voltage (RMS)', { sign: 'pos' }), I_('I', 'I', 'AC current (RMS)', { sign: 'pos' }), field('f', 'f', 'Frequency', 'frequency', { sign: 'pos' }), R_('R', 'R', 'Coil wire resistance', { sign: 'nonneg' }),
    R_('X', 'X', 'Reactance'), C_('C', 'C', 'Capacitance'), L_('L', 'L', 'Inductance'), R_('Z', 'Z', 'Impedance')],
  unitsNote: 'If the part has resistance R (e.g. coil wire): Z = V / I, then remove R: X = √(Z² − R²).',
  exampleText: 'Capacitor on 12 V AC, 50 Hz, current 37.7 mA → XC = 318 Ω → C = 10 µF. Coil at 1 kHz, 1 V, 15.9 mA → XL = 62.9 Ω → L = 10 mH.',
  visual: 'impedance',
  modes: [
    mode({ id: 'C', label: 'Capacitor', inputs: ['V', 'I', 'f'], outputs: ['X', 'C'], equation: 'XC = V/I;  C = 1 / (2π f XC)', compute: (v) => { const X = v.V / v.I; return { X, C: 1 / (TWO_PI * v.f * X) } },
      steps: (v, o) => [`1. XC = V / I = ${S('voltage', v.V)} / ${S('current', v.I)} = ${S('resistance', o.X)}  (Ohm's law with reactance instead of resistance)`, `2. C = 1 / (2π × f × XC) = 1 / (${N(TWO_PI)} × ${N(v.f)} × ${N(o.X)}) = ${S('capacitance', o.C)}`],
      examples: [ex('P12 12 V, 50 Hz, 37.7 mA', { V: 12, I: 0.0377, f: 50 }, { X: 318.3, C: 10 * micro }, 0.005)] }),
    mode({ id: 'L', label: 'Coil (ideal)', inputs: ['V', 'I', 'f'], outputs: ['X', 'L'], equation: 'XL = V/I;  L = XL / (2π f)', compute: (v) => { const X = v.V / v.I; return { X, L: X / (TWO_PI * v.f) } },
      steps: (v, o) => [`1. XL = V / I = ${S('resistance', o.X)}`, `2. L = XL / (2π f) = ${N(o.X)} / ${N(TWO_PI * v.f)} = ${S('inductance', o.L)}`],
      examples: [ex('P12 1 kHz, 1 V, 15.9 mA', { V: 1, I: 0.0159, f: 1000 }, { X: 62.89, L: 0.01 }, 0.005)] }),
    mode({ id: 'L_R', label: 'Coil with wire resistance', inputs: ['V', 'I', 'f', 'R'], outputs: ['Z', 'X', 'L'], equation: 'Z = V/I;  X = √(Z² − R²);  L = X / (2π f)',
      check: (v) => (v.V / v.I > v.R ? undefined : 'Z = V / I must be larger than the coil resistance R.'),
      compute: (v) => { const Z = v.V / v.I; const X = Math.sqrt(Z ** 2 - v.R ** 2); return { Z, X, L: X / (TWO_PI * v.f) } },
      steps: (v, o) => [`1. Z = V / I = ${S('resistance', o.Z)}`, `2. X = √(Z² − R²) = √(${N(o.Z ** 2)} − ${N(v.R ** 2)}) = ${S('resistance', o.X)}  (remove the wire resistance)`, `3. L = X / (2π f) = ${S('inductance', o.L)}`],
      examples: [ex('62.89 Ω with 10 Ω wire', { V: 1, I: 0.0159, f: 1000, R: 10 }, { Z: 62.89, X: 62.09, L: 0.009882 }, 0.005)] }),
  ],
})

/* ── per-component tables for the guided problems ── */
const rRow = (label: string, R: number, V: number, I: number, share?: number): BreakdownRow => ({ label, value: { dim: 'resistance', x: R }, V, I, P: V * I, share })
for (const m of p1.modes) m.breakdown = (v, o) => parallelRBreakdown([v.R1, o.R2!], v.V)
for (const m of p2.modes) {
  m.breakdown = (v, o) => {
    const Vp = v.V - v.I * v.R1
    return [rRow('R1', v.R1, v.I * v.R1, v.I), rRow('R2', v.R2, Vp, Vp / v.R2, (Vp / v.R2) / v.I), rRow('R3', o.R3!, Vp, Vp / o.R3!, (Vp / o.R3!) / v.I)]
  }
}
p5.modes[0]!.breakdown = (v, o) => [rRow('R1', v.R1, o.I1! * v.R1, o.I1!), rRow('R2', v.R2, o.I2! * v.R2, o.I2!), rRow('R3', v.R3, o.V!, o.I3!)]
