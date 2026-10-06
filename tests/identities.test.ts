/**
 * Independent checks: physical identities and round-trips between formulas.
 * These do not reuse the cheat-sheet numbers, so a wrong formula can't be hidden by a wrong example.
 */
import { describe, expect, it } from 'vitest'
import { close, logu, rng, run, status } from './helpers.ts'

const N = 60
const r = rng(2024)
const R = () => logu(r, 1, 1e6)

describe('Ohm / power round-trips', () => {
  it('V = I·R, I = V/R, R = V/I agree', () => {
    for (let i = 0; i < N; i++) {
      const I = logu(r, 1e-6, 10), Rr = R()
      const V = run('ohms-law', 'V', { I, R: Rr }).V!
      close(run('ohms-law', 'I', { V, R: Rr }).I!, I)
      close(run('ohms-law', 'R', { V, I }).R!, Rr)
    }
  })
  it('all three power forms are equal', () => {
    for (let i = 0; i < N; i++) {
      const V = logu(r, 0.1, 400), Rr = R()
      const I = V / Rr
      const a = run('power', 'P', { V, I }).P!
      close(a, run('power', 'P_IR', { I, R: Rr }).P!)
      close(a, run('power', 'P_VR', { V, R: Rr }).P!)
      close(run('power', 'V', { P: a, I }).V!, V)
      close(run('power', 'I', { P: a, V }).I!, I)
    }
  })
})

describe('resistor networks', () => {
  it('parallel pair = parallel-n with two values; result below the smaller resistor', () => {
    for (let i = 0; i < N; i++) {
      const a = R(), b = R()
      const two = run('r-parallel-2', 'Rt', { R1: a, R2: b }).Rt!
      close(two, run('r-parallel-n', 'Rt', {}, { R: [a, b] }).Rt!)
      expect(two).toBeLessThan(Math.min(a, b))
    }
  })
  it('series total is larger than any part and equals the sum', () => {
    const rs = [1000, 470, 2200, 10]
    expect(run('r-series', 'Rt', {}, { R: rs }).Rt).toBe(3680)
  })
  it('equal resistors in parallel give R/n', () => {
    for (const n of [2, 3, 5, 10]) close(run('r-parallel-n', 'Rt', {}, { R: Array(n).fill(1200) }).Rt!, 1200 / n)
  })
  it('reverse formulas undo the forward ones', () => {
    for (let i = 0; i < N; i++) {
      const a = R(), x = R()
      close(run('reverse-formulas', 'Rs', { Rt: a + x, R1: a }).Rx!, x, 1e-9)
      close(run('reverse-formulas', 'Rp', { Rt: (a * x) / (a + x), R1: a }).Rx!, x, 1e-9)
      // keep ratios within ~4 decades: Ct − C1 loses digits to float cancellation beyond that (inherent, not a bug)
      const c1 = logu(r, 1e-9, 1e-6), cx = logu(r, 1e-9, 1e-6)
      close(run('reverse-formulas', 'Cp', { Ct: c1 + cx, C1: c1 }).Cx!, cx, 1e-9)
      close(run('reverse-formulas', 'Cs', { Ct: (c1 * cx) / (c1 + cx), C1: c1 }).Cx!, cx, 1e-9)
      const l1 = logu(r, 1e-6, 1e-3), lx = logu(r, 1e-6, 1e-3)
      close(run('reverse-formulas', 'Ls', { Lt: l1 + lx, L1: l1 }).Lx!, lx, 1e-9)
      close(run('reverse-formulas', 'Lp', { Lt: (l1 * lx) / (l1 + lx), L1: l1 }).Lx!, lx, 1e-9)
    }
  })
  it('voltage + current dividers conserve voltage / current', () => {
    for (let i = 0; i < N; i++) {
      const R1 = R(), R2 = R(), V = logu(r, 1, 100)
      const top = V - run('voltage-divider', 'Vout', { Vin: V, R1, R2 }).Vout!
      close(top / V, R1 / (R1 + R2), 1e-9)
      const It = logu(r, 1e-3, 5)
      const o = run('current-divider', 'I1', { It, R1, R2 })
      close(o.I1! + o.I2!, It)
      close(o.I1! * R1, o.I2! * R2) // same voltage across both
    }
  })
  it('Thévenin divider matches a direct computation with the load', () => {
    for (let i = 0; i < N; i++) {
      const Vin = logu(r, 1, 50), R1 = R(), R2 = R(), RL = R()
      const bottom = (R2 * RL) / (R2 + RL)
      const direct = (Vin * bottom) / (R1 + bottom)
      close(run('p4-thevenin', 'divider', { Vin, R1, R2, RL }).VL!, direct, 1e-9)
    }
  })
  it('maximum power transfer at RL = Rth', () => {
    const Vth = 6, Rth = 5000
    const P = (RL: number) => run('p4-thevenin', 'load', { Vth, Rth, RL }).VL! ** 2 / RL
    const best = P(Rth)
    close(best, run('p4-thevenin', 'load', { Vth, Rth, RL: Rth }).Pmax!)
    expect(P(Rth * 0.5)).toBeLessThan(best)
    expect(P(Rth * 2)).toBeLessThan(best)
  })
  it('Millman node satisfies KCL', () => {
    for (let i = 0; i < N; i++) {
      const o = run('p5-millman', 'V', { V1: logu(r, 1, 30), V2: logu(r, 1, 30), R1: R(), R2: R(), R3: R() })
      close(o.I1! + o.I2!, o.I3!, 1e-9)
    }
  })
  it('Wheatstone: Rx balances the bridge (output 0)', () => {
    for (let i = 0; i < N; i++) {
      const R1 = R(), R2 = R(), R3 = R()
      const Rx = run('p8-wheatstone', 'Rx', { R1, R2, R3 }).Rx!
      expect(Math.abs(run('p8-wheatstone', 'Vout', { V: 5, R1, R2, R3, Rx }).Vout!)).toBeLessThan(1e-9)
    }
  })
})

describe('solving circuits: both methods agree and check out', () => {
  it('P1 method A = method B, and the answer reproduces the measured current', () => {
    for (let i = 0; i < N; i++) {
      const V = logu(r, 1, 50), R1 = R(), R2 = R()
      const I = V / R1 + V / R2
      const a = run('p1-unknown-parallel', 'A', { V, I, R1 }).R2!
      const b = run('p1-unknown-parallel', 'B', { V, I, R1 }).R2!
      close(a, R2, 1e-8); close(b, R2, 1e-8)
    }
  })
  it('P1 rejects measurements that would give a negative resistor', () => {
    expect(status('p1-unknown-parallel', 'A', { V: 12, I: 0.005, R1: 1000 }).status).toBe('invalid') // I < V/R1
    expect(status('p1-unknown-parallel', 'B', { V: 12, I: 0.005, R1: 1000 }).status).toBe('invalid')
  })
  it('P2 method A = method B and reproduces total current', () => {
    for (let i = 0; i < N; i++) {
      // moderate ratios: subtracting nearly-equal numbers is ill-conditioned for extreme values
      const V = logu(r, 5, 50), R1 = logu(r, 1e2, 1e4), R2 = logu(r, 1e2, 1e4), R3 = logu(r, 1e2, 1e4)
      const I = V / (R1 + (R2 * R3) / (R2 + R3))
      const a = run('p2-series-parallel', 'A', { V, I, R1, R2 }).R3!
      const b = run('p2-series-parallel', 'B', { V, I, R1, R2 }).R3!
      close(a, R3, 1e-8); close(b, R3, 1e-8)
    }
  })
  it('P3 both routes give the same Rx', () => {
    for (let i = 0; i < N; i++) {
      const V = logu(r, 3, 24), R1 = R(), Rx = R()
      const I = V / (R1 + Rx)
      close(run('p3-unknown-series', 'I', { V, I, R1 }).Rx!, Rx, 1e-8)
      close(run('p3-unknown-series', 'V1', { V, V1: I * R1, R1 }).Rx!, Rx, 1e-8)
    }
  })
  it('P6 divider design hits the target and the readback factor inverts it', () => {
    for (let i = 0; i < N; i++) {
      const Vin = logu(r, 6, 60), Vout = Vin * (0.1 + 0.4 * r()), R2 = logu(r, 1e3, 1e5)
      const o = run('p6-adc-divider', 'R1', { Vin, Vout, R2 })
      close(run('voltage-divider', 'Vout', { Vin, R1: o.R1!, R2 }).Vout!, Vout, 1e-9)
      close(Vout * o.k!, Vin, 1e-9)
      close(run('p6-adc-divider', 'R2', { Vin, Vout, R1: o.R1! }).R2!, R2, 1e-9)
    }
  })
  it('P7 sensor resistance round-trips through the divider (bottom and top)', () => {
    for (let i = 0; i < N; i++) {
      const Vin = logu(r, 1, 12), Rf = R(), Rs = R()
      const Vout = (Vin * Rs) / (Rs + Rf)
      close(run('p7-sensor-divider', 'bottom', { Vin, Rf, Vout }).Rs!, Rs, 1e-8)
      const Vtop = (Vin * Rf) / (Rs + Rf) // sensor on top
      close(run('p7-sensor-divider', 'top', { Vin, Rf, Vout: Vtop }).Rs!, Rs, 1e-8)
    }
  })
  it('P20 internal resistance: predicted voltage at the measured load matches the measurement', () => {
    for (let i = 0; i < N; i++) {
      const Voc = logu(r, 1.5, 12), Rint = logu(r, 0.01, 2), RL = logu(r, 1, 100)
      const VL = (Voc * RL) / (RL + Rint)
      const o = run('p20-internal-resistance', 'Rint', { Voc, VL, RL })
      close(o.Rint!, Rint, 1e-8)
      close(run('p20-internal-resistance', 'sag', { Voc, Rint: o.Rint!, Inew: VL / RL }).V!, VL, 1e-8)
    }
  })
})

describe('capacitors, inductors, timing', () => {
  it('series capacitors: total smaller than the smallest; 1/Ct = Σ1/C', () => {
    const cs = [1e-6, 4.7e-7, 2.2e-6]
    const ct = run('c-series', 'Ct', {}, { C: cs }).Ct!
    expect(ct).toBeLessThan(Math.min(...cs))
    close(1 / ct, cs.reduce((a, c) => a + 1 / c, 0))
  })
  it('Q = C·V and E = ½CV² are consistent: E = ½QV', () => {
    for (let i = 0; i < N; i++) {
      const C = logu(r, 1e-12, 1e-2), V = logu(r, 0.1, 400)
      const Q = run('cap-charge', 'Q', { C, V }).Q!
      close(run('cap-energy', 'E', { C, V }).E!, 0.5 * Q * V)
      close(run('cap-charge', 'C', { Q, V }).C!, C); close(run('cap-charge', 'V', { Q, C }).V!, V)
    }
  })
  it('XC and XL: reactance ratio at resonance is 1 and f0 solves XL = XC', () => {
    for (let i = 0; i < N; i++) {
      const L = logu(r, 1e-9, 1e-1), C = logu(r, 1e-12, 1e-4)
      const f0 = run('resonant-frequency', 'f0', { L, C }).f0!
      close(run('ind-reactance', 'XL', { f: f0, L }).XL!, run('cap-reactance', 'XC', { f: f0, C }).XC!, 1e-9)
      // P11 designs the other part back
      close(run('p11-choose-lc', 'C', { f: f0, L }).C!, C, 1e-9)
      close(run('p11-choose-lc', 'L', { f: f0, C }).L!, L, 1e-9)
    }
  })
  it('at the RC cutoff the reactance equals R; design modes invert', () => {
    for (let i = 0; i < N; i++) {
      const Rr = R(), C = logu(r, 1e-12, 1e-4)
      const fc = run('rc-cutoff', 'fc', { R: Rr, C }).fc!
      close(run('cap-reactance', 'XC', { f: fc, C }).XC!, Rr, 1e-9)
      close(run('rc-cutoff', 'C', { fc, R: Rr }).C!, C, 1e-9)
      close(run('rc-cutoff', 'R', { fc, C }).R!, Rr, 1e-9)
    }
  })
  it('RL cutoff: XL(fc) = R', () => {
    for (let i = 0; i < N; i++) {
      const Rr = R(), L = logu(r, 1e-6, 1)
      const fc = run('rl-cutoff', 'fc', { R: Rr, L }).fc!
      close(run('ind-reactance', 'XL', { f: fc, L }).XL!, Rr, 1e-9)
    }
  })
  it('RC charge + discharge sum to the supply; 1τ is 63.2%, 5τ > 99%', () => {
    for (let i = 0; i < N; i++) {
      const tau = logu(r, 1e-6, 10), t = tau * r() * 6, Vs = logu(r, 1, 30)
      close(run('rc-charging', 'V', { Vs, t, tau }).V! + run('rc-discharging', 'V', { V0: Vs, t, tau }).V!, Vs, 1e-9)
    }
    close(run('rc-charging', 'V', { Vs: 1, t: 1, tau: 1 }).V!, 1 - Math.exp(-1))
    expect(run('rc-charging', 'V', { Vs: 1, t: 5, tau: 1 }).V!).toBeGreaterThan(0.99)
    expect(run('settling-time', 't', { tau: 0.2 }).t).toBe(1)
  })
  it('P9 time-to-threshold inverts the charging formula (charge and discharge)', () => {
    for (let i = 0; i < N; i++) {
      const Rr = R(), C = logu(r, 1e-9, 1e-3), Vs = logu(r, 1, 30), V = Vs * (0.05 + 0.9 * r())
      const o = run('p9-time-to-voltage', 'charge', { Vs, R: Rr, C, V })
      close(run('rc-charging', 'V', { Vs, t: o.t!, tau: o.tau! }).V!, V, 1e-9)
      close(run('p9-time-to-voltage', 'R', { Vs, C, V, t: o.t! }).R!, Rr, 1e-9)
      close(run('p9-time-to-voltage', 'C', { Vs, R: Rr, V, t: o.t! }).C!, C, 1e-9)
      const d = run('p9-time-to-voltage', 'discharge', { V0: Vs, R: Rr, C, V })
      close(run('rc-discharging', 'V', { V0: Vs, t: d.t!, tau: d.tau! }).V!, V, 1e-9)
    }
    // "to half the supply: t = 0.69 × RC"
    close(run('p9-time-to-voltage', 'charge', { Vs: 2, R: 1, C: 1, V: 1 }).t!, Math.LN2)
  })
  it('P12 recovers C and L from a simulated AC measurement', () => {
    for (let i = 0; i < N; i++) {
      const C = logu(r, 1e-9, 1e-3), L = logu(r, 1e-6, 1), f = logu(r, 10, 1e6), V = logu(r, 1, 20), wire = logu(r, 0.1, 50)
      const XC = run('cap-reactance', 'XC', { f, C }).XC!
      close(run('p12-ac-measurement', 'C', { V, I: V / XC, f }).C!, C, 1e-8)
      const XL = run('ind-reactance', 'XL', { f, L }).XL!
      close(run('p12-ac-measurement', 'L', { V, I: V / XL, f }).L!, L, 1e-8)
      const Z = Math.hypot(Math.min(wire, XL), XL) // coil wire resistance no larger than its reactance (else Z² − R² is pure cancellation)
      close(run('p12-ac-measurement', 'L_R', { V, I: V / Z, f, R: Math.min(wire, XL) }).L!, L, 1e-7)
    }
  })
  it('RL tau and induced voltage are consistent', () => {
    close(run('rl-tau', 'tau', { L: 0.01, R: 100 }).tau!, 1e-4)
    close(run('induced-voltage', 'V', { L: 0.01, dI: 1, dt: 1e-6 }).V!, 1e4)
  })
  it('Q series and parallel are reciprocal views of the same tank (at R_par = X²/R_ser)', () => {
    const L = 1e-5, C = 1e-10, Rs = 10
    const Qs = run('q-series', 'Q', { R: Rs, L, C }).Q!
    const Rp = (L / C) / Rs // equivalent parallel resistance
    close(run('q-parallel', 'Q', { R: Rp, L, C }).Q!, Qs, 1e-9)
    close(run('bandwidth', 'BW', { f0: 1e7, Q: 50 }).BW!, 2e5)
  })
})

describe('AC / RF / dB', () => {
  it('Vrms ↔ Vpeak ↔ Vpp are mutually consistent', () => {
    for (let i = 0; i < N; i++) {
      const pk = logu(r, 0.1, 500)
      const rms = run('vrms-from-peak', 'Vrms', { Vpeak: pk }).Vrms!
      close(run('vpeak-from-rms', 'Vpeak', { Vrms: rms }).Vpeak!, pk)
      close(run('vpp', 'Vpp', { Vpeak: pk }).Vpp!, 2 * pk)
      close(run('rectified-average', 'Vavg', { Vpeak: pk }).Vavg!, pk * 0.6366, 1e-3)
    }
  })
  it('impedance triangle: |Z|² = R² + X²; θ = 45° when X = R; sign follows the reactance', () => {
    for (let i = 0; i < N; i++) {
      const Rr = R(), X = logu(r, 1, 1e6)
      close(run('impedance-magnitude', 'Z', { R: Rr, X }).Z! ** 2, Rr ** 2 + X ** 2, 1e-9)
    }
    close(run('phase-angle', 'theta', { X: 50, R: 50 }).theta!, 45)
    expect(run('phase-angle', 'theta', { X: -50, R: 50 }).theta).toBeLessThan(0)
    expect(run('impedance-complex', 'X', { R: 10, XL: 5, XC: 20 }).X).toBe(-15)
  })
  it('dB: doubling power = +3.01 dB, doubling voltage = +6.02 dB, 10× = 10 / 20 dB', () => {
    close(run('db-power', 'dB', { P1: 1, P2: 2 }).dB!, 3.0103, 1e-4)
    close(run('db-voltage', 'dB', { V1: 1, V2: 2 }).dB!, 6.0206, 1e-4)
    close(run('db-power', 'dB', { P1: 1, P2: 10 }).dB!, 10)
    close(run('db-voltage', 'dB', { V1: 1, V2: 10 }).dB!, 20)
    close(run('db-power', 'dB', { P1: 2, P2: 1 }).dB!, -3.0103, 1e-4)
  })
  it('dBm ↔ power round-trips; anchors 0 dBm = 1 mW, 30 dBm = 1 W', () => {
    for (let i = 0; i < N; i++) {
      const dBm = -100 + 150 * r()
      close(run('dbm', 'dBm', { P: run('dbm', 'P', { dBm }).P! }).dBm!, dBm, 1e-9)
    }
    close(run('dbm', 'P', { dBm: 0 }).P!, 1e-3)
    close(run('dbm', 'P', { dBm: 30 }).P!, 1)
    close(run('dbm', 'P', { dBm: -100 }).P!, 1e-13)
  })
  it('Γ, VSWR and return loss agree with each other', () => {
    for (let i = 0; i < N; i++) {
      const ZL = R(), Z0 = [50, 75][i % 2]!
      const G = Math.abs(run('reflection-coefficient', 'G', { ZL, Z0 }).G!)
      const s = run('vswr', 'S', { G }).S!
      expect(s).toBeGreaterThanOrEqual(1)
      // VSWR is also max(ZL/Z0, Z0/ZL) for a resistive load
      close(s, Math.max(ZL / Z0, Z0 / ZL), 1e-9)
      close(run('return-loss', 'RL', { G }).RL!, -20 * Math.log10(G), 1e-9)
    }
    close(run('reflection-coefficient', 'G', { ZL: 50, Z0: 50 }).G!, 0)
  })
  it('wavelength × frequency = c; dipole = 2 × quarter-wave', () => {
    for (let i = 0; i < N; i++) {
      const f = logu(r, 1e3, 1e10)
      close(run('wavelength', 'lambda', { f }).lambda! * f, 3e8)
      close(run('half-wave-dipole', 'L', { f }).L!, 2 * run('quarter-wave', 'L', { f }).L!)
      close(run('half-wave-dipole', 'L', { f }).arm!, run('quarter-wave', 'L', { f }).L!)
    }
  })
  it('FSPL: +6.02 dB per doubling of distance', () => {
    const a = run('fspl', 'FSPL', { d: 1000, f: 433e6 }).FSPL!
    close(run('fspl', 'FSPL', { d: 2000, f: 433e6 }).FSPL! - a, 6.0206, 1e-4)
    close(run('fspl', 'FSPL', { d: 1000, f: 866e6 }).FSPL! - a, 6.0206, 1e-4)
  })
  it('frequency ↔ period are reciprocal', () => {
    for (let i = 0; i < N; i++) { const f = logu(r, 0.1, 1e9); close(run('frequency-period', 'f', { T: run('frequency-period', 'T', { f }).T! }).f!, f) }
  })
})

describe('devices, microcontrollers, batteries', () => {
  it('ADC reading ↔ Vin round-trips within one step; resolution doubles per bit', () => {
    for (let i = 0; i < N; i++) {
      const Vref = [3.3, 5][i % 2]!, n = [8, 10, 12, 16][i % 4]!, Vin = Vref * r()
      const reading = run('adc-reading', 'Reading', { Vin, Vref, n }).Reading!
      const back = run('adc-reading', 'Vin', { Reading: reading, Vref, n }).Vin!
      const step = run('adc-step', 'Vstep', { Vref, n }).Vstep!
      expect(Math.abs(back - Vin)).toBeLessThanOrEqual(step * 1.0001)
      expect(Number.isInteger(reading)).toBe(true)
    }
    close(run('adc-step', 'Vstep', { Vref: 3.3, n: 11 }).Vstep! * 2, run('adc-step', 'Vstep', { Vref: 3.3, n: 10 }).Vstep!)
    expect(run('adc-reading', 'Reading', { Vin: 3.3, Vref: 3.3, n: 12 }).Reading).toBe(4095)
    expect(run('adc-reading', 'Reading', { Vin: 0, Vref: 3.3, n: 12 }).Reading).toBe(0)
  })
  it('PWM: D·Vhigh = Vavg and 8-bit register mapping', () => {
    const o = run('pwm', 'time', { T: 1e-3, ton: 0.25e-3, Vhigh: 5 })
    close(o.Vavg!, 1.25); close(o.f!, 1000)
    expect(run('pwm', 'register', { value: 255, bits: 8, Vhigh: 5 }).D).toBe(1)
    expect(run('pwm', 'register', { value: 0, bits: 8, Vhigh: 5 }).D).toBe(0)
    expect(status('pwm', 'time', { T: 1e-3, ton: 2e-3, Vhigh: 5 }).status).toBe('invalid')
    expect(status('pwm', 'register', { value: 256, bits: 8, Vhigh: 5 }).status).toBe('invalid')
  })
  it('UART: 10 bits per byte', () => { const o = run('uart-bit-time', 'tbit', { baud: 9600 }); close(o.tbyte!, 10 * o.tbit!); close(o.rate!, 960) })
  it('crystal load caps round-trip', () => {
    for (let i = 0; i < N; i++) {
      const CL = logu(r, 6e-12, 30e-12), Cs = CL * r() * 0.5
      const C1 = run('crystal-load', 'C1', { CL, Cs }).C1!
      close(run('crystal-load', 'CL', { C1, C2: C1, Cs }).CL!, CL, 1e-9)
    }
  })
  it('LED resistor: current through R at the computed value equals the requested current', () => {
    for (let i = 0; i < N; i++) {
      const Vs = logu(r, 3, 24), Vf = Vs * (0.1 + 0.6 * r()), If = logu(r, 1e-3, 0.05)
      const Rr = run('led-resistor', 'R', { Vs, Vf, If }).R!
      close((Vs - Vf) / Rr, If)
    }
    expect(status('led-resistor', 'R', { Vs: 3.3, Vf: 3.4, If: 0.01 }).status).toBe('invalid')
  })
  it('several LEDs: n=1 reduces to the single-LED formula', () => {
    close(run('p13-several-leds', 'R', { Vs: 5, Vf: 2, I: 0.02, n: 1 }).R!, run('led-resistor', 'R', { Vs: 5, Vf: 2, If: 0.02 }).R!)
    expect(status('p13-several-leds', 'R', { Vs: 5, Vf: 2, I: 0.02, n: 3 }).status).toBe('invalid')
  })
  it('BJT: IC = hFE·IB, IE = IB + IC; switch design drives the load current', () => {
    const IC = run('bjt-gain', 'IC', { IB: 1e-4, hFE: 200 }).IC!
    close(run('bjt-emitter', 'IE', { IB: 1e-4, IC }).IE!, IC + 1e-4)
    const o = run('p17-bjt-switch', 'RB', { Vcc: 12, Rload: 400, Vce: 0.2, Vgpio: 3.3 })
    close(o.IB! * o.RB!, 3.3 - 0.7, 1e-9)
    close(o.IC! * 400, 12 - 0.2, 1e-9)
  })
  it('BJT bias: VCE = Vcc − IC(RC+RE) when IC ≈ IE', () => {
    for (let i = 0; i < 20; i++) {
      const Vcc = logu(r, 9, 24), R1 = logu(r, 2e4, 6e4), R2 = logu(r, 1e4, 2e4), RE = logu(r, 200, 2000), RC = logu(r, 1e3, 1e4)
      const o = run('p18-bjt-bias', 'bias', { Vcc, R1, R2, RE, RC })
      close(o.VCE!, Vcc - o.IC! * (RC + RE), 1e-9)
    }
  })
  it('MOSFET and heat: P = I²R and ΔT = P·θ', () => {
    const o = run('p19-mosfet-switch', 'P', { ID: 3, RDS: 0.04, tJA: 125 })
    close(o.P!, 0.36); close(o.dT!, 45)
    close(run('mosfet-power', 'PD', { ID: 3, RDS: 0.04 }).PD!, o.P!)
    // scales with the square of current
    close(run('mosfet-power', 'PD', { ID: 6, RDS: 0.04 }).PD!, 4 * o.P!)
  })
  it('P16: sizing the heatsink puts the junction exactly at Tj,max', () => {
    for (let i = 0; i < 30; i++) {
      const P = logu(r, 0.5, 20), Ta = 25 + 30 * r(), Tjmax = 125, tJC = 1 + 4 * r(), tCS = 0.5
      const o = run('p16-heat', 'power', { P, Ta, Tjmax, tJA: 50, tJC, tCS })
      expect(o.tSA!).toBeGreaterThan(-1e6)
      close(Ta + P * (tJC + tCS + o.tSA!), Tjmax, 1e-9)
    }
  })
  it('Zener: worst-case resistor gives exactly IL + Iz,min at the lowest input', () => {
    for (let i = 0; i < 30; i++) {
      const Vz = logu(r, 3, 15), Vmin = Vz + logu(r, 1, 10), Vmax = Vmin + logu(r, 0.5, 10), IL = logu(r, 1e-3, 0.05)
      const o = run('p14-zener', 'R', { Vmin, Vmax, Vz, IL, Izmin: 0.005 })
      close((Vmin - Vz) / o.R!, IL + 0.005, 1e-9)
      close(o.PR!, o.Imax! ** 2 * o.R!, 1e-9)
      const chk = run('p14-zener', 'check', { Vmin, Vmax, Vz, IL, R: o.R! })
      close(chk.Izlow!, 0.005, 1e-6)
    }
  })
  it('transformer: ripple capacitor gives exactly the requested ripple (ΔV = I/(fC))', () => {
    const o = run('p15-transformer-rectifier', 'C', { Vp: 230, Vs: 12, I: 0.5, dV: 1.5, fr: 100 })
    close(0.5 / (100 * o.C!), 1.5)
    close(o.Vpeak!, 12 * Math.SQRT2 - 1.4)
  })
  it('battery: Wh = Ah·V; runtime × current = capacity; C-rate = 1/hours; pack math', () => {
    close(run('battery-energy', 'Wh', { Ah: 2.5, V: 3.7 }).Wh!, 9.25)
    close(run('battery-runtime', 't', { cap: 2, Iload: 0.08 }).t! * 0.08, 2)
    close(run('c-rate', 'rate', { I: 1, cap: 2 }).rate!, 0.5)
    close(run('battery-capacity', 'Ah', { I: 0.5, t: 5 }).Ah!, 2.5)
    close(run('voltage-sag', 'Vt', { Voc: 4, I: 2, Rint: 0.05 }).Vt!, 3.9)
    const p = run('p21-battery-packs', 'pack', { x: 3, y: 2, Vcell: 3.7, Ahcell: 2.5, Rcell: 0.05, Iload: 1 })
    close(p.V!, 11.1); close(p.Ah!, 5); close(p.Wh!, 55.5); close(p.Rint!, 0.075); close(p.t!, 5); close(p.treal!, 4)
    // 1S1P is the cell itself
    close(run('p21-battery-packs', 'pack', { x: 1, y: 1, Vcell: 3.7, Ahcell: 2.5, Rcell: 0.05, Iload: 1 }).Rint!, 0.05)
  })
  it('wire: cable voltage drop uses the loop (2 × length)', () => {
    const o = run('cable-voltage-drop', 'cable', { I: 10, rho: 1.68e-8, L: 10, A: 1.5e-6, Vsrc: 230 })
    close(o.Rwire!, 0.224); close(o.pct!, 2.24 / 230)
    close(run('wire-resistance', 'R', { rho: 1.68e-8, L: 20, A: 1.5e-6 }).R!, o.Rwire!)
  })
  it('KVL / KCL helpers', () => {
    expect(run('kvl', 'sum', {}, { V: [9, -2, -7] }).sum).toBe(0)
    expect(run('kvl', 'Vx', {}, { V: [12, -3, -4] }).Vx).toBe(-5)
    expect(run('kcl', 'diff', {}, { Iin: [0.05], Iout: [0.03, 0.01] }).diff).toBeCloseTo(0.01, 12)
    expect(status('kvl', 'sum', {}, { V: [] }).status).toBe('incomplete')
  })
  it('power factor: PF ≤ 1 enforced', () => {
    expect(status('power-factor', 'PF', { Preal: 250, Sapp: 230 }).status).toBe('invalid')
    close(run('power-factor', 'PF_VI', { V: 230, I: 1, Preal: 115 }).PF!, 0.5)
  })
})

describe('PCB / RF details', () => {
  it('IPC-2221: width mode reproduces the target current via the current mode', () => {
    for (let i = 0; i < 30; i++) {
      const I = logu(r, 0.1, 10), k = [0.048, 0.024][i % 2]!, dT = logu(r, 5, 40)
      const A = run('ipc-2221', 'w', { I, k, dT, oz: 1 }).A!
      close(run('ipc-2221', 'I', { k, dT, A }).I!, I, 1e-9)
    }
  })
  it('inner layers need more copper than outer layers for the same current', () => {
    expect(run('ipc-2221', 'w', { I: 2, k: 0.024, dT: 10, oz: 1 }).A!).toBeGreaterThan(run('ipc-2221', 'w', { I: 2, k: 0.048, dT: 10, oz: 1 }).A!)
  })
  it('skin depth falls as 1/√f (copper 66 µm @ 1 MHz)', () => {
    const d1 = run('skin-depth', 'delta', { rho: 1.68e-8, f: 1e6, mu: 4 * Math.PI * 1e-7 }).delta!
    close(d1, 65.2e-6, 0.01)
    close(run('skin-depth', 'delta', { rho: 1.68e-8, f: 1e8, mu: 4 * Math.PI * 1e-7 }).delta!, d1 / 10, 1e-9)
  })
  it('microstrip rejects geometries outside the approximation (negative impedance)', () => {
    expect(status('microstrip-z0', 'Z0', { er: 4.3, h: 1e-3, w: 1, t: 35e-6 }).status).toBe('invalid')
  })
  it('capacitor SRF is lower for larger C or ESL', () => {
    expect(run('cap-self-resonance', 'fsrf', { ESL: 1e-9, C: 1e-7 }).fsrf!).toBeGreaterThan(run('cap-self-resonance', 'fsrf', { ESL: 1e-9, C: 1e-6 }).fsrf!)
  })
})
