import { describe, expect, it } from 'vitest'
import { COLOURS, decodeBands, encodeBands } from '../src/core/colorcode.ts'
import { e12Down, e12Up } from '../src/core/e12.ts'
import { decodeCapacitor3, decodeResistor3, parseRKM } from '../src/core/markings.ts'
import { liIonSoc } from '../src/core/soc.ts'
import { bestUnit, fmtNum, fmtSI, fromBase, toBase } from '../src/core/units.ts'
import { parseNumber } from '../src/ui/input.ts'

describe('unit conversion (cheat sheet §0)', () => {
  it.each([
    ['resistance', 4.7, 'kΩ', 4700], ['resistance', 4.7, 'MΩ', 4.7e6], ['current', 20, 'mA', 0.02], ['capacitance', 100, 'µF', 1e-4],
    ['capacitance', 100, 'nF', 1e-7], ['capacitance', 22, 'pF', 22e-12], ['frequency', 2.4, 'GHz', 2.4e9], ['inductance', 10, 'µH', 1e-5], ['resistance', 25, 'mΩ', 0.025],
  ] as const)('%s: %d %s → base', (dim, v, unit, base) => {
    expect(toBase(dim, v, unit)).toBeCloseTo(base, 12)
    expect(fromBase(dim, base, unit)).toBeCloseTo(v, 9)
  })
  it('1 kΩ + 470 Ω is 1470 Ω, not 471', () => {
    expect(toBase('resistance', 1, 'kΩ') + 470).toBe(1470)
  })
  it('picks a friendly prefix', () => {
    expect(bestUnit('resistance', 4700).label).toBe('kΩ')
    expect(bestUnit('resistance', 0.38).label).toBe('mΩ')
    expect(bestUnit('capacitance', 5e-5).label).toBe('µF')
    expect(bestUnit('frequency', 5.03e6).label).toBe('MHz')
    expect(bestUnit('time', 8.68e-6).label).toBe('µs')
    expect(bestUnit('voltage', 0).label).toBe('V')
  })
  it('formats values', () => {
    expect(fmtSI('resistance', 4700)).toBe('4.7 kΩ')
    expect(fmtSI('capacitance', 1e-4)).toBe('100 µF')
    expect(fmtSI('ratio', 31.62)).toBe('31.62')
    expect(fmtNum(1e-9)).toContain('×10⁻⁹')
    expect(fmtNum(0)).toBe('0')
  })
  it('parses user text safely', () => {
    expect(parseNumber('4,7')).toBe(4.7)
    expect(parseNumber('1e-3')).toBe(0.001)
    expect(parseNumber('')).toBeUndefined()
    expect(parseNumber('abc')).toBeNaN()
    expect(parseNumber('1 2')).toBeNaN()
    expect(parseNumber('-5')).toBe(-5)
  })
})

describe('resistor colour code (§2)', () => {
  it('brown-black-red-gold = 1 kΩ ±5%', () => {
    expect(decodeBands(['brown', 'black', 'red', 'gold'])).toEqual({ ok: true, ohms: 1000, tolerance: 5 })
  })
  it('brown-black-black-brown-brown = 1 kΩ ±1%', () => {
    expect(decodeBands(['brown', 'black', 'black', 'brown', 'brown'])).toEqual({ ok: true, ohms: 1000, tolerance: 1 })
  })
  it('handles sub-ohm multipliers', () => {
    expect(decodeBands(['yellow', 'violet', 'gold', 'gold'])).toMatchObject({ ok: true, ohms: 4.7 })
    expect(decodeBands(['yellow', 'violet', 'silver', 'gold'])).toMatchObject({ ok: true, ohms: 0.47 })
  })
  it('rejects impossible combinations', () => {
    expect(decodeBands(['gold', 'black', 'red', 'gold']).ok).toBe(false) // gold is not a digit
    expect(decodeBands(['black', 'black', 'red', 'gold']).ok).toBe(false) // leading zero
    expect(decodeBands(['brown', 'black', 'gold', 'orange']).ok).toBe(false) // orange has no tolerance
    expect(decodeBands(['brown', 'black', 'grey', 'gold']).ok).toBe(false) // grey has no multiplier on the sheet
    expect(decodeBands(['brown', 'black']).ok).toBe(false)
  })
  it('encode is the inverse of decode', () => {
    for (const ohms of [10, 47, 100, 330, 470, 1000, 4700, 10000, 100000, 2.2e6, 0.47, 1]) {
      const bands = encodeBands(ohms, 2, 5)
      expect(bands, `${ohms}`).toBeDefined()
      expect(decodeBands(bands!)).toMatchObject({ ok: true, ohms })
    }
    expect(encodeBands(1234, 2, 5)).toBeUndefined()
    expect(decodeBands(encodeBands(1230, 3, 1)!)).toMatchObject({ ohms: 1230, tolerance: 1 })
    expect(encodeBands(-1, 2, 5)).toBeUndefined()
  })
  it('table matches the cheat sheet', () => {
    expect(COLOURS.green).toEqual({ digit: 5, multiplier: 1e5, tolerance: 0.5 })
    expect(COLOURS.violet).toEqual({ digit: 7, multiplier: 1e7, tolerance: 0.1 })
    expect(COLOURS.white).toEqual({ digit: 9 })
  })
})

describe('part markings (§0)', () => {
  it.each([['4k7', 4700], ['2M2', 2.2e6], ['R47', 0.47], ['100R', 100], ['1K', 1000], ['4K7', 4700]])('%s', (code, ohms) => {
    expect(parseRKM(code)).toMatchObject({ ok: true, value: ohms })
  })
  it('rejects garbage', () => { for (const c of ['', 'k', 'abc', '4x7', '4.7k']) expect(parseRKM(c).ok).toBe(false) })
  it('3-digit resistor', () => {
    expect(decodeResistor3('103')).toMatchObject({ ok: true, value: 10000 })
    expect(decodeResistor3('472')).toMatchObject({ value: 4700 })
    expect(decodeResistor3('100')).toMatchObject({ value: 10 })
    expect(decodeResistor3('10').ok).toBe(false)
  })
  it('3-digit capacitor is in pF', () => {
    expect(decodeCapacitor3('104')).toMatchObject({ ok: true, unit: 'F' })
    expect((decodeCapacitor3('104') as { value: number }).value).toBeCloseTo(100e-9, 15)
    expect((decodeCapacitor3('472') as { value: number }).value).toBeCloseTo(4.7e-9, 15)
    expect(decodeCapacitor3('abc').ok).toBe(false)
  })
})

describe('E12 helpers', () => {
  it('rounds up and down', () => {
    expect(e12Up(135)).toBe(150)
    expect(e12Up(150)).toBe(150)
    expect(e12Up(4600)).toBe(4700)
    expect(e12Up(40000)).toBe(47000)
    expect(e12Up(0.38)).toBeCloseTo(0.39, 12)
    expect(e12Down(156)).toBe(150)
    expect(e12Down(881)).toBe(820)
    expect(e12Down(40000)).toBe(39000)
    expect(e12Up(9500)).toBe(10000)
  })
  it('is NaN for non-positive input', () => { expect(e12Up(0)).toBeNaN(); expect(e12Down(-1)).toBeNaN() })
})

describe('Li-ion state of charge (§15)', () => {
  it('matches the three published anchor points', () => {
    expect(liIonSoc(4.2)).toBe(100)
    expect(liIonSoc(3.7)).toBe(50)
    expect(liIonSoc(3.0)).toBe(0)
  })
  it('is clamped and monotonic', () => {
    expect(liIonSoc(5)).toBe(100)
    expect(liIonSoc(2)).toBe(0)
    let prev = -1
    for (let v = 3; v <= 4.2; v += 0.05) { const s = liIonSoc(v); expect(s).toBeGreaterThanOrEqual(prev); prev = s }
    expect(liIonSoc(NaN)).toBeNaN()
  })
})
