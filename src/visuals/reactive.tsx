import { Arrow, Caption, Diagram, Dot, fv, Plot, Rect, Two, Txt, Wire, pick, type VisualProps } from './kit.tsx'
import { fmtNum, fmtSI } from '../core/units.ts'

const TWO_PI = 2 * Math.PI
const rcTime: Array<[number, string]> = [[0, '0'], [1, '1τ'], [2, '2τ'], [3, '3τ'], [4, '4τ'], [5, '5τ']]

export const CapCharge = (p: VisualProps) => {
  const C = pick(p, 'C'), V = pick(p, 'V'), Q = pick(p, 'Q')
  return (
    <Diagram title="Capacitor holding charge Q at voltage V: a bucket (C) filled to a level (V)" h={170}>
      <Wire d="M 40 40 H 100" /><Wire d="M 40 130 H 100" /><Two kind="V" x1={40} y1={40} x2={40} y2={130} />
      <Wire d="M 100 40 V 70" /><Wire d="M 100 130 V 100" />
      <line x1={80} y1={70} x2={120} y2={70} stroke="var(--accent)" strokeWidth="4" /><line x1={80} y1={100} x2={120} y2={100} stroke="var(--accent)" strokeWidth="4" />
      {[86, 100, 114].map((x) => <g key={x}><text x={x} y={66} fontSize="11" textAnchor="middle" fill="var(--hot)" fontWeight="700">+</text><text x={x} y={113} fontSize="12" textAnchor="middle" fill="var(--accent)" fontWeight="700">−</text></g>)}
      <Txt x={145} y={88} anchor="start" bold>C {fv('capacitance', C, '')}</Txt>
      <Txt x={145} y={104} anchor="start" size={10.5} c="muted">V = {fv('voltage', V, '')}</Txt>
      <g transform="translate(230 30)"><path d="M 0 0 L 8 100 H 82 L 90 0" fill="none" stroke="var(--ink)" strokeWidth="2" /><rect x={5} y={48} width={80} height={52} fill="var(--soft)" /><path d="M 5 48 q 20 -6 40 0 t 40 0" fill="none" stroke="var(--accent)" strokeWidth="2" />
        <Txt x={45} y={78} bold c="accent">Q = {fv('charge', Q, '?')}</Txt><Txt x={45} y={118} size={10} c="muted">bucket analogy</Txt></g>
      <Caption>Q = C × V — a bigger bucket or a higher level stores more charge</Caption>
    </Diagram>
  )
}

export const CapEnergy = (p: VisualProps) => {
  const C = pick(p, 'C') ?? 1e-3, V = pick(p, 'V') ?? 10
  const vmax = Math.max(V * 1.4, 1)
  return (
    <Diagram title="Energy stored in a capacitor grows with the square of the voltage" h={190}>
      <Plot xmin={0} xmax={vmax} ymin={0} ymax={0.5 * C * vmax ** 2} fn={(x) => 0.5 * C * x * x} fill marker={{ x: V, y: 0.5 * C * V * V, label: fmtSI('energy', 0.5 * C * V * V) }} xlabel="voltage V" ylabel="energy E" xticks={[[0, '0'], [vmax / 2, fmtNum(vmax / 2, 3)], [vmax, fmtNum(vmax, 3)]]} />
      <Txt x={90} y={30} size={10.5} c="muted" anchor="start">E = ½ C V²</Txt>
      <Caption>Double the voltage → four times the energy</Caption>
    </Diagram>
  )
}

export const ReactanceC = (p: VisualProps) => {
  const C = pick(p, 'C') ?? 1e-7, f = p.v.f ?? 1000
  return (
    <Diagram title="Capacitive reactance falls as frequency rises" h={200}>
      <Plot xmin={f / 100} xmax={f * 100} ymin={1 / (TWO_PI * f * 100 * C)} ymax={1 / (TWO_PI * (f / 100) * C)} xlog ylog fn={(x) => 1 / (TWO_PI * x * C)} marker={{ x: f, y: 1 / (TWO_PI * f * C), label: `XC = ${fmtSI('resistance', 1 / (TWO_PI * f * C))}` }} xlabel="frequency (log scale)" ylabel="XC (log)" xticks={[[f / 100, fmtSI('frequency', f / 100)], [f, fmtSI('frequency', f)], [f * 100, fmtSI('frequency', f * 100)]]} />
      <Caption>DC (0 Hz) is blocked; high frequencies pass easily</Caption>
    </Diagram>
  )
}
export const ReactanceL = (p: VisualProps) => {
  const L = pick(p, 'L') ?? 1e-5, f = p.v.f ?? 1e6
  return (
    <Diagram title="Inductive reactance rises as frequency rises" h={200}>
      <Plot xmin={f / 100} xmax={f * 100} ymin={TWO_PI * (f / 100) * L} ymax={TWO_PI * f * 100 * L} xlog ylog fn={(x) => TWO_PI * x * L} marker={{ x: f, y: TWO_PI * f * L, label: `XL = ${fmtSI('resistance', TWO_PI * f * L)}` }} xlabel="frequency (log scale)" ylabel="XL (log)" xticks={[[f / 100, fmtSI('frequency', f / 100)], [f, fmtSI('frequency', f)], [f * 100, fmtSI('frequency', f * 100)]]} />
      <Caption>DC passes through; high frequencies are held back</Caption>
    </Diagram>
  )
}

export const RcTau = (p: VisualProps) => (
  <Diagram title="RC circuit and its charging curve: 63 percent of the way after one time constant" h={190}>
    <Wire d="M 30 50 H 60" /><Two kind="R" x1={60} y1={50} x2={130} y2={50} label="R" value={fv('resistance', pick(p, 'R'), '')} /><Wire d="M 130 50 H 150 V 70" /><Two kind="C" x1={150} y1={70} x2={150} y2={120} label="C" value={fv('capacitance', pick(p, 'C'), '')} /><Wire d="M 150 120 V 140 H 30 V 100" /><Two kind="V" x1={30} y1={50} x2={30} y2={100} />
    <Txt x={90} y={170} bold c="accent">τ = R × C = {fv('time', pick(p, 'tau'), '?')}</Txt>
    <Plot x0={200} y0={20} w={140} h={110} xmin={0} xmax={5} ymin={0} ymax={1} fn={(x) => 1 - Math.exp(-x)} marker={{ x: 1, y: 0.632, label: '63%' }} xticks={rcTime.filter((_, i) => i % 2 === 1 || i === 0)} yticks={[[0, '0'], [1, 'Vs']]} />
    <Txt x={270} y={170} size={10.5} c="muted">time in time constants</Txt>
  </Diagram>
)

const rcCurve = (charge: boolean) => (p: VisualProps) => {
  const tau = pick(p, 'tau') ?? 1, t = p.v.t ?? tau
  const Vs = (charge ? p.v.Vs : p.v.V0) ?? 1
  const x = t / tau
  const val = charge ? 1 - Math.exp(-x) : Math.exp(-x)
  const xmax = Math.max(5, x * 1.15)
  return (
    <Diagram title={`Capacitor ${charge ? 'charging' : 'discharging'} curve: fast at first, then slower`} h={200}>
      <Plot xmin={0} xmax={xmax} ymin={0} ymax={1.05} fn={(u) => (charge ? 1 - Math.exp(-u) : Math.exp(-u))} fill marker={{ x, y: val, label: `${fmtSI('voltage', val * Vs)} (${fmtNum(val * 100, 3)}%)` }} xlabel="time (in time constants τ)" ylabel={charge ? 'V(t)' : 'V(t)'} xticks={[0, 1, 2, 3, 4, 5].filter((i) => i <= xmax).map((i) => [i, i === 0 ? '0' : `${i}τ`] as [number, string])} yticks={[[0, '0'], [1, fmtSI('voltage', Vs)]]}
        extra={<g><line x1={40} y1={10 + 130 * (1 - (charge ? 0.632 : 0.368)) / 1.05 * 1.05 * 1} x2={340} y2={10 + 130 * (1 - (charge ? 0.632 : 0.368)) / 1.05} stroke="var(--muted)" strokeOpacity="0.4" strokeDasharray="2 4" /></g>} />
      <Caption>{charge ? 'Charging: 63% at 1τ, 86% at 2τ, 95% at 3τ, 99% at 5τ' : 'Discharging: 37% left at 1τ, 14% at 2τ, 5% at 3τ, <1% at 5τ'}</Caption>
    </Diagram>
  )
}
export const RcCharge = rcCurve(true)
export const RcDischarge = rcCurve(false)

export const Settle = () => (
  <Diagram title="Settling: 63 percent at 1τ, 86 at 2τ, 95 at 3τ, 98 at 4τ and over 99 at 5τ" h={200}>
    <Plot xmin={0} xmax={5.5} ymin={0} ymax={1.05} fn={(x) => 1 - Math.exp(-x)} fill xticks={[0, 1, 2, 3, 4, 5].map((i) => [i, i === 0 ? '0' : `${i}τ`] as [number, string])} yticks={[[0, '0%'], [0.5, '50%'], [1, '100%']]} xlabel="time"
      extra={<>{[1, 2, 3, 4, 5].map((i) => <g key={i}><Dot x={40 + (i / 5.5) * 300} y={10 + 130 - ((1 - Math.exp(-i)) / 1.05) * 130} c="hot" r={3.5} /><text x={40 + (i / 5.5) * 300} y={10 + 130 - ((1 - Math.exp(-i)) / 1.05) * 130 + (i < 3 ? 14 : -7)} fontSize="9.5" textAnchor="middle" fill="var(--hot)" fontWeight="700">{fmtNum((1 - Math.exp(-i)) * 100, 3)}%</text></g>)}</>} />
    <Caption>Rule of thumb: wait 5τ and the job is done</Caption>
  </Diagram>
)

export const IndEnergy = (p: VisualProps) => {
  const L = pick(p, 'L') ?? 0.1, I = p.v.I ?? 2
  const imax = I * 1.4
  return (
    <Diagram title="Energy stored in an inductor's magnetic field grows with the square of the current" h={190}>
      <Plot xmin={0} xmax={imax} ymin={0} ymax={0.5 * L * imax ** 2} fn={(x) => 0.5 * L * x * x} fill marker={{ x: I, y: 0.5 * L * I * I, label: fmtSI('energy', 0.5 * L * I * I) }} xlabel="current I" ylabel="energy E" xticks={[[0, '0'], [imax / 2, fmtNum(imax / 2, 3)], [imax, fmtNum(imax, 3)]]} />
      <Caption>E = ½ L I² — energy lives in the magnetic field</Caption>
    </Diagram>
  )
}

export const RlTau = (p: VisualProps) => (
  <Diagram title="RL circuit: current builds up to 63 percent in one time constant" h={190}>
    <Wire d="M 30 50 H 60" /><Two kind="L" x1={60} y1={50} x2={140} y2={50} label="L" value={fv('inductance', pick(p, 'L'), '')} /><Wire d="M 140 50 H 150 V 70" /><Two kind="R" x1={150} y1={70} x2={150} y2={120} label="R" value={fv('resistance', pick(p, 'R'), '')} side={-1} /><Wire d="M 150 120 V 140 H 30 V 100" /><Two kind="V" x1={30} y1={50} x2={30} y2={100} />
    <Txt x={90} y={170} bold c="accent">τ = L / R = {fv('time', pick(p, 'tau'), '?')}</Txt>
    <Plot x0={200} y0={20} w={140} h={110} xmin={0} xmax={5} ymin={0} ymax={1} fn={(x) => 1 - Math.exp(-x)} marker={{ x: 1, y: 0.632, label: '63%' }} xticks={[[0, '0'], [1, '1τ'], [3, '3τ'], [5, '5τ']]} yticks={[[0, '0'], [1, 'Imax']]} />
    <Txt x={270} y={170} size={10.5} c="muted">current rises, like a heavy wheel spinning up</Txt>
  </Diagram>
)

export const Induced = (p: VisualProps) => {
  const V = pick(p, 'V')
  return (
    <Diagram title="Switching current off quickly makes a high voltage spike across an inductor" h={190}>
      <Plot xmin={0} xmax={10} ymin={-0.2} ymax={1.2} fn={(x) => (x < 5 ? 1 : x < 6 ? 1 - (x - 5) : 0)} c="accent" xlabel="time" ylabel="current" yticks={[[0, '0'], [1, 'I']]} xticks={[[5, 'off'], [6, '']]} />
      <g><Arrow x1={235} y1={75} x2={235} y2={22} c="bad" w={3} /><Txt x={255} y={40} anchor="start" c="bad" bold>spike</Txt><Txt x={255} y={55} anchor="start" size={10.5} c="bad">V = {fv('voltage', V, 'L·ΔI/Δt')}</Txt></g>
      <Txt x={150} y={36} size={10.5} c="muted">ΔI</Txt><Txt x={228} y={118} size={10.5} c="muted">Δt</Txt>
      <Caption>Faster Δt → bigger spike → add a flyback diode</Caption>
    </Diagram>
  )
}

export const Resonance = (p: VisualProps) => {
  const f0 = pick(p, 'f0') ?? pick(p, 'fsrf') ?? 1e6
  const Q = pick(p, 'Q') ?? 10
  const BW = f0 / Q
  const H = (x: number) => 1 / Math.sqrt(1 + (Q * (x / f0 - f0 / x)) ** 2)
  const xl = f0 * 0.5, xr = f0 * 1.5
  return (
    <Diagram title="Resonance peak: the bandwidth is measured between the minus 3 dB points" h={200}>
      <Plot xmin={xl} xmax={xr} ymin={0} ymax={1.1} fn={H} fill n={300} marker={{ x: f0, y: 1, label: `f0 ${fmtSI('frequency', f0)}` }} xlabel="frequency" xticks={[[xl, ''], [f0, 'f0'], [xr, '']]} yticks={[[0.707, '−3 dB'], [1, '1']]}
        extra={<g><line x1={40 + ((f0 - BW / 2 - xl) / (xr - xl)) * 300} y1={10 + 130 * (1 - 0.707 / 1.1)} x2={40 + ((f0 + BW / 2 - xl) / (xr - xl)) * 300} y2={10 + 130 * (1 - 0.707 / 1.1)} stroke="var(--good)" strokeWidth="3" /><Txt x={190} y={10 + 130 * (1 - 0.707 / 1.1) + 14} size={10} c="good" bold>BW = f0/Q = {fmtSI('frequency', BW)}</Txt></g>} />
      <Caption>Higher Q = taller, narrower peak = sharper tuning (Q = {fmtNum(Q, 3)})</Caption>
    </Diagram>
  )
}

const Filter = ({ p, kind }: { p: VisualProps; kind: 'RC' | 'RL' }) => {
  const R = pick(p, 'R') ?? 1000
  const fc = pick(p, 'fc') ?? (kind === 'RC' ? 1 / (TWO_PI * R * (pick(p, 'C') ?? 1e-7)) : R / (TWO_PI * (pick(p, 'L') ?? 0.01)))
  const db = (x: number) => -10 * Math.log10(1 + (x / fc) ** 2)
  return (
    <Diagram title={`${kind} low-pass response: the signal drops 3 dB at the cutoff frequency`} h={200}>
      <Plot xmin={fc / 100} xmax={fc * 100} ymin={-40} ymax={3} xlog fn={db} fill marker={{ x: fc, y: -3.01, label: `fc ${fmtSI('frequency', fc)} (−3 dB)` }} xlabel="frequency (log scale)" ylabel="gain (dB)" xticks={[[fc / 100, ''], [fc / 10, ''], [fc, 'fc'], [fc * 10, ''], [fc * 100, '']]} yticks={[[0, '0'], [-3, '−3'], [-20, '−20'], [-40, '−40']]} />
      <Txt x={95} y={34} size={10} c="good" bold>passed</Txt><Txt x={310} y={110} size={10} c="bad" bold>blocked</Txt>
      <Caption>Low-pass shown. A high-pass is the mirror image — same fc</Caption>
    </Diagram>
  )
}
export const FilterRc = (p: VisualProps) => <Filter p={p} kind="RC" />
export const FilterRl = (p: VisualProps) => <Filter p={p} kind="RL" />
export { Rect }
