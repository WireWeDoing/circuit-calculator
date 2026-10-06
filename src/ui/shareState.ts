import { fieldOf, modeOf } from '../core/engine.ts'
import type { Formula } from '../core/types.ts'
import { baseUnit, unitsOf } from '../core/units.ts'
import type { Entry } from './QuantityInput.tsx'

/** What a shared link restores: the chosen mode and every typed value. */
export interface SharedState { modeId?: string; entries: Record<string, Entry>; lists: Record<string, Entry[]> }

/** "4.7" + "kΩ" → "4.7~kΩ" (a unit equal to the base unit is left out to keep links short) */
const encodeEntry = (base: string, e: Entry) => (e.unit === base ? e.text : `${e.text}~${e.unit}`)

/**
 * The query for the current inputs: `mode=<id>` (when not the first mode) and one `<field>=<text>[~<unit>]` per typed value;
 * a list input repeats its key, one per row. Only the inputs of the current mode are written.
 */
export function encodeState(formula: Formula, modeId: string, entries: Record<string, Entry>, lists: Record<string, Entry[]>): string {
  const p = new URLSearchParams()
  if (modeId !== formula.modes[0]?.id) p.set('mode', modeId)
  for (const k of modeOf(formula, modeId).inputs) {
    const f = fieldOf(formula, k)
    const base = baseUnit(f.dim).label
    if (f.list) {
      const rows = lists[k] ?? []
      if (rows.some((e) => e.text.trim() !== '')) for (const e of rows) p.append(k, encodeEntry(base, e))
    } else {
      const e = entries[k]
      if (e && e.text.trim() !== '') p.set(k, encodeEntry(base, e))
    }
  }
  return p.toString()
}

/** Inverse of `encodeState`. Unknown fields, modes and units are ignored, so a stale or hand-edited link never breaks the page. */
export function decodeState(formula: Formula, query: string | undefined): SharedState {
  const out: SharedState = { entries: {}, lists: {} }
  if (!query) return out
  const p = new URLSearchParams(query)
  const m = p.get('mode')
  if (m && formula.modes.some((x) => x.id === m)) out.modeId = m
  const mode = modeOf(formula, out.modeId ?? formula.modes[0]!.id)
  const toEntry = (k: string, raw: string): Entry => {
    const f = fieldOf(formula, k)
    const i = raw.lastIndexOf('~')
    const unit = i >= 0 ? raw.slice(i + 1) : ''
    return { text: i >= 0 ? raw.slice(0, i) : raw, unit: unitsOf(f.dim).some((u) => u.label === unit) ? unit : baseUnit(f.dim).label }
  }
  for (const k of mode.inputs) {
    const f = fieldOf(formula, k)
    const all = p.getAll(k)
    if (all.length === 0) continue
    if (f.list) out.lists[k] = all.map((raw) => toEntry(k, raw))
    else out.entries[k] = toEntry(k, all[0]!)
  }
  return out
}
