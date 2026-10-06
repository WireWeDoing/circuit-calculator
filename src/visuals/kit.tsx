import { createContext, memo, useContext, type ReactNode } from 'react'
import type { BreakdownRow } from '../core/types.ts'
import { fmtNum, fmtSI, type Dim } from '../core/units.ts'

export interface VisualProps {
  /** current input values (base units) — undefined while the user hasn't typed */
  v: Partial<Record<string, number>>
  /** current outputs (base units) if the calculation succeeded */
  o?: Record<string, number>
  mode: string
  lists: Partial<Record<string, number[]>>
  /** list inputs as typed, one slot per row (undefined = row still empty) — lets a diagram grow as rows are added */
  slots?: Partial<Record<string, Array<number | undefined>>>
  /** per-component results (voltage, current, power…) when the mode provides them */
  rows?: BreakdownRow[]
}

/** true while a diagram is rendered as a small list thumbnail: captions are dropped */
export const ThumbContext = createContext(false)

/** formatted value with unit, or the fallback text (usually the symbol) when unknown */
export const fv = (dim: Dim, x: number | undefined, fallback: string): string =>
  x === undefined || !Number.isFinite(x) ? fallback : fmtSI(dim, x)
export const fn = (x: number | undefined, fallback: string): string =>
  x === undefined || !Number.isFinite(x) ? fallback : fmtNum(x)
/** value from outputs first, then inputs */
export const pick = (p: VisualProps, key: string): number | undefined => p.o?.[key] ?? p.v[key]
/** is this key the thing being solved for? */
export const isOut = (p: VisualProps, key: string): boolean => p.o !== undefined && key in p.o && p.v[key] === undefined

const CaptionY = createContext(0)

/** one entry of the summary strip drawn under a circuit */
export interface Total { key: string; label: string; text: string }
/** build a Total from a value; undefined / non-finite values are dropped */
export const total = (key: string, label: string, dim: Dim, x: number | undefined): Total | null =>
  x === undefined || !Number.isFinite(x) ? null : { key, label, text: fmtSI(dim, x) }

const STRIP_H = 28
/** padTop: extra room above the drawing for part labels that sit over a rail near the top edge. totals: summary strip under the drawing. */
export const Diagram = memo(function Diagram({ title, children, h = 180, padTop = 0, totals }: { title: string; children: ReactNode; h?: number; padTop?: number; totals?: Array<Total | null> }) {
  const items = (totals ?? []).filter((t): t is Total => !!t).slice(0, 4)
  const extra = items.length ? STRIP_H : 0
  // a plain <svg>: colours come from the --ink/--accent… variables set once on :root (App's GlobalStyles)
  const body = (
    <>
      {children}
      {items.length > 0 && (
        <g data-testid="totals" aria-hidden="false">
          <rect x={6} y={h + 2} width={348} height={STRIP_H - 6} rx={7} fill="var(--soft)" />
          {items.map((t, i) => (
            <text key={t.key} data-total={t.key} x={6 + (348 * (i + 0.5)) / items.length} y={h + 17} textAnchor="middle" fontSize={10.5}>
              <tspan fill="var(--muted)">{t.label} </tspan><tspan fill={t.key === 'I' ? 'var(--hot)' : 'var(--ink)'} fontWeight={800}>{t.text}</tspan>
            </text>
          ))}
        </g>
      )}
    </>
  )
  return (
    <CaptionY.Provider value={h + 8 + extra}>
      <svg className="diagram" viewBox={`0 0 360 ${h + 20 + padTop + extra}`} role="img" aria-label={title}>
        <title>{title}</title>
        {padTop ? <g transform={`translate(0 ${padTop})`}>{body}</g> : body}
      </svg>
    </CaptionY.Provider>
  )
})

/** the supply current: an arrow beside the source's wire (leaving the + terminal upwards) with its value written alongside, reading upwards */
export const SourceCurrent = ({ x, y, text, signed }: { x: number; y: number; text: string; signed?: number }) => (
  <g data-testid="source-current">
    <FlowBeside x={x} y={y} dir="up" side={-1} gap={17} len={18} name="supply" signed={signed} w={2.8} />
    <text x={x - 30} y={y} fontSize={9} fontWeight={700} fill="var(--hot)" textAnchor="middle" transform={`rotate(-90 ${x - 30} ${y})`}>{text}</text>
  </g>
)

type Color = 'ink' | 'muted' | 'accent' | 'hot' | 'good' | 'bad'
const col = (c: Color) => `var(--${c})`

export const Wire = ({ d, c = 'ink', w = 2, dash }: { d: string; c?: Color; w?: number; dash?: string }) => (
  <path data-wire="" d={d} fill="none" stroke={col(c)} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />
)
/* ── current-flow direction ─────────────────────────────────────────────────────────────
   Conventional current leaves the + terminal and returns to −. Electron flow is the opposite.
   Diagrams give the CONVENTIONAL direction of each arrow; FlowArrow flips it in electron mode
   (and when the calculated current is negative, e.g. a source being charged in the Millman problem). */
export type FlowMode = 'conventional' | 'electron'
export const FlowContext = createContext<FlowMode>('conventional')
export type Dir = 'right' | 'left' | 'down' | 'up'
const VEC: Record<Dir, [number, number]> = { right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1] }
const OPPOSITE: Record<Dir, Dir> = { right: 'left', left: 'right', down: 'up', up: 'down' }
export const useFlowDir = (dir: Dir, signed = 1): Dir => {
  const mode = useContext(FlowContext)
  const flip = (mode === 'electron') !== (signed < 0)
  return flip ? OPPOSITE[dir] : dir
}
export const FlowArrow = ({ x, y, dir, len = 18, signed = 1, c = 'hot', w = 2.2, name, offset }: { x: number; y: number; dir: Dir; len?: number; signed?: number; c?: Color; w?: number; name?: string; offset?: number }) => {
  const d = useFlowDir(dir, signed)
  const [dx, dy] = VEC[d]
  const h = len / 2
  return (
    <g data-testid="flow-arrow" data-dir={d} data-part={name} data-offset={offset}>
      <Arrow x1={x - dx * h} y1={y - dy * h} x2={x + dx * h} y2={y + dy * h} c={c} w={w} />
    </g>
  )
}

/** Distance (SVG units) between a wire and its current arrow: ≈ 15–24 px on screen, so the arrow never sits ON the line. */
export const FLOW_GAP = 17
/**
 * A current arrow drawn NEXT TO a wire, not on it. (x, y) is a point on the wire; the arrow is moved `gap` units sideways
 * (perpendicular to the direction of flow). side −1 = left of / above the wire, +1 = right of / below it.
 */
export const FlowBeside = ({ x, y, dir, side = 1, gap = FLOW_GAP, ...rest }: { x: number; y: number; dir: Dir; side?: 1 | -1; gap?: number; len?: number; signed?: number; c?: Color; w?: number; name?: string }) => {
  const vertical = dir === 'up' || dir === 'down'
  return <FlowArrow x={vertical ? x + side * gap : x} y={vertical ? y : y + side * gap} dir={dir} offset={gap} {...rest} />
}

export const Dot = ({ x, y, r = 3, c = 'ink' }: { x: number; y: number; r?: number; c?: Color }) => <circle cx={x} cy={y} r={r} fill={col(c)} />
export const Txt = ({ x, y, children, size = 11, anchor = 'middle', c = 'ink', bold, italic }: { x: number; y: number; children: ReactNode; size?: number; anchor?: 'start' | 'middle' | 'end'; c?: Color; bold?: boolean; italic?: boolean }) => (
  <text x={x} y={y} fontSize={size} textAnchor={anchor} fill={col(c)} fontWeight={bold ? 700 : 400} fontStyle={italic ? 'italic' : undefined}>{children}</text>
)
export const Rect = ({ x, y, w, h, c = 'accent', fill = 'soft', r = 3, sw = 1.5 }: { x: number; y: number; w: number; h: number; c?: Color; fill?: string; r?: number; sw?: number }) => (
  <rect x={x} y={y} width={w} height={h} rx={r} fill={fill === 'none' ? 'none' : `var(--${fill})`} stroke={col(c)} strokeWidth={sw} />
)
export const Arrow = ({ x1, y1, x2, y2, c = 'accent', w = 2 }: { x1: number; y1: number; x2: number; y2: number; c?: Color; w?: number }) => {
  const a = Math.atan2(y2 - y1, x2 - x1)
  const s = 6
  const p1 = [x2 - s * Math.cos(a - 0.45), y2 - s * Math.sin(a - 0.45)]
  const p2 = [x2 - s * Math.cos(a + 0.45), y2 - s * Math.sin(a + 0.45)]
  return (
    <g stroke={col(c)} strokeWidth={w} strokeLinecap="round" fill={col(c)}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <polygon points={`${x2},${y2} ${p1.join(',')} ${p2.join(',')}`} stroke="none" />
    </g>
  )
}

export type Kind = 'R' | 'C' | 'L' | 'V' | 'D' | 'LED' | 'Z' | 'AC' | 'box' | 'I' | 'NTC' | 'sw'

/** Two-terminal component drawn from (x1,y1) to (x2,y2); label sits beside it. */
export const Two = ({ kind, x1, y1, x2, y2, label, value, c = 'ink', side = 1, hot }: { kind: Kind; x1: number; y1: number; x2: number; y2: number; label?: string; value?: string; c?: Color; side?: 1 | -1; hot?: boolean }) => {
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.hypot(dx, dy)
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI
  const mid = len / 2
  const stroke = hot ? col('hot') : col(c)
  const sw = 2
  const lead = (a: number, b: number) => <line x1={a} y1={0} x2={b} y2={0} stroke={col('ink')} strokeWidth={sw} strokeLinecap="round" />
  let body: ReactNode
  switch (kind) {
    case 'R': {
      const bw = Math.min(32, len * 0.6)
      const x0 = mid - bw / 2
      const n = 6
      const pts = [`${x0},0`]
      for (let i = 0; i < n; i++) pts.push(`${x0 + (bw / n) * (i + 0.5)},${i % 2 === 0 ? -7 : 7}`)
      pts.push(`${x0 + bw},0`)
      body = <>{lead(0, x0)}{lead(x0 + bw, len)}<polyline points={pts.join(' ')} fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" /></>
      break
    }
    case 'box': {
      const bw = Math.min(34, len * 0.6)
      body = <>{lead(0, mid - bw / 2)}{lead(mid + bw / 2, len)}<rect x={mid - bw / 2} y={-8} width={bw} height={16} fill="var(--soft)" stroke={stroke} strokeWidth={sw} strokeDasharray="4 2" rx="2" /><text x={mid} y={4} fontSize="11" textAnchor="middle" fill={stroke} fontWeight="700" transform={`rotate(${-ang} ${mid} 0)`}>?</text></>
      break
    }
    case 'NTC': {
      const bw = Math.min(34, len * 0.6)
      body = <>{lead(0, mid - bw / 2)}{lead(mid + bw / 2, len)}<rect x={mid - bw / 2} y={-7} width={bw} height={14} fill="none" stroke={stroke} strokeWidth={sw} /><line x1={mid - bw / 2 - 4} y1={11} x2={mid + bw / 2 + 4} y2={-11} stroke={stroke} strokeWidth={sw} /></>
      break
    }
    case 'C':
      body = <>{lead(0, mid - 4)}{lead(mid + 4, len)}<line x1={mid - 4} y1={-12} x2={mid - 4} y2={12} stroke={stroke} strokeWidth={3} /><line x1={mid + 4} y1={-12} x2={mid + 4} y2={12} stroke={stroke} strokeWidth={3} /></>
      break
    case 'L': {
      const bw = Math.min(40, len * 0.65)
      const x0 = mid - bw / 2
      const n = 4
      const r = bw / n / 2
      let d = `M ${x0} 0`
      for (let i = 0; i < n; i++) d += ` a ${r} ${r} 0 0 1 ${2 * r} 0`
      body = <>{lead(0, x0)}{lead(x0 + bw, len)}<path d={d} fill="none" stroke={stroke} strokeWidth={sw} /></>
      break
    }
    case 'V':
      body = <>{lead(0, mid - 3)}{lead(mid + 3, len)}<line x1={mid - 3} y1={-11} x2={mid - 3} y2={11} stroke={stroke} strokeWidth={3} /><line x1={mid + 3} y1={-6} x2={mid + 3} y2={6} stroke={stroke} strokeWidth={3} /><text x={mid - 11} y={-6} fontSize="10" fill={col('muted')} textAnchor="middle">+</text></>
      break
    case 'AC':
      body = <>{lead(0, mid - 11)}{lead(mid + 11, len)}<circle cx={mid} cy={0} r={11} fill="var(--paper)" stroke={stroke} strokeWidth={sw} /><path d={`M ${mid - 7} 0 q 3.5 -8 7 0 t 7 0`} fill="none" stroke={stroke} strokeWidth="1.6" /></>
      break
    case 'I':
      body = <>{lead(0, mid - 11)}{lead(mid + 11, len)}<circle cx={mid} cy={0} r={11} fill="var(--paper)" stroke={stroke} strokeWidth={sw} /><line x1={mid - 6} y1={0} x2={mid + 6} y2={0} stroke={stroke} strokeWidth="1.6" /><polygon points={`${mid + 6},0 ${mid + 1},-3 ${mid + 1},3`} fill={stroke} /></>
      break
    case 'sw':
      body = <>{lead(0, mid - 12)}{lead(mid + 12, len)}<line x1={mid - 12} y1={0} x2={mid + 10} y2={-12} stroke={stroke} strokeWidth={sw} /><circle cx={mid - 12} cy={0} r={2.5} fill={stroke} /><circle cx={mid + 12} cy={0} r={2.5} fill={stroke} /></>
      break
    case 'D':
    case 'LED':
    case 'Z':
      body = <>{lead(0, mid - 7)}{lead(mid + 7, len)}<polygon points={`${mid - 7},-9 ${mid - 7},9 ${mid + 7},0`} fill={kind === 'LED' ? 'var(--soft)' : 'none'} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        <path d={kind === 'Z' ? `M ${mid + 11} 9 L ${mid + 7} 9 L ${mid + 7} -9 L ${mid + 3} -9` : `M ${mid + 7} -9 L ${mid + 7} 9`} fill="none" stroke={stroke} strokeWidth={sw} />
        {kind === 'LED' && <><Arrow x1={mid - 2} y1={-12} x2={mid + 8} y2={-22} c="hot" w={1.4} /><Arrow x1={mid + 4} y1={-9} x2={mid + 14} y2={-19} c="hot" w={1.4} /></>}</>
      break
  }
  const vertical = Math.abs(Math.abs(ang) - 90) < 1
  const mx = x1 + dx / 2, my = y1 + dy / 2
  return (
    <g data-kind={kind} data-plus-y={kind === 'V' ? y1 : undefined} data-minus-y={kind === 'V' ? y2 : undefined} data-vertical={kind === 'V' ? String(vertical) : undefined}>
      <g transform={`translate(${x1} ${y1}) rotate(${ang})`}>{body}</g>
      {(label || value) && (
        vertical
          ? <g><text x={mx + side * 20} y={my - (value ? 2 : -4)} fontSize="11" textAnchor={side > 0 ? 'start' : 'end'} fill={col(c)} fontWeight="700">{label}</text>{value && <text x={mx + side * 20} y={my + 11} fontSize="10.5" textAnchor={side > 0 ? 'start' : 'end'} fill={col('muted')}>{value}</text>}</g>
          : <g><text x={mx} y={my - side * 14 - (value ? 13 : 0) + (side < 0 ? 22 : 0)} fontSize="11" textAnchor="middle" fill={col(c)} fontWeight="700">{label}</text>{value && <text x={mx} y={my - side * 14 + (side < 0 ? 22 : 0)} fontSize="10.5" textAnchor="middle" fill={col('muted')}>{value}</text>}</g>
      )}
    </g>
  )
}

export const Ground = ({ x, y }: { x: number; y: number }) => (
  <g stroke="var(--ink)" strokeWidth="2" strokeLinecap="round">
    <line x1={x} y1={y} x2={x} y2={y + 6} />
    <line x1={x - 9} y1={y + 6} x2={x + 9} y2={y + 6} />
    <line x1={x - 5.5} y1={y + 10} x2={x + 5.5} y2={y + 10} />
    <line x1={x - 2} y1={y + 14} x2={x + 2} y2={y + 14} />
  </g>
)

/** Simple function plot. xlog/ylog optional; marker draws a point and guides. */
export const Plot = ({
  x0 = 40, y0 = 10, w = 300, h = 130, xmin, xmax, ymin, ymax, fn: f, xlog, ylog, marker, xlabel, ylabel, xticks, yticks, c = 'accent', fill, extra, n = 120,
}: {
  x0?: number; y0?: number; w?: number; h?: number; xmin: number; xmax: number; ymin: number; ymax: number; fn: (x: number) => number
  xlog?: boolean; ylog?: boolean; marker?: { x: number; y: number; label?: string }; xlabel?: string; ylabel?: string
  xticks?: Array<[number, string]>; yticks?: Array<[number, string]>; c?: Color; fill?: boolean; extra?: ReactNode; n?: number
}) => {
  const tx = (x: number) => x0 + ((xlog ? Math.log10(x) - Math.log10(xmin) : x - xmin) / (xlog ? Math.log10(xmax) - Math.log10(xmin) : xmax - xmin)) * w
  const ty = (y: number) => y0 + h - ((ylog ? Math.log10(y) - Math.log10(ymin) : y - ymin) / (ylog ? Math.log10(ymax) - Math.log10(ymin) : ymax - ymin)) * h
  const pts: string[] = []
  for (let i = 0; i <= n; i++) {
    const x = xlog ? 10 ** (Math.log10(xmin) + ((Math.log10(xmax) - Math.log10(xmin)) * i) / n) : xmin + ((xmax - xmin) * i) / n
    const y = f(x)
    if (!Number.isFinite(y)) continue
    pts.push(`${tx(x).toFixed(1)},${Math.min(y0 + h + 40, Math.max(y0 - 40, ty(y))).toFixed(1)}`)
  }
  const mxp = marker ? tx(marker.x) : 0
  const myp = marker ? ty(marker.y) : 0
  return (
    <g>
      <line x1={x0} y1={y0 + h} x2={x0 + w} y2={y0 + h} stroke="var(--muted)" strokeWidth="1.2" />
      <line x1={x0} y1={y0} x2={x0} y2={y0 + h} stroke="var(--muted)" strokeWidth="1.2" />
      {xticks?.map(([x, l]) => <g key={`x${l}`}><line x1={tx(x)} y1={y0 + h} x2={tx(x)} y2={y0 + h + 4} stroke="var(--muted)" /><text x={tx(x)} y={y0 + h + 15} fontSize="9.5" textAnchor="middle" fill="var(--muted)">{l}</text></g>)}
      {yticks?.map(([y, l]) => <g key={`y${l}`}><line x1={x0 - 4} y1={ty(y)} x2={x0} y2={ty(y)} stroke="var(--muted)" /><line x1={x0} y1={ty(y)} x2={x0 + w} y2={ty(y)} stroke="var(--muted)" strokeOpacity="0.2" /><text x={x0 - 6} y={ty(y) + 3} fontSize="9.5" textAnchor="end" fill="var(--muted)">{l}</text></g>)}
      {fill && <polygon points={`${tx(xmin)},${y0 + h} ${pts.join(' ')} ${tx(xmax)},${y0 + h}`} fill="var(--soft)" />}
      <polyline points={pts.join(' ')} fill="none" stroke={col(c)} strokeWidth="2.4" strokeLinejoin="round" />
      {extra}
      {marker && Number.isFinite(mxp) && Number.isFinite(myp) && (
        <g>
          <line x1={mxp} y1={y0 + h} x2={mxp} y2={myp} stroke="var(--hot)" strokeDasharray="3 3" />
          <line x1={x0} y1={myp} x2={mxp} y2={myp} stroke="var(--hot)" strokeDasharray="3 3" />
          <circle cx={mxp} cy={myp} r="4.5" fill="var(--hot)" />
          {marker.label && <text x={mxp > x0 + w * 0.6 ? mxp - 8 : mxp + 8} y={myp < y0 + 24 ? myp + 18 : myp - 8} fontSize="10.5" fill="var(--hot)" fontWeight="700" textAnchor={mxp > x0 + w * 0.6 ? 'end' : 'start'} paintOrder="stroke" stroke="var(--paper)" strokeWidth="3">{marker.label}</text>}
        </g>
      )}
      {xlabel && <text x={x0 + w / 2} y={y0 + h + 28} fontSize="10.5" textAnchor="middle" fill="var(--muted)">{xlabel}</text>}
      {ylabel && <text x={12} y={y0 + h / 2} fontSize="10.5" textAnchor="middle" fill="var(--muted)" transform={`rotate(-90 12 ${y0 + h / 2})`}>{ylabel}</text>}
    </g>
  )
}

/** Caption sits in a strip below the drawing (Diagram adds the space) */
export const Caption = ({ children }: { children: ReactNode }) => {
  const y = useContext(CaptionY)
  const thumb = useContext(ThumbContext)
  if (thumb) return null
  return <Txt x={180} y={y + 8} size={10.5} c="muted">{children}</Txt>
}
