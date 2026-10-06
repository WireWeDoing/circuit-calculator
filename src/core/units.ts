/** SI multipliers — use these in formulas/examples instead of bare 1e3 etc. */
export const giga = 1e9
export const mega = 1e6
export const kilo = 1e3
export const milli = 1e-3
export const micro = 1e-6
export const nano = 1e-9
export const pico = 1e-12

export interface Unit {
  /** label shown in the UI, e.g. "kΩ" */
  label: string
  /** multiply a value in this unit by `factor` to get the base unit */
  factor: number
}

export type Dim =
  | 'voltage' | 'current' | 'resistance' | 'capacitance' | 'inductance' | 'frequency' | 'time'
  | 'power' | 'energy' | 'charge' | 'length' | 'area' | 'areaMil' | 'resistivity' | 'ratio'
  | 'angle' | 'dB' | 'dBm' | 'temp' | 'thermal' | 'capacityAh' | 'energyWh' | 'hours'
  | 'permeability' | 'va' | 'baud' | 'bits' | 'psPerInch' | 'count' | 'ohmMm2PerM' | 'fraction' | 'percent' | 'div'

const prefixed = (base: string, prefixes: Array<[string, number]>): Unit[] =>
  prefixes.map(([p, factor]) => ({ label: `${p}${base}`, factor }))

/** First unit of each list is the base unit (factor 1) — the "golden rule" unit. */
export const UNITS: Record<Dim, Unit[]> = {
  voltage: prefixed('V', [['', 1], ['k', 1e3], ['m', 1e-3], ['µ', 1e-6], ['n', 1e-9]]),
  current: prefixed('A', [['', 1], ['m', 1e-3], ['µ', 1e-6], ['n', 1e-9], ['k', 1e3]]),
  resistance: prefixed('Ω', [['', 1], ['m', 1e-3], ['k', 1e3], ['M', 1e6]]),
  capacitance: prefixed('F', [['', 1], ['m', 1e-3], ['µ', 1e-6], ['n', 1e-9], ['p', 1e-12]]),
  inductance: prefixed('H', [['', 1], ['m', 1e-3], ['µ', 1e-6], ['n', 1e-9]]),
  frequency: prefixed('Hz', [['', 1], ['k', 1e3], ['M', 1e6], ['G', 1e9]]),
  time: prefixed('s', [['', 1], ['m', 1e-3], ['µ', 1e-6], ['n', 1e-9], ['p', 1e-12]]),
  power: prefixed('W', [['', 1], ['m', 1e-3], ['µ', 1e-6], ['k', 1e3]]),
  energy: prefixed('J', [['', 1], ['m', 1e-3], ['µ', 1e-6], ['k', 1e3]]),
  charge: prefixed('C', [['', 1], ['m', 1e-3], ['µ', 1e-6], ['n', 1e-9]]),
  length: [
    { label: 'm', factor: 1 }, { label: 'cm', factor: 1e-2 }, { label: 'mm', factor: 1e-3 },
    { label: 'µm', factor: 1e-6 }, { label: 'km', factor: 1e3 },
  ],
  area: [{ label: 'm²', factor: 1 }, { label: 'mm²', factor: 1e-6 }],
  areaMil: [{ label: 'mil²', factor: 1 }],
  resistivity: [{ label: 'Ω·m', factor: 1 }],
  permeability: [{ label: 'H/m', factor: 1 }],
  ohmMm2PerM: [{ label: 'Ω·mm²/m', factor: 1 }],
  ratio: [{ label: '', factor: 1 }],
  count: [{ label: '', factor: 1 }],
  bits: [{ label: 'bit', factor: 1 }],
  fraction: [{ label: '', factor: 1 }],
  percent: [{ label: '%', factor: 1 }],
  /** oscilloscope screen divisions */
  div: [{ label: 'div', factor: 1 }],
  angle: [{ label: '°', factor: 1 }],
  dB: [{ label: 'dB', factor: 1 }],
  dBm: [{ label: 'dBm', factor: 1 }],
  temp: [{ label: '°C', factor: 1 }],
  thermal: [{ label: '°C/W', factor: 1 }],
  capacityAh: [{ label: 'Ah', factor: 1 }, { label: 'mAh', factor: 1e-3 }],
  energyWh: [{ label: 'Wh', factor: 1 }, { label: 'mWh', factor: 1e-3 }, { label: 'kWh', factor: 1e3 }],
  hours: [{ label: 'h', factor: 1 }, { label: 'min', factor: 1 / 60 }, { label: 's', factor: 1 / 3600 }],
  va: [{ label: 'VA', factor: 1 }, { label: 'kVA', factor: 1e3 }],
  baud: [{ label: 'baud', factor: 1 }],
  psPerInch: [{ label: 'ps/inch', factor: 1 }],
}

export const unitsOf = (dim: Dim): Unit[] => UNITS[dim]
export const baseUnit = (dim: Dim): Unit => UNITS[dim][0]!
export const findUnit = (dim: Dim, label: string): Unit =>
  UNITS[dim].find((u) => u.label === label) ?? baseUnit(dim)

/** value typed in `unitLabel` → base units */
export const toBase = (dim: Dim, value: number, unitLabel: string): number =>
  value * findUnit(dim, unitLabel).factor

/** base value → value expressed in `unitLabel` */
export const fromBase = (dim: Dim, value: number, unitLabel: string): number =>
  value / findUnit(dim, unitLabel).factor

/** Pick the unit that gives a mantissa in [1, 1000) (engineering style). */
export function bestUnit(dim: Dim, value: number): Unit {
  const list = UNITS[dim]
  if (list.length === 1 || value === 0 || !Number.isFinite(value)) return list[0]!
  const abs = Math.abs(value)
  // only consider units whose factor is a power of 1000 relative to base
  const candidates = list.filter((u) => {
    const l = Math.log10(u.factor) / 3
    return Math.abs(l - Math.round(l)) < 1e-9
  })
  let best = candidates[0]!
  let bestScore = Infinity
  for (const u of candidates) {
    const scaled = abs / u.factor
    // prefer 1 ≤ scaled < 1000; otherwise closest in log space
    const score = scaled >= 1 && scaled < 1000 ? 0 : Math.abs(Math.log10(scaled) - 1.5)
    if (score < bestScore - 1e-12) {
      best = u
      bestScore = score
    }
  }
  return best
}

/** Format a plain number to ~4 significant digits without noise. */
export function fmtNum(x: number, digits = 4): string {
  if (!Number.isFinite(x)) return String(x)
  if (x === 0) return '0'
  const abs = Math.abs(x)
  if (abs >= 1e7 || abs < 1e-3) {
    const [m, e] = x.toExponential(digits - 1).split('e')
    const mant = m!.includes('.') ? m!.replace(/0+$/, '').replace(/\.$/, '') : m!
    return `${mant}×10${toSuperscript(Number(e))}`
  }
  const s = Number(x.toPrecision(digits)).toString()
  return s
}

const SUP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻',
}
export const toSuperscript = (n: number): string =>
  String(n).split('').map((c) => SUP[c] ?? c).join('')

/** value in base units → "4.7 kΩ" */
export function fmtSI(dim: Dim, value: number, digits = 4): string {
  if (!Number.isFinite(value)) return String(value)
  const u = bestUnit(dim, value)
  const num = fmtNum(value / u.factor, digits)
  return u.label ? `${num} ${u.label}` : num
}

/** Plain, re-parseable text for an input field ("1.68e-8" — never the pretty "×10⁻⁸" form). */
export const toInputText = (x: number, digits = 10): string => String(Number(x.toPrecision(digits)))
