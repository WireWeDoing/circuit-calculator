/* Measurement errors (Part 2 of the book): how the meter itself changes the reading. Not in the cheat sheet. */
import { defineFormula, ex, field, mode } from '../core/define.ts'
import { N, S } from '../core/fmt.ts'
import { kilo, mega } from '../core/units.ts'

const par = (a: number, b: number) => (a * b) / (a + b)
const pct = (got: number, want: number) => ((got - want) / want) * 100

export const meterLoading = defineFormula({
  id: 'meter-loading', title: 'Voltmeter loading',
  equation: 'Vread = V × (R2 ∥ Rin) / (R1 + R2 ∥ Rin)',
  meaning: 'A voltmeter is not invisible: its input resistance (about 10 MΩ for a digital multimeter, 1 MΩ for a scope on a 1× probe) sits in parallel with what you measure. Across high-value resistors the reading comes out low.',
  analogy: 'Checking the water pressure by opening a small tap: some water escapes through the gauge, so the pressure drops a little while you look.',
  fields: [
    field('V', 'V', 'Supply voltage', 'voltage', { sign: 'pos' }),
    field('R1', 'R1', 'Top resistor', 'resistance', { sign: 'pos' }),
    field('R2', 'R2', 'Bottom resistor (measured)', 'resistance', { sign: 'pos', description: 'the meter is connected across this one' }),
    field('Rm', 'Rin', 'Meter input resistance', 'resistance', { sign: 'pos', description: 'DMM ≈ 10 MΩ; scope 1 MΩ (1× probe) or 10 MΩ (10× probe)', presets: [{ label: 'DMM 10 MΩ', value: 10 * mega }, { label: 'Scope 1× probe 1 MΩ', value: mega }, { label: 'Scope 10× probe 10 MΩ', value: 10 * mega }] }),
    field('Vtrue', 'Vtrue', 'Voltage without the meter', 'voltage'),
    field('Vread', 'Vread', 'Voltage the meter shows', 'voltage'),
    field('err', 'error', 'Reading error', 'percent', { description: 'negative = the meter reads low' }),
  ],
  unitsNote: 'Enter resistances in the same kind of unit or let the unit picker convert (10 MΩ = 10 000 000 Ω). Rule of thumb: the error stays below 1 % while Rin is at least 100× the parallel value of R1 and R2.',
  visual: 'meter-loading', keywords: ['input impedance', 'loading', 'voltmeter', 'measurement error'],
  modes: [mode({
    id: 'read', label: 'What the meter shows', inputs: ['V', 'R1', 'R2', 'Rm'], outputs: ['Vtrue', 'Vread', 'err'], equation: 'Vread = V × (R2 ∥ Rin) / (R1 + R2 ∥ Rin)',
    compute: (v) => {
      const Vtrue = (v.V * v.R2) / (v.R1 + v.R2)
      const Rp = par(v.R2, v.Rm)
      const Vread = (v.V * Rp) / (v.R1 + Rp)
      return { Vtrue, Vread, err: pct(Vread, Vtrue) }
    },
    warn: (_v, o) => (Math.abs(o.err) > 1 ? ['Error over 1 %: use lower-value resistors, a 10× probe or a meter with a higher input resistance — or correct the reading with this calculator.'] : ['Error below 1 %: the meter barely disturbs this circuit.']),
    steps: (v, o) => {
      const Rp = par(v.R2, v.Rm)
      return [
        `Without the meter: Vtrue = V × R2 / (R1 + R2) = ${N(v.V)} × ${N(v.R2)} / (${N(v.R1)} + ${N(v.R2)}) = ${S('voltage', o.Vtrue)}`,
        `The meter is in parallel with R2: R2 ∥ Rin = (${N(v.R2)} × ${N(v.Rm)}) / (${N(v.R2)} + ${N(v.Rm)}) = ${S('resistance', Rp)}`,
        `With the meter: Vread = ${N(v.V)} × ${N(Rp)} / (${N(v.R1)} + ${N(Rp)}) = ${S('voltage', o.Vread)}`,
        `Error = (Vread − Vtrue) / Vtrue × 100 = ${N(o.err)} %`,
      ]
    },
    examples: [
      ex('1 MΩ + 1 MΩ divider on 10 V, 10 MΩ meter', { V: 10, R1: mega, R2: mega, Rm: 10 * mega }, { Vtrue: 5, Vread: 100 / 21, err: -100 / 21 }),
      ex('10 kΩ + 10 kΩ divider on 10 V, 10 MΩ meter', { V: 10, R1: 10 * kilo, R2: 10 * kilo, Rm: 10 * mega }, { Vtrue: 5, Vread: 10 * par(1e4, 1e7) / (1e4 + par(1e4, 1e7)), err: pct(10 * par(1e4, 1e7) / (1e4 + par(1e4, 1e7)), 5) }),
    ],
  })],
})

export const burdenVoltage = defineFormula({
  id: 'burden-voltage', title: 'Ammeter burden voltage',
  equation: 'Iread = V / (R + Rshunt) · Vburden = Iread × Rshunt',
  meaning: 'To measure current the meter passes it through a small shunt resistor. That resistor adds to the circuit, so the current is a little lower with the meter in place, and a small voltage (the burden voltage) is lost across the meter.',
  fields: [
    field('V', 'V', 'Supply voltage', 'voltage', { sign: 'pos' }),
    field('R', 'R', 'Load resistance', 'resistance', { sign: 'pos' }),
    field('Rs', 'Rshunt', 'Meter shunt resistance', 'resistance', { sign: 'pos', description: 'mA range: about 1–10 Ω; 10 A range: about 0.01 Ω (see the meter manual, often given as mV per mA)', presets: [{ label: 'mA range ≈ 10 Ω', value: 10 }, { label: '10 A range ≈ 0.01 Ω', value: 0.01 }] }),
    field('Itrue', 'Itrue', 'Current without the meter', 'current'),
    field('Iread', 'Iread', 'Current the meter shows', 'current'),
    field('Vb', 'Vburden', 'Voltage lost across the meter', 'voltage'),
    field('err', 'error', 'Reading error', 'percent'),
  ],
  unitsNote: 'Low-voltage circuits suffer most: 0.5 V of burden is nothing at 12 V but a lot at 1.5 V. Use the highest current range that still gives enough digits.',
  visual: 'burden', keywords: ['ammeter', 'shunt', 'measure current', 'measurement error'],
  modes: [mode({
    id: 'read', label: 'What the meter shows', inputs: ['V', 'R', 'Rs'], outputs: ['Itrue', 'Iread', 'Vb', 'err'], equation: 'Iread = V / (R + Rshunt)',
    compute: (v) => {
      const Itrue = v.V / v.R, Iread = v.V / (v.R + v.Rs)
      return { Itrue, Iread, Vb: Iread * v.Rs, err: pct(Iread, Itrue) }
    },
    warn: (_v, o) => (Math.abs(o.err) > 1 ? ['Error over 1 %: switch to a higher current range (smaller shunt), or measure the voltage across a known resistor instead and use I = V / R.'] : []),
    steps: (v, o) => [
      `Without the meter: Itrue = V / R = ${N(v.V)} / ${N(v.R)} = ${S('current', o.Itrue)}`,
      `The shunt adds in series: Iread = V / (R + Rshunt) = ${N(v.V)} / (${N(v.R)} + ${N(v.Rs)}) = ${S('current', o.Iread)}`,
      `Burden voltage = Iread × Rshunt = ${N(o.Iread)} × ${N(v.Rs)} = ${S('voltage', o.Vb)}`,
      `Error = (Iread − Itrue) / Itrue × 100 = ${N(o.err)} %`,
    ],
    examples: [ex('5 V across 100 Ω, 10 Ω shunt', { V: 5, R: 100, Rs: 10 }, { Itrue: 0.05, Iread: 5 / 110, Vb: 50 / 110, err: -100 / 11 })],
  })],
})

export const measurePages = [meterLoading, burdenVoltage]
