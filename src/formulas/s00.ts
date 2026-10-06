import { defineFormula } from '../core/define.ts'

export const unitsTool = defineFormula({
  id: 'units-and-prefixes', section: 's0', title: 'Units, prefixes & conversions', page: 1,
  equation: 'Convert to base units → calculate → convert back',
  meaning: 'Golden rule: formulas expect base units — V, A, Ω, F, H, Hz, s, W. Convert prefixed values (4.7 kΩ, 20 mA, 100 nF) to base units, calculate, then convert the answer back.',
  fields: [], unitsNote: 'Same kind of quantity with the same prefix: calculate directly — the answer keeps that prefix. Mixed prefixes or different quantities: convert first.',
  visual: 'prefix-ladder', tool: 'units', modes: [], keywords: ['prefix', 'milli', 'micro', 'kilo', 'conversion', 'markings', '104', '4k7'],
})
