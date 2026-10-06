import { useMemo, useState, type ComponentType } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import LinearProgress from '@mui/material/LinearProgress'
import Slider from '@mui/material/Slider'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { COLOUR_NAMES, COLOURS, decodeBands, encodeBands } from '../core/colorcode.ts'
import { decodeCapacitor3, decodeResistor3, parseRKM, SHORTCUTS } from '../core/markings.ts'
import { liIonSoc } from '../core/soc.ts'
import { fmtNum, fmtSI } from '../core/units.ts'
import { QuantityInput, type Entry } from './QuantityInput.tsx'
import { parseNumber } from './input.ts'
import { Row } from './layout.tsx'
import { ScrollX } from './ScrollX.tsx'
import { BAND_COLORS, ResistorBands, SeriesParallelTable } from '../visuals/basic.tsx'
import { Diagram, Rect, Txt } from '../visuals/kit.tsx'
import { PrefixLadder } from '../visuals/basic.tsx'
import { field } from '../core/define.ts'

const PREFIXES: Array<[string, number]> = [['G', 1e9], ['M', 1e6], ['k', 1e3], ['(none)', 1], ['m', 1e-3], ['µ', 1e-6], ['n', 1e-9], ['p', 1e-12]]

function ColourCodeTool() {
  const [n, setN] = useState<4 | 5>(4)
  const [bands, setBands] = useState<string[]>(['brown', 'black', 'red', 'gold'])
  const used = bands.slice(0, n)
  const set = (i: number, c: string) => setBands((b) => b.map((x, j) => (j === i ? c : x)))
  const change = (k: 4 | 5) => { setN(k); setBands(k === 4 ? ['brown', 'black', 'red', 'gold'] : ['brown', 'black', 'black', 'brown', 'brown']) }
  const res = decodeBands(used)
  const roles = n === 4 ? ['Digit 1', 'Digit 2', 'Multiplier', 'Tolerance'] : ['Digit 1', 'Digit 2', 'Digit 3', 'Multiplier', 'Tolerance']
  const allowed = (i: number) => COLOUR_NAMES.filter((c) => (i < n - 2 ? COLOURS[c]!.digit !== undefined : i === n - 2 ? COLOURS[c]!.multiplier !== undefined : COLOURS[c]!.tolerance !== undefined))
  const [valText, setValText] = useState<Entry>({ text: '', unit: 'Ω' })
  const want = parseNumber(valText.text)
  const factor = valText.unit === 'kΩ' ? 1e3 : valText.unit === 'MΩ' ? 1e6 : valText.unit === 'mΩ' ? 1e-3 : 1
  const enc = want !== undefined && !Number.isNaN(want) ? encodeBands(want * factor, n === 4 ? 2 : 3, 5) : undefined
  return (
    <Stack spacing={2}>
      <Card variant="outlined"><CardContent>
        <Typography component="h2" variant="h3" gutterBottom>Bands → value</Typography>
        <ToggleButtonGroup exclusive value={n} onChange={(_, v: 4 | 5 | null) => v && change(v)} aria-label="Number of bands" size="small" sx={{ mb: 2 }}>
          <ToggleButton value={4}>4 bands</ToggleButton><ToggleButton value={5}>5 bands</ToggleButton>
        </ToggleButtonGroup>
        <ResistorBands bands={used} />
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr 1fr', sm: `repeat(${n}, 1fr)` }, mt: 1 }}>
          {used.map((b, i) => (
            <TextField key={i} select label={roles[i]} value={b} onChange={(e) => set(i, e.target.value)} slotProps={{ select: { native: true }, htmlInput: { 'data-testid': `band-${i}` } }}>
              {allowed(i).map((c) => <option key={c} value={c}>{c}</option>)}
            </TextField>
          ))}
        </Box>
        <Box sx={{ mt: 2 }} aria-live="polite" data-testid="colour-result">
          {res.ok ? <Typography sx={{ fontSize: '1.6rem', fontWeight: 700 }}>{fmtSI('resistance', res.ohms)} ±{res.tolerance}%</Typography> : <Alert severity="error">{res.error}</Alert>}
        </Box>
        <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }} aria-hidden="true">{COLOUR_NAMES.map((c) => <Box key={c} title={c} sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: BAND_COLORS[c], border: '1px solid #0004' }} />)}</Box>
      </CardContent></Card>
      <Card variant="outlined"><CardContent>
        <Typography component="h2" variant="h3" gutterBottom>Value → bands ({n} bands, ±5%)</Typography>
        <QuantityInput field={field('r', 'R', 'Resistance', 'resistance', { sign: 'pos' })} entry={valText} rowId="colour-value" onChange={(_, e) => setValText(e)} testId="colour-value" />
        {want !== undefined && (enc ? <><ResistorBands bands={enc} /><Typography data-testid="colour-bands">{enc.join(' – ')}</Typography></> : <Alert severity="warning">That value cannot be written with {n} bands (±5%). Try {n === 4 ? '5' : '4'} bands.</Alert>)}
      </CardContent></Card>
      <Card variant="outlined"><CardContent>
        <Typography component="h2" variant="h3" gutterBottom>Colour table</Typography>
        <ScrollX label="Resistor colour code (scrolls sideways)"><Table size="small" aria-label="Resistor colour code"><TableHead><TableRow><TableCell>Colour</TableCell><TableCell>Digit</TableCell><TableCell>Multiplier</TableCell><TableCell>Tolerance</TableCell></TableRow></TableHead><TableBody>
          {COLOUR_NAMES.map((c) => { const i = COLOURS[c]!; return <TableRow key={c}><TableCell><Row gap={1}><Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: BAND_COLORS[c], border: '1px solid #0004' }} />{c}</Row></TableCell><TableCell>{i.digit ?? '—'}</TableCell><TableCell>{i.multiplier === undefined ? '—' : `×${fmtNum(i.multiplier)}`}</TableCell><TableCell>{i.tolerance === undefined ? '—' : `±${i.tolerance}%`}</TableCell></TableRow> })}
        </TableBody></Table></ScrollX>
        <Typography variant="body2" sx={{ mt: 1 }}>4-band: digit, digit, multiplier, tolerance. Brown-black-red-gold = 1, 0, ×100, ±5% → 1000 Ω = 1 kΩ ±5%. 5-band: digit, digit, digit, multiplier, tolerance.</Typography>
      </CardContent></Card>
    </Stack>
  )
}

function UnitsTool() {
  const [v, setV] = useState('4.7')
  const [from, setFrom] = useState('k')
  const [to, setTo] = useState('(none)')
  const [code, setCode] = useState('4k7')
  const [kind, setKind] = useState<'rkm' | 'r3' | 'c3'>('rkm')
  const f = PREFIXES.find(([p]) => p === from)![1], t = PREFIXES.find(([p]) => p === to)![1]
  const x = parseNumber(v)
  const out = x !== undefined && !Number.isNaN(x) ? (x * f) / t : undefined
  const parsed = useMemo(() => (kind === 'rkm' ? parseRKM(code) : kind === 'r3' ? decodeResistor3(code) : decodeCapacitor3(code)), [kind, code])
  return (
    <Stack spacing={2}>
      <Card variant="outlined"><CardContent>
        <Typography component="h2" variant="h3" gutterBottom>Prefix converter</Typography>
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr 1fr', sm: '2fr 1fr 1fr' } }}>
          <TextField label="Value" value={v} onChange={(e) => setV(e.target.value)} slotProps={{ htmlInput: { inputMode: 'decimal', 'data-testid': 'prefix-value' } }} sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' } }} />
          <TextField select label="From" value={from} onChange={(e) => setFrom(e.target.value)} slotProps={{ select: { native: true }, htmlInput: { 'data-testid': 'prefix-from' } }}>{PREFIXES.map(([p]) => <option key={p}>{p}</option>)}</TextField>
          <TextField select label="To" value={to} onChange={(e) => setTo(e.target.value)} slotProps={{ select: { native: true }, htmlInput: { 'data-testid': 'prefix-to' } }}>{PREFIXES.map(([p]) => <option key={p}>{p}</option>)}</TextField>
        </Box>
        <Typography sx={{ mt: 2, fontSize: '1.5rem', fontWeight: 700 }} aria-live="polite" data-testid="prefix-result">{out === undefined ? 'Enter a number' : `${fmtNum(x!)} ${from === '(none)' ? '' : from} = ${fmtNum(out)} ${to === '(none)' ? '' : to}`.replace(/\s+/g, ' ')}</Typography>
        <Typography variant="body2" color="text.secondary">Each step G → M → k → (base) → m → µ → n → p is ×1000. To a smaller prefix multiply; to a bigger one divide.</Typography>
      </CardContent></Card>
      <Card variant="outlined"><CardContent><PrefixLadder /></CardContent></Card>
      <Card variant="outlined"><CardContent>
        <Typography component="h2" variant="h3" gutterBottom>When do you actually need to convert?</Typography>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
          <Alert severity="success" icon={false}><strong>No conversion needed — like with like</strong><br />Series resistors: 1 kΩ + 2 kΩ = 3 kΩ<br />Parallel: (1 kΩ × 2 kΩ)/(1 kΩ + 2 kΩ) = 0.667 kΩ<br />Capacitors: 10 µF + 22 µF in parallel = 32 µF; 10 µF and 10 µF in series = 5 µF<br />Inductors: 10 µH + 22 µH in series = 32 µH<br />Ratios (divider, dB, duty cycle): units cancel completely.</Alert>
          <Alert severity="warning" icon={false}><strong>CONVERT FIRST — mixed prefixes or different quantities</strong><br />1 kΩ + 470 Ω → 1000 Ω + 470 Ω = 1470 Ω (not 471!)<br />1 µF + 470 nF → 1000 nF + 470 nF = 1470 nF<br />Different quantities multiplied or divided (V = I × R, τ = R × C, XC, f0): prefixes don't cancel — convert to base units or use a shortcut pair below.</Alert>
        </Box>
      </CardContent></Card>
      <Card variant="outlined"><CardContent>
        <Typography component="h2" variant="h3" gutterBottom>Shortcut unit pairs</Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>No conversion needed if you stay inside a pair.</Typography>
        <ScrollX label="Shortcut unit pairs (scrolls sideways)"><Table size="small" aria-label="Shortcut unit pairs"><TableHead><TableRow><TableCell>You combine</TableCell><TableCell>You get</TableCell><TableCell>Example</TableCell></TableRow></TableHead><TableBody>
          {SHORTCUTS.map((s) => <TableRow key={s.you}><TableCell>{s.you}</TableCell><TableCell>{s.get}</TableCell><TableCell>{s.example}</TableCell></TableRow>)}
        </TableBody></Table></ScrollX>
      </CardContent></Card>
      <Card variant="outlined"><CardContent>
        <Typography component="h2" variant="h3" gutterBottom>Part markings decoder</Typography>
        <ToggleButtonGroup exclusive size="small" value={kind} onChange={(_, k: typeof kind | null) => { if (k) { setKind(k); setCode(k === 'rkm' ? '4k7' : k === 'r3' ? '103' : '104') } }} aria-label="Marking type" sx={{ mb: 2, flexWrap: 'wrap' }}>
          <ToggleButton value="rkm">R / k / M notation</ToggleButton><ToggleButton value="r3">3-digit resistor</ToggleButton><ToggleButton value="c3">3-digit capacitor</ToggleButton>
        </ToggleButtonGroup>
        <TextField label="Marking on the part" value={code} onChange={(e) => setCode(e.target.value)} fullWidth slotProps={{ htmlInput: { 'data-testid': 'marking-input' } }} />
        <Box aria-live="polite" sx={{ mt: 2 }} data-testid="marking-result">
          {parsed.ok ? <Typography sx={{ fontSize: '1.4rem', fontWeight: 700 }}>{parsed.text} → {fmtSI(parsed.unit === 'F' ? 'capacitance' : 'resistance', parsed.value)}</Typography> : <Alert severity="error">{parsed.error}</Alert>}
        </Box>
        <Typography variant="body2" sx={{ mt: 1 }}>R/k/M notation: the letter is the decimal point — 4k7 = 4.7 kΩ, 2M2 = 2.2 MΩ, R47 = 0.47 Ω. 3-digit codes: two digits + number of zeros. Resistor "103" = 10 kΩ. Capacitors are in pF: "104" = 100 000 pF = 100 nF; "472" = 4.7 nF.</Typography>
      </CardContent></Card>
    </Stack>
  )
}

function SocTool() {
  const [volts, setVolts] = useState(3.7)
  const soc = liIonSoc(volts)
  return (
    <Card variant="outlined"><CardContent>
      <Typography component="h2" variant="h3" gutterBottom>Li-ion state of charge (rough)</Typography>
      <Typography id="soc-label" gutterBottom>Resting (no-load) cell voltage: <strong data-testid="soc-volts">{volts.toFixed(2)} V</strong></Typography>
      <Slider value={volts} min={2.8} max={4.3} step={0.01} onChange={(_, v) => setVolts(v as number)} aria-labelledby="soc-label" valueLabelDisplay="auto" slotProps={{ input: { 'data-testid': 'soc-slider' } as object }} />
      <Diagram title={`Battery gauge showing about ${fmtNum(soc, 3)} percent charge`} h={90}>
        <Rect x={40} y={20} w={250} h={50} c="ink" fill="none" r={8} sw={3} /><Rect x={290} y={34} w={14} h={22} c="ink" fill="none" r={3} sw={3} />
        <rect x={46} y={26} width={Math.max(0, (238 * soc) / 100)} height={38} rx={5} fill={soc < 20 ? 'var(--bad)' : soc < 50 ? 'var(--hot)' : 'var(--good)'} />
        <Txt x={165} y={50} bold size={14} c="ink">{fmtNum(soc, 3)}%</Txt>
      </Diagram>
      <LinearProgress variant="determinate" value={soc} sx={{ height: 14, borderRadius: 7, my: 1 }} aria-label="Estimated charge" />
      <Typography sx={{ fontSize: '1.8rem', fontWeight: 700 }} aria-live="polite" data-testid="soc-result">≈ {fmtNum(soc, 3)} %</Typography>
      <Alert severity={volts <= 3.0 ? 'error' : 'info'} sx={{ mt: 1 }}>Rough Li-ion values — 4.2 V ≈ full, 3.7 V ≈ half, 3.0 V ≈ empty (don't go lower). Read the real value from your chemistry's discharge curve; this estimate interpolates those three points.</Alert>
    </CardContent></Card>
  )
}

const STEPS: Array<[string, string, string]> = [
  ['Draw the circuit. Mark every known value and the unknown.', 'Makes series and parallel groups visible.', '1'],
  ['Total resistance seen by the source: Rt = V / Itotal.', 'Ohm\'s law applied to the whole circuit.', '2'],
  ['Work from the source toward the unknown. For each known part find its voltage (series) or current (parallel).', 'Series parts carry the full current; parallel parts see the full voltage.', '3'],
  ['Subtract: remaining voltage (KVL) or remaining current (KCL) belongs to the unknown part.', 'What isn\'t used by known parts must go through the unknown.', '4'],
  ['Unknown R = V across it ÷ I through it.', 'Ohm\'s law applied to the unknown alone.', '5'],
  ['Check: put the result back and recompute Rt or Itotal.', 'Catches unit and arithmetic mistakes.', '6'],
]
function MethodTool() {
  return (
    <Stack spacing={2}>
      <Card variant="outlined"><CardContent><SeriesParallelTable />
        <ScrollX label="Series versus parallel (scrolls sideways)"><Table size="small" aria-label="Series versus parallel"><TableHead><TableRow><TableCell /><TableCell>Series — one path, end to end</TableCell><TableCell>Parallel — across the same two points</TableCell></TableRow></TableHead><TableBody>
          <TableRow><TableCell component="th">Current</TableCell><TableCell>Same through every component</TableCell><TableCell>Splits between branches: I = I1 + I2 + … (KCL)</TableCell></TableRow>
          <TableRow><TableCell component="th">Voltage</TableCell><TableCell>Splits between components: V = V1 + V2 + … (KVL)</TableCell><TableCell>Same across every branch</TableCell></TableRow>
          <TableRow><TableCell component="th">Resistance</TableCell><TableCell>Adds: Rt = R1 + R2 + …</TableCell><TableCell>Reciprocals add: 1/Rt = 1/R1 + 1/R2 + …</TableCell></TableRow>
          <TableRow><TableCell component="th">Total vs parts</TableCell><TableCell>Total is larger than any part</TableCell><TableCell>Total is smaller than any branch</TableCell></TableRow>
        </TableBody></Table></ScrollX>
      </CardContent></Card>
      <Card variant="outlined"><CardContent>
        <Typography component="h2" variant="h3" gutterBottom>General method for any unknown component</Typography>
        <Box component="ol" sx={{ pl: 3, m: 0 }}>{STEPS.map(([what, why]) => <li key={what}><Typography><strong>{what}</strong> <Typography component="span" color="text.secondary">— {why}</Typography></Typography></li>)}</Box>
        <Typography sx={{ mt: 2 }}><strong>Two equivalent routes:</strong> Method A follows currents and voltages branch by branch (easy to check with a multimeter). Method B reduces the circuit to one equivalent resistance and then removes the known parts from it. Both give the same answer — each guided problem below offers both where they exist.</Typography>
      </CardContent></Card>
    </Stack>
  )
}

export const TOOLS: Record<string, ComponentType> = { colorcode: ColourCodeTool, units: UnitsTool, soc: SocTool, method: MethodTool }
