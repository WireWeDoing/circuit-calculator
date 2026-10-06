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
