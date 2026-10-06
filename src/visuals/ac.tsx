import { Arrow, Caption, Diagram, fv, Plot, Rect, Two, Txt, Wire, pick, type VisualProps } from './kit.tsx'
import { fmtNum, fmtSI } from '../core/units.ts'

export const Impedance = (p: VisualProps) => {
  const R = pick(p, 'R') ?? 100
  const X = pick(p, 'X') ?? (p.v.XL !== undefined && p.v.XC !== undefined ? p.v.XL - p.v.XC : 100)
  const sc = 120 / Math.max(Math.abs(R), Math.abs(X), 1e-9)
  const w = R * sc, h = -X * sc
  const ox = 90, oy = 100
  const theta = Math.atan2(X, R) * (180 / Math.PI)
  return (
    <Diagram title="Impedance triangle: resistance along the base, reactance upright, impedance as the hypotenuse" h={190}>
      <Arrow x1={ox} y1={oy} x2={ox + w} y2={oy} c="accent" /><Arrow x1={ox + w} y1={oy} x2={ox + w} y2={oy + h} c="hot" /><Arrow x1={ox} y1={oy} x2={ox + w} y2={oy + h} c="good" w={3} />
      <Txt x={ox + w / 2} y={oy + (h < 0 ? 16 : -8)} c="accent" bold>R {fmtNum(R)} Ω</Txt>
      <Txt x={ox + w + 8} y={oy + h / 2} anchor="start" c="hot" bold>X {fmtNum(X)} Ω</Txt>
      <Txt x={ox + w / 2 - 20} y={oy + h / 2 - 8} anchor="end" c="good" bold>|Z| {fmtNum(Math.hypot(R, X))} Ω</Txt>
      <path d={`M ${ox + 28} ${oy} A 28 28 0 0 ${X >= 0 ? 0 : 1} ${ox + 28 * Math.cos(Math.atan2(X, R))} ${oy - 28 * Math.sin(Math.atan2(X, R))}`} fill="none" stroke="var(--ink)" />
      <Txt x={ox + 40} y={oy + (X >= 0 ? -6 : 14)} size={10.5} anchor="start">θ {fmtNum(theta, 3)}°</Txt>
      <Txt x={290} y={60} size={10.5} c="muted" anchor="middle">X up = inductive</Txt><Txt x={290} y={74} size={10.5} c="muted">(current lags)</Txt>
      <Txt x={290} y={130} size={10.5} c="muted">X down = capacitive</Txt><Txt x={290} y={144} size={10.5} c="muted">(current leads)</Txt>
      <Caption>Z = R + jX; |Z| = √(R² + X²); θ = arctan(X/R)</Caption>
    </Diagram>
  )
}

export const Sine = (p: VisualProps) => {
  const Vpk = p.v.Vpeak ?? (p.v.Vrms !== undefined ? p.v.Vrms * Math.SQRT2 : p.o?.Vpeak) ?? 10
  const x0 = 30, w = 300, cy = 90, a = 60
  const y = (v: number) => cy - (v / Vpk) * a
  const pts = Array.from({ length: 101 }, (_, i) => `${x0 + (i / 100) * w},${y(Vpk * Math.sin((i / 100) * 4 * Math.PI))}`).join(' ')
  const Vrms = Vpk / Math.SQRT2
  return (
    <Diagram title="Sine wave with its peak, peak-to-peak, RMS and rectified average levels" h={190}>
      <line x1={x0} y1={cy} x2={x0 + w} y2={cy} stroke="var(--muted)" />
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="2.4" />
      <line x1={x0} y1={y(Vpk)} x2={x0 + w} y2={y(Vpk)} stroke="var(--hot)" strokeDasharray="4 3" /><Txt x={x0 + w - 2} y={y(Vpk) - 4} anchor="end" size={10} c="hot" bold>Vpeak {fmtSI('voltage', Vpk)}</Txt>
      <line x1={x0} y1={y(Vrms)} x2={x0 + w} y2={y(Vrms)} stroke="var(--good)" strokeDasharray="4 3" /><Txt x={x0 + 4} y={y(Vrms) - 4} anchor="start" size={10} c="good" bold>Vrms {fmtSI('voltage', Vrms)}</Txt>
      <line x1={x0} y1={y(0.637 * Vpk)} x2={x0 + w} y2={y(0.637 * Vpk)} stroke="var(--muted)" strokeDasharray="1 4" /><Txt x={x0 + w - 2} y={y(0.637 * Vpk) + 12} anchor="end" size={9.5} c="muted">Vavg(rectified) {fmtSI('voltage', 0.637 * Vpk)}</Txt>
      <Arrow x1={x0 + 8} y1={y(Vpk)} x2={x0 + 8} y2={y(-Vpk)} c="ink" w={1.2} /><Arrow x1={x0 + 8} y1={y(-Vpk)} x2={x0 + 8} y2={y(Vpk)} c="ink" w={1.2} />
      <Txt x={x0 + 14} y={cy + 4} anchor="start" size={10}>Vpp {fmtSI('voltage', 2 * Vpk)}</Txt>
      <Caption>RMS = peak ÷ 1.414 · Vpp = 2 × peak (pure sine waves only)</Caption>
    </Diagram>
  )
}

export const FiveFiveFive = (p: VisualProps) => {
  const R1 = p.v.R1 ?? 1000, R2 = p.v.R2 ?? 10000
  const D = (R1 + R2) / (R1 + 2 * R2)
  const per = 100
  const pts = (n: number) => Array.from({ length: n }, (_, i) => `${40 + i * per},70 ${40 + i * per},30 ${40 + i * per + per * D},30 ${40 + i * per + per * D},70`).join(' ')
  return (
    <Diagram title="555 astable output: high for most of each cycle, duty cycle D = (R1+R2)/(R1+2R2)" h={190}>
      <rect x={20} y={90} width={90} height={80} rx={6} fill="var(--soft)" stroke="var(--accent)" strokeWidth="2" /><Txt x={65} y={134} bold>555</Txt>
      <Wire d="M 110 110 H 140" /><Two kind="R" x1={140} y1={110} x2={215} y2={110} label="R1" value={fv('resistance', p.v.R1, '')} /><Wire d="M 215 110 H 230" /><Two kind="R" x1={230} y1={110} x2={305} y2={110} label="R2" value={fv('resistance', p.v.R2, '')} /><Wire d="M 305 110 H 320 V 140" /><Two kind="C" x1={320} y1={140} x2={320} y2={170} label="C" value={fv('capacitance', p.v.C, '')} side={-1} />
      <polyline points={pts(3)} fill="none" stroke="var(--hot)" strokeWidth="2.4" strokeLinejoin="round" />
      <Txt x={40 + per * D / 2} y={22} size={10} c="hot" bold>high {fmtNum(D * 100, 3)}%</Txt><Txt x={40 + per * D + (per * (1 - D)) / 2} y={86} size={10} c="muted">low</Txt>
      <Txt x={300} y={22} size={10.5} c="muted">f = 1.44 / ((R1+2R2)·C)</Txt>
    </Diagram>
  )
}

export const Db = (p: VisualProps) => {
  const power = p.v.P1 !== undefined || p.v.P2 !== undefined || p.v.P !== undefined || p.v.dBm !== undefined
  const k = power ? 10 : 20
  const ratio = p.v.P2 && p.v.P1 ? p.v.P2 / p.v.P1 : p.v.V2 && p.v.V1 ? p.v.V2 / p.v.V1 : undefined
  const dbv = p.o?.dB ?? p.o?.dBm
  return (
    <Diagram title="Decibel scale: each factor of 10 in power adds 10 dB; in voltage adds 20 dB" h={190}>
      <Plot xmin={0.1} xmax={1000} ymin={-k} ymax={3 * k} xlog fn={(x) => k * Math.log10(x)} xlabel={`ratio ${power ? '(power)' : '(voltage / current)'}`} ylabel="dB" xticks={[[0.1, '0.1'], [1, '1'], [10, '10'], [100, '100'], [1000, '1000']]} yticks={[[0, '0'], [k, `${k}`], [2 * k, `${2 * k}`], [3 * k, `${3 * k}`]]}
        marker={ratio && dbv !== undefined && ratio > 0.1 && ratio < 1000 ? { x: ratio, y: dbv, label: `${fmtNum(dbv, 3)} dB` } : undefined} />
      <Txt x={50} y={24} size={10} c="muted" anchor="start">{power ? '+3 dB ≈ 2× · +10 dB = 10× · −3 dB = ½' : '+6 dB ≈ 2× · +20 dB = 10×'}</Txt>
      <Caption>A logarithmic ruler: huge ratios become small, easy numbers</Caption>
    </Diagram>
  )
}

export const Wavelength = (p: VisualProps) => {
  const lam = pick(p, 'lambda')
  return (
    <Diagram title="Wavelength is the distance of one full wave cycle" h={170}>
      <polyline points={Array.from({ length: 121 }, (_, i) => `${30 + (i / 120) * 300},${80 - 40 * Math.sin((i / 120) * 3 * 2 * Math.PI)}`).join(' ')} fill="none" stroke="var(--accent)" strokeWidth="2.4" />
      <Arrow x1={30} y1={138} x2={130} y2={138} c="hot" /><Arrow x1={130} y1={138} x2={30} y2={138} c="hot" /><Txt x={80} y={154} c="hot" bold>λ = {fv('length', lam, 'c / f')}</Txt>
      <Txt x={250} y={150} size={10.5} c="muted">f = {fv('frequency', p.v.f, '')}</Txt>
      <Caption>Higher frequency → shorter wavelength (λ (m) = 300 / f (MHz))</Caption>
    </Diagram>
  )
}

export const Period = (p: VisualProps) => {
  const T = pick(p, 'T'), f = pick(p, 'f')
  return (
    <Diagram title="One period T is the time of one cycle; frequency is how many cycles fit in one second" h={170}>
      <polyline points={Array.from({ length: 121 }, (_, i) => `${30 + (i / 120) * 300},${80 - 40 * Math.sin((i / 120) * 3 * 2 * Math.PI)}`).join(' ')} fill="none" stroke="var(--accent)" strokeWidth="2.4" />
      <Arrow x1={30} y1={138} x2={130} y2={138} c="hot" /><Arrow x1={130} y1={138} x2={30} y2={138} c="hot" /><Txt x={80} y={154} c="hot" bold>T = {fv('time', T, '?')}</Txt>
      <Txt x={250} y={150} bold c="accent">f = {fv('frequency', f, '?')}</Txt>
      <Caption>f = 1/T and T = 1/f — seconds ↔ Hz, ms ↔ kHz, µs ↔ MHz</Caption>
    </Diagram>
  )
}

export const Impedance2 = Impedance
export const PowerFactor = (p: VisualProps) => {
  const P = pick(p, 'Preal'), S = pick(p, 'Sapp')
  const pf = P !== undefined && S ? P / S : 0.8
  const w = 150, h = 150 * Math.sqrt(1 - pf * pf)
  return (
    <Diagram title="Power triangle: real power P and reactive power Q combine into apparent power S" h={180}>
      <Arrow x1={50} y1={140} x2={50 + w} y2={140} c="good" /><Arrow x1={50 + w} y1={140} x2={50 + w} y2={140 - h} c="hot" /><Arrow x1={50} y1={140} x2={50 + w} y2={140 - h} c="accent" w={3} />
      <Txt x={50 + w / 2} y={158} c="good" bold>Real P {fv('power', P, '')} (wattmeter)</Txt><Txt x={50 + w + 8} y={140 - h / 2} anchor="start" c="hot" size={10.5} bold>reactive Q</Txt>
      <Txt x={40 + w / 2} y={140 - h / 2 - 8} anchor="end" c="accent" bold>S {fmtNum(S ?? NaN, 4) === 'NaN' ? '' : `${fmtNum(S!, 4)} VA`}</Txt>
      <Txt x={290} y={60} bold>PF = {fmtNum(pf, 3)}</Txt><Txt x={290} y={76} size={10.5} c="muted">= P / S = cos θ</Txt>
    </Diagram>
  )
}
export { Rect, Two, Wire }
