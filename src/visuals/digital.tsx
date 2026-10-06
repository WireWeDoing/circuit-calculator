import { Arrow, Caption, Diagram, Dot, fv, Plot, Rect, Two, Txt, Wire, pick, type VisualProps } from './kit.tsx'
import { fmtNum, fmtSI } from '../core/units.ts'

export const Adc = (p: VisualProps) => {
  const n = Math.min(p.v.n ?? 3, 3) // draw a 3-bit staircase for clarity
  const steps = 2 ** n
  const Vref = p.v.Vref ?? 3.3
  const Vin = p.v.Vin ?? pick(p, 'Vin') ?? Vref / 2
  return (
    <Diagram title="ADC transfer function: the input voltage is rounded down to a numbered step" h={200}>
      <Plot xmin={0} xmax={Vref} ymin={0} ymax={steps} fn={(x) => Math.min(steps - 1, Math.floor((x / Vref) * steps))} n={400} xticks={[[0, '0'], [Vref / 2, fmtNum(Vref / 2, 3)], [Vref, `${fmtNum(Vref, 3)} V`]]} yticks={[[0, '0'], [steps - 1, `2ⁿ−1`]]} xlabel="input voltage" ylabel="reading" marker={Vin >= 0 && Vin <= Vref ? { x: Vin, y: Math.min(steps - 1, Math.floor((Vin / Vref) * steps)) } : undefined} />
      <Txt x={120} y={26} size={10.5} c="muted" anchor="start">3-bit shown; real ADCs have 2ⁿ steps</Txt>
      <Caption>1 step = Vref / 2ⁿ = {fv('voltage', pick(p, 'Vstep'), 'Vstep')}</Caption>
    </Diagram>
  )
}

export const Nyquist = (p: VisualProps) => {
  const f = 1
  const fs = 2.4 * f
  const pts = Array.from({ length: 201 }, (_, i) => `${30 + (i / 200) * 300},${80 - 45 * Math.sin((i / 200) * 4 * 2 * Math.PI * f)}`).join(' ')
  return (
    <Diagram title="Sampling a sine wave: at least two samples per cycle are needed to avoid aliasing" h={190}>
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="2" strokeOpacity="0.6" />
      {Array.from({ length: Math.floor(8 * fs) + 1 }, (_, i) => { const t = i / (fs * 4) * 1; const x = 30 + (t / 1) * 300; return t <= 1 ? <g key={i}><line x1={x} y1={80} x2={x} y2={80 - 45 * Math.sin(t * 4 * 2 * Math.PI * f)} stroke="var(--hot)" strokeOpacity="0.5" /><circle cx={x} cy={80 - 45 * Math.sin(t * 4 * 2 * Math.PI * f)} r="3.5" fill="var(--hot)" /></g> : null })}
      <Txt x={180} y={150} bold c="hot">fs ≥ 2 × fmax = {fv('frequency', pick(p, 'fs'), '?')}</Txt><Txt x={180} y={168} size={10.5} c="muted">in practice 5–10× the highest frequency</Txt>
    </Diagram>
  )
}

export const Pwm = (p: VisualProps) => {
  const D = pick(p, 'D') ?? 0.25
  const per = 90
  const Vh = p.v.Vhigh ?? 3.3
  return (
    <Diagram title="PWM: a fast on/off signal whose average voltage equals duty cycle times the high voltage" h={190}>
      <polyline points={Array.from({ length: 3 }, (_, i) => `${40 + i * per},110 ${40 + i * per},40 ${40 + i * per + per * D},40 ${40 + i * per + per * D},110`).join(' ') + ` ${40 + 3 * per},110`} fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinejoin="round" />
      <line x1={40} y1={110 - 70 * D} x2={40 + 3 * per} y2={110 - 70 * D} stroke="var(--hot)" strokeDasharray="5 3" strokeWidth="2" /><Txt x={40 + 3 * per + 4} y={110 - 70 * D + 4} anchor="start" size={10.5} c="hot" bold>Vavg {fv('voltage', pick(p, 'Vavg'), '')}</Txt>
      <Arrow x1={40} y1={128} x2={40 + per} y2={128} c="muted" w={1.2} /><Arrow x1={40 + per} y1={128} x2={40} y2={128} c="muted" w={1.2} /><Txt x={40 + per / 2} y={142} size={10} c="muted">T</Txt>
      <Txt x={40 + (per * D) / 2} y={32} size={10} c="accent" bold>ton</Txt>
      <Txt x={180} y={166} bold>D = ton / T = {fmtNum(D * 100, 3)}%</Txt><Txt x={180} y={182} size={10.5} c="muted">high level {fmtSI('voltage', Vh)}</Txt>
    </Diagram>
  )
}

export const Decoupling = () => (
  <Diagram title="Decoupling: a 100 nF capacitor right at the IC power pin, plus a bulk capacitor at the power input" h={180}>
    <Wire d="M 30 40 H 300" /><Wire d="M 30 150 H 300" />
    <Two kind="C" x1={60} y1={40} x2={60} y2={150} label="10–100 µF" value="bulk, at power input" side={1} />
    <rect x={190} y={60} width={90} height={70} rx={6} fill="var(--soft)" stroke="var(--accent)" strokeWidth="2" /><Txt x={235} y={100} bold>IC</Txt>
    <Wire d="M 210 40 V 60" /><Wire d="M 210 130 V 150" />
    <Two kind="C" x1={160} y1={40} x2={160} y2={150} label="100 nF" value="ceramic '104'" c="hot" side={-1} />
    <Txt x={180} y={172} size={10.5} c="muted">place it within a few mm of the pin</Txt>
  </Diagram>
)

export const Crystal = (p: VisualProps) => (
  <Diagram title="Crystal oscillator with two load capacitors from each crystal pin to ground" h={170}>
    <rect x={150} y={40} width={60} height={30} rx={3} fill="var(--soft)" stroke="var(--accent)" strokeWidth="2" /><line x1={130} y1={55} x2={150} y2={55} stroke="var(--ink)" strokeWidth="2" /><line x1={210} y1={55} x2={230} y2={55} stroke="var(--ink)" strokeWidth="2" />
    <Txt x={180} y={59} size={10.5} bold>XTAL</Txt>
    <Wire d="M 130 55 H 100" /><Wire d="M 230 55 H 260" />
    <Wire d="M 115 55 V 70" /><Two kind="C" x1={115} y1={70} x2={115} y2={125} label="C1" value={fv('capacitance', pick(p, 'C1'), '')} side={-1} /><Wire d="M 115 125 V 135 H 245 V 125" /><Wire d="M 245 55 V 70" /><Two kind="C" x1={245} y1={70} x2={245} y2={125} label="C2" value={fv('capacitance', pick(p, 'C2') ?? pick(p, 'C1'), '')} />
    <Txt x={180} y={155} size={10.5} c="muted">CL = C1·C2/(C1+C2) + Cstray</Txt>
  </Diagram>
)

export const Uart = (p: VisualProps) => {
  const bits = ['S', '1', '0', '1', '0', '0', '1', '1', '0', 'P']
  const w = 30
  let d = 'M 20 40'
  const lvl = (b: string) => (b === 'S' ? 110 : b === 'P' ? 40 : b === '1' ? 40 : 110)
  bits.forEach((b, i) => { d += ` L ${20 + i * w} ${lvl(b)} L ${20 + (i + 1) * w} ${lvl(b)}` })
  return (
    <Diagram title="UART frame: start bit, 8 data bits, stop bit; each bit lasts 1 over baud seconds" h={170}>
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinejoin="round" />
      {bits.map((b, i) => <Txt key={i} x={20 + i * w + w / 2} y={132} size={10} c={b === 'S' || b === 'P' ? 'hot' : 'muted'}>{b === 'S' ? 'start' : b === 'P' ? 'stop' : b}</Txt>)}
      <Arrow x1={20 + w} y1={148} x2={20 + 2 * w} y2={148} c="hot" w={1.5} /><Txt x={20 + 2.8 * w} y={152} anchor="start" size={10.5} c="hot" bold>tbit = {fv('time', pick(p, 'tbit'), '1 / baud')}</Txt>
      <Txt x={180} y={20} size={10.5} c="muted">8N1: 10 bits per byte · 115 200 baud ≈ 11 520 bytes/s</Txt>
    </Diagram>
  )
}

export const I2c = (p: VisualProps) => (
  <Diagram title="I2C bus: two pull-up resistors tie the data and clock lines to VDD" h={190}>
    <Wire d="M 30 25 H 250" /><Txt x={254} y={29} anchor="start" size={10.5} c="accent" bold>VDD</Txt>
    {[{ x: 70, n: 'Rp SDA', side: -1 as const }, { x: 160, n: 'Rp SCL', side: 1 as const }].map(({ x, n, side }) => <g key={x}><Wire d={`M ${x} 25 V 34`} /><Two kind="R" x1={x} y1={34} x2={x} y2={90} label={n} value={fv('resistance', pick(p, 'Rmin') ?? pick(p, 'Rmax'), '')} side={side} /></g>)}
    <Wire d="M 40 108 H 320" /><Wire d="M 40 126 H 320" /><Txt x={36} y={111} anchor="end" size={10} c="muted">SDA</Txt><Txt x={36} y={129} anchor="end" size={10} c="muted">SCL</Txt>
    <Wire d="M 70 90 V 108" /><Wire d="M 160 90 V 126" /><Dot x={70} y={108} r={2.5} /><Dot x={160} y={126} r={2.5} />
    <Rect x={60} y={146} w={80} h={30} /><Txt x={100} y={165} bold>master</Txt><Rect x={230} y={146} w={80} h={30} /><Txt x={270} y={165} bold>device</Txt>
    <Wire d="M 100 146 V 108" /><Wire d="M 120 146 V 126" /><Wire d="M 250 146 V 108" /><Wire d="M 270 146 V 126" />
    <Txt x={215} y={52} size={10.5} c="muted" anchor="start">Rmin = (VDD − 0.4 V) / 3 mA</Txt><Txt x={215} y={67} size={10.5} c="muted" anchor="start">Rmax = tr / (0.8473 · Cb)</Txt>
    <Txt x={215} y={84} size={10.5} c="hot" anchor="start" bold>pick between Rmin and Rmax</Txt>
  </Diagram>
)
export { Caption }
