import { Arrow, Caption, Diagram, Dot, FlowBeside, total, fv, Plot, Rect, Two, Txt, Wire, pick, type VisualProps } from './kit.tsx'
import { fmtNum, fmtSI } from '../core/units.ts'

export const DiodeV = (p: VisualProps) => {
  void p
  return (
    <Diagram title="Diode: current flows from anode to cathode once the forward voltage is exceeded" h={190}>
      <Wire d="M 20 60 H 40" /><Two kind="D" x1={40} y1={60} x2={110} y2={60} label="diode" /><Wire d="M 110 60 H 130" />
      <Txt x={42} y={92} size={10} c="muted" anchor="start">anode (+)</Txt><Txt x={112} y={92} size={10} c="muted" anchor="end">cathode (−)</Txt>
      <Arrow x1={50} y1={40} x2={100} y2={40} c="hot" /><Txt x={75} y={32} size={10} c="hot">current →</Txt>
      <Plot x0={190} y0={15} w={150} h={120} xmin={-1} xmax={1.2} ymin={-0.1} ymax={1} fn={(x) => (x < 0 ? -0.05 : Math.min(1, 0.002 * (Math.exp(x / 0.075) - 1)))} xticks={[[0, '0'], [0.3, '0.3'], [0.7, '0.7 V']]} xlabel="forward voltage" />
      <Txt x={290} y={85} size={10.5} c="hot" bold>knee ≈ 0.7 V (Si)</Txt>
      <Txt x={80} y={150} size={10.5} c="muted">Si 0.6–0.7 V · Schottky 0.2–0.4 V · Ge ≈ 0.3 V</Txt>
    </Diagram>
  )
}

export const LedV = (p: VisualProps) => {
  const Vs = p.v.Vs ?? p.v.Vgpio, Vf = p.v.Vf
  const frac = Vs && Vf ? Math.min(1, Vf / Vs) : 0.4
  return (
    <Diagram title="LED with a series resistor: the supply voltage splits between the LED and the resistor" h={190} totals={[total('V', 'Supply', 'voltage', p.v.Vs ?? p.v.Vgpio), total('I', 'Total I', 'current', p.v.If ?? p.v.Iled), total('P', 'Power', 'power', (p.v.Vs ?? p.v.Vgpio) !== undefined && (p.v.If ?? p.v.Iled) !== undefined ? (p.v.Vs ?? p.v.Vgpio)! * (p.v.If ?? p.v.Iled)! : undefined), total('R', 'R', 'resistance', p.o?.R)]}>
      <Wire d="M 40 40 H 70" /><Two kind="R" x1={70} y1={40} x2={140} y2={40} label="R" value={fv('resistance', pick(p, 'R'), '')} /><Wire d="M 140 40 H 160 V 60" /><Two kind="LED" x1={160} y1={60} x2={160} y2={120} label="LED" value={`Vf ${fv('voltage', Vf, '')}`} side={-1} /><Wire d="M 160 120 V 150 H 40 V 100" /><Two kind="V" x1={40} y1={40} x2={40} y2={100} label="" />
      <Txt x={40} y={170} size={10.5} c="accent" bold anchor="start">{fv('voltage', Vs, 'Vsupply')}</Txt>{(p.v.If ?? p.v.Iled) !== undefined && <><FlowBeside x={105} y={40} dir="right" side={1} len={22} name="R" /><Txt x={105} y={72} size={9.5} c="hot" bold>{fv('current', p.v.If ?? p.v.Iled, '')}</Txt><FlowBeside x={160} y={118} dir="down" side={-1} len={18} name="LED" /><Txt x={134} y={138} size={9.5} c="hot" bold anchor="end">{fv('current', p.v.If ?? p.v.Iled, '')}</Txt></>}
      <g transform="translate(250 22)"><Rect x={0} y={0} w={40} h={130 * (1 - frac)} c="muted" /><Rect x={0} y={130 * (1 - frac)} w={40} h={130 * frac} c="hot" /><Txt x={20} y={130 * (1 - frac) / 2 + 4} size={10}>R</Txt><Txt x={20} y={130 * (1 - frac) + 130 * frac / 2 + 4} size={10} c="hot" bold>LED</Txt><Txt x={20} y={-6} size={10} c="muted">supply</Txt></g>
      <Caption>R = (Vsupply − Vf) / If — the resistor takes whatever the LED doesn't</Caption>
    </Diagram>
  )
}

const Npn = ({ x, y, hot }: { x: number; y: number; hot?: boolean }) => (
  <g stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" fill="none">
    <circle cx={x} cy={y} r={26} stroke={hot ? 'var(--hot)' : 'var(--muted)'} strokeWidth="1.2" />
    <line x1={x - 8} y1={y - 16} x2={x - 8} y2={y + 16} strokeWidth="3.5" />
    <line x1={x - 8} y1={y - 6} x2={x + 10} y2={y - 20} /><line x1={x - 8} y1={y + 6} x2={x + 10} y2={y + 20} />
    <polygon points={`${x + 10},${y + 20} ${x + 2},${y + 17} ${x + 7},${y + 11}`} fill="var(--ink)" />
  </g>
)
export const Bjt = (p: VisualProps) => (
  <Diagram title="NPN transistor: a small base current IB controls a larger collector current IC; emitter current is their sum" h={190}>
    <Npn x={170} y={95} />
    <Wire d="M 80 95 H 162" /><Txt x={90} y={85} anchor="start" bold c="accent">B</Txt>
    <Wire d="M 180 75 V 35" /><Txt x={192} y={45} anchor="start" bold c="accent">C</Txt><Wire d="M 180 115 V 155" /><Txt x={192} y={152} anchor="start" bold c="accent">E</Txt>
    <Arrow x1={95} y1={110} x2={140} y2={110} c="hot" /><Txt x={118} y={126} size={10.5} c="hot" bold>IB {fv('current', p.v.IB, '')}</Txt>
    <Arrow x1={172} y1={30} x2={172} y2={62} c="good" /><Txt x={236} y={52} size={10.5} c="good" bold anchor="middle">IC {fv('current', pick(p, 'IC'), '')}</Txt>
    <Arrow x1={172} y1={125} x2={172} y2={160} c="accent" /><Txt x={236} y={170} size={10.5} c="accent" bold>IE {fv('current', pick(p, 'IE'), '')}</Txt>
    <Txt x={300} y={95} size={11} c="muted">IC = hFE × IB</Txt><Txt x={300} y={110} size={11} c="muted">IE = IB + IC</Txt>
  </Diagram>
)

export const BjtSwitch = (p: VisualProps) => (
  <Diagram title="BJT switching a load from a microcontroller pin through a base resistor" h={200} totals={[total('V', 'Vcc', 'voltage', p.v.Vcc), total('I', 'Load I', 'current', pick(p, 'IC')), total('IB', 'Base I', 'current', pick(p, 'IB')), total('R', 'RB', 'resistance', pick(p, 'RB'))]}>
    <Wire d="M 270 20 H 120" /><Txt x={274} y={24} anchor="start" size={10.5} c="accent" bold>+Vcc</Txt>
    <Two kind="box" x1={120} y1={20} x2={120} y2={70} label="Load" value="relay / motor" side={-1} /><Wire d="M 120 70 H 140 V 80" />
    <Npn x={130} y={105} /><Wire d="M 122 70 V 79" />
    <Wire d="M 40 105 H 60" /><Two kind="R" x1={60} y1={105} x2={105} y2={105} label="RB" value={fv('resistance', pick(p, 'RB'), '')} side={1} /><Wire d="M 105 105 H 122" />
    <Txt x={38} y={108} anchor="end" size={10.5} c="accent" bold>GPIO</Txt>
    <Wire d="M 140 130 V 170" /><Wire d="M 132 170 H 148" /><Wire d="M 136 174 H 144" />
    <Two kind="D" x1={190} y1={70} x2={190} y2={20} label="" /><Wire d="M 190 70 H 120" /><Wire d="M 190 20 H 120" />
    <Txt x={202} y={40} anchor="start" size={10} c="hot">flyback diode</Txt>
    {pick(p, 'IC') !== undefined && <><FlowBeside x={120} y={45} dir="down" side={1} len={20} name="Load" /><Txt x={144} y={49} size={8.5} c="good" bold anchor="start">{fv('current', pick(p, 'IC'), '')}</Txt><FlowBeside x={82} y={105} dir="right" side={1} len={22} name="RB" /><Txt x={82} y={133} size={9.5} c="hot" bold>IB {fv('current', pick(p, 'IB'), '')}</Txt></>}<Txt x={300} y={110} size={10.5} c="muted">IB = IC / 10 → saturated</Txt><Txt x={300} y={125} size={10.5} c="muted">RB = (Vgpio − 0.7) / IB</Txt>
  </Diagram>
)

export const Mosfet = (p: VisualProps) => (
  <Diagram title="N-channel MOSFET: gate voltage opens the drain-source channel; when on it acts as a small resistor RDS(on)" h={190}>
    <g stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" fill="none">
      <line x1={90} y1={95} x2={118} y2={95} /><line x1={118} y1={70} x2={118} y2={120} strokeWidth="3.5" />
      <line x1={130} y1={68} x2={130} y2={82} /><line x1={130} y1={88} x2={130} y2={102} /><line x1={130} y1={108} x2={130} y2={122} />
      <line x1={130} y1={75} x2={170} y2={75} /><line x1={170} y1={75} x2={170} y2={40} /><line x1={130} y1={115} x2={170} y2={115} /><line x1={170} y1={115} x2={170} y2={150} /><line x1={130} y1={95} x2={170} y2={95} /><line x1={170} y1={95} x2={170} y2={115} />
    </g>
    <Txt x={85} y={99} anchor="end" bold c="accent">G</Txt><Txt x={180} y={44} anchor="start" bold c="accent">D</Txt><Txt x={180} y={150} anchor="start" bold c="accent">S</Txt>
    <Txt x={20} y={142} size={10.5} c="hot" bold anchor="start">VGS ≥ 4.5 V (logic-level)</Txt>
    <text x={270} y={50} fontSize="11" fill="var(--muted)" textAnchor="middle">fully on =</text>
    <Two kind="R" x1={270} y1={60} x2={270} y2={120} label="RDS(on)" value={fv('resistance', p.v.RDS, '')} side={1} />
    <Txt x={270} y={150} size={10.5} c="hot" bold>P = ID² × RDS(on) = {fv('power', pick(p, 'PD') ?? pick(p, 'P'), '')}</Txt>
  </Diagram>
)

export const WireV = (p: VisualProps) => (
  <Diagram title="Wire resistance grows with length and shrinks with cross-section; a cable loop doubles the length" h={170}>
    <rect x={40} y={50} width={220} height={34} rx={6} fill="var(--soft)" stroke="var(--accent)" strokeWidth="2" /><ellipse cx={260} cy={67} rx={8} ry={17} fill="var(--paper)" stroke="var(--accent)" strokeWidth="2" />
    <Arrow x1={40} y1={105} x2={260} y2={105} c="hot" /><Arrow x1={260} y1={105} x2={40} y2={105} c="hot" /><Txt x={150} y={122} bold c="hot">L = {fv('length', p.v.L, '')}</Txt>
    <Txt x={296} y={55} size={10.5} anchor="start" c="accent" bold>A = {fv('area', p.v.A, '')}</Txt><Txt x={296} y={69} size={10} anchor="start" c="muted">cross-section</Txt>
    <Arrow x1={50} y1={67} x2={100} y2={67} c="accent" w={1.6} /><Txt x={75} y={44} size={10.5} c="accent">I</Txt>
    <Txt x={180} y={150} size={11} bold>R = ρ × L / A</Txt><Txt x={180} y={165} size={10} c="muted">to a load and back: use 2 × L</Txt>
  </Diagram>
)

export const ChargeFlow = (p: VisualProps) => (
  <Diagram title="Charge flowing through a wire: current times time gives the total charge moved" h={150}>
    <rect x={30} y={50} width={300} height={36} rx={18} fill="var(--soft)" stroke="var(--accent)" strokeWidth="2" />
    {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={55 + i * 31} cy={68} r={5} fill="var(--hot)" />)}
    <Arrow x1={60} y1={110} x2={300} y2={110} c="hot" /><Txt x={180} y={104} size={10.5} c="hot">I = {fv('current', p.v.I, '')} for t = {fv('time', p.v.t, '')}</Txt>
    <Txt x={180} y={135} bold c="accent">Q = I × t = {fv('charge', pick(p, 'Q'), '?')}</Txt>
  </Diagram>
)

export const Kvl = (p: VisualProps) => {
  const vs = p.lists.V ?? []
  return (
    <Diagram title="Kirchhoff's voltage law: walking around a closed loop, rises and drops add up to zero" h={190}>
      <Wire d="M 80 40 H 280 V 150 H 80 V 40" />
      <Two kind="V" x1={80} y1={60} x2={80} y2={130} label="rise" value={vs[0] !== undefined ? `${fmtNum(vs[0])} V` : '+9 V'} side={-1} />
      <Two kind="LED" x1={160} y1={40} x2={240} y2={40} label="drop" value={vs[1] !== undefined ? `${fmtNum(vs[1])} V` : '−2 V'} />
      <Two kind="R" x1={280} y1={60} x2={280} y2={130} label="drop" value={vs[2] !== undefined ? `${fmtNum(vs[2])} V` : '−7 V'} />
      <Arrow x1={170} y1={150} x2={120} y2={150} c="hot" /><Txt x={145} y={168} size={10.5} c="hot">walk this way</Txt>
      <Txt x={180} y={100} bold c="accent">ΣV = {p.o?.sum !== undefined ? fmtNum(p.o.sum) : '0'}</Txt>
    </Diagram>
  )
}

export const Kcl = (p: VisualProps) => {
  const inn = p.lists.Iin ?? [], out = p.lists.Iout ?? []
  return (
    <Diagram title="Kirchhoff's current law: currents entering a node equal currents leaving it" h={170}>
      <circle cx={180} cy={85} r={7} fill="var(--accent)" />
      <Arrow x1={40} y1={85} x2={166} y2={85} c="good" w={3} /><Txt x={100} y={75} c="good" bold>in {inn.length ? fv('current', inn.reduce((a, b) => a + b, 0), '') : '50 mA'}</Txt>
      <Arrow x1={194} y1={85} x2={310} y2={40} c="hot" w={3} /><Arrow x1={194} y1={88} x2={310} y2={135} c="hot" w={3} />
      <Txt x={300} y={30} c="hot" bold anchor="end">{out[0] !== undefined ? fv('current', out[0], '') : '30 mA'}</Txt><Txt x={300} y={156} c="hot" bold anchor="end">{out[1] !== undefined ? fv('current', out[1], '') : '20 mA'}</Txt>
      <Caption>Like a pipe junction: whatever flows in must flow out</Caption>
    </Diagram>
  )
}

export const BatteryV = (p: VisualProps) => {
  const Rint = p.v.Rint ?? 0.05
  return (
    <Diagram title="Real battery: an ideal voltage source in series with an internal resistance, feeding a load" h={170}>
      <Wire d="M 40 40 H 70" /><Two kind="R" x1={70} y1={40} x2={140} y2={40} label="Rint" value={fv('resistance', Rint, '')} c="hot" /><Wire d="M 140 40 H 200 V 70" /><Two kind="box" x1={200} y1={70} x2={200} y2={120} label="Load" value={fv('current', p.v.I ?? p.v.Iload, '')} side={1} /><Wire d="M 200 120 V 145 H 40 V 100" /><Two kind="V" x1={40} y1={40} x2={40} y2={100} label="Voc" value={fv('voltage', p.v.Voc, '')} side={-1} />
      <Rect x={270} y={50} w={70} h={70} c="muted" fill="none" /><Rect x={270} y={50 + 70 * 0.25} w={70} h={70 * 0.75} c="good" fill="soft" /><Txt x={305} y={140} size={10.5} c="muted">capacity</Txt><Txt x={305} y={90} size={10.5} bold>{fv('capacityAh', pick(p, 'Ah') ?? p.v.cap, 'Ah')}</Txt>
      <Caption>Vterminal = Voc − I × Rint — the battery "sags" under load</Caption>
    </Diagram>
  )
}

export const Pack = (p: VisualProps) => {
  const x = Math.min(p.v.x ?? 3, 6), y = Math.min(p.v.y ?? 2, 4)
  return (
    <Diagram title={`Battery pack: ${x} cells in series by ${y} in parallel`} h={190}>
      {Array.from({ length: y }, (_, r) => Array.from({ length: x }, (_, c) => (
        <g key={`${r}${c}`}><Two kind="V" x1={30 + c * (290 / x)} y1={50 + r * 36} x2={30 + (c + 1) * (290 / x) - 14} y2={50 + r * 36} />{c < x - 1 && <Wire d={`M ${30 + (c + 1) * (290 / x) - 14} ${50 + r * 36} h 14`} />}</g>
      )))}
      <Txt x={175} y={28} bold c="accent">{x}S{y}P</Txt>
      <Txt x={175} y={50 + y * 36 + 14} size={10.5} c="muted">series ↑ voltage adds · parallel ↓ capacity adds</Txt>
      <Txt x={175} y={50 + y * 36 + 30} size={10.5} bold c="hot">{fv('voltage', p.o?.V, 'V')} · {fv('capacityAh', p.o?.Ah, 'Ah')} · {fv('energyWh', p.o?.Wh, 'Wh')}</Txt>
    </Diagram>
  )
}
export { Dot, Plot, fmtSI }
