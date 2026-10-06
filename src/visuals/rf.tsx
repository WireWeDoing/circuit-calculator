import { Arrow, Caption, Diagram, fv, Plot, Rect, Txt, Wire, pick, type VisualProps } from './kit.tsx'
import { fmtNum, fmtSI } from '../core/units.ts'

export const Trace = (p: VisualProps) => (
  <Diagram title="PCB trace cross-section: width times copper thickness gives the area that carries the current" h={170}>
    <rect x={40} y={110} width={280} height={34} fill="#2e7d32" fillOpacity="0.35" stroke="var(--muted)" /><Txt x={180} y={132} size={10.5} c="muted">FR4 board</Txt>
    <rect x={130} y={92} width={100} height={18} fill="#c9824b" stroke="var(--ink)" strokeWidth="1.5" /><Txt x={180} y={105} size={10.5} bold>copper</Txt>
    <Arrow x1={130} y1={78} x2={230} y2={78} c="accent" w={1.4} /><Arrow x1={230} y1={78} x2={130} y2={78} c="accent" w={1.4} /><Txt x={180} y={70} c="accent" bold>W {fv('length', p.v.W ?? p.o?.w, 'width')}</Txt>
    <Arrow x1={250} y1={92} x2={250} y2={110} c="hot" w={1.4} /><Arrow x1={250} y1={110} x2={250} y2={92} c="hot" w={1.4} /><Txt x={258} y={104} anchor="start" size={10.5} c="hot" bold>t {fv('length', p.v.t, '35 µm = 1 oz')}</Txt>
    <Txt x={180} y={30} size={11} bold>A = W × t (mil²)  ·  R = ρ L / (W t)</Txt><Txt x={180} y={48} size={10.5} c="muted">1 oz copper = 1.37 mil = 35 µm thick</Txt>
  </Diagram>
)

export const Microstrip = (p: VisualProps) => (
  <Diagram title="Microstrip: a trace of width w over a dielectric of height h above a ground plane" h={180}>
    <rect x={60} y={140} width={240} height={14} fill="var(--muted)" fillOpacity="0.6" stroke="var(--ink)" /><Txt x={180} y={170} size={10.5} c="muted">ground plane</Txt>
    <rect x={60} y={86} width={240} height={54} fill="#2e7d32" fillOpacity="0.28" stroke="var(--muted)" /><Txt x={90} y={118} size={10.5} c="muted" anchor="start">dielectric εr = {fmtNum(p.v.er ?? 4.3, 3)}</Txt>
    <rect x={140} y={76} width={90} height={10} fill="#c9824b" stroke="var(--ink)" strokeWidth="1.5" /><Txt x={185} y={68} size={11} c="accent" bold>w {fv('length', p.v.w, '')}</Txt>
    <Arrow x1={278} y1={86} x2={278} y2={140} c="hot" w={1.4} /><Arrow x1={278} y1={140} x2={278} y2={86} c="hot" w={1.4} /><Txt x={272} y={118} anchor="end" c="hot" bold>h {fv('length', p.v.h, '')}</Txt>
    <Txt x={180} y={30} bold>Z0 ≈ 87/√(εr+1.41) · ln(5.98h/(0.8w+t))</Txt><Txt x={180} y={46} size={10.5} c="muted">≈ 50 Ω typical · tpd ≈ 140 ps/inch on FR4</Txt>
  </Diagram>
)

export const Skin = (p: VisualProps) => {
  const frac = 0.25
  return (
    <Diagram title="Skin effect: at high frequency current flows only in a thin outer layer of the conductor" h={170}>
      <circle cx={110} cy={85} r={55} fill="var(--soft)" stroke="var(--ink)" strokeWidth="2" /><circle cx={110} cy={85} r={55 * (1 - frac)} fill="var(--paper)" stroke="var(--muted)" strokeDasharray="4 3" />
      <Txt x={110} y={89} size={10.5} c="muted">no current</Txt>
      <Arrow x1={110} y1={85} x2={165} y2={85} c="hot" w={1.4} />
      <Txt x={250} y={70} bold c="hot">δ = {fv('length', pick(p, 'delta'), '')}</Txt><Txt x={250} y={86} size={10.5} c="muted">skin depth</Txt><Txt x={250} y={110} size={10.5} c="muted">copper: δ(µm) ≈ 66/√f(MHz)</Txt>
    </Diagram>
  )
}

export const Antenna = (p: VisualProps) => {
  const L = pick(p, 'L')
  return (
    <Diagram title="Quarter-wave whip over a ground plane and a half-wave dipole with each arm a quarter wave" h={190}>
      <line x1={20} y1={150} x2={150} y2={150} stroke="var(--ink)" strokeWidth="3" /><Txt x={85} y={168} size={10} c="muted">ground plane</Txt>
      <line x1={85} y1={150} x2={85} y2={50} stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" /><Arrow x1={105} y1={150} x2={105} y2={50} c="hot" w={1.2} /><Arrow x1={105} y1={50} x2={105} y2={150} c="hot" w={1.2} /><Txt x={112} y={104} anchor="start" size={10.5} c="hot" bold>λ/4</Txt>
      <Txt x={85} y={30} size={10.5} bold>quarter-wave: c/(4f)</Txt>
      <line x1={250} y1={30} x2={250} y2={148} stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" /><circle cx={250} cy={89} r={4} fill="var(--hot)" />
      <Txt x={262} y={62} anchor="start" size={10.5} c="hot">λ/4</Txt><Txt x={262} y={122} anchor="start" size={10.5} c="hot">λ/4</Txt><Txt x={250} y={22} size={10.5} bold>half-wave dipole: c/(2f)</Txt>
      <Txt x={250} y={168} size={10.5} c="muted">{L !== undefined ? `L = ${fmtSI('length', L)}` : 'cut ~5% shorter in practice'}</Txt>
    </Diagram>
  )
}

export const Fspl = (p: VisualProps) => {
  const f = (p.v.f ?? 433e6) / 1e6
  const d0 = (p.v.d ?? 1000) / 1000
  const loss = (d: number) => 20 * Math.log10(d) + 20 * Math.log10(f) + 32.44
  return (
    <Diagram title="Free-space path loss rises by 6 dB each time the distance doubles" h={200}>
      <Plot xmin={0.01} xmax={100} ymin={loss(0.01)} ymax={loss(100)} xlog fn={loss} fill marker={{ x: Math.min(100, Math.max(0.01, d0)), y: loss(Math.min(100, Math.max(0.01, d0))), label: `${fmtNum(loss(d0), 4)} dB` }} xlabel="distance (km, log scale)" ylabel="loss (dB)" xticks={[[0.01, '10 m'], [0.1, '100 m'], [1, '1 km'], [10, '10 km'], [100, '100 km']]} />
      <Caption>Twice the distance (or frequency) = 6 dB more loss</Caption>
    </Diagram>
  )
}

export const Swr = (p: VisualProps) => {
  const G = Math.min(0.95, Math.abs(pick(p, 'G') ?? 0.2))
  const pts = (sgn: number) => Array.from({ length: 121 }, (_, i) => { const x = 30 + (i / 120) * 240; const e = Math.sqrt(1 + G * G + 2 * G * Math.cos((i / 120) * 6 * Math.PI)); return `${x},${80 - sgn * 30 * e}` }).join(' ')
  return (
    <Diagram title="Standing waves on a mismatched line: the larger the reflection, the bigger the swing between maximum and minimum" h={190}>
      <line x1={30} y1={80} x2={270} y2={80} stroke="var(--muted)" strokeDasharray="2 4" />
      <polyline points={pts(1)} fill="none" stroke="var(--accent)" strokeWidth="2.4" /><polyline points={pts(-1)} fill="none" stroke="var(--accent)" strokeWidth="2.4" />
      <Rect x={276} y={56} w={50} h={48} c="hot" /><Txt x={301} y={84} bold c="hot">load</Txt>
      <Arrow x1={60} y1={140} x2={230} y2={140} c="good" w={2} /><Txt x={145} y={133} size={10} c="good">forward</Txt><Arrow x1={230} y1={158} x2={60} y2={158} c="bad" w={1.4 + G * 4} /><Txt x={145} y={174} size={10} c="bad">reflected (Γ = {fmtNum(G, 3)})</Txt>
      <Txt x={300} y={140} size={10.5} bold>VSWR {fmtNum((1 + G) / (1 - G), 3)}:1</Txt><Txt x={300} y={156} size={10.5} c="muted">RL {fmtNum(-20 * Math.log10(G || 1e-9), 3)} dB</Txt>
    </Diagram>
  )
}
export { Wire }
