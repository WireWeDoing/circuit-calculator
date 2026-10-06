import { Arrow, Caption, Diagram, Dot, FLOW_GAP, FlowBeside, SourceCurrent, total, fv, Rect, Two, Txt, Wire, type VisualProps, pick, isOut } from './kit.tsx'
import type { Dim } from '../core/units.ts'
import { fmtNum, fmtSI } from '../core/units.ts'

/* ── Ohm's law triangle + circuit ── */
const Tri = ({ cx, cy, top, bl, br, t, topT, blT, brT, hl }: { cx: number; cy: number; top: string; bl: string; br: string; t: string; topT: string; blT: string; brT: string; hl: string }) => (
  <g>
    <polygon points={`${cx},${cy - 48} ${cx - 56},${cy + 40} ${cx + 56},${cy + 40}`} fill="var(--soft)" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
    <line x1={cx - 33} y1={cy + 4} x2={cx + 33} y2={cy + 4} stroke="var(--accent)" strokeWidth="1.5" />
    <line x1={cx} y1={cy + 4} x2={cx} y2={cy + 40} stroke="var(--accent)" strokeWidth="1.5" />
    {[[top, cx, cy - 8, topT], [bl, cx - 28, cy + 28, blT], [br, cx + 28, cy + 28, brT]].map(([k, x, y, v]) => (
      <g key={k as string}><circle cx={x as number} cy={(y as number) - 5} r="14" fill={hl === k ? 'var(--hot)' : 'var(--paper)'} stroke="var(--accent)" /><text x={x as number} y={(y as number) - 1} textAnchor="middle" fontSize="13" fontWeight="700" fill={hl === k ? 'var(--paper)' : 'var(--ink)'}>{k as string}</text><text x={x as number} y={(y as number) + 22} textAnchor="middle" fontSize="9.5" fill="var(--muted)">{v as string}</text></g>
    ))}
    <Txt x={cx} y={cy - 56} size={11} bold>{t}</Txt>
    <Txt x={cx} y={cy + 66} size={10.5} c="muted">cover {hl} →  {hl === top ? `${bl} × ${br}` : `${top} ÷ ${hl === bl ? br : bl}`}</Txt>
  </g>
)

export const Ohm = (p: VisualProps) => {
  const target = p.mode // 'V' | 'I' | 'R'
  return (
    <Diagram title={`Ohm's law triangle: V on top, I and R below. Cover the quantity you want: ${target}.`} h={200}>
      <Tri cx={90} cy={92} top="V" bl="I" br="R" t="Ohm's law" topT="" blT={fv('current', p.v.I ?? p.o?.I, '')} brT={fv('resistance', p.v.R ?? p.o?.R, '')} hl={target} />
      <Wire d="M 200 40 H 330 V 100" /><Wire d="M 330 130 V 150 H 200 V 100" /><Wire d="M 200 40 V 70" />
      <Two kind="V" x1={200} y1={70} x2={200} y2={100} />
      <Two kind="R" x1={330} y1={100} x2={330} y2={130} label="R" value={fv('resistance', pick(p, 'R'), '')} side={-1} />
      <Arrow x1={235} y1={40} x2={285} y2={40} c="hot" /><Txt x={260} y={31} c="hot" bold>I</Txt>
      <Txt x={266} y={166} size={10.5} c="muted">{fv('voltage', pick(p, 'V'), 'V')} drives {fv('current', pick(p, 'I'), 'I')} through R</Txt>
      <Caption>Pressure (V) pushes flow (I) through a narrow pipe (R)</Caption>
    </Diagram>
  )
}

export const Power = (p: VisualProps) => {
  const known = (k: string, dim: Dim) => fv(dim, pick(p, k), '')
  return (
    <Diagram title="Power triangle: P on top, V and I below. Also P = I squared times R and P = V squared over R." h={200}>
      <polygon points="90,44 34,132 146,132" fill="var(--soft)" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
      <line x1={57} y1={96} x2={123} y2={96} stroke="var(--accent)" strokeWidth="1.5" /><line x1={90} y1={96} x2={90} y2={132} stroke="var(--accent)" strokeWidth="1.5" />
      <Txt x={90} y={88} size={15} bold>P</Txt><Txt x={62} y={122} size={15} bold>V</Txt><Txt x={118} y={122} size={15} bold>I</Txt>
      <Txt x={90} y={36} bold>Power</Txt>
      <Rect x={190} y={36} w={150} h={34} /><Txt x={265} y={52} bold>P = V × I</Txt><Txt x={265} y={65} size={10} c="muted">{known('P', 'power')} = {known('V', 'voltage')} × {known('I', 'current')}</Txt>
      <Rect x={190} y={80} w={150} h={34} /><Txt x={265} y={96} bold>P = I² × R</Txt><Txt x={265} y={109} size={10} c="muted">{`current squared × resistance`}</Txt>
      <Rect x={190} y={124} w={150} h={34} /><Txt x={265} y={140} bold>P = V² ÷ R</Txt><Txt x={265} y={153} size={10} c="muted">voltage squared ÷ resistance</Txt>
      <Caption>Almost all of this power turns into heat — pick a part rated ≥ 2×</Caption>
    </Diagram>
  )
}

type Net = { kind: 'R' | 'C' | 'L'; topology: 'series' | 'parallel' }
const SYM: Record<string, Dim> = { R: 'resistance', C: 'capacitance', L: 'inductance' }
const MAX_PARTS = 12

/** the typed parts of a network: list rows, or R1/R2 for the two-resistor formula */
const slotsOf = (p: VisualProps, kind: string): Array<number | undefined> => {
  const s = p.slots?.[kind]
  if (s && s.length) return s.slice(0, MAX_PARTS)
  if (p.v.R1 !== undefined || p.v.R2 !== undefined) return [p.v.R1, p.v.R2]
  return [undefined, undefined]
}
const fq = (dim: Dim, x: number | undefined) => (x === undefined ? '' : fmtSI(dim, x))

/**
 * Series chain or parallel ladder. Draws exactly as many parts as there are rows entered (2–12),
 * and — when the calculation provides a per-part breakdown — annotates each part with its voltage / current.
 */
export const Network = ({ kind, topology, p }: Net & { p: VisualProps }) => {
  const slots = slotsOf(p, kind)
  const n = Math.max(slots.length, 2)
  const dim = SYM[kind]!
  const rows = p.rows
  const tKey = kind === 'R' ? 'Rt' : kind === 'C' ? 'Ct' : 'Lt'
  const name = (i: number) => `${kind}${i + 1}`
  const noun = kind === 'R' ? 'resistors' : kind === 'C' ? 'capacitors' : 'inductors'
  const row = (i: number) => rows?.[i]
  const totalValue = p.o?.[tKey]
  const compact = n > 6

  // what the whole network does: supply, total current, power, equivalent value — shown in the strip under the drawing
  const supplyV = p.v.V ?? p.o?.V
  const allI = !!rows?.length && rows.every((r) => r.I !== undefined)
  const supplyI = topology === 'series' ? rows?.[0]?.I : (p.o?.I ?? (allI ? rows!.reduce((a, r) => a + r.I!, 0) : undefined))
  const totals = kind === 'C'
    ? [total('V', 'Supply', 'voltage', supplyV), total(tKey, tKey, dim, totalValue), total('Q', 'Charge', 'charge', p.o?.Q), total('E', 'Energy', 'energy', p.o?.E)]
    : [total('V', 'Supply', 'voltage', supplyV), total('I', 'Total I', 'current', supplyI), total('P', 'Power', 'power', p.o?.P), total(tKey, tKey, dim, totalValue)]

  if (topology === 'series') {
    const two = n > 5
    const perRow = two ? Math.ceil(n / 2) : n
    const railTop = 40, railBot = two ? 164 : 140
    const x0 = 62, x1 = 318
    const place = (i: number) => {
      const bottom = two && i >= perRow
      const k = bottom ? n - perRow : perRow
      const idx = bottom ? i - perRow : i
      const w = (x1 - x0) / k
      // bottom row is walked right → left so the chain stays continuous
      const a = bottom ? x1 - idx * w : x0 + idx * w
      const b = bottom ? x1 - (idx + 1) * w : x0 + (idx + 1) * w
      return { a, b, y: bottom ? railBot : railTop, bottom }
    }
    const I = rows?.[0]?.I
    return (
      <Diagram title={`${n} ${noun} in series, one after another in a single path${rows ? ', annotated with the voltage across each' : ''}`} h={two ? 217 : 160} totals={totals}>
        <Wire d={`M 40 ${railTop} H ${x0}`} />
        <Wire d={`M ${x1} ${railTop} H 322 ${two ? `V ${railBot} H ${x1}` : `V ${railBot} H 40`}`} />
        {two ? <Wire d={`M ${x0} ${railBot} H 40`} /> : null}
        {kind !== 'C' && supplyI !== undefined && <SourceCurrent x={40} y={railTop + 18} text={fmtSI('current', supplyI)} />}
        <Wire d={`M 40 ${railTop} V ${(railTop + railBot) / 2 - 20}`} /><Two kind="V" x1={40} y1={(railTop + railBot) / 2 - 20} x2={40} y2={(railTop + railBot) / 2 + 20} /><Wire d={`M 40 ${(railTop + railBot) / 2 + 20} V ${railBot}`} />
        {Array.from({ length: n }, (_, i) => {
          const { a, b, y, bottom } = place(i)
          const r = row(i)
          const mx = (a + b) / 2
          const fsz = compact ? 8.5 : 9.5
          const showI = r?.I !== undefined
          return (
            <g key={i} data-testid={`part-${name(i)}`}>
              <Two kind={kind} x1={a} y1={y} x2={b} y2={y} label={name(i)} value={compact ? '' : fq(dim, slots[i])} />
              {/* current: arrow + value right under the part; conventional direction = away from the battery's + (top row →, bottom row ←) */}
              {showI && <>
                <FlowBeside x={mx} y={y} dir={bottom ? 'left' : 'right'} side={1} len={Math.min(22, Math.abs(b - a) - 14)} name={name(i)} />
                <Txt x={mx} y={y + 31} size={fsz} c="hot" bold>{fmtSI('current', r!.I!)}</Txt>
              </>}
              {r?.V !== undefined && <Txt x={mx} y={y + (showI ? 43 : 24)} size={fsz} c="accent" bold>{fmtSI('voltage', r.V)}</Txt>}
              {r?.V === undefined && r?.share !== undefined && <Txt x={mx} y={y + 24} size={fsz} c="muted">{fmtNum(r.share * 100, 3)}%</Txt>}
            </g>
          )
        })}
        <Txt x={180} y={two ? 124 : 112} c="accent" bold size={11}>{kind === 'C' ? 'Ct: 1/Ct = 1/C1 + 1/C2 + …' : `${tKey} = ${name(0)} + ${name(1)} + …`}{totalValue !== undefined ? ` = ${fmtSI(dim, totalValue)}` : ''}</Txt>
        {I !== undefined && <Txt x={180} y={two ? 104 : 134} size={10.5} c="hot" bold>same current in every part: I = {fmtSI('current', I)}</Txt>}
        {rows?.[0]?.Q !== undefined && <Txt x={180} y={two ? 104 : 134} size={10.5} c="hot" bold>same charge on every part: Q = {fmtSI('charge', rows[0].Q!)}</Txt>}
        <Caption>{kind === 'R' || kind === 'L' ? 'Series: values add; voltage splits in proportion to each part' : 'Series C: reciprocals add; the smallest C takes the most voltage'}</Caption>
      </Diagram>
    )
  }

  const left = 102, right = 330 // the first branch keeps clear of the battery symbol (its current arrow sits left of it)
  const xs = Array.from({ length: n }, (_, i) => (n === 1 ? (left + right) / 2 : left + (i * (right - left)) / (n - 1)))
  const colW = (right - left) / Math.max(n - 1, 1)
  const fs = colW < 34 ? 8 : colW < 50 ? 9 : 10.5
  const Vsame = rows?.[0]?.V
  return (
    <Diagram title={`${n} ${noun} in parallel, each across the same two points${rows ? ', annotated with the current through each' : ''}`} h={compact ? 240 : 195} totals={totals}>
      <Wire d={`M 40 34 H ${right + 14}`} /><Wire d={`M 40 150 H ${right + 14}`} />
      {kind !== 'C' && supplyI !== undefined && <SourceCurrent x={40} y={52} text={fmtSI('current', supplyI)} />}
      <Wire d="M 40 34 V 70" /><Two kind="V" x1={40} y1={70} x2={40} y2={114} /><Wire d="M 40 114 V 150" />
      {xs.map((x, i) => {
        const r = row(i)
        const sw = r?.share !== undefined ? 2 + r.share * 5 : 2
        const tI = r?.I !== undefined ? fmtSI('current', r.I) : r?.Q !== undefined ? fmtSI('charge', r.Q) : ''
        return (
          <g key={i} data-testid={`part-${name(i)}`}>
            <Wire d={`M ${x} 34 V 62`} w={sw} c={r?.I !== undefined ? 'hot' : 'ink'} /><Two kind={kind} x1={x} y1={62} x2={x} y2={122} /><Wire d={`M ${x} 122 V 150`} w={sw} c={r?.I !== undefined ? 'hot' : 'ink'} />
            <Dot x={x} y={34} r={2.5} /><Dot x={x} y={150} r={2.5} />
            {/* current arrow on the branch wire (conventional: down from the + rail), its value beside the part */}
            {/* The arrow sits beside the branch, never on the wire. Up to 6 branches: the value is written vertically right next to the arrow
                (both left of the wire, so the first/last branch never run off the picture). More: arrows stay beside the wire up near the rail and
                the values are written downwards under the rail, so nothing is drawn over the resistor symbols. */}
            {r?.I !== undefined && (compact
              ? <FlowBeside x={x} y={48} dir="down" side={-1} gap={Math.max(9, Math.min(FLOW_GAP, colW * 0.3))} len={14} name={name(i)} w={2.6} />
              : <FlowBeside x={x} y={92} dir="down" side={-1} len={16} name={name(i)} w={2.6} />)}
            {tI && !compact && <text x={x - 29} y={92} fontSize={fs - 0.5} fill="var(--hot)" fontWeight={700} textAnchor="middle" transform={`rotate(-90 ${x - 29} 92)`}>{tI}</text>}
            {tI && compact && <text x={x} y={174} fontSize={fs} fill="var(--hot)" fontWeight={700} transform={`rotate(90 ${x} 174)`}>{tI}</text>}
            <Txt x={x} y={166} size={fs} bold>{name(i)}</Txt>
            {!compact && <Txt x={x} y={178} size={fs - 0.5} c="muted">{fq(dim, slots[i])}</Txt>}
            {!tI && r?.share !== undefined && <Txt x={x} y={compact ? 178 : 190} size={fs - 0.5} c="muted">{fmtNum(r.share * 100, 3)}%</Txt>}
          </g>
        )
      })}
      <Txt x={200} y={11} c="accent" bold size={11}>{kind === 'C' ? 'Ct = C1 + C2 + …' : `1/${tKey} = 1/${name(0)} + 1/${name(1)} + …`}{totalValue !== undefined ? `  →  ${tKey} = ${fmtSI(dim, totalValue)}` : ''}</Txt>
      {Vsame !== undefined && <Txt x={200} y={25} size={10} c="hot" bold>same voltage across every branch: V = {fmtSI('voltage', Vsame)}</Txt>}
    </Diagram>
  )
}

export const SeriesR = (p: VisualProps) => <Network kind="R" topology="series" p={p} />
export const SeriesC = (p: VisualProps) => <Network kind="C" topology="series" p={p} />
export const SeriesL = (p: VisualProps) => <Network kind="L" topology="series" p={p} />
export const ParallelR = (p: VisualProps) => <Network kind="R" topology="parallel" p={p} />
export const ParallelC = (p: VisualProps) => <Network kind="C" topology="parallel" p={p} />
export const ParallelL = (p: VisualProps) => <Network kind="L" topology="parallel" p={p} />

export const Divider = (p: VisualProps) => {
  const Vin = pick(p, 'Vin'), R1 = pick(p, 'R1'), R2 = pick(p, 'R2'), Vout = pick(p, 'Vout')
  const frac = R1 && R2 ? R2 / (R1 + R2) : 0.5
  const barH = 120, top = 30
  return (
    <Diagram title="Voltage divider: two series resistors; the output is taken across the bottom one" h={190} totals={[total('V', 'Vin', 'voltage', Vin), total('I', 'Total I', 'current', p.rows?.[0]?.I), total('Vout', 'Vout', 'voltage', Vout), total('P', 'Power', 'power', p.rows?.every((r) => r.P !== undefined) ? p.rows.reduce((a, r) => a + r.P!, 0) : undefined)]}>
      <Txt x={60} y={20} bold c="accent">Vin {fv('voltage', Vin, '')}</Txt>
      <Wire d="M 60 28 V 40" /><Two kind="R" x1={60} y1={40} x2={60} y2={92} label="R1" value={fv('resistance', R1, '')} />
      <Dot x={60} y={92} /><Wire d="M 60 92 H 130" /><Two kind="R" x1={60} y1={92} x2={60} y2={144} label="R2" value={fv('resistance', R2, '')} /><Wire d="M 60 144 V 152" /><Ground x={60} y={152} />
      {p.rows?.[0]?.I !== undefined ? [66, 118].map((yy, k) => (
        <g key={yy}><FlowBeside x={60} y={yy} dir="down" side={-1} len={22} name={`R${k + 1}`} /><Txt x={26} y={yy + 24} anchor="middle" size={9.5} c="hot" bold>{fmtSI('current', p.rows![0]!.I!)}</Txt></g>
      )) : null}
      <Txt x={150} y={88} bold c="hot" anchor="start">Vout {fv('voltage', Vout, '')}</Txt><Dot x={130} y={92} c="hot" />
      <g transform="translate(230 0)">
        <Rect x={0} y={top} w={64} h={barH * (1 - frac)} c="muted" />
        <Rect x={0} y={top + barH * (1 - frac)} w={64} h={barH * frac} c="hot" fill="soft" />
        <Txt x={32} y={top + (barH * (1 - frac)) / 2 + 4} size={9.5}>lost on R1</Txt><Txt x={32} y={top + barH * (1 - frac) + (barH * frac) / 2 + 4} size={10} c="hot" bold>Vout</Txt>
        <Txt x={32} y={top - 6} size={10} c="muted">Vin split</Txt>
        <Txt x={70} y={top + barH * (1 - frac) + 14} size={10} anchor="start" c="hot">{fmtNum(frac * 100, 3)}%</Txt>
      </g>
      <Caption>Vout = Vin × R2 / (R1 + R2): the bigger R2 is, the bigger its share</Caption>
    </Diagram>
  )
}
const Ground = ({ x, y }: { x: number; y: number }) => <g stroke="var(--ink)" strokeWidth="2" strokeLinecap="round"><line x1={x - 9} y1={y} x2={x + 9} y2={y} /><line x1={x - 5.5} y1={y + 4} x2={x + 5.5} y2={y + 4} /><line x1={x - 2} y1={y + 8} x2={x + 2} y2={y + 8} /></g>

export const CurrentDivider = (p: VisualProps) => {
  const It = pick(p, 'It'), I1 = pick(p, 'I1'), I2 = pick(p, 'I2')
  const wd = (x: number | undefined) => 2 + (It && x ? (x / It) * 7 : 3.5)
  return (
    <Diagram title="Current divider: total current splits between two parallel resistors; more flows through the smaller resistor" h={190} totals={[total('I', 'Total I', 'current', It), total('V', 'Voltage', 'voltage', p.rows?.[0]?.V), total('P', 'Power', 'power', p.rows?.every((r) => r.P !== undefined) ? p.rows.reduce((a, r) => a + r.P!, 0) : undefined)]}>
      <Wire d="M 30 80 H 90" w={wd(It) } c="hot" /><Txt x={50} y={50} c="hot" bold>It {fv('current', It, '')}</Txt>
      <Wire d="M 90 80 V 40 H 200" w={wd(I1)} c="accent" /><Wire d="M 90 80 V 140 H 200" w={wd(I2)} c="accent" />
      <Two kind="R" x1={200} y1={40} x2={290} y2={40} label="R1" value={fv('resistance', p.v.R1, '')} /><Two kind="R" x1={200} y1={140} x2={290} y2={140} label="R2" value={fv('resistance', p.v.R2, '')} side={-1} />
      <Wire d="M 290 40 H 330 V 140 H 290" /><Wire d="M 330 90 H 350" w={wd(It)} c="hot" />
      {It !== undefined && <FlowBeside x={60} y={80} dir="right" side={-1} len={20} name="It" />}
      {I1 !== undefined && <FlowBeside x={106} y={40} dir="right" side={-1} len={20} name="R1" />}
      {I2 !== undefined && <FlowBeside x={106} y={140} dir="right" side={1} len={20} name="R2" />}
      <Txt x={150} y={32} c="accent" bold size={10.5}>I1 {fv('current', I1, '')}</Txt><Txt x={150} y={162} c="accent" bold size={10.5}>I2 {fv('current', I2, '')}</Txt>
      <Caption>Line thickness = share of the current</Caption>
    </Diagram>
  )
}

const BANDS: Record<string, string> = { black: '#111', brown: '#7b4a1e', red: '#d32f2f', orange: '#f57c00', yellow: '#fbc02d', green: '#2e7d32', blue: '#1565c0', violet: '#7b1fa2', grey: '#757575', white: '#f5f5f5', gold: '#c9a227', silver: '#b0b0b0' }
export const BAND_COLORS = BANDS
export const ResistorBands = ({ bands }: { bands: string[] }) => (
  <Diagram title={`Resistor with colour bands: ${bands.join(', ')}`} h={90}>
    <Wire d="M 10 45 H 70" w={3} /><Wire d="M 290 45 H 350" w={3} />
    <rect x={70} y={22} width={220} height={46} rx={22} fill="#e9d8b4" stroke="var(--ink)" strokeWidth="1.5" />
    {bands.map((b, i) => <rect key={i} x={98 + i * (bands.length === 5 ? 34 : 38) + (i === bands.length - 1 ? 14 : 0)} y={23} width={14} height={44} fill={BANDS[b] ?? '#999'} stroke="#0003" />)}
  </Diagram>
)
export const ColourCode = () => <ResistorBands bands={['brown', 'black', 'red', 'gold']} />

export const PrefixLadder = () => {
  const steps = [['G', '10⁹'], ['M', '10⁶'], ['k', '10³'], ['base', '1'], ['m', '10⁻³'], ['µ', '10⁻⁶'], ['n', '10⁻⁹'], ['p', '10⁻¹²']]
  return (
    <Diagram title="Prefix ladder from giga to pico: each step is a factor of 1000" h={140}>
      {steps.map(([s, e], i) => (
        <g key={s}><Rect x={12 + i * 43} y={40} w={38} h={46} c={s === 'base' ? 'hot' : 'accent'} fill={s === 'base' ? 'soft' : 'paper'} /><Txt x={31 + i * 43} y={62} size={15} bold>{s}</Txt><Txt x={31 + i * 43} y={78} size={9.5} c="muted">{e}</Txt></g>
      ))}
      <Arrow x1={30} y1={110} x2={330} y2={110} c="muted" w={1.5} /><Txt x={180} y={104} size={10.5} c="muted">to a smaller prefix: × 1000 (1.5 kΩ = 1500 Ω)</Txt>
      <Arrow x1={330} y1={124} x2={30} y2={124} c="muted" w={1.5} /><Txt x={180} y={138} size={10.5} c="muted">to a bigger prefix: ÷ 1000 (4700 Ω = 4.7 kΩ)</Txt>
    </Diagram>
  )
}

export const SeriesParallelTable = () => (
  <Diagram title="Series: one path, same current, voltages add. Parallel: shared voltage, currents add." h={170}>
    <Txt x={90} y={18} bold>Series</Txt><Txt x={270} y={18} bold>Parallel</Txt>
    <Wire d="M 20 60 H 40" /><Two kind="R" x1={40} y1={60} x2={100} y2={60} label="R1" /><Two kind="R" x1={100} y1={60} x2={160} y2={60} label="R2" /><Wire d="M 160 60 H 170" />
    <Txt x={95} y={100} size={10.5} c="hot">same I through all</Txt><Txt x={95} y={116} size={10.5} c="muted">V = V1 + V2 (KVL)</Txt><Txt x={95} y={132} size={10.5} c="muted">Rt = R1 + R2 (larger)</Txt>
    <Wire d="M 210 30 H 340" /><Wire d="M 210 130 H 340" />
    {[240, 310].map((x, i) => <g key={x}><Wire d={`M ${x} 30 V 48`} /><Two kind="R" x1={x} y1={48} x2={x} y2={112} label={`R${i + 1}`} side={-1} /><Wire d={`M ${x} 112 V 130`} /></g>)}
    <Txt x={275} y={148} size={10.5} c="hot">same V across each</Txt><Txt x={275} y={162} size={10.5} c="muted">I = I1 + I2 (KCL) · Rt smaller</Txt>
  </Diagram>
)

export const Reverse = (p: VisualProps) => (
  <Diagram title="Remove a known part from a measured total to find the unknown part" h={170}>
    <Txt x={90} y={18} bold>In series</Txt><Txt x={270} y={18} bold>In parallel</Txt>
    <rect x={20} y={34} width={140} height={44} rx={6} fill="none" stroke="var(--muted)" strokeDasharray="5 3" /><Txt x={90} y={30} size={10} c="muted">measured total</Txt>
    <Two kind="R" x1={26} y1={56} x2={86} y2={56} label="known" /><Two kind="box" x1={90} y1={56} x2={154} y2={56} label="unknown" c="hot" />
    <Txt x={90} y={104} size={11} c="accent" bold>Rx = Rt − R1</Txt><Txt x={90} y={122} size={10} c="muted">(C in parallel, L in series work the same)</Txt>
    <rect x={200} y={28} width={140} height={96} rx={6} fill="none" stroke="var(--muted)" strokeDasharray="5 3" /><Txt x={270} y={140} size={10} c="muted">measured total</Txt>
    <Wire d="M 215 46 H 325" /><Wire d="M 215 108 H 325" />
    <Wire d="M 240 46 V 52" /><Two kind="R" x1={240} y1={52} x2={240} y2={102} label="known" side={-1} /><Wire d="M 240 102 V 108" />
    <Wire d="M 300 46 V 52" /><Two kind="box" x1={300} y1={52} x2={300} y2={102} label="?" c="hot" /><Wire d="M 300 102 V 108" />
    <Txt x={270} y={158} size={11} c="accent" bold>Rx = R1·Rt / (R1 − Rt)</Txt>
    {p.o && <Txt x={180} y={178} size={10.5} c="hot">{`Result: ${Object.entries(p.o).map(([k, x]) => `${k} = ${fmtNum(x)}`).join(' ')}`}</Txt>}
  </Diagram>
)

export { isOut }
