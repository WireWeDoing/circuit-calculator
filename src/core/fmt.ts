import { fmtNum, fmtSI } from './units.ts'
/** N(x) → "0.0047"; S('resistance', 4700) → "4.7 kΩ" — used inside step text */
export const N = (x: number, digits?: number): string => fmtNum(x, digits)
export const S = fmtSI
