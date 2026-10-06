import { useCallback, useMemo, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import { Row } from './layout.tsx'
import Typography from '@mui/material/Typography'
import { DEFAULT_LIST_MAX, evaluate, fieldOf, modeLabel, modeOf } from '../core/engine.ts'
import type { Field, Formula } from '../core/types.ts'
import { baseUnit, bestUnit, fmtNum, fmtSI, findUnit, toBase, toInputText } from '../core/units.ts'
import { FLOW_VISUALS, VISUALS } from '../visuals/index.ts'
import { FlowContext, type FlowMode } from '../visuals/kit.tsx'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { parseNumber } from './input.ts'
import { AnchorCard } from './anchors.tsx'
import { Breakdown } from './Breakdown.tsx'
import { ModeTabs } from './ModeTabs.tsx'
import { QuantityInput, type Entry } from './QuantityInput.tsx'

const emptyEntry = (f: Field): Entry => ({ text: '', unit: baseUnit(f.dim).label })
/** "R1…Rn" → "R" so list rows read R1, R2, R3 */
const listBase = (f: Field) => (f.symbol.split('…')[0] ?? f.symbol).replace(/\d+$/, '')
const listSize = (f: Field) => f.listMin ?? 2

/** Convert an entry to a base-unit number. undefined = empty, NaN = invalid text. */
const toBaseValue = (f: Field, e: Entry): number | undefined => {
  const n = parseNumber(e.text)
  return n === undefined ? undefined : toBase(f.dim, n, e.unit)
}

/** A base-unit value as an Entry using the friendliest unit. */
const entryFor = (f: Field, x: number): Entry => {
  const u = bestUnit(f.dim, x)
  return { text: toInputText(x / u.factor), unit: u.label }
}

const readFlow = (): FlowMode => { try { return localStorage.getItem('flow') === 'electron' ? 'electron' : 'conventional' } catch { return 'conventional' } }

export function Calculator({ formula }: { formula: Formula }) {
  const [flow, setFlowState] = useState<FlowMode>(readFlow)
  const setFlow = (f: FlowMode) => { setFlowState(f); try { localStorage.setItem('flow', f) } catch { /* private mode */ } }
  const [modeId, setModeId] = useState(formula.modes[0]!.id)
  const [entries, setEntries] = useState<Record<string, Entry>>({})
  const [lists, setLists] = useState<Record<string, Entry[]>>({})
  const [copied, setCopied] = useState(false)

  const mode = modeOf(formula, modeId)
  const tabs = useMemo(() => formula.modes.map((m) => ({ id: m.id, label: modeLabel(formula, m) })), [formula])

  /** one shared empty entry per field (entries are replaced, never mutated), so untouched rows keep identical props */
  const empties = useMemo(() => Object.fromEntries(formula.fields.map((f) => [f.key, emptyEntry(f)])) as Record<string, Entry>, [formula])
  /** rows of a list input padded to the minimum count — pure, so it is safe inside state updaters */
  const padRows = (k: string, have: Entry[] | undefined): Entry[] => {
    const f = fieldOf(formula, k)
    const h = have ?? []
    return h.length >= listSize(f) ? h : [...h, ...Array.from({ length: listSize(f) - h.length }, () => empties[k]!)]
  }
  const rowsOf = (k: string): Entry[] => padRows(k, lists[k])

  /** one stable change-handler for every input row, so memoised rows that did not change are not re-rendered */
  const onEntry = useCallback((rowId: string, e: Entry) => {
    const [key, idx] = rowId.split(':') as [string, string | undefined]
    if (idx === undefined) setEntries((p) => ({ ...p, [key]: e }))
    else setLists((p) => ({ ...p, [key]: padRows(key, p[key]).map((x, j) => (j === Number(idx) ? e : x)) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formula])
  /** list-row field without the long description (built once per field, not on every render) */
  const rowFields = useMemo(() => Object.fromEntries(formula.fields.filter((f) => f.list).map((f) => [f.key, { ...f, description: undefined }])), [formula])

  const parsed = useMemo(() => {
    const values: Record<string, number | undefined> = {}
    const lv: Record<string, Array<number | undefined>> = {}
    const badText: Record<string, string> = {}
    for (const k of mode.inputs) {
      const f = fieldOf(formula, k)
      if (f.list) {
        lv[k] = rowsOf(k).map((e) => toBaseValue(f, e))
        if (lv[k]!.some((x) => x !== undefined && Number.isNaN(x))) badText[k] = 'Enter plain numbers (e.g. 4.7 or 1e-3)'
      } else {
        const x = entries[k] ? toBaseValue(f, entries[k]!) : undefined
        values[k] = x
        if (x !== undefined && Number.isNaN(x)) badText[k] = 'Enter a plain number (e.g. 4.7 or 1e-3)'
      }
    }
    return { values, lists: lv, badText }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, lists, formula, mode])

  const result = useMemo(() => evaluate(formula, modeId, parsed.values, parsed.lists), [formula, modeId, parsed])

  const visualProps = useMemo(() => {
    const v: Record<string, number> = {}
    for (const [k, x] of Object.entries(parsed.values)) if (x !== undefined && Number.isFinite(x)) v[k] = x
    const l: Record<string, number[]> = {}
    for (const [k, xs] of Object.entries(parsed.lists)) l[k] = xs.filter((x): x is number => x !== undefined && Number.isFinite(x))
    const slots: Record<string, Array<number | undefined>> = {}
    for (const [k, xs] of Object.entries(parsed.lists)) slots[k] = xs.map((x) => (x !== undefined && Number.isFinite(x) ? x : undefined))
    return { v, lists: l, slots, o: result.status === 'ok' ? result.outputs : undefined, rows: result.status === 'ok' ? result.rows : undefined, mode: modeId }
  }, [parsed, result, modeId])

  const Visual = VISUALS[formula.visual]
  const example = mode.examples[0]

  const fillExample = () => {
    if (!example) return
    const next: Record<string, Entry> = {}
    for (const [k, x] of Object.entries(example.inputs)) if (mode.inputs.includes(k)) next[k] = entryFor(fieldOf(formula, k), x)
    setEntries(next)
    const nl: Record<string, Entry[]> = {}
    for (const [k, xs] of Object.entries(example.lists ?? {})) nl[k] = xs.map((x) => entryFor(fieldOf(formula, k), x))
    setLists(nl)
  }
  const clearAll = () => { setEntries({}); setLists({}) }

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* clipboard may be unavailable */ }
  }

  const inputConversions = mode.inputs.flatMap((k) => {
    const f = fieldOf(formula, k)
    const rows: Entry[] = f.list ? rowsOf(k) : entries[k] ? [entries[k]!] : []
    return rows.flatMap((e, i) => {
      const n = parseNumber(e.text)
      const u = findUnit(f.dim, e.unit)
      if (n === undefined || Number.isNaN(n) || u.factor === 1) return []
      return [`${f.list ? `${listBase(f)}${i + 1}` : f.symbol}: ${fmtNum(n)} ${e.unit} = ${fmtNum(n * u.factor)} ${baseUnit(f.dim).label}`]
    })
  })

  return (
    <Box sx={{
      display: 'grid', gap: 2, alignItems: 'start',
      gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'minmax(0,1fr) minmax(0,1fr)' },
      // phones: modes → inputs → DIAGRAM → results (the picture sits right under what you typed)
      gridTemplateAreas: { xs: '"modes" "inputs" "visual" "results"', md: '"modes visual" "inputs visual" "results visual"' },
      gridTemplateRows: { md: 'auto auto 1fr' },
    }}>
      <>
        {formula.modes.length > 1 && (
          <Box sx={{ gridArea: 'modes', minWidth: 0 }}><ModeTabs tabs={tabs} value={modeId} onChange={setModeId} label="Choose what to solve for" /></Box>
        )}
        <AnchorCard id="inputs" label="Enter what you know" sx={{ gridArea: 'inputs', minWidth: 0 }}>
          <CardContent>
            <Typography component="h2" variant="h3" gutterBottom>Enter what you know</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} data-testid="mode-equation">{mode.equation}</Typography>
            <Stack spacing={1}>
              {mode.inputs.map((k) => {
                const f = fieldOf(formula, k)
                const err = parsed.badText[k] ?? (result.status === 'invalid' ? result.errors[k] : undefined)
                if (f.list) {
                  const rows = rowsOf(k)
                  const max = f.listMax ?? DEFAULT_LIST_MAX
                  return (
                    <Stack key={k} spacing={1} role="group" aria-label={f.name}>
                      <Typography variant="subtitle2">{f.name}{f.description ? ` — ${f.description}` : ''}</Typography>
                      {rows.map((e, i) => (
                        <Row key={i} gap={1} align="flex-start">
                          <Box sx={{ flex: 1 }}>
                            <QuantityInput field={rowFields[k]!} entry={e} rowId={`${k}:${i}`} label={`${listBase(f)}${i + 1}`} testId={`in-${k}-${i}`} onChange={onEntry} />
                          </Box>
                          {rows.length > listSize(f) && <IconButton aria-label={`Remove ${listBase(f)}${i + 1}`} onClick={() => setLists((p) => ({ ...p, [k]: padRows(k, p[k]).filter((_, j) => j !== i) }))}><DeleteOutlinedIcon /></IconButton>}
                        </Row>
                      ))}
                      {err && <Typography role="alert" variant="caption" color="error">{err}</Typography>}
                      {rows.length < max && <Button startIcon={<AddIcon />} onClick={() => setLists((p) => ({ ...p, [k]: [...padRows(k, p[k]), empties[k]!] }))} sx={{ alignSelf: 'flex-start' }}>Add another</Button>}
                    </Stack>
                  )
                }
                return <QuantityInput key={k} field={f} rowId={k} entry={entries[k] ?? empties[k]!} error={err} onChange={onEntry} />
              })}
            </Stack>
            <Row gap={1} wrap sx={{ mt: 1 }}>
              {example && <Button variant="outlined" startIcon={<LightbulbOutlinedIcon />} onClick={fillExample} data-testid="use-example">Use the cheat-sheet example</Button>}
              <Button onClick={clearAll} data-testid="clear">Clear</Button>
            </Row>
          </CardContent>
        </AnchorCard>

        <Stack spacing={2} sx={{ gridArea: 'results', minWidth: 0 }}>
        <AnchorCard id="result" label="Result" sx={{ borderColor: result.status === 'ok' ? 'primary.main' : undefined }}>
          <CardContent>
            <Typography component="h2" variant="h3" gutterBottom>Result</Typography>
            <Box aria-live="polite" aria-atomic="true" data-testid="result" data-status={result.status}>
              {result.status === 'incomplete' && <Typography color="text.secondary">Fill in all the values above to see the answer.</Typography>}
              {result.status === 'invalid' && (
                <Alert severity="error" data-testid="result-error">
                  {result.general ?? Object.values(result.errors).join(' · ')}
                </Alert>
              )}
              {result.status === 'ok' && (
                <Stack spacing={1.5}>
                  {mode.outputs.map((k) => {
                    const f = fieldOf(formula, k)
                    const x = result.outputs[k]!
                    const text = fmtSI(f.dim, x)
                    const baseText = `${fmtNum(x)} ${baseUnit(f.dim).label}`.trim()
                    return (
                      <Row key={k} gap={1} align="center">
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" color="text.secondary">{f.name}</Typography>
                          <Typography component="p" sx={{ fontSize: '1.8rem', fontWeight: 700, lineHeight: 1.2, wordBreak: 'break-word' }} data-testid={`out-${k}`}>
                            <span aria-hidden="true">{f.symbol} = </span><span className="sr-only">{f.name}: </span>{text}
                            {f.dim === 'fraction' && <Typography component="span" color="text.secondary" sx={{ fontSize: '1rem' }}> ({fmtNum(x * 100, 4)} %)</Typography>}
                          </Typography>
                          {text !== baseText && <Typography variant="caption" color="text.secondary">= {baseText}</Typography>}
                        </Box>
                        <IconButton aria-label={`Copy ${f.name}`} onClick={() => copy(text)}><ContentCopyIcon /></IconButton>
                      </Row>
                    )
                  })}
                  {copied && <Typography variant="caption" role="status">Copied</Typography>}
                  {result.warnings.map((w, i) => <Alert key={i} severity="info" data-testid="warning">{w}</Alert>)}
                </Stack>
              )}
            </Box>
          </CardContent>
        </AnchorCard>

        {result.status === 'ok' && result.rows && <Breakdown rows={result.rows} share={mode.table?.share ?? 'Share'} sums={mode.table?.sums ?? []} />}
        {result.status === 'ok' && (
          <AnchorCard id="steps" label="How it was calculated">
            <CardContent>
              <Typography component="h2" variant="h3" gutterBottom>How it was calculated</Typography>
              <Box component="ol" sx={{ pl: 3, m: 0, '& li': { mb: 0.75 } }} data-testid="steps">
                {inputConversions.length > 0 && <li><strong>Convert to base units:</strong> {inputConversions.join('; ')}</li>}
                {result.steps.map((s, i) => <li key={i}>{s}</li>)}
              </Box>
            </CardContent>
          </AnchorCard>
        )}
        </Stack>
      </>
      <Box sx={{ gridArea: 'visual', minWidth: 0, position: { md: 'sticky' }, top: { md: 72 }, alignSelf: 'start' }}>
        <AnchorCard id="diagram" label="Diagram"><CardContent>
          {FLOW_VISUALS.has(formula.visual) && (
            <Box sx={{ mb: 1.5 }}>
              <ToggleButtonGroup exclusive size="small" value={flow} onChange={(_, v: FlowMode | null) => v && setFlow(v)} aria-label="Current direction shown by the arrows" sx={{ flexWrap: 'wrap' }}>
                <ToggleButton value="conventional" data-testid="flow-conventional">Conventional (+ → −)</ToggleButton>
                <ToggleButton value="electron" data-testid="flow-electron">Electron flow (− → +)</ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5 }} data-testid="flow-note">
                {flow === 'conventional' ? 'Arrows show conventional current: from the battery’s + terminal, through the parts, back to −. (Electrons actually move the opposite way.)' : 'Arrows show electron flow: from the battery’s − terminal through the parts to +. (Textbook “conventional” current points the other way.)'}
              </Typography>
            </Box>
          )}
          <FlowContext.Provider value={flow}>{Visual && <Visual {...visualProps} />}</FlowContext.Provider>
        </CardContent></AnchorCard>
      </Box>
    </Box>
  )
}
