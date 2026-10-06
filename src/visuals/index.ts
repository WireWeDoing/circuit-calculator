import type { ComponentType } from 'react'
import type { VisualProps } from './kit.tsx'
import * as basic from './basic.tsx'
import * as re from './reactive.tsx'
import * as ac from './ac.tsx'
import * as dev from './devices.tsx'
import * as dig from './digital.tsx'
import * as rf from './rf.tsx'
import * as pr from './problems.tsx'

export type Visual = ComponentType<VisualProps>

/**
 * Registry of diagrams. Every Formula.visual id must exist here (enforced by tests/registry.test.ts).
 * Visual components get the live input values `v`, outputs `o`, active `mode` and list values.
 */
export const VISUALS: Record<string, Visual> = {
  ohm: basic.Ohm, power: basic.Power,
  'series-R': basic.SeriesR, 'parallel-R': basic.ParallelR, 'series-C': basic.SeriesC, 'parallel-C': basic.ParallelC, 'series-L': basic.SeriesL, 'parallel-L': basic.ParallelL,
  divider: basic.Divider, 'current-divider': basic.CurrentDivider, 'colour-code': basic.ColourCode, 'prefix-ladder': basic.PrefixLadder,
  'series-parallel-table': basic.SeriesParallelTable, reverse: basic.Reverse,
  'cap-charge': re.CapCharge, 'cap-energy': re.CapEnergy, 'reactance-C': re.ReactanceC, 'reactance-L': re.ReactanceL, 'rc-tau': re.RcTau,
  'rc-charge': re.RcCharge, 'rc-discharge': re.RcDischarge, settle: re.Settle, 'ind-energy': re.IndEnergy, 'rl-tau': re.RlTau, induced: re.Induced,
  resonance: re.Resonance, 'filter-rc': re.FilterRc, 'filter-rl': re.FilterRl,
  impedance: ac.Impedance, sine: ac.Sine, '555': ac.FiveFiveFive, db: ac.Db, wavelength: ac.Wavelength, period: ac.Period, 'power-factor': ac.PowerFactor,
  diode: dev.DiodeV, led: dev.LedV, bjt: dev.Bjt, 'bjt-switch': dev.BjtSwitch, mosfet: dev.Mosfet, wire: dev.WireV, 'charge-flow': dev.ChargeFlow, kvl: dev.Kvl, kcl: dev.Kcl, battery: dev.BatteryV, pack: dev.Pack,
  adc: dig.Adc, nyquist: dig.Nyquist, pwm: dig.Pwm, decoupling: dig.Decoupling, crystal: dig.Crystal, uart: dig.Uart, i2c: dig.I2c,
  trace: rf.Trace, microstrip: rf.Microstrip, skin: rf.Skin, antenna: rf.Antenna, fspl: rf.Fspl, swr: rf.Swr,
  p1: pr.P1, p2: pr.P2, p3: pr.P3, p4: pr.P4, p5: pr.P5, p6: pr.P6, p7: pr.P7, p8: pr.P8, p13: pr.P13, p14: pr.P14, p15: pr.P15, p16: pr.P16, p18: pr.P18, p20: pr.P20,
}

/** diagrams that draw current arrows — the Calculator shows the conventional / electron-flow switch for these */
export const FLOW_VISUALS = new Set(['series-R', 'parallel-R', 'divider', 'current-divider', 'p1', 'p2', 'p3', 'p4', 'p5', 'p13', 'p14', 'p20', 'led', 'bjt-switch'])
