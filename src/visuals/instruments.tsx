/* Diagrams for the beginner chapters and bench instruments: multimeter, oscilloscope, logic analyser, waveforms,
   breadboard, schematic symbols, op-amp and regulator. All render with empty inputs (typical values as fallback). */
import { fmtNum, fmtSI } from '../core/units.ts'
import { Arrow, Caption, Diagram, Dot, fv, Ground, pick, Rect, total, Two, Txt, Wire, type VisualProps } from './kit.tsx'

/** a meter: circle with its function letter (V, A, Ω) */
const Meter = ({ x, y, letter, r = 13 }: { x: number; y: number; letter: string; r?: number }) => (
  <g data-testid="meter">
    <circle cx={x} cy={y} r={r} fill="var(--paper)" stroke="var(--accent)" strokeWidth={2} />
    <Txt x={x} y={y + 4.5} size={13} c="accent" bold>{letter}</Txt>
  </g>
)

/* ───────── basics ───────── */

/** water analogy: tank height = voltage, narrow pipe = resistance, flow = current */
export const Water = (p: VisualProps) => (
  <Diagram title="Water analogy: the water level in the tank is the voltage, the narrow pipe is the resistance and the flow of water is the current." h={160}>
    <Rect x={20} y={30} w={70} h={100} c="accent" fill="paper" />
    <rect x={21} y={58} width={68} height={71} fill="var(--soft)" />
    <Txt x={55} y={22} size={10.5} bold>Tank = voltage (V)</Txt>
    <Arrow x1={35} y1={124} x2={35} y2={66} c="accent" w={1.4} /><Txt x={55} y={146} size={10} c="accent">↑ water pressure</Txt>
    <Wire d="M 90 118 H 160" w={10} c="accent" />
    <Wire d="M 160 118 H 250" w={4} c="accent" />
    <Wire d="M 250 118 H 330" w={10} c="accent" />
    <Txt x={225} y={102} size={10.5} bold>Narrow pipe = resistance (R)</Txt>
    <Arrow x1={200} y1={138} x2={252} y2={138} c="hot" /><Txt x={226} y={156} size={10.5} c="hot" bold>flow = current (I)</Txt>
    <Txt x={290} y={60} size={10} c="muted">{fv('voltage', pick(p, 'V'), 'more pressure')}</Txt>
    <Txt x={290} y={74} size={10} c="muted">→ more flow</Txt>
    <Caption>V pushes, R resists, I is what flows: I = V ÷ R</Caption>
  </Diagram>
)

/** the common schematic symbols, each with its name */
export const Symbols = () => {
  const cells: Array<[Parameters<typeof Two>[0]['kind'], string]> = [['R', 'Resistor'], ['C', 'Capacitor'], ['L', 'Inductor'], ['D', 'Diode'], ['LED', 'LED'], ['Z', 'Zener'], ['V', 'Battery'], ['AC', 'AC source'], ['sw', 'Switch']]
  return (
    <Diagram title="Common schematic symbols: resistor, capacitor, inductor, diode, LED, Zener diode, battery, AC source, switch and ground." h={190}>
      {cells.map(([kind, name], i) => {
        const col = i % 4, row = Math.floor(i / 4)
        const x = 14 + col * 88, y = 34 + row * 62
        return (
          <g key={name}>
            <Two kind={kind} x1={x} y1={y} x2={x + 64} y2={y} />
            <Txt x={x + 32} y={y + 30} size={10}>{name}</Txt>
          </g>
        )
      })}
      <Ground x={14 + 88 + 32} y={150} /><Txt x={14 + 88 + 32} y={186} size={10}>Ground (0 V)</Txt>
      <Wire d="M 222 160 H 286" /><Dot x={254} y={160} r={4} /><Txt x={254} y={186} size={10}>Joined wires</Txt>
      <Caption>A dot means wires connect; crossing lines without a dot do not</Caption>
    </Diagram>
  )
}

/** breadboard: power rails along the edges, 5-hole strips joined underneath, gap in the middle for chips */
export const Breadboard = () => {
  const cols = 12, x0 = 40, dx = 24
  const holes = (y: number) => Array.from({ length: cols }, (_, i) => <circle key={`${y}-${i}`} cx={x0 + i * dx} cy={y} r={2.6} fill="var(--muted)" />)
  return (
    <Diagram title="Breadboard: the long rails along the top and bottom carry power; each short column of five holes is connected underneath; the gap in the middle separates the two sides of a chip." h={200}>
      <Rect x={20} y={14} w={320} h={176} c="muted" fill="paper" r={8} />
      <line x1={30} y1={24} x2={330} y2={24} stroke="var(--bad)" strokeWidth={1.5} /><Txt x={26} y={36} anchor="end" size={10} c="bad" bold>+</Txt>
      {holes(32)}
      <line x1={30} y1={42} x2={330} y2={42} stroke="var(--accent)" strokeWidth={1.5} /><Txt x={26} y={46} anchor="end" size={10} c="accent" bold>−</Txt>
      {[62, 74, 86].map((y) => <g key={y}>{holes(y)}</g>)}
      <rect x={20} y={95} width={320} height={12} fill="var(--soft)" />
      {[116, 128, 140].map((y) => <g key={y}>{holes(y)}</g>)}
      {holes(162)}
      <line x1={30} y1={170} x2={330} y2={170} stroke="var(--bad)" strokeWidth={1.5} />
      {/* one strip highlighted, and a chip straddling the gap */}
      <rect x={x0 + 2 * dx - 6} y={56} width={12} height={36} rx={5} fill="none" stroke="var(--hot)" strokeWidth={2} />
      <Txt x={x0 + 2 * dx + 10} y={60} anchor="start" size={9.5} c="hot" bold>joined</Txt>
      <Rect x={x0 + 6 * dx - 6} y={80} w={4 * dx + 12} h={42} c="ink" fill="soft" />
      <Txt x={x0 + 7.5 * dx} y={105} size={10} bold>chip</Txt>
      <Caption>Rails carry power · each strip of 5 is one node</Caption>
    </Diagram>
  )
}

/** bench safety: the three things that can hurt you on a hobby bench */
export const Safety = () => (
  <Diagram title="Bench safety: mains voltage, charged capacitors and shorted batteries are the main dangers." h={150}>
    <polygon points="60,20 105,100 15,100" fill="var(--soft)" stroke="var(--hot)" strokeWidth={3} strokeLinejoin="round" />
    <Txt x={60} y={88} size={34} c="hot" bold>!</Txt>
    <Txt x={130} y={38} anchor="start" size={11} bold>Mains (230 / 120 V AC): don't open it</Txt>
    <Txt x={130} y={66} anchor="start" size={11} bold>Big capacitors: discharge first</Txt>
    <Txt x={130} y={94} anchor="start" size={11} bold>Li-ion cells: never short them</Txt>
    <Txt x={180} y={130} size={10.5} c="muted">Power off before you change the circuit</Txt>
    <Caption>Learn on low-voltage DC with a current limit set</Caption>
  </Diagram>
)

/* ───────── multimeter ───────── */

/** the three ways a multimeter is connected: V across, A in series, Ω with the power off */
export const MultimeterHookup = () => {
  const loop = (ox: number, battery: boolean) => (
    <>
      {battery && <Two kind="V" x1={ox + 18} y1={55} x2={ox + 18} y2={85} />}
      {battery ? <Wire d={`M ${ox + 18} 85 V 100 H ${ox + 70} V 88`} /> : null}
    </>
  )
  return (
    <Diagram title="Multimeter connections. Volts: the meter goes across the part, in parallel. Amps: break the circuit and put the meter in series. Ohms: take the power off and measure the part alone." h={140}>
      {/* volts */}
      <Txt x={62} y={18} size={10.5} bold>Volts: across</Txt>
      {loop(10, true)}
      <Wire d="M 28 55 V 40 H 80 V 52" /><Two kind="R" x1={80} y1={52} x2={80} y2={88} />
      <Wire d="M 80 46 H 106 V 57" /><Meter x={106} y={70} letter="V" /><Wire d="M 106 83 V 94 H 80" />
      <Dot x={80} y={46} /><Dot x={80} y={94} />
      <Txt x={62} y={124} size={9.5} c="muted">in parallel, power ON</Txt>
      {/* amps */}
      <Txt x={182} y={18} size={10.5} bold>Amps: in series</Txt>
      {loop(130, true)}
      <Wire d="M 148 55 V 40 H 158" /><Meter x={172} y={40} letter="A" /><Wire d="M 185 40 H 200 V 52" />
      <Two kind="R" x1={200} y1={52} x2={200} y2={88} />
      <Txt x={182} y={124} size={9.5} c="muted">break the loop, red → A jack</Txt>
      {/* ohms */}
      <Txt x={300} y={18} size={10.5} bold>Ohms: power OFF</Txt>
      <Two kind="R" x1={280} y1={52} x2={280} y2={88} />
      <Wire d="M 280 52 V 44 H 322 V 57" /><Meter x={322} y={70} letter="Ω" /><Wire d="M 322 83 V 96 H 280 V 88" />
      <Txt x={300} y={124} size={9.5} c="muted">part out of the circuit</Txt>
      <Caption>Black lead in COM; red lead in VΩ (or A for current)</Caption>
    </Diagram>
  )
}

/** a voltmeter across the bottom resistor of a divider: its input resistance sits in parallel with R2 */
export const MeterLoading = (p: VisualProps) => {
  const V = pick(p, 'V'), R1 = pick(p, 'R1'), R2 = pick(p, 'R2'), Rm = pick(p, 'Rm')
  return (
    <Diagram title="A voltmeter across the lower resistor of a divider. The meter's own input resistance is in parallel with R2, so it lowers the voltage it measures." h={180}
      totals={[total('Vtrue', 'Without meter', 'voltage', p.o?.Vtrue), total('Vread', 'Meter reads', 'voltage', p.o?.Vread), p.o ? { key: 'err', label: 'Error', text: `${fmtNum(p.o.err)} %` } : null]}>
      <Wire d="M 40 30 H 150 V 40" /><Wire d="M 40 160 H 150 V 150" /><Wire d="M 40 30 V 80" /><Wire d="M 40 110 V 160" />
      <Two kind="V" x1={40} y1={80} x2={40} y2={110} label="V" value={fv('voltage', V, '')} side={1} />
      <Two kind="R" x1={150} y1={40} x2={150} y2={88} label="R1" value={fv('resistance', R1, '')} side={-1} />
      <Wire d="M 150 88 V 102" /><Dot x={150} y={95} />
      <Two kind="R" x1={150} y1={102} x2={150} y2={150} label="R2" value={fv('resistance', R2, '')} side={-1} />
      <Wire d="M 150 95 H 250 V 112" /><Meter x={250} y={126} letter="V" /><Wire d="M 250 139 V 160 H 150" /><Dot x={150} y={160} />
      <Txt x={268} y={122} anchor="start" size={10} bold>Rin</Txt>
      <Txt x={268} y={135} anchor="start" size={10} c="muted">{fv('resistance', Rm, '10 MΩ')}</Txt>
      <Txt x={250} y={86} size={10} c="hot">Rin ∥ R2</Txt>
      <Caption>The meter is another resistor in parallel with R2</Caption>
    </Diagram>
  )
}

/** an ammeter in series: its shunt resistance adds to the circuit and drops the burden voltage */
export const Burden = (p: VisualProps) => {
  const V = pick(p, 'V'), R = pick(p, 'R'), Rs = pick(p, 'Rs')
  return (
    <Diagram title="An ammeter in series with a load. Its shunt resistance adds to the circuit, so a little voltage (the burden voltage) is lost across the meter and the current drops." h={170}
      totals={[total('Itrue', 'Without meter', 'current', p.o?.Itrue), total('Iread', 'Meter reads', 'current', p.o?.Iread), total('Vb', 'Burden', 'voltage', p.o?.Vb)]}>
      <Wire d="M 60 40 V 70" /><Wire d="M 60 100 V 140 H 280 V 115" />
      <Two kind="V" x1={60} y1={70} x2={60} y2={100} label="V" value={fv('voltage', V, '')} side={1} />
      <Wire d="M 60 40 H 152" /><Meter x={170} y={40} letter="A" r={16} /><Wire d="M 186 40 H 280 V 67" />
      <Txt x={170} y={74} size={10} bold>Rshunt</Txt><Txt x={170} y={87} size={10} c="muted">{fv('resistance', Rs, '')}</Txt>
      <Two kind="R" x1={280} y1={67} x2={280} y2={115} label="R load" value={fv('resistance', R, '')} side={-1} />
      <Arrow x1={152} y1={20} x2={188} y2={20} c="hot" w={1.6} /><Txt x={170} y={14} size={10} c="hot" bold>{fv('voltage', p.o?.Vb, 'burden voltage')}</Txt>
      <Caption>Use the highest current range first, then step down</Caption>
    </Diagram>
  )
}

/* ───────── signals ───────── */

/** DC, AC and a pulse train side by side */
export const Signals = () => {
  const box = (ox: number, title: string, d: string, note: string) => (
    <g>
      <Txt x={ox + 52} y={18} size={10.5} bold>{title}</Txt>
      <Arrow x1={ox} y1={80} x2={ox + 108} y2={80} c="muted" w={1} />
      <line x1={ox} y1={28} x2={ox} y2={128} stroke="var(--muted)" />
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth={2.4} strokeLinejoin="round" />
      <Txt x={ox + 52} y={146} size={9.5} c="muted">{note}</Txt>
    </g>
  )
  return (
    <Diagram title="Three kinds of signal: DC stays at one voltage, AC swings above and below zero, pulses switch between two levels." h={160}>
      {box(10, 'DC', 'M 10 50 H 114', 'steady: a battery')}
      {box(130, 'AC', 'M 130 80 C 143 30 156 30 156 80 S 169 130 182 80 S 195 30 208 80 S 221 130 234 80', 'swings ±: mains')}
      {box(250, 'Pulses', 'M 250 80 H 262 V 44 H 282 V 80 H 302 V 44 H 322 V 80 H 342 V 44 H 354', 'on/off: PWM, clock')}
      <Caption>Across: time · up: voltage</Caption>
    </Diagram>
  )
}

const SHAPES: Record<string, { name: string; at: (t: number) => number; rms: number; avg: number }> = {
  sine: { name: 'Sine', at: (t) => Math.sin(2 * Math.PI * t), rms: 1 / Math.SQRT2, avg: 2 / Math.PI },
  square: { name: 'Square', at: (t) => (t % 1 < 0.5 ? 1 : -1), rms: 1, avg: 1 },
  triangle: { name: 'Triangle', at: (t) => { const u = t % 1; return u < 0.25 ? 4 * u : u < 0.75 ? 2 - 4 * u : 4 * u - 4 }, rms: 1 / Math.sqrt(3), avg: 0.5 },
}

/** the chosen waveform with its peak, RMS and average levels */
export const Waveforms = (p: VisualProps) => {
  const s = SHAPES[p.mode] ?? SHAPES.sine!
  const Vp = pick(p, 'Vp')
  const x0 = 30, w = 300, cy = 90, a = 60
  const y = (frac: number) => cy - frac * a
  const n = p.mode === 'square' ? 400 : 120
  const pts = Array.from({ length: n + 1 }, (_, i) => `${(x0 + (i / n) * w).toFixed(1)},${y(s.at((i / n) * 2)).toFixed(1)}`).join(' ')
  const lvl = (frac: number) => (Vp === undefined ? undefined : Vp * frac)
  return (
    <Diagram title={`${s.name} wave with its peak, peak-to-peak, RMS and average levels`} h={180}>
      <line x1={x0} y1={cy} x2={x0 + w} y2={cy} stroke="var(--muted)" />
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={2.4} strokeLinejoin="round" />
      <line x1={x0} y1={y(1)} x2={x0 + w} y2={y(1)} stroke="var(--hot)" strokeDasharray="4 3" />
      <Txt x={x0 + w} y={y(1) - 5} anchor="end" size={10} c="hot" bold>Vpeak {fv('voltage', Vp, '')}</Txt>
      {s.rms < 1 && <><line x1={x0} y1={y(s.rms)} x2={x0 + w} y2={y(s.rms)} stroke="var(--good)" strokeDasharray="4 3" /><Txt x={x0 + w} y={y(s.rms) - 4} anchor="end" size={10} c="good" bold>RMS {fv('voltage', lvl(s.rms), `= ${fmtNum(s.rms, 3)} × Vpeak`)}</Txt></>}
      {s.avg < 1 && s.avg !== s.rms && <><line x1={x0} y1={y(s.avg)} x2={x0 + w} y2={y(s.avg)} stroke="var(--muted)" strokeDasharray="1 4" /><Txt x={x0 + w} y={y(s.avg) + 13} anchor="end" size={9.5} c="muted">avg {fv('voltage', lvl(s.avg), `= ${fmtNum(s.avg, 3)} × Vpeak`)}</Txt></>}
      {s.rms === 1 && <Txt x={x0 + w} y={y(1) + 14} anchor="end" size={10} c="good" bold>RMS = average = Vpeak</Txt>}
      <Arrow x1={x0 + 8} y1={y(1)} x2={x0 + 8} y2={y(-1)} c="ink" w={1.2} /><Arrow x1={x0 + 8} y1={y(-1)} x2={x0 + 8} y2={y(1)} c="ink" w={1.2} />
      <Txt x={x0 + 14} y={y(-1) + 2} anchor="start" size={10}>Vpp {fv('voltage', lvl(2), '= 2 × Vpeak')}</Txt>
      <Caption>Cheap meters assume a sine; True RMS reads any shape</Caption>
    </Diagram>
  )
}

/** oscilloscope screen: 10 × 8 divisions with a trace sized by the inputs */
export const Scope = (p: VisualProps) => {
  const divV = pick(p, 'divV') ?? 4, divT = pick(p, 'divT') ?? 4
  const x0 = 16, y0 = 12, dx = 22, dy = 18, W = 10 * dx, H = 8 * dy, cy = y0 + H / 2
  const amp = Math.min(Math.max(divV, 0.2), 8) * dy / 2
  const per = Math.min(Math.max(divT, 0.5), 10) * dx
  const n = 200
  const pts = Array.from({ length: n + 1 }, (_, i) => { const x = (i / n) * W; return `${(x0 + x).toFixed(1)},${(cy - amp * Math.sin((2 * Math.PI * x) / per)).toFixed(1)}` }).join(' ')
  const rx = x0 + W + 12
  return (
    <Diagram title="Oscilloscope screen, 10 divisions wide and 8 high. Count divisions, then multiply by volts per division and time per division." h={186}>
      <rect x={x0} y={y0} width={W} height={H} fill="var(--soft)" stroke="var(--muted)" />
      {Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={x0 + (i + 1) * dx} y1={y0} x2={x0 + (i + 1) * dx} y2={y0 + H} stroke="var(--muted)" strokeOpacity={i === 4 ? 0.7 : 0.3} />)}
      {Array.from({ length: 7 }, (_, i) => <line key={`h${i}`} x1={x0} y1={y0 + (i + 1) * dy} x2={x0 + W} y2={y0 + (i + 1) * dy} stroke="var(--muted)" strokeOpacity={i === 3 ? 0.7 : 0.3} />)}
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={2.2} />
      {/* peak-to-peak and one period */}
      <Arrow x1={x0 + per / 4} y1={cy} x2={x0 + per / 4} y2={cy - amp + 2} c="hot" w={1.4} />
      <Arrow x1={x0 + per / 4} y1={cy} x2={x0 + per / 4} y2={cy + amp - 2} c="hot" w={1.4} />
      <line x1={x0} y1={y0 + H + 8} x2={x0 + per} y2={y0 + H + 8} stroke="var(--hot)" strokeWidth={1.6} />
      <line x1={x0} y1={y0 + H + 4} x2={x0} y2={y0 + H + 12} stroke="var(--hot)" strokeWidth={1.6} /><line x1={x0 + per} y1={y0 + H + 4} x2={x0 + per} y2={y0 + H + 12} stroke="var(--hot)" strokeWidth={1.6} />
      <Txt x={x0 + per / 2} y={y0 + H + 22} size={9.5} c="hot" bold>{`${fmtNum(divT)} div = 1 period`}</Txt>
      <Txt x={rx} y={30} anchor="start" size={10} bold>{`${fmtNum(divV)} div p-p`}</Txt>
      <Txt x={rx} y={46} anchor="start" size={10} c="muted">{fv('voltage', pick(p, 'Vdiv'), 'V/div')}{p.v.probe ? ` ×${fmtNum(p.v.probe)}` : ''}</Txt>
      <Txt x={rx} y={62} anchor="start" size={10} c="muted">{fv('time', pick(p, 'tdiv'), 's/div')}</Txt>
      {p.o?.Vpp !== undefined && <Txt x={rx} y={94} anchor="start" size={10.5} c="hot" bold>{`Vpp ${fmtSI('voltage', p.o.Vpp)}`}</Txt>}
      {p.o?.f !== undefined && <Txt x={rx} y={110} anchor="start" size={10.5} c="hot" bold>{`f ${fmtSI('frequency', p.o.f)}`}</Txt>}
      {p.o?.T !== undefined && <Txt x={rx} y={126} anchor="start" size={10} c="muted">{`T ${fmtSI('time', p.o.T)}`}</Txt>}
      <Caption>Volts = divisions × V/div (× probe) · time = divisions × s/div</Caption>
    </Diagram>
  )
}

/** a rising edge: rise time is measured from 10 % to 90 % */
export const RiseTime = (p: VisualProps) => {
  const x0 = 40, y0 = 20, w = 280, h = 110
  const edge = (t: number) => 1 / (1 + Math.exp(-(t - 0.5) * 12))
  const pts = Array.from({ length: 101 }, (_, i) => `${(x0 + (i / 100) * w).toFixed(1)},${(y0 + h - edge(i / 100) * h).toFixed(1)}`).join(' ')
  const tAt = (v: number) => 0.5 - Math.log(1 / v - 1) / 12
  const x10 = x0 + tAt(0.1) * w, x90 = x0 + tAt(0.9) * w
  return (
    <Diagram title="A rising edge. The rise time is the time from 10 percent to 90 percent of the step. The scope's own rise time adds to it." h={170}>
      <line x1={x0} y1={y0 + h} x2={x0 + w} y2={y0 + h} stroke="var(--muted)" />
      <line x1={x0} y1={y0 + h * 0.1} x2={x0 + w} y2={y0 + h * 0.1} stroke="var(--muted)" strokeDasharray="2 4" />
      <line x1={x0} y1={y0 + h * 0.9} x2={x0 + w} y2={y0 + h * 0.9} stroke="var(--muted)" strokeDasharray="2 4" />
      <Txt x={x0 - 4} y={y0 + h * 0.1 + 4} anchor="end" size={9.5} c="muted">90 %</Txt><Txt x={x0 - 4} y={y0 + h * 0.9 + 4} anchor="end" size={9.5} c="muted">10 %</Txt>
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={2.4} />
      <line x1={x10} y1={y0 + h * 0.9} x2={x10} y2={y0 + h + 8} stroke="var(--hot)" /><line x1={x90} y1={y0 + h * 0.1} x2={x90} y2={y0 + h + 8} stroke="var(--hot)" />
      <Arrow x1={x10} y1={y0 + h + 6} x2={x90} y2={y0 + h + 6} c="hot" w={1.4} />
      <Txt x={(x10 + x90) / 2} y={y0 + h + 22} size={10.5} c="hot" bold>{`tr ${fv('time', pick(p, 'tr'), '')}`}</Txt>
      <Txt x={x0 + w} y={y0 + h * 0.9 - 8} anchor="end" size={10} c="muted">{`scope BW ${fv('frequency', pick(p, 'BW'), '')}`}</Txt>
      <Caption>tr ≈ 0.35 ÷ bandwidth · use a scope 3–5× faster than the signal</Caption>
    </Diagram>
  )
}

/** logic analyser: several digital channels sampled at once, with a decoded byte */
export const LogicAnalyser = () => {
  const ch = (y: number, name: string, levels: number[]) => {
    const step = 26
    let d = `M 70 ${y + (levels[0] ? 0 : 18)}`
    levels.forEach((l, i) => { const yy = y + (l ? 0 : 18); d += ` V ${yy} H ${70 + (i + 1) * step}` })
    return <g key={name}><Txt x={62} y={y + 13} anchor="end" size={10} bold>{name}</Txt><path d={d} fill="none" stroke="var(--accent)" strokeWidth={2} /></g>
  }
  return (
    <Diagram title="A logic analyser records several digital lines at once. It shows each as high or low over time and can decode protocols such as I2C, SPI and UART into bytes." h={150}>
      {ch(14, 'CH0 SCL', [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1])}
      {ch(52, 'CH1 SDA', [1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1])}
      {Array.from({ length: 22 }, (_, i) => <circle key={i} cx={70 + i * 13} cy={98} r={1.8} fill="var(--hot)" />)}
      <Txt x={62} y={102} anchor="end" size={10} c="hot">samples</Txt>
      <Rect x={96} y={112} w={180} h={22} c="good" />
      <Txt x={186} y={127} size={10.5} bold>{'I²C decoder: write 0x3C'}</Txt>
      <Caption>Sample at least 4× faster than the fastest signal</Caption>
    </Diagram>
  )
}

/** driver output levels next to receiver input thresholds, with the two noise margins */
export const LogicLevels = (p: VisualProps) => {
  const VOH = pick(p, 'VOH') ?? 2.4, VOL = pick(p, 'VOL') ?? 0.4, VIH = pick(p, 'VIH') ?? 2.0, VIL = pick(p, 'VIL') ?? 0.8
  const top = Math.max(VOH, VIH, VOL, VIL, 0.1) * 1.2
  const y0 = 20, h = 130, y = (v: number) => y0 + h - (v / top) * h
  const NMH = VOH - VIH, NML = VIL - VOL
  return (
    <Diagram title="Logic levels: the driver's guaranteed output levels next to the receiver's input thresholds. The gaps between them are the noise margins; a negative margin means the parts are not compatible." h={160}>
      <Txt x={80} y={14} size={10.5} bold>Driver output</Txt><Txt x={260} y={14} size={10.5} bold>Receiver input</Txt>
      <rect x={40} y={y(top)} width={80} height={y(VOH) - y(top)} fill="var(--soft)" stroke="var(--good)" /><Txt x={80} y={y(VOH) - 6} size={10} c="good" bold>{`VOH ${fmtNum(VOH)} V`}</Txt>
      <rect x={40} y={y(VOL)} width={80} height={y(0) - y(VOL)} fill="var(--soft)" stroke="var(--good)" /><Txt x={80} y={y(VOL) - 4} size={10} c="good" bold>{`VOL ${fmtNum(VOL)} V`}</Txt>
      <rect x={220} y={y(top)} width={80} height={y(VIH) - y(top)} fill="var(--soft)" stroke="var(--accent)" /><Txt x={260} y={y(VIH) + 13} size={10} c="accent" bold>{`VIH ${fmtNum(VIH)} V`}</Txt>
      <rect x={220} y={y(VIL)} width={80} height={y(0) - y(VIL)} fill="var(--soft)" stroke="var(--accent)" /><Txt x={260} y={y(VIL) - 4} size={10} c="accent" bold>{`VIL ${fmtNum(VIL)} V`}</Txt>
      <line x1={120} y1={y(VOH)} x2={220} y2={y(VIH)} stroke={NMH >= 0 ? 'var(--good)' : 'var(--bad)'} strokeDasharray="4 3" />
      <line x1={120} y1={y(VOL)} x2={220} y2={y(VIL)} stroke={NML >= 0 ? 'var(--good)' : 'var(--bad)'} strokeDasharray="4 3" />
      <Txt x={170} y={(y(VOH) + y(VIH)) / 2 - 6} size={10} c={NMH >= 0 ? 'good' : 'bad'} bold>{`NMH ${fmtNum(NMH)} V`}</Txt>
      <Txt x={170} y={(y(VOL) + y(VIL)) / 2 + 14} size={10} c={NML >= 0 ? 'good' : 'bad'} bold>{`NML ${fmtNum(NML)} V`}</Txt>
      <line x1={30} y1={y(0)} x2={330} y2={y(0)} stroke="var(--muted)" /><Txt x={334} y={y(0) + 4} anchor="start" size={9} c="muted">0 V</Txt>
      <Caption>Both margins must be positive — bigger is more noise-proof</Caption>
    </Diagram>
  )
}

/** a serial signal with the analyser's sample points: k samples per bit */
export const SampleRate = (p: VisualProps) => {
  const k = Math.round(Math.min(Math.max(pick(p, 'k') ?? 4, 1), 12))
  const bits = [1, 0, 1, 1, 0, 1], bw = 50, x0 = 30, hi = 40, lo = 90
  let d = `M ${x0} ${bits[0] ? hi : lo}`
  bits.forEach((b, i) => { d += ` V ${b ? hi : lo} H ${x0 + (i + 1) * bw}` })
  return (
    <Diagram title={`A digital signal with the analyser's sample points: ${k} samples per bit. Fewer than about 4 samples per bit and short pulses can be missed.`} h={130}>
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth={2.4} />
      {bits.flatMap((b, i) => Array.from({ length: k }, (_, j) => <circle key={`${i}-${j}`} cx={x0 + i * bw + ((j + 0.5) * bw) / k} cy={b ? hi : lo} r={2.6} fill="var(--hot)" />))}
      <line x1={x0} y1={108} x2={x0 + bw} y2={108} stroke="var(--ink)" /><Txt x={x0 + bw / 2} y={122} size={10}>1 bit</Txt>
      <Txt x={x0 + 3 * bw} y={20} size={10.5} c="hot" bold>{`${k} samples per bit · fs ${fv('frequency', p.o?.fs, '= k × f')}`}</Txt>
      <Caption>Memory = sample rate × capture time</Caption>
    </Diagram>
  )
}

/* ───────── components ───────── */

const E12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82]
const E24X = [11, 13, 16, 20, 24, 30, 36, 43, 51, 62, 75, 91]
/** one decade on a log scale with the E12 values (and the extra E24 ones), plus the value you asked for */
export const ESeries = (p: VisualProps) => {
  const x0 = 24, w = 312, y = 80
  const tx = (m: number) => x0 + Math.log10(m / 10) * w
  const X = pick(p, 'X')
  const m = X !== undefined && X > 0 ? X / 10 ** Math.floor(Math.log10(X)) * 10 : undefined
  return (
    <Diagram title="One decade of preferred values on a logarithmic scale: the E12 values, with the extra E24 values in between. Each step is about the same percentage." h={140}>
      <line x1={x0} y1={y} x2={x0 + w} y2={y} stroke="var(--ink)" strokeWidth={1.5} />
      {E12.map((v, i) => <g key={v}><line x1={tx(v)} y1={y - 12} x2={tx(v)} y2={y} stroke="var(--accent)" strokeWidth={2} /><Txt x={tx(v)} y={y - 16 - (i % 2) * 11} size={9.5} c="accent" bold>{v}</Txt></g>)}
      {E24X.map((v, i) => <g key={v}><line x1={tx(v)} y1={y} x2={tx(v)} y2={y + 8} stroke="var(--muted)" /><Txt x={tx(v)} y={y + 19 + (i % 2) * 10} size={8.5} c="muted">{v}</Txt></g>)}
      <Txt x={x0 + w} y={y + 4} anchor="start" size={9} c="muted">100</Txt>
      {m !== undefined && Number.isFinite(m) && <><circle cx={tx(m)} cy={y} r={5} fill="var(--hot)" /><Txt x={Math.min(Math.max(tx(m), 60), 300)} y={y + 46} size={10.5} c="hot" bold>{`your value ${fmtSI('resistance', X!)}`}</Txt></>}
      <Caption>E12 (blue, ±10 %) · extra E24 values (grey, ±5 %) · repeat ×10 per decade</Caption>
    </Diagram>
  )
}

/** a ceramic disc capacitor and how its 3-digit code is read */
export const CapCode = (p: VisualProps) => {
  const code = pick(p, 'code')
  const txt = code !== undefined && Number.isInteger(code) ? String(code).padStart(3, '0') : '104'
  const C = pick(p, 'C')
  return (
    <Diagram title={`A ceramic capacitor marked ${txt}: the first two digits are the value, the third is the number of zeros, in picofarads.`} h={150}>
      <Wire d="M 70 110 V 140" /><Wire d="M 100 110 V 140" />
      <ellipse cx={85} cy={70} rx={50} ry={44} fill="var(--soft)" stroke="var(--hot)" strokeWidth={2} />
      <Txt x={85} y={78} size={22} bold>{txt}</Txt>
      <Txt x={160} y={44} anchor="start" size={11}><tspan fontWeight={700}>{txt.slice(0, 2)}</tspan> = digits</Txt>
      <Txt x={160} y={64} anchor="start" size={11}><tspan fontWeight={700}>{txt[2]}</tspan> = number of zeros</Txt>
      <Txt x={160} y={88} anchor="start" size={11} c="hot" bold>{`${Number(txt.slice(0, 2))} × 10`}<tspan dy={-5} fontSize={8}>{txt[2]}</tspan><tspan dy={5}> pF</tspan></Txt>
      <Txt x={160} y={108} anchor="start" size={11} c="hot" bold>{C !== undefined ? `= ${fmtSI('capacitance', C)}` : '= 100 000 pF = 100 nF'}</Txt>
      <Caption>A letter after the code is the tolerance: J ±5 %, K ±10 %, M ±20 %</Caption>
    </Diagram>
  )
}

/** op-amp amplifier: non-inverting (input on +) or inverting (input through Rin on −) */
export const OpAmp = (p: VisualProps) => {
  const inv = p.mode === 'inv'
  const Rf = pick(p, 'Rf'), Rg = pick(p, 'Rg')
  const G = p.o?.G ?? (Rf !== undefined && Rg !== undefined ? (inv ? -Rf / Rg : 1 + Rf / Rg) : undefined)
  return (
    <Diagram title={inv ? 'Inverting amplifier: the input goes through Rin to the minus input; Rf feeds the output back. Gain = minus Rf over Rin.' : 'Non-inverting amplifier: the input goes to the plus input; Rf and Rg feed part of the output back to the minus input. Gain = 1 + Rf over Rg.'} h={170}>
      <polygon points="150,50 150,130 220,90" fill="var(--paper)" stroke="var(--ink)" strokeWidth={2} strokeLinejoin="round" />
      <Txt x={158} y={74} anchor="start" size={13} bold>−</Txt><Txt x={158} y={116} anchor="start" size={13} bold>+</Txt>
      <Wire d="M 220 90 H 320" /><Dot x={280} y={90} /><Txt x={322} y={80} anchor="end" size={10} bold>Vout</Txt>
      {/* feedback Rf from the output back to the − input, drawn above the op-amp */}
      <Wire d="M 280 90 V 46 H 252" /><Two kind="R" x1={252} y1={46} x2={180} y2={46} label="Rf" value={fv('resistance', Rf, '')} side={1} /><Wire d="M 180 46 H 130 V 70 H 150" /><Dot x={130} y={70} />
      {inv ? (
        <>
          <Two kind="R" x1={40} y1={70} x2={130} y2={70} label="Rin" value={fv('resistance', Rg, '')} side={1} />
          <Txt x={36} y={74} anchor="end" size={10} bold>Vin</Txt>
          <Wire d="M 150 110 H 120 V 126" /><Ground x={120} y={126} />
        </>
      ) : (
        <>
          <Two kind="R" x1={130} y1={70} x2={50} y2={70} label="Rg" value={fv('resistance', Rg, '')} side={1} /><Wire d="M 50 70 H 36 V 80" /><Ground x={36} y={80} />
          <Wire d="M 70 110 H 150" /><Txt x={66} y={114} anchor="end" size={10} bold>Vin</Txt>
        </>
      )}
      <Txt x={250} y={130} size={11} c="hot" bold>{`gain ${G === undefined ? (inv ? '= −Rf/Rin' : '= 1 + Rf/Rg') : fmtNum(G)}`}</Txt>
      <Caption>The output can't swing past the supply rails</Caption>
    </Diagram>
  )
}

/** linear regulator: the voltage it drops times the current is burned as heat */
export const Regulator = (p: VisualProps) => {
  const Vin = pick(p, 'Vin'), Vout = pick(p, 'Vout'), I = pick(p, 'I')
  return (
    <Diagram title="A linear regulator between the input and the load. It drops the difference between input and output voltage and turns that times the current into heat." h={160}
      totals={[total('P', 'Heat', 'power', p.o?.P), p.o ? { key: 'eff', label: 'Efficiency', text: `${fmtNum(p.o.eff)} %` } : null, total('VinMin', 'Min Vin', 'voltage', p.o?.VinMin)]}>
      <Wire d="M 30 60 H 140" /><Wire d="M 220 60 H 330" />
      <Rect x={140} y={40} w={80} h={50} c="ink" fill="soft" /><Txt x={180} y={62} bold>REG</Txt><Txt x={180} y={78} size={9.5} c="muted">7805 / LDO</Txt>
      <Wire d="M 180 90 V 120" /><Ground x={180} y={120} />
      <Txt x={30} y={50} anchor="start" size={10.5} bold>{`Vin ${fv('voltage', Vin, '')}`}</Txt>
      <Txt x={330} y={50} anchor="end" size={10.5} bold>{`Vout ${fv('voltage', Vout, '')}`}</Txt>
      <Txt x={330} y={80} anchor="end" size={10} c="muted">{`load ${fv('current', I, '')}`}</Txt>
      <path d="M 166 34 q 4 -8 0 -14 M 180 34 q 4 -8 0 -14 M 194 34 q 4 -8 0 -14" fill="none" stroke="var(--hot)" strokeWidth={1.8} />
      <Txt x={258} y={22} size={10} c="hot" bold>{`heat ${fv('power', p.o?.P, '= (Vin − Vout) × I')}`}</Txt>
      <Caption>Input must stay above Vout + dropout</Caption>
    </Diagram>
  )
}
