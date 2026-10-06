import { defineFormula, ex, field, mode } from '../core/define.ts'
import { N, S } from '../core/fmt.ts'


const ohmFields = [
  field('V', 'V', 'Voltage', 'voltage', { sign: 'nonneg', description: 'voltage across the component' }),
  field('I', 'I', 'Current', 'current', { sign: 'nonneg', description: 'current through the component' }),
  field('R', 'R', 'Resistance', 'resistance', { sign: 'pos', description: 'resistance of the component' }),
]

export const ohm = defineFormula({
  id: 'ohms-law', section: 's1', title: "Ohm's law", page: 2,
  equation: 'V = I × R   ·   I = V / R   ·   R = V / I',
  meaning: 'Relates voltage, current and resistance. Knowing any two gives the third.',
  analogy: 'Water in a pipe: voltage is the water pressure, current is the flow, resistance is how narrow the pipe is. More pressure → more flow; narrower pipe → less flow.',
  fields: ohmFields,
  unitsNote: 'Convert mA → A (÷ 1000) and kΩ → Ω (× 1000). Shortcuts: mA × kΩ = V; V ÷ mA = kΩ; V ÷ kΩ = mA.',
  exampleText: 'V: 0.02 A × 4700 Ω = 94 V · I: 9 V ÷ 1500 Ω = 0.006 A = 6 mA · R: 3 V ÷ 0.015 A = 200 Ω',
  visual: 'ohm', keywords: ['voltage', 'current', 'resistance', 'triangle'],
  modes: [
    mode({
      id: 'V', inputs: ['I', 'R'], outputs: ['V'], equation: 'V = I × R',
      compute: (v) => ({ V: v.I * v.R }),
      steps: (v, o) => [`V = I × R`, `V = ${S('current', v.I)} × ${S('resistance', v.R)} (base units: ${N(v.I)} A × ${N(v.R)} Ω)`, `V = ${S('voltage', o.V)}`],
      examples: [ex('§1 V = 0.02 A × 4700 Ω', { I: 0.02, R: 4700 }, { V: 94 })],
    }),
    mode({
      id: 'I', inputs: ['V', 'R'], outputs: ['I'], equation: 'I = V / R',
      compute: (v) => ({ I: v.V / v.R }),
      steps: (v, o) => [`I = V / R`, `I = ${S('voltage', v.V)} / ${S('resistance', v.R)} (base units: ${N(v.V)} V ÷ ${N(v.R)} Ω)`, `I = ${S('current', o.I)}`],
      examples: [ex('§1 I = 9 V ÷ 1500 Ω', { V: 9, R: 1500 }, { I: 0.006 })],
    }),
    mode({
      id: 'R', inputs: ['V', 'I'], outputs: ['R'], equation: 'R = V / I',
      check: (v) => (v.I > 0 ? undefined : 'I must be greater than 0 to find R'),
      compute: (v) => ({ R: v.V / v.I }),
      steps: (v, o) => [`R = V / I`, `R = ${S('voltage', v.V)} / ${S('current', v.I)} (base units: ${N(v.V)} V ÷ ${N(v.I)} A)`, `R = ${S('resistance', o.R)}`],
      examples: [ex('§1 R = 3 V ÷ 0.015 A', { V: 3, I: 0.015 }, { R: 200 })],
    }),
  ],
})

const powerFields = [
  field('P', 'P', 'Power', 'power', { sign: 'nonneg', description: 'rate at which energy is converted, mostly into heat' }),
  field('V', 'V', 'Voltage', 'voltage', { sign: 'nonneg', description: 'voltage across the component' }),
  field('I', 'I', 'Current', 'current', { sign: 'nonneg', description: 'current through the component' }),
  field('R', 'R', 'Resistance', 'resistance', { sign: 'pos', description: 'resistance' }),
]
const rating = (p: number) => [`Choose a part rated about 2× the result: ≥ ${S('power', 2 * p)}.`]

export const power = defineFormula({
  id: 'power', section: 's1', title: 'Power', page: 2,
  equation: 'P = V × I   ·   also P = I² × R and P = V² / R',
  meaning: 'Rate at which a component converts electrical energy, mostly into heat. Use the form that matches the known values; choose a part rated about 2× the result.',
  analogy: 'Power is how hard the water is working: pressure × flow. A resistor turns that work into heat.',
  fields: powerFields,
  unitsNote: 'V × A = W; V × mA = mW. Convert mA → A before squaring.',
  exampleText: 'P = V × I: 5 V × 0.2 A = 1 W · P = I² × R: 0.02² × 470 Ω = 0.188 W → use a 0.5 W resistor · P = V² / R: 12² ÷ 1000 Ω = 0.144 W',
  visual: 'power', keywords: ['watt', 'heat', 'dissipation'],
  modes: [
    mode({
      id: 'P', label: 'Find P (from V, I)', inputs: ['V', 'I'], outputs: ['P'], equation: 'P = V × I',
      compute: (v) => ({ P: v.V * v.I }),
      warn: (_v, o) => rating(o.P),
      steps: (v, o) => ['P = V × I', `P = ${S('voltage', v.V)} × ${S('current', v.I)}`, `P = ${S('power', o.P)}`],
      examples: [ex('§1 P = 5 V × 0.2 A', { V: 5, I: 0.2 }, { P: 1 })],
    }),
    mode({
      id: 'V', label: 'Find V (from P, I)', inputs: ['P', 'I'], outputs: ['V'], equation: 'V = P / I',
      check: (v) => (v.I > 0 ? undefined : 'I must be greater than 0'),
      compute: (v) => ({ V: v.P / v.I }),
      steps: (v, o) => ['V = P / I', `V = ${S('power', v.P)} / ${S('current', v.I)}`, `V = ${S('voltage', o.V)}`],
      examples: [ex('inverse of P = V × I', { P: 1, I: 0.2 }, { V: 5 })],
    }),
    mode({
      id: 'I', label: 'Find I (from P, V)', inputs: ['P', 'V'], outputs: ['I'], equation: 'I = P / V',
      check: (v) => (v.V > 0 ? undefined : 'V must be greater than 0'),
      compute: (v) => ({ I: v.P / v.V }),
      steps: (v, o) => ['I = P / V', `I = ${S('power', v.P)} / ${S('voltage', v.V)}`, `I = ${S('current', o.I)}`],
      examples: [ex('inverse of P = V × I', { P: 1, V: 5 }, { I: 0.2 })],
    }),
    mode({
      id: 'P_IR', label: 'Find P (from I, R)', inputs: ['I', 'R'], outputs: ['P'], equation: 'P = I² × R',
      compute: (v) => ({ P: v.I ** 2 * v.R }),
      warn: (_v, o) => rating(o.P),
      steps: (v, o) => ['P = I² × R', `P = (${N(v.I)} A)² × ${N(v.R)} Ω  — convert mA → A before squaring`, `P = ${S('power', o.P)}`],
      examples: [ex('§1 P = 0.02² × 470 Ω', { I: 0.02, R: 470 }, { P: 0.188 })],
    }),
    mode({
      id: 'P_VR', label: 'Find P (from V, R)', inputs: ['V', 'R'], outputs: ['P'], equation: 'P = V² / R',
      compute: (v) => ({ P: v.V ** 2 / v.R }),
      warn: (_v, o) => rating(o.P),
      steps: (v, o) => ['P = V² / R', `P = (${N(v.V)} V)² / ${N(v.R)} Ω`, `P = ${S('power', o.P)}`],
      examples: [ex('§1 P = 12² ÷ 1000 Ω', { V: 12, R: 1000 }, { P: 0.144 })],
    }),
  ],
})

export const s01 = [ohm, power]
