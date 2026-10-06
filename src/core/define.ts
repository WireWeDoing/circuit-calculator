import type { Field, Formula, Mode, Example, Values, Lists } from './types.ts'

/** field(key, symbol, name, dim, extra) — compact Field builder */
export const field = (
  key: string,
  symbol: string,
  name: string,
  dim: Field['dim'],
  extra: Partial<Field> = {},
): Field => ({ key, symbol, name, dim, sign: 'any', ...extra })

export const mode = (m: Mode): Mode => m

export const ex = (
  label: string,
  inputs: Values,
  expected: Values,
  tol?: number,
  lists?: Lists,
): Example => ({ label, inputs, expected, tol, lists })

export const defineFormula = (f: Formula): Formula => f

/** Round-trip helper for definitions: a series/parallel list sum */
export const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0)
export const recipSum = (xs: number[]): number => xs.reduce((a, b) => a + 1 / b, 0)
