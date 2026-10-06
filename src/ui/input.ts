/** Parse user text into a number. undefined = empty, NaN = not a number. Accepts "4,7" and "1e-3". */
export function parseNumber(text: string): number | undefined {
  const t = text.trim().replace(',', '.')
  if (t === '') return undefined
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t)) return NaN
  return Number(t)
}
