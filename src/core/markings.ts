/** Part markings from cheat sheet §0: R/k/M notation and 3-digit codes. */

export type Parsed = { ok: true; value: number; unit: string; text: string } | { ok: false; error: string }

/** "4k7" → 4700 Ω, "2M2" → 2.2 MΩ, "R47" → 0.47 Ω, "100R" → 100 Ω. The letter is the decimal point. */
export function parseRKM(code: string): Parsed {
  const s = code.trim().toUpperCase()
  const m = /^(\d*)([RKM])(\d*)$/.exec(s)
  if (!m || (m[1] === '' && m[3] === '')) return { ok: false, error: 'Use a form like 4k7, 2M2, R47 or 100R.' }
  const mult = m[2] === 'R' ? 1 : m[2] === 'K' ? 1e3 : 1e6
  const value = Number(`${m[1] || '0'}.${m[3] || '0'}`) * mult
  return { ok: true, value: Number(value.toPrecision(12)), unit: 'Ω', text: `${code.trim()} = ${value} Ω` }
}

/** 3-digit code on resistors: two digits + number of zeros. "103" = 10 kΩ. */
export function decodeResistor3(code: string): Parsed {
  if (!/^\d{3}$/.test(code.trim())) return { ok: false, error: 'Enter exactly 3 digits, e.g. 103.' }
  const c = code.trim()
  const value = Number(c.slice(0, 2)) * 10 ** Number(c[2])
  return { ok: true, value, unit: 'Ω', text: `${c} = ${value} Ω` }
}

/** 3-digit code on capacitors: result in picofarads. "104" = 100 000 pF = 100 nF. */
export function decodeCapacitor3(code: string): Parsed {
  if (!/^\d{3}$/.test(code.trim())) return { ok: false, error: 'Enter exactly 3 digits, e.g. 104.' }
  const c = code.trim()
  const pF = Number(c.slice(0, 2)) * 10 ** Number(c[2])
  return { ok: true, value: pF * 1e-12, unit: 'F', text: `${c} = ${pF} pF` }
}

export interface Shortcut { you: string; get: string; example: string }
/** "Shortcut unit pairs (no conversion needed if you stay inside a pair)" */
export const SHORTCUTS: Shortcut[] = [
  { you: 'V ÷ mA', get: 'kΩ', example: '5 V ÷ 20 mA = 0.25 kΩ = 250 Ω' },
  { you: 'V ÷ kΩ', get: 'mA', example: '12 V ÷ 4 kΩ = 3 mA' },
  { you: 'mA × kΩ', get: 'V', example: '2 mA × 4.7 kΩ = 9.4 V' },
  { you: 'V × mA', get: 'mW', example: '5 V × 200 mA = 1000 mW = 1 W' },
  { you: 'kΩ × µF', get: 'ms', example: '10 kΩ × 100 µF = 1000 ms = 1 s' },
  { you: 'MΩ × µF', get: 's', example: '1 MΩ × 10 µF = 10 s' },
  { you: 'mH ÷ kΩ', get: 'µs', example: '10 mH ÷ 1 kΩ = 10 µs' },
  { you: '1 ÷ ms / 1 ÷ µs', get: 'kHz / MHz', example: '1 ÷ 0.5 ms = 2 kHz' },
]
