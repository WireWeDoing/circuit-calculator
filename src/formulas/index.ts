import type { Formula } from '../core/types.ts'
import { s01 } from './s01.ts'
import { s02 } from './s02.ts'
import { s03 } from './s03.ts'
import { s04 } from './s04.ts'
import { s05 } from './s05.ts'
import { s06, s07, s08 } from './s06_08.ts'
import { s09, s10, s11 } from './s09_11.ts'
import { s12, s13 } from './s12_13.ts'
import { s14, s15, s16 } from './s14_16.ts'
import * as a from './s17a.ts'
import * as b from './s17b.ts'
import { unitsTool } from './s00.ts'

const s17: Formula[] = [
  a.methodGuide, a.reverse, a.p1, a.p2, a.p3, a.p4, a.p5, a.p6, a.p7, a.p8, a.p9, a.p10, a.p11, a.p12,
  ...b.s17,
]

/** Every formula in the app, in cheat-sheet order. Add new formulas to the section file, not here. */
export const FORMULAS: Formula[] = [
  unitsTool, ...s01, ...s02, ...s03, ...s04, ...s05, ...s06, ...s07, ...s08, ...s09, ...s10, ...s11, ...s12, ...s13, ...s14, ...s15, ...s16, ...s17,
]

import { SECTIONS } from './sections.ts'
export { SECTIONS }
export const formulaById = (id: string): Formula | undefined => FORMULAS.find((f) => f.id === id)
export const formulasInSection = (sectionId: string): Formula[] => FORMULAS.filter((f) => f.section === sectionId)

// How each breakdown table is read (what "share" means, which columns add up to a total)
const TABLES: Record<string, NonNullable<(typeof FORMULAS)[number]['modes'][number]['table']>> = {
  'r-series': { share: 'Share of voltage', sums: ['V', 'P'] }, 'voltage-divider': { share: 'Share of voltage', sums: ['V', 'P'] },
  'r-parallel-2': { share: 'Share of current', sums: ['I', 'P'] }, 'r-parallel-n': { share: 'Share of current', sums: ['I', 'P'] },
  'current-divider': { share: 'Share of current', sums: ['I', 'P'] }, 'p1-unknown-parallel': { share: 'Share of current', sums: ['I', 'P'] },
  'c-series': { share: 'Share of voltage', sums: ['V', 'E'] }, 'c-parallel': { share: 'Share of charge', sums: ['Q', 'E'] },
  'p2-series-parallel': { share: 'Share of current', sums: ['P'] }, 'p5-millman': { share: 'Share', sums: ['P'] }, 'p13-several-leds': { share: 'Share of supply', sums: ['V', 'P'] },
}
for (const f of FORMULAS) for (const m of f.modes) if (m.breakdown) m.table = TABLES[f.id] ?? { share: 'Share', sums: [] }

// Sub-sections of §17 (the cheat sheet's 17.1 … 17.6)
const GROUPS: Record<string, string> = {
  'solving-method': 'g17-method', 'reverse-formulas': 'g17-method',
  'p1-unknown-parallel': 'g17-1', 'p2-series-parallel': 'g17-1', 'p3-unknown-series': 'g17-1', 'p4-thevenin': 'g17-1', 'p5-millman': 'g17-1',
  'p6-adc-divider': 'g17-2', 'p7-sensor-divider': 'g17-2', 'p8-wheatstone': 'g17-2',
  'p9-time-to-voltage': 'g17-3', 'p10-choose-rc': 'g17-3', 'p11-choose-lc': 'g17-3', 'p12-ac-measurement': 'g17-3',
  'p13-several-leds': 'g17-4', 'p14-zener': 'g17-4', 'p15-transformer-rectifier': 'g17-4', 'p16-heat': 'g17-4',
  'p17-bjt-switch': 'g17-5', 'p18-bjt-bias': 'g17-5', 'p19-mosfet-switch': 'g17-5',
  'p20-internal-resistance': 'g17-6', 'p21-battery-packs': 'g17-6',
}
for (const f of FORMULAS) if (GROUPS[f.id]) f.group = GROUPS[f.id]

/** Topics of a section in display order, split by sub-section where the section has them. */
export function topicsOf(sectionId: string): Array<{ group?: { id: string; title: string }; formulas: Formula[] }> {
  const section = SECTIONS.find((s) => s.id === sectionId)
  const all = formulasInSection(sectionId)
  if (!section?.groups) return [{ formulas: all }]
  const out: Array<{ group?: { id: string; title: string }; formulas: Formula[] }> = []
  const loose = all.filter((f) => !f.group)
  if (loose.length) out.push({ formulas: loose })
  for (const g of section.groups) { const fs = all.filter((f) => f.group === g.id); if (fs.length) out.push({ group: g, formulas: fs }) }
  return out
}
