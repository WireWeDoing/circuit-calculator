import type { EvalResult, Field, Formula, Lists, Mode, Values } from './types.ts'
import { fmtSI } from './units.ts'

/** default maximum rows for a list input (the network diagrams are laid out for up to this many) */
export const DEFAULT_LIST_MAX = 12

export const fieldOf = (f: Formula, key: string): Field => {
  const field = f.fields.find((x) => x.key === key)
  if (!field) throw new Error(`${f.id}: unknown field "${key}"`)
  return field
}

export const modeOf = (f: Formula, id: string): Mode => {
  const m = f.modes.find((x) => x.id === id)
  if (!m) throw new Error(`${f.id}: unknown mode "${id}"`)
  return m
}

export const modeLabel = (f: Formula, m: Mode): string =>
  m.label ?? `Find ${fieldOf(f, m.outputs[0]!).symbol}`

/** Validate one number against a field's rules. Returns an error message or undefined. */
export function validateValue(field: Field, x: number): string | undefined {
  if (typeof x !== 'number' || Number.isNaN(x)) return `${field.symbol} must be a number`
  if (!Number.isFinite(x)) return `${field.symbol} must be a finite number`
  if (field.sign === 'pos' && !(x > 0)) return `${field.symbol} must be greater than 0`
  if (field.sign === 'nonneg' && x < 0) return `${field.symbol} cannot be negative`
  if (field.integer && !Number.isInteger(x)) return `${field.symbol} must be a whole number`
  if (field.min !== undefined && x < field.min) return `${field.symbol} must be at least ${fmtSI(field.dim, field.min)}`.trim()
  if (field.max !== undefined && x > field.max) return `${field.symbol} must be at most ${fmtSI(field.dim, field.max)}`.trim()
  return undefined
}

const isMissing = (x: unknown): boolean => x === undefined || x === null || (typeof x === 'number' && Number.isNaN(x))

/**
 * Evaluate a formula mode. All values are in BASE units (V, A, Ω, F, H, Hz, s, W …).
 * Pipeline: completeness → per-field validation → cross-field check → compute → finite check → steps.
 * It never throws for user input; every failure becomes a typed result.
 */
export function evaluate(
  formula: Formula,
  modeId: string,
  values: Partial<Record<string, number>>,
  lists: Partial<Record<string, Array<number | undefined>>> = {},
): EvalResult {
  const mode = modeOf(formula, modeId)

  // 1. completeness
  const missing: string[] = []
  for (const key of mode.inputs) {
    const field = fieldOf(formula, key)
    if (field.list) {
      const list = lists[key] ?? []
      const min = field.listMin ?? 2
      if (list.length < min || list.some(isMissing)) missing.push(key)
    } else if (isMissing(values[key])) missing.push(key)
  }
  if (missing.length) return { status: 'incomplete', missing }

  // 2. per-field validation
  const errors: Record<string, string> = {}
  const v: Values = {}
  const l: Lists = {}
  for (const key of mode.inputs) {
    const field = fieldOf(formula, key)
    if (field.list) {
      const list = lists[key] as number[]
      const max = field.listMax ?? DEFAULT_LIST_MAX
      if (list.length > max) errors[key] = `At most ${max} values`
      for (const [i, x] of list.entries()) {
        const msg = validateValue(field, x)
        if (msg) { errors[key] = `${msg} (value ${i + 1})`; break }
      }
      l[key] = list
    } else {
      const msg = validateValue(field, values[key] as number)
      if (msg) errors[key] = msg
      v[key] = values[key] as number
    }
  }
  if (Object.keys(errors).length) return { status: 'invalid', errors }

  // 3. cross-field physical checks
  const general = mode.check?.(v, l)
  if (general) return { status: 'invalid', errors: {}, general }

  // 4. compute (guard against thrown errors in formula code)
  let outputs: Values
  try {
    outputs = mode.compute(v, l)
  } catch (e) {
    return { status: 'invalid', errors: {}, general: e instanceof Error ? e.message : 'Could not calculate' }
  }
  for (const key of mode.outputs) {
    const out = outputs[key]
    if (out === undefined || !Number.isFinite(out)) {
      return { status: 'invalid', errors: {}, general: 'These values give no valid result (check for zero or impossible combinations).' }
    }
  }

  return {
    status: 'ok',
    outputs,
    steps: mode.steps(v, outputs, l),
    warnings: mode.warn?.(v, outputs, l) ?? [],
    rows: mode.breakdown?.(v, outputs, l),
  }
}
