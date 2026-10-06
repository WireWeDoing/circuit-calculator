import type { Dim } from './units.ts'

export type Sign = 'any' | 'pos' | 'nonneg'

export interface Field {
  key: string
  /** symbol shown in formulas, e.g. "Vout", "τ" */
  symbol: string
  name: string
  /** short plain-English description for the Variables table */
  description?: string
  dim: Dim
  /** validation. Default 'any' — pass 'pos' for anything that must be > 0 */
  sign?: Sign
  min?: number
  max?: number
  integer?: boolean
  /** this input is a list of values (series/parallel chains, KVL…) */
  list?: boolean
  /** list size limits (default 2…10) */
  listMin?: number
  listMax?: number
  placeholder?: string
  /** quick-fill chips, values in BASE units (e.g. copper resistivity) */
  presets?: Array<{ label: string; value: number }>
}

export type Values = Record<string, number>
export type Lists = Record<string, number[]>

export interface Example {
  /** where it came from, e.g. "Cheat sheet §2, series" */
  label: string
  inputs: Values
  lists?: Lists
  /** expected outputs in base units */
  expected: Values
  /** relative tolerance (default 1e-6). Cheat-sheet values are rounded, so use ~0.01 for those. */
  tol?: number
}

/** One line of a per-component breakdown table (all numbers in base units). */
export interface BreakdownRow {
  label: string
  /** the component's own value (R, C…) with its dimension, for display */
  value?: { dim: Dim; x: number }
  V?: number
  I?: number
  P?: number
  Q?: number
  E?: number
  /** share of the total (0–1): of the voltage for series parts, of the current for parallel parts */
  share?: number
}

export interface Mode {
  id: string
  /** "Find R" — defaults to `Find <symbol>` */
  label?: string
  inputs: string[]
  outputs: string[]
  /** equation shown for this mode, e.g. "I = V / R" */
  equation: string
  compute: (v: Values, l: Lists) => Values
  /** cross-field validation. Return a message if the combination is physically invalid. */
  check?: (v: Values, l: Lists) => string | undefined
  /** non-fatal advice shown with the result (ratings, rounding up…) */
  warn?: (v: Values, o: Values, l: Lists) => string[]
  /** human-readable steps with the numbers filled in */
  steps: (v: Values, o: Values, l: Lists) => string[]
  /** optional per-component table (current, drop, power…). Drives the table and diagram annotations. */
  breakdown?: (v: Values, o: Values, l: Lists) => BreakdownRow[]
  /** how to read the breakdown table: what 'share' means and which columns can be summed */
  table?: { share: string; sums: Array<'V' | 'I' | 'P' | 'Q' | 'E'> }
  examples: Example[]
}

export type VisualId = string

export interface Formula {
  id: string
  section: string
  /** id of a sub-section inside `section` (see Section.groups) */
  group?: string
  title: string
  /** the formula as printed in the cheat sheet */
  equation: string
  /** plain-English meaning (from the cheat sheet) */
  meaning: string
  /** "Think of it like…" analogy for newcomers */
  analogy?: string
  fields: Field[]
  /** UNITS & CONVERSION column of the cheat sheet */
  unitsNote: string
  /** worked example text from the cheat sheet */
  exampleText?: string
  modes: Mode[]
  visual: VisualId
  /** glossary concept ids to explain (e.g. "exp", "ln", "j") */
  concepts?: string[]
  /** search keywords */
  keywords?: string[]
  /** cheat-sheet page number for traceability */
  page?: number
  /** reference-only entries (tables, rules of thumb) have no modes */
  reference?: { rows: Array<[string, string]>; note?: string }
  /** custom interactive tool instead of the generic calculator */
  tool?: string
}

export interface Group {
  id: string
  title: string
}

export interface Section {
  id: string
  hero: string
  /** optional sub-sections (the cheat sheet's 17.1, 17.2 …). Topics without a group sit directly under the section. */
  groups?: Group[]
  number: string
  title: string
  blurb: string
}

export type EvalResult =
  | { status: 'incomplete'; missing: string[] }
  | { status: 'invalid'; errors: Record<string, string>; general?: string }
  | { status: 'ok'; outputs: Values; steps: string[]; warnings: string[]; rows?: BreakdownRow[] }
