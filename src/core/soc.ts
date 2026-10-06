/**
 * Rough Li-ion state of charge from resting voltage (cheat sheet §15: 4.2 V ≈ full, 3.7 V ≈ half, 3.0 V ≈ empty).
 * Linear interpolation between those three published points — an estimate only.
 */
export const SOC_POINTS: Array<[number, number]> = [[3.0, 0], [3.7, 50], [4.2, 100]]

export function liIonSoc(volts: number): number {
  if (!Number.isFinite(volts)) return NaN
  if (volts <= SOC_POINTS[0]![0]) return 0
  if (volts >= SOC_POINTS[SOC_POINTS.length - 1]![0]) return 100
  for (let i = 1; i < SOC_POINTS.length; i++) {
    const [v0, s0] = SOC_POINTS[i - 1]!
    const [v1, s1] = SOC_POINTS[i]!
    if (volts <= v1) return s0 + ((volts - v0) / (v1 - v0)) * (s1 - s0)
  }
  return 100
}
