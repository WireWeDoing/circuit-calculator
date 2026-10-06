/** E12 preferred values (cheat sheet footer): 10 12 15 18 22 27 33 39 47 56 68 82 × 10^n */
export const E12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82] as const

/** Smallest E12 value ≥ x ("round up"). */
export function e12Up(x: number): number {
  if (!(x > 0) || !Number.isFinite(x)) return NaN
  const decade = Math.floor(Math.log10(x)) - 1
  const scale = 10 ** decade
  for (const m of [...E12, 100]) {
    const v = m * scale
    if (v >= x * (1 - 1e-9)) return Number(v.toPrecision(12))
  }
  return NaN
}

/** Largest E12 value ≤ x ("round down"). */
export function e12Down(x: number): number {
  if (!(x > 0) || !Number.isFinite(x)) return NaN
  const decade = Math.floor(Math.log10(x)) - 1
  const scale = 10 ** decade
  let best = NaN
  for (const m of [...E12, 100]) {
    const v = m * scale
    if (v <= x * (1 + 1e-9)) best = Number(v.toPrecision(12))
  }
  return best
}

/** E6 (±20 %) and E24 (±5 %) preferred values, one decade */
export const E6 = [10, 15, 22, 33, 47, 68] as const
export const E24 = [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91] as const

/** The value of a preferred-value series closest to x on a log scale (the smallest percentage difference). */
export function nearestPreferred(series: readonly number[], x: number): number {
  if (!(x > 0) || !Number.isFinite(x)) return NaN
  const decade = 10 ** (Math.floor(Math.log10(x)) - 1)
  let best = NaN, dist = Infinity
  for (const m of [...series, 100]) {
    const v = m * decade
    const d = Math.abs(Math.log(v / x))
    if (d < dist - 1e-12) { best = Number(v.toPrecision(12)); dist = d }
  }
  return best
}
