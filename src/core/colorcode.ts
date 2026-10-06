/** Resistor colour code (cheat sheet §2). Values exactly as printed there. */
export interface ColourInfo { digit?: number; multiplier?: number; tolerance?: number }

export const COLOURS: Record<string, ColourInfo> = {
  black: { digit: 0, multiplier: 1 },
  brown: { digit: 1, multiplier: 10, tolerance: 1 },
  red: { digit: 2, multiplier: 100, tolerance: 2 },
  orange: { digit: 3, multiplier: 1e3 },
  yellow: { digit: 4, multiplier: 1e4 },
  green: { digit: 5, multiplier: 1e5, tolerance: 0.5 },
  blue: { digit: 6, multiplier: 1e6, tolerance: 0.25 },
  violet: { digit: 7, multiplier: 1e7, tolerance: 0.1 },
  grey: { digit: 8, tolerance: 0.05 },
  white: { digit: 9 },
  gold: { multiplier: 0.1, tolerance: 5 },
  silver: { multiplier: 0.01, tolerance: 10 },
}
export const COLOUR_NAMES = Object.keys(COLOURS)

export type DecodeResult = { ok: true; ohms: number; tolerance: number | undefined } | { ok: false; error: string }

/** Decode 4-band (d, d, ×, tol) or 5-band (d, d, d, ×, tol) colour codes. */
export function decodeBands(bands: string[]): DecodeResult {
  if (bands.length !== 4 && bands.length !== 5) return { ok: false, error: 'Use 4 or 5 bands.' }
  const nd = bands.length - 2
  const digits: number[] = []
  for (let i = 0; i < nd; i++) {
    const d = COLOURS[bands[i]!]?.digit
    if (d === undefined) return { ok: false, error: `${bands[i]} cannot be a digit band (position ${i + 1}).` }
    digits.push(d)
  }
  if (digits[0] === 0) return { ok: false, error: 'The first digit cannot be black (0).' }
  const mult = COLOURS[bands[nd]!]?.multiplier
  if (mult === undefined) return { ok: false, error: `${bands[nd]} cannot be a multiplier band.` }
  const tolName = bands[nd + 1]!
  const tol = COLOURS[tolName]?.tolerance
  if (tol === undefined) return { ok: false, error: `${tolName} cannot be a tolerance band.` }
  const base = digits.reduce((a, d) => a * 10 + d, 0)
  return { ok: true, ohms: Number((base * mult).toPrecision(12)), tolerance: tol }
}

const byDigit = (d: number) => COLOUR_NAMES.find((n) => COLOURS[n]!.digit === d)!
const byMultiplier = (m: number) => COLOUR_NAMES.find((n) => COLOURS[n]!.multiplier !== undefined && Math.abs(Math.log10(COLOURS[n]!.multiplier!) - Math.log10(m)) < 1e-9)
export const byTolerance = (t: number) => COLOUR_NAMES.find((n) => COLOURS[n]!.tolerance === t)

/** Find the bands for a resistance. digits = 2 (4-band) or 3 (5-band). Returns undefined if not representable. */
export function encodeBands(ohms: number, digits: 2 | 3, tolerance: number): string[] | undefined {
  if (!(ohms > 0) || !Number.isFinite(ohms)) return undefined
  for (const exp of [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7]) {
    const mult = 10 ** exp
    const n = Math.round((ohms / mult) * 1e6) / 1e6
    if (Number.isInteger(n) && n >= 10 ** (digits - 1) && n < 10 ** digits) {
      const m = byMultiplier(mult)
      const t = byTolerance(tolerance)
      if (!m || !t) continue
      return [...String(n).split('').map((d) => byDigit(Number(d))), m, t]
    }
  }
  return undefined
}
