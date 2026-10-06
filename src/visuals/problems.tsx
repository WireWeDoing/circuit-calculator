import { Caption, Diagram, Dot, FlowBeside, total, fv, Rect, Two, Txt, Wire, pick, type VisualProps } from './kit.tsx'
import { fmtNum } from '../core/units.ts'

const Gnd = ({ x, y }: { x: number; y: number }) => <g stroke="var(--ink)" strokeWidth="2" strokeLinecap="round"><line x1={x - 9} y1={y} x2={x + 9} y2={y} /><line x1={x - 5.5} y1={y + 4} x2={x + 5.5} y2={y + 4} /><line x1={x - 2} y1={y + 8} x2={x + 2} y2={y + 8} /></g>

export const P1 = (p: VisualProps) => (
  <Diagram title="Problem 1: the supply feeds R1 in parallel with an unknown R2" h={180} totals={[total('V', 'Supply', 'voltage', p.v.V), total('I', 'Total I', 'current', p.v.I), total('P', 'Power', 'power', p.v.V !== undefined && p.v.I !== undefined ? p.v.V * p.v.I : undefined), total('Rt', 'Rt', 'resistance', p.o?.Rt ?? (p.v.V !== undefined && p.v.I ? p.v.V / p.v.I : undefined))]}>
    <Two kind="V" x1={40} y1={60} x2={40} y2={130} label="V" value={fv('voltage', p.v.V, '')} side={1} />
    <Wire d="M 40 60 V 40 H 280" /><Wire d="M 40 130 V 150 H 280" />
    <Wire d="M 150 40 V 56" /><Two kind="R" x1={150} y1={56} x2={150} y2={134} label="R1" value={fv('resistance', p.v.R1, '')} side={-1} /><Wire d="M 150 134 V 150" />
    <Wire d="M 250 40 V 56" /><Two kind="box" x1={250} y1={56} x2={250} y2={134} label="R2 = ?" value={fv('resistance', p.o?.R2, '')} c="hot" /><Wire d="M 250 134 V 150" />
    <Dot x={150} y={40} r={2.5} /><Dot x={250} y={40} r={2.5} /><Dot x={150} y={150} r={2.5} /><Dot x={250} y={150} r={2.5} />
    <FlowBeside x={92} y={40} dir="right" side={-1} len={46} name="I" /><Txt x={92} y={13} size={10.5} c="hot" bold>I {fv('current', p.v.I, '')}</Txt>{p.o?.I1 !== undefined && <><FlowBeside x={150} y={74} dir="down" side={-1} len={16} name="R1" /><FlowBeside x={250} y={74} dir="down" side={-1} len={16} name="R2" /></>}
    <Txt x={185} y={34} size={10} c="accent">I1 {fv('current', p.o?.I1, '')}</Txt><Txt x={285} y={34} size={10} c="accent" anchor="end">I2 {fv('current', p.o?.I2, '')}</Txt>
  </Diagram>
)

export const P2 = (p: VisualProps) => (
  <Diagram title="Problem 2: R1 in series with the parallel pair R2 and the unknown R3" h={190} totals={[total('V', 'Supply', 'voltage', p.v.V), total('I', 'Total I', 'current', p.v.I), total('P', 'Power', 'power', p.v.V !== undefined && p.v.I !== undefined ? p.v.V * p.v.I : undefined), total('Rt', 'Rt', 'resistance', p.o?.Rt ?? (p.v.V !== undefined && p.v.I ? p.v.V / p.v.I : undefined))]}>
    <Two kind="V" x1={30} y1={70} x2={30} y2={140} label="V" value={fv('voltage', p.v.V, '')} side={1} />
    <Wire d="M 30 70 V 40 H 60" /><Two kind="R" x1={60} y1={40} x2={140} y2={40} label="R1" value={fv('resistance', p.v.R1, '')} /><Wire d="M 140 40 H 290" />
    <Wire d="M 200 40 V 58" /><Two kind="R" x1={200} y1={58} x2={200} y2={132} label="R2" value={fv('resistance', p.v.R2, '')} side={-1} /><Wire d="M 200 132 V 160" />
    <Wire d="M 270 40 V 58" /><Two kind="box" x1={270} y1={58} x2={270} y2={132} label="R3 = ?" value={fv('resistance', p.o?.R3, '')} c="hot" /><Wire d="M 270 132 V 160" />
    <Wire d="M 30 140 V 160 H 290" /><Dot x={200} y={40} r={2.5} /><Dot x={270} y={40} r={2.5} />
    <Txt x={100} y={72} size={10.5} c="muted">V1 {fv('voltage', p.o?.V1, '')}</Txt>{p.rows && <><FlowBeside x={84} y={40} dir="right" side={1} len={20} name="R1" /><Txt x={116} y={60} size={9.5} c="hot" bold anchor="start">{fv('current', p.rows[0]!.I, '')}</Txt><FlowBeside x={200} y={74} dir="down" side={-1} len={16} name="R2" /><Txt x={210} y={90} size={9.5} c="hot" bold anchor="start">{fv('current', p.rows[1]!.I, '')}</Txt><FlowBeside x={270} y={74} dir="down" side={-1} len={16} name="R3" /><Txt x={254} y={114} size={9.5} c="hot" bold anchor="end">{fv('current', p.rows[2]!.I, '')}</Txt></>}<Txt x={235} y={176} size={10.5} c="accent" bold>Vp {fv('voltage', p.o?.Vp, '')}</Txt>
  </Diagram>
)

export const P3 = (p: VisualProps) => (
  <Diagram title="Problem 3: R1 in series with an unknown resistor Rx" h={168} totals={[total('V', 'Supply', 'voltage', p.v.V), total('I', 'Total I', 'current', pick(p, 'I')), total('P', 'Power', 'power', p.v.V !== undefined && pick(p, 'I') !== undefined ? p.v.V * pick(p, 'I')! : undefined), total('Rt', 'Rt', 'resistance', p.v.V !== undefined && pick(p, 'I') ? p.v.V / pick(p, 'I')! : undefined)]} padTop={14}>
    <Two kind="V" x1={40} y1={50} x2={40} y2={110} label="V" value={fv('voltage', p.v.V, '')} side={-1} />
    <Wire d="M 40 50 V 30 H 70" /><Two kind="R" x1={70} y1={30} x2={160} y2={30} label="R1" value={fv('resistance', p.v.R1, '')} /><Wire d="M 160 30 H 200" /><Two kind="box" x1={200} y1={30} x2={290} y2={30} label="Rx = ?" value={fv('resistance', p.o?.Rx, '')} c="hot" /><Wire d="M 290 30 H 320 V 130 H 40 V 110" />
    <Txt x={165} y={120} size={10.5} c="hot" bold>I {fv('current', pick(p, 'I'), '')} (same everywhere)</Txt>{pick(p, 'I') !== undefined && <><FlowBeside x={115} y={30} dir="right" side={1} len={22} name="R1" /><Txt x={140} y={52} size={9.5} c="hot" bold anchor="start">{fv('current', pick(p, 'I'), '')}</Txt><FlowBeside x={245} y={30} dir="right" side={1} len={22} name="Rx" /><Txt x={270} y={52} size={9.5} c="hot" bold anchor="start">{fv('current', pick(p, 'I'), '')}</Txt><FlowBeside x={180} y={130} dir="left" side={1} len={26} name="return" /></>}
  </Diagram>
)

export const P4 = (p: VisualProps) => (
  <Diagram title="Problem 4: any two-terminal circuit replaced by one source Vth in series with Rth feeding the load" h={190} totals={[total('V', 'Vth', 'voltage', pick(p, 'Vth')), total('I', 'Load I', 'current', pick(p, 'IL')), total('VL', 'VL', 'voltage', pick(p, 'VL')), total('P', 'Load P', 'power', pick(p, 'VL') !== undefined && pick(p, 'IL') !== undefined ? pick(p, 'VL')! * pick(p, 'IL')! : undefined)]}>
    <Rect x={20} y={40} w={90} h={90} c="muted" fill="none" /><Txt x={65} y={90} size={11} c="muted" bold>any circuit</Txt>
    <Txt x={150} y={90} size={22} c="accent">≡</Txt>
    <Two kind="V" x1={200} y1={70} x2={200} y2={125} label="Vth" value={fv('voltage', pick(p, 'Vth'), '')} side={-1} />
    <Wire d="M 200 70 V 40 H 230" /><Two kind="R" x1={230} y1={40} x2={280} y2={40} label="Rth" value={fv('resistance', pick(p, 'Rth'), '')} /><Wire d="M 280 40 H 330 V 60" /><Two kind="R" x1={330} y1={60} x2={330} y2={110} label="RL" value={fv('resistance', p.v.RL, '')} side={-1} /><Wire d="M 330 110 V 140 H 200 V 125" />
    {pick(p, 'IL') !== undefined && <><FlowBeside x={255} y={40} dir="right" side={1} len={22} name="Rth" /><Txt x={255} y={72} size={9.5} c="hot" bold>{fv('current', pick(p, 'IL'), '')}</Txt><FlowBeside x={330} y={85} dir="down" side={1} len={20} name="RL" /></>}<Txt x={265} y={172} size={11} c="hot" bold>VL = Vth × RL / (Rth + RL) = {fv('voltage', pick(p, 'VL'), '?')}</Txt>
  </Diagram>
)

export const P5 = (p: VisualProps) => (
  <Diagram title="Problem 5: two sources with series resistors and a load meeting at a single node" h={190} totals={[total('V', 'Node', 'voltage', p.o?.V), total('I1', 'I1', 'current', p.o?.I1), total('I2', 'I2', 'current', p.o?.I2), total('I', 'Load I', 'current', p.o?.I3)]} padTop={14}>
    <Two kind="V" x1={30} y1={60} x2={30} y2={120} label="V1" value={fv('voltage', p.v.V1, '')} side={1} /><Wire d="M 30 60 V 30 H 60" /><Two kind="R" x1={60} y1={30} x2={120} y2={30} label="R1" value={fv('resistance', p.v.R1, '')} /><Wire d="M 120 30 H 180 V 90" />
    <Two kind="V" x1={330} y1={60} x2={330} y2={120} label="V2" value={fv('voltage', p.v.V2, '')} side={-1} /><Wire d="M 330 60 V 30 H 300" /><Two kind="R" x1={300} y1={30} x2={240} y2={30} label="R2" value={fv('resistance', p.v.R2, '')} /><Wire d="M 240 30 H 180" />
    <Dot x={180} y={90} c="hot" r={4} /><Txt x={196} y={86} anchor="start" size={10.5} c="hot" bold>V = {fv('voltage', p.o?.V, '?')}</Txt>
    <Wire d="M 180 90 V 104" /><Two kind="R" x1={180} y1={104} x2={180} y2={150} label="R3" value={fv('resistance', p.v.R3, '')} side={-1} /><Wire d="M 180 150 V 168 H 30 V 120" /><Wire d="M 180 168 H 330 V 120" />
    <Txt x={60} y={64} size={10} c="muted" anchor="start">I1 {fv('current', p.o?.I1, '')}</Txt><Txt x={300} y={64} size={10} c="muted" anchor="end">I2 {fv('current', p.o?.I2, '')}</Txt>{p.o && <><FlowBeside x={90} y={30} dir="right" side={1} signed={p.o.I1} len={22} name="R1" /><FlowBeside x={270} y={30} dir="left" side={1} signed={p.o.I2} len={22} name="R2" /><FlowBeside x={180} y={128} dir="down" side={1} signed={p.o.I3} len={20} name="R3" /></>}
  </Diagram>
)

export const P6 = (p: VisualProps) => (
  <Diagram title="Problem 6: a divider scales a high input voltage down to a safe level for the ADC pin" h={190}>
    <Txt x={60} y={20} bold c="accent">Vin,max {fv('voltage', p.v.Vin, '')}</Txt><Wire d="M 60 26 V 36" />
    <Two kind="R" x1={60} y1={36} x2={60} y2={92} label="R1 = ?" value={fv('resistance', p.o?.R1 ?? p.v.R1, '')} c="hot" /><Dot x={60} y={92} /><Wire d="M 60 92 H 150" />
    <Two kind="R" x1={60} y1={92} x2={60} y2={148} label="R2" value={fv('resistance', p.v.R2, '')} /><Wire d="M 60 148 V 158" /><Gnd x={60} y={158} />
    <Rect x={150} y={72} w={80} h={40} /><Txt x={190} y={96} bold>ADC pin</Txt><Txt x={250} y={90} anchor="start" size={10.5} c="accent" bold>{fv('voltage', p.v.Vout, 'Vout')}</Txt>
    <Txt x={190} y={150} size={10.5} c="muted">Vin = Vadc × (R1 + R2) / R2</Txt><Txt x={190} y={166} size={10.5} c="hot" bold>× {fmtNum(p.o?.k ?? NaN) === 'NaN' ? 'factor' : fmtNum(p.o!.k, 4)}</Txt>
  </Diagram>
)

export const P7 = (p: VisualProps) => (
  <Diagram title="Problem 7: a sensor such as an NTC or LDR forms a divider with a known fixed resistor" h={190}>
    <Txt x={60} y={20} bold c="accent">Vin {fv('voltage', p.v.Vin, '')}</Txt><Wire d="M 60 26 V 36" />
    <Two kind="R" x1={60} y1={36} x2={60} y2={92} label="Rf" value={fv('resistance', p.v.Rf, '')} /><Dot x={60} y={92} /><Wire d="M 60 92 H 150" />
    <Two kind="NTC" x1={60} y1={92} x2={60} y2={148} label="Rs = ?" value={fv('resistance', p.o?.Rs, '')} c="hot" /><Wire d="M 60 148 V 158" /><Gnd x={60} y={158} />
    <Txt x={160} y={88} anchor="start" size={11} c="hot" bold>Vout {fv('voltage', pick(p, 'Vout'), '')}</Txt>
    <Txt x={250} y={140} size={10.5} c="muted">I = (Vin − Vout)/Rf</Txt><Txt x={250} y={156} size={10.5} c="muted">Rs = Vout / I</Txt>
  </Diagram>
)

export const P8 = (p: VisualProps) => (
  <Diagram title="Problem 8: Wheatstone bridge: a meter between two dividers reads zero when the ratios match" h={200}>
    <Wire d="M 180 20 V 34" /><Txt x={196} y={26} anchor="start" size={10.5} c="accent" bold>V {fv('voltage', p.v.V, '')}</Txt>
    <Wire d="M 180 34 L 100 90 L 180 146 L 260 90 Z" c="muted" />
    <Two kind="R" x1={180} y1={34} x2={100} y2={90} label="R1" value={fv('resistance', p.v.R1, '')} side={-1} /><Two kind="R" x1={180} y1={34} x2={260} y2={90} label="R3" value={fv('resistance', p.v.R3, '')} />
    <Two kind="R" x1={100} y1={90} x2={180} y2={146} label="R2" value={fv('resistance', p.v.R2, '')} side={-1} /><Two kind="box" x1={260} y1={90} x2={180} y2={146} label="Rx = ?" value={fv('resistance', p.o?.Rx, '')} c="hot" />
    <Wire d="M 100 90 H 260" /><circle cx={180} cy={90} r={13} fill="var(--paper)" stroke="var(--hot)" strokeWidth="2" /><Txt x={180} y={94} size={11} c="hot" bold>V</Txt>
    <Wire d="M 180 146 V 162" /><Gnd x={180} y={162} />
    <Txt x={300} y={90} size={10.5} c="hot" bold anchor="start">0 V = balanced</Txt>
    <Txt x={180} y={190} size={10.5} c="muted">R1/R2 = R3/Rx → Rx = R2 × R3 / R1</Txt>
  </Diagram>
)

export const P13 = (p: VisualProps) => {
  const n = Math.min(p.v.n ?? 3, 4)
  return (
    <Diagram title="Problem 13: several LEDs in series share one current-limiting resistor" h={170} totals={[total('V', 'Supply', 'voltage', p.v.Vs), total('I', 'Total I', 'current', p.v.I), total('P', 'Power', 'power', p.v.Vs !== undefined && p.v.I !== undefined ? p.v.Vs * p.v.I : undefined), total('R', 'R', 'resistance', p.o?.R)]} padTop={14}>
      <Two kind="V" x1={30} y1={50} x2={30} y2={120} label="Vs" value={fv('voltage', p.v.Vs, '')} side={1} /><Wire d="M 30 50 V 30 H 60" />
      <Two kind="R" x1={60} y1={30} x2={120} y2={30} label="R" value={fv('resistance', p.o?.R, '')} c="hot" />
      {Array.from({ length: n }, (_, i) => <Two key={i} kind="LED" x1={120 + i * (190 / n)} y1={30} x2={120 + (i + 1) * (190 / n)} y2={30} />)}
      <Wire d={`M ${120 + 190} 30 H 320 V 140 H 30 V 120`} />
      {p.v.I !== undefined && <><FlowBeside x={90} y={30} dir="right" side={1} len={22} name="R" />{Array.from({ length: n }, (_, i) => <FlowBeside key={i} x={120 + (i + 0.5) * (190 / n)} y={30} dir="right" side={1} len={16} name={`LED${i + 1}`} />)}<Txt x={90} y={62} size={9.5} c="hot" bold>{fv('current', p.v.I, '')}</Txt></>}<Txt x={180} y={100} bold c="accent">R = (Vs − n × Vf) / I</Txt><Txt x={180} y={118} size={10.5} c="muted">{n} LED(s) take n × Vf; the resistor takes the rest</Txt>
    </Diagram>
  )
}

export const P14 = (p: VisualProps) => (
  <Diagram title="Problem 14: Zener regulator: a series resistor feeds a Zener diode in parallel with the load" h={190} totals={[total('V', 'Vz', 'voltage', p.v.Vz), total('I', 'Max I', 'current', p.o?.Imax), total('Pz', 'Pzener', 'power', p.o?.Pz), total('P', 'PR', 'power', p.o?.PR)]}>
    <Txt x={6} y={62} bold c="accent" anchor="start" size={10.5}>Vin {fv('voltage', p.v.Vmin, '')}–{fv('voltage', p.v.Vmax, '')}</Txt>
    <Wire d="M 40 40 H 70" /><Two kind="R" x1={70} y1={40} x2={140} y2={40} label="R" value={fv('resistance', p.o?.R ?? p.v.R, '')} c="hot" /><Wire d="M 140 40 H 290" />
    <Wire d="M 200 40 V 60" /><Two kind="Z" x1={200} y1={130} x2={200} y2={60} label="Zener" value={fv('voltage', p.v.Vz, '')} side={-1} /><Wire d="M 200 130 V 150" />
    <Wire d="M 270 40 V 60" /><Two kind="box" x1={270} y1={60} x2={270} y2={130} label="Load" value={fv('current', p.v.IL, '')} /><Wire d="M 270 130 V 150" />
    <Wire d="M 40 150 H 290" /><Dot x={200} y={40} r={2.5} /><Dot x={270} y={40} r={2.5} />
    {p.o?.Imax !== undefined && <><FlowBeside x={105} y={40} dir="right" side={1} len={22} name="R" /><Txt x={105} y={72} size={9.5} c="hot" bold>{fv('current', p.o.Imax, '')}</Txt><FlowBeside x={200} y={95} dir="down" side={1} len={20} name="Zener" /><FlowBeside x={270} y={95} dir="down" side={-1} len={20} name="Load" /></>}<Txt x={180} y={176} size={10.5} c="muted">worst case: lowest input + full load → R</Txt>
  </Diagram>
)

export const P15 = (p: VisualProps) => (
  <Diagram title="Problem 15: mains transformer, bridge rectifier and smoothing capacitor" h={190}>
    <Txt x={50} y={26} size={11} bold>mains {fv('voltage', p.v.Vp, '')}</Txt>
    <g stroke="var(--ink)" strokeWidth="2" fill="none"><path d="M 50 60 q 12 0 12 8 t -12 8 t -12 8 t 12 8" /><path d="M 90 60 q -12 0 -12 8 t 12 8 t 12 8 t -12 8" /><line x1={68} y1={56} x2={68} y2={108} /><line x1={74} y1={56} x2={74} y2={108} /></g>
    <Txt x={68} y={128} size={10.5} c="muted">{p.o?.ratio !== undefined ? `${fmtNum(p.o.ratio, 4)} : 1` : 'Np : Ns'}</Txt>
    <Wire d="M 90 60 H 130" /><Wire d="M 90 108 H 130" />
    <path d="M 130 60 L 165 84 L 200 60 M 130 108 L 165 84 L 200 108" fill="none" stroke="var(--accent)" strokeWidth="2" /><Txt x={165} y={150} size={10.5} c="accent" bold>bridge</Txt>
    <Wire d="M 200 60 H 250" /><Wire d="M 200 108 H 250" /><Wire d="M 250 60 V 66" /><Two kind="C" x1={250} y1={66} x2={250} y2={104} label="C" value={fv('capacitance', p.o?.C, '')} c="hot" side={-1} /><Wire d="M 250 104 V 108" />
    <Wire d="M 250 60 H 300 V 76" /><Two kind="box" x1={300} y1={76} x2={300} y2={106} label="Load" value={fv('current', p.v.I, '')} /><Wire d="M 300 106 V 108 H 250" />
    <Txt x={290} y={150} size={10.5} c="muted">C = I / (fr · ΔV)</Txt>
  </Diagram>
)

export const P16 = (p: VisualProps) => (
  <Diagram title="Problem 16: heat flows from the junction to the air through thermal resistances in series" h={170}>
    <Rect x={20} y={50} w={64} h={44} c="hot" /><Txt x={52} y={70} bold c="hot">junction</Txt><Txt x={52} y={85} size={10.5}>Tj</Txt>
    <Two kind="R" x1={84} y1={72} x2={150} y2={72} label="θJC" value={fv('thermal', p.v.tJC, '')} /><Rect x={150} y={52} w={44} h={40} c="muted" /><Txt x={172} y={76} size={10.5}>case</Txt>
    <Two kind="R" x1={194} y1={72} x2={248} y2={72} label="θCS" value={fv('thermal', p.v.tCS, '')} /><Rect x={248} y={52} w={44} h={40} c="accent" /><Txt x={270} y={76} size={10.5}>sink</Txt>
    <Two kind="R" x1={292} y1={72} x2={340} y2={72} label="θSA" value={fv('thermal', p.o?.tSA, '')} c="hot" /><Txt x={340} y={100} size={10.5} anchor="end" c="muted">air Ta</Txt>
    <Txt x={180} y={130} size={11} bold c="accent">θSA = (Tj,max − Ta)/P − θJC − θCS</Txt><Txt x={180} y={148} size={10.5} c="muted">P = {fv('power', pick(p, 'P'), '(Vin − Vout) × I')} — Tj = Ta + P × θJA = {fmtNum(p.o?.Tj ?? NaN) === 'NaN' ? '?' : `${fmtNum(p.o!.Tj, 4)} °C`}</Txt>
  </Diagram>
)

export const P18 = (p: VisualProps) => (
  <Diagram title="Problem 18: NPN amplifier with voltage-divider bias, collector resistor and emitter resistor" h={200}>
    <Wire d="M 30 20 H 250" /><Txt x={254} y={24} anchor="start" size={10.5} c="accent" bold>Vcc {fv('voltage', p.v.Vcc, '')}</Txt>
    <Wire d="M 60 20 V 30" /><Two kind="R" x1={60} y1={30} x2={60} y2={80} label="R1" value={fv('resistance', p.v.R1, '')} side={-1} /><Dot x={60} y={95} /><Wire d="M 60 80 V 105" /><Two kind="R" x1={60} y1={105} x2={60} y2={150} label="R2" value={fv('resistance', p.v.R2, '')} side={-1} /><Wire d="M 60 150 V 172 H 190" />
    <Wire d="M 60 95 H 135" /><Txt x={90} y={88} size={10.5} c="hot" bold>VB {fv('voltage', p.o?.VB, '')}</Txt>
    <Wire d="M 190 20 V 30" /><Two kind="R" x1={190} y1={30} x2={190} y2={70} label="RC" value={fv('resistance', p.v.RC, '')} /><Wire d="M 190 70 V 82" />
    <g stroke="var(--ink)" strokeWidth="2" fill="none" strokeLinecap="round"><line x1={150} y1={95} x2={150} y2={125} strokeWidth="3.5" /><line x1={135} y1={95} x2={150} y2={95} /><line x1={150} y1={103} x2={190} y2={82} /><line x1={150} y1={117} x2={190} y2={128} /></g>
    <Txt x={206} y={86} anchor="start" size={10.5} c="hot" bold>VC {fv('voltage', p.o?.VC, '')}</Txt>
    <Wire d="M 190 128 V 138" /><Two kind="R" x1={190} y1={138} x2={190} y2={172} label="RE" value={fv('resistance', p.v.RE, '')} side={1} />
    <Txt x={296} y={120} size={10.5} c="hot" bold>VE {fv('voltage', p.o?.VE, '')}</Txt><Txt x={296} y={136} size={10.5} c="muted">IC {fv('current', p.o?.IC, '')}</Txt><Txt x={296} y={152} size={10.5} c="good" bold>VCE {fv('voltage', p.o?.VCE, '')}</Txt>
  </Diagram>
)

export const P20 = (p: VisualProps) => (
  <Diagram title="Problem 20: a battery with internal resistance, measured with and without a known load" h={170} totals={[total('V', 'Voc', 'voltage', p.v.Voc), total('I', 'Load I', 'current', p.o?.I), total('R', 'Rint', 'resistance', p.o?.Rint), total('VL', 'VL', 'voltage', p.v.VL)]}>
    <Rect x={20} y={20} w={170} h={110} c="muted" fill="none" /><Txt x={105} y={142} size={10.5} c="muted">battery (dashed box)</Txt>
    <Two kind="V" x1={40} y1={50} x2={40} y2={100} label="Voc" value={fv('voltage', p.v.Voc, '')} side={1} /><Wire d="M 40 50 H 70" /><Two kind="R" x1={70} y1={50} x2={140} y2={50} label="Rint" value={fv('resistance', p.o?.Rint ?? p.v.Rint, '')} c="hot" /><Wire d="M 140 50 H 190" />
    <Wire d="M 190 50 H 250 V 70" /><Two kind="R" x1={250} y1={70} x2={250} y2={110} label="RL" value={fv('resistance', p.v.RL, '')} side={1} /><Wire d="M 250 110 V 135 H 40 V 100" />
    <Txt x={270} y={122} size={10.5} c="accent" bold anchor="start">VL {fv('voltage', p.v.VL, '')}</Txt>
    {p.o?.I !== undefined && <><FlowBeside x={105} y={50} dir="right" side={1} len={22} name="Rint" /><Txt x={105} y={80} size={9.5} c="hot" bold>{fv('current', p.o.I, '')}</Txt><FlowBeside x={250} y={90} dir="down" side={-1} len={20} name="RL" /></>}<Txt x={180} y={160} size={10.5} c="muted">Rint = (Voc − VL) / I — the missing voltage is dropped inside</Txt>
  </Diagram>
)
export { Caption }
