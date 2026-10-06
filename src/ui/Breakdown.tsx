import { AnchorCard } from './anchors.tsx'
import { ScrollX } from './ScrollX.tsx'
import CardContent from '@mui/material/CardContent'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { columnTotal } from '../core/breakdown.ts'
import type { BreakdownRow } from '../core/types.ts'
import { fmtNum, fmtSI } from '../core/units.ts'

type Col = { key: 'V' | 'I' | 'P' | 'Q' | 'E'; head: string; dim: 'voltage' | 'current' | 'power' | 'charge' | 'energy' }
const COLS: Col[] = [
  { key: 'V', head: 'Voltage', dim: 'voltage' }, { key: 'I', head: 'Current', dim: 'current' }, { key: 'P', head: 'Power', dim: 'power' },
  { key: 'Q', head: 'Charge', dim: 'charge' }, { key: 'E', head: 'Energy', dim: 'energy' },
]

/** Per-component table: value, share of the total, and whichever of V / I / P / Q / E the calculation produced. */
export function Breakdown({ rows, share, sums }: { rows: BreakdownRow[]; share: string; sums: Array<Col['key']> }) {
  const cols = COLS.filter((c) => rows.some((r) => r[c.key] !== undefined))
  const hasShare = rows.some((r) => r.share !== undefined)
  const additive = (c: Col) => sums.includes(c.key)
  return (
    <AnchorCard id="breakdown" label="Each part in detail">
      <CardContent>
        <Typography component="h2" variant="h3" gutterBottom>Each part in detail</Typography>
        <ScrollX label="Per-component breakdown, scrolls sideways">
          <Table size="small" aria-label="Per-component breakdown" data-testid="breakdown">
            <TableHead>
              <TableRow>
                <TableCell>Part</TableCell>
                {rows.some((r) => r.value) && <TableCell align="right">Value</TableCell>}
                {cols.map((c) => <TableCell key={c.key} align="right">{c.head}</TableCell>)}
                {hasShare && <TableCell align="right">{share}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.label} data-testid={`row-${r.label}`}>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 700 }}>{r.label}</TableCell>
                  {rows.some((x) => x.value) && <TableCell align="right">{r.value ? fmtSI(r.value.dim, r.value.x) : ''}</TableCell>}
                  {cols.map((c) => <TableCell key={c.key} align="right" data-testid={`${r.label}-${c.key}`}>{r[c.key] === undefined ? '' : fmtSI(c.dim, r[c.key]!)}</TableCell>)}
                  {hasShare && <TableCell align="right">{r.share === undefined ? '' : `${fmtNum(r.share * 100, 3)} %`}</TableCell>}
                </TableRow>
              ))}
              {cols.some(additive) && (
                <TableRow sx={{ '& td, & th': { fontWeight: 700 } }} data-testid="row-total">
                  <TableCell component="th" scope="row">Total</TableCell>
                  {rows.some((x) => x.value) && <TableCell />}
                  {cols.map((c) => <TableCell key={c.key} align="right">{additive(c) && columnTotal(rows, c.key) !== undefined ? fmtSI(c.dim, columnTotal(rows, c.key)!) : ''}</TableCell>)}
                  {hasShare && <TableCell align="right">{fmtNum(rows.reduce((a, r) => a + (r.share ?? 0), 0) * 100, 3)} %</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollX>
      </CardContent>
    </AnchorCard>
  )
}
