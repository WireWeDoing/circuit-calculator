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
import { basicsPages } from './basics.ts'
import { measurePages } from './measure.ts'
import { signalPages } from './signals.ts'
import { componentPages } from './components.ts'

const s17: Formula[] = [
  a.methodGuide, a.reverse, a.p1, a.p2, a.p3, a.p4, a.p5, a.p6, a.p7, a.p8, a.p9, a.p10, a.p11, a.p12,
  ...b.s17,
]

/**
 * Every topic in the app: the cheat sheet's formulas (in its order), then the pages added beyond it.
 * Add new formulas to their file, not here — and place each one in the book (src/learn/book.ts).
 */
export const FORMULAS: Formula[] = [
  unitsTool, ...s01, ...s02, ...s03, ...s04, ...s05, ...s06, ...s07, ...s08, ...s09, ...s10, ...s11, ...s12, ...s13, ...s14, ...s15, ...s16, ...s17,
  ...basicsPages, ...measurePages, ...signalPages, ...componentPages,
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
