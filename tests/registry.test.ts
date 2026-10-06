/**
 * Generic contract tests — they run against EVERY formula in the registry, so adding a formula
 * automatically adds its checks. A formula that violates the contract fails the build.
 */
import { describe, expect, it } from 'vitest'
import { evaluate, fieldOf, validateValue } from '../src/core/engine.ts'
import { FORMULAS, SECTIONS } from '../src/formulas/index.ts'
import { UNITS } from '../src/core/units.ts'
import { VISUALS } from '../src/visuals/index.ts'
import { TOOLS } from '../src/ui/tools.tsx'

const calc = FORMULAS.filter((f) => f.modes.length > 0)

describe('registry metadata', () => {
  it('has unique formula ids and valid sections', () => {
    const ids = FORMULAS.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
    const sections = new Set(SECTIONS.map((s) => s.id))
    // `section` = where the topic comes from in the cheat sheet; topics added beyond it have none
    for (const f of FORMULAS) if (f.section !== undefined) expect(sections.has(f.section), `${f.id}: unknown section ${f.section}`).toBe(true)
  })

  it('covers every cheat-sheet section', () => {
    for (const s of SECTIONS) expect(FORMULAS.some((f) => f.section === s.id), `section ${s.id} is empty`).toBe(true)
  })

  it.each(FORMULAS.map((f) => [f.id, f] as const))('%s is documented for newcomers', (_id, f) => {
    expect(f.title.length).toBeGreaterThan(2)
    expect(f.equation.length).toBeGreaterThan(2)
    expect(f.meaning.length).toBeGreaterThan(10)
    expect(f.visual, 'every formula needs a visual').toBeTruthy()
    expect(VISUALS[f.visual], `visual "${f.visual}" is not registered`).toBeDefined()
    if (f.tool) expect(TOOLS[f.tool], `tool "${f.tool}" is not registered`).toBeDefined()
    if (f.modes.length === 0) expect(f.reference || f.tool || f.article, `${f.id}: no modes → needs reference rows, a tool or an article`).toBeTruthy()
    for (const field of f.fields) {
      expect(UNITS[field.dim], `${f.id}.${field.key}: unknown dim ${field.dim}`).toBeDefined()
      expect(field.symbol.length).toBeGreaterThan(0)
      expect(field.name.length).toBeGreaterThan(0)
    }
    const keys = f.fields.map((x) => x.key)
    expect(new Set(keys).size, `${f.id}: duplicate field keys`).toBe(keys.length)
  })
})

describe.each(calc.map((f) => [f.id, f] as const))('%s', (_id, f) => {
  it('modes reference only declared fields and have unique ids', () => {
    expect(new Set(f.modes.map((m) => m.id)).size).toBe(f.modes.length)
    for (const m of f.modes) {
      expect(m.inputs.length).toBeGreaterThan(0)
      expect(m.outputs.length).toBeGreaterThan(0)
      expect(m.equation.length).toBeGreaterThan(2)
      for (const k of [...m.inputs, ...m.outputs]) expect(() => fieldOf(f, k)).not.toThrow()
      for (const k of m.outputs) expect(m.inputs, `${f.id}/${m.id}: ${k} is both input and output`).not.toContain(k)
    }
  })

  for (const m of f.modes) {
    describe(`mode ${m.id}`, () => {
      it('has at least one example from the cheat sheet or a physical identity', () => {
        expect(m.examples.length).toBeGreaterThan(0)
      })

      it.each(m.examples.map((e) => [e.label, e] as const))('example: %s', (_label, e) => {
        const r = evaluate(f, m.id, e.inputs, e.lists ?? {})
        if (r.status !== 'ok') throw new Error(`example rejected: ${JSON.stringify(r)}`)
        const tol = e.tol ?? 1e-6
        for (const [k, want] of Object.entries(e.expected)) {
          const got = r.outputs[k]!
          const err = want === 0 ? Math.abs(got) : Math.abs(got - want) / Math.abs(want)
          expect(err, `${k}: got ${got}, want ${want}`).toBeLessThanOrEqual(want === 0 ? 1e-9 : tol)
        }
        expect(r.steps.length).toBeGreaterThan(0)
        for (const s of r.steps) {
          expect(s).not.toMatch(/NaN|undefined|Infinity/)
        }
        for (const w of r.warnings) expect(w).not.toMatch(/NaN|undefined|Infinity/)
      })

      it('reports missing inputs instead of calculating', () => {
        const e = m.examples[0]!
        for (const key of m.inputs) {
          const field = fieldOf(f, key)
          if (field.list) {
            const r = evaluate(f, m.id, e.inputs, { ...(e.lists ?? {}), [key]: [] })
            expect(r.status).toBe('incomplete')
          } else {
            const rest = { ...e.inputs }
            delete rest[key]
            expect(evaluate(f, m.id, rest, e.lists ?? {}).status, `missing ${key}`).toBe('incomplete')
          }
        }
      })

      it('rejects NaN, Infinity and values that violate field rules', () => {
        const e = m.examples[0]!
        for (const key of m.inputs) {
          const field = fieldOf(f, key)
          if (field.list) continue
          const bad: number[] = [Infinity, -Infinity]
          if (field.sign === 'pos') bad.push(0, -1)
          if (field.sign === 'nonneg') bad.push(-1)
          if (field.integer) bad.push((e.inputs[key] ?? 1) + 0.5)
          if (field.min !== undefined) bad.push(field.min - 1)
          if (field.max !== undefined) bad.push(field.max + 1)
          for (const x of bad) {
            const r = evaluate(f, m.id, { ...e.inputs, [key]: x }, e.lists ?? {})
            expect(r.status, `${key}=${x} should be rejected`).toBe('invalid')
            if (r.status === 'invalid') expect(r.errors[key] ?? r.general).toBeTruthy()
          }
          expect(evaluate(f, m.id, { ...e.inputs, [key]: NaN }, e.lists ?? {}).status).toBe('incomplete')
        }
      })

      it('never returns non-finite numbers for sane inputs', () => {
        const e = m.examples[0]!
        for (const factor of [0.001, 0.1, 10, 1000]) {
          const scaled: Record<string, number> = {}
          for (const [k, x] of Object.entries(e.inputs)) {
            const fld = fieldOf(f, k)
            scaled[k] = fld.integer || fld.max !== undefined || fld.min !== undefined ? x : x * factor
          }
          const r = evaluate(f, m.id, scaled, e.lists ?? {})
          if (r.status === 'ok') for (const k of m.outputs) expect(Number.isFinite(r.outputs[k]!)).toBe(true)
          else expect(['invalid', 'incomplete']).toContain(r.status)
        }
      })
    })
  }
})

describe('validateValue', () => {
  const pos = { key: 'x', symbol: 'x', name: 'x', dim: 'resistance' as const, sign: 'pos' as const }
  it('applies sign rules', () => {
    expect(validateValue(pos, 1)).toBeUndefined()
    expect(validateValue(pos, 0)).toMatch(/greater than 0/)
    expect(validateValue({ ...pos, sign: 'nonneg' }, 0)).toBeUndefined()
    expect(validateValue({ ...pos, sign: 'nonneg' }, -1e-9)).toMatch(/negative/)
    expect(validateValue({ ...pos, sign: 'any' }, -5)).toBeUndefined()
  })
  it('rejects non-numbers', () => {
    expect(validateValue(pos, NaN)).toBeTruthy()
    expect(validateValue(pos, Infinity)).toBeTruthy()
  })
})
