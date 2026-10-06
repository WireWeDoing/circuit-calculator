import CardContent from '@mui/material/CardContent'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import type { ArticleBlock } from '../core/types.ts'
import { VISUALS } from '../visuals/index.ts'
import { AnchorCard } from './anchors.tsx'
import { slug } from './anchorContext.ts'
import { ScrollX } from './ScrollX.tsx'

/** The body of a reference page: one card per block (text, bullet points, a table and/or a diagram). */
export function Article({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <>
      {blocks.map((b) => {
        const Visual = b.visual ? VISUALS[b.visual] : undefined
        const [head, ...rows] = b.table ?? []
        return (
          <AnchorCard key={b.heading} id={slug(b.heading)} label={b.heading} component="section" aria-labelledby={`a-${slug(b.heading)}`} data-testid={`article-${slug(b.heading)}`}>
            <CardContent>
              <Typography id={`a-${slug(b.heading)}`} component="h2" variant="h3" gutterBottom>{b.heading}</Typography>
              {b.text && <Typography sx={{ mb: b.bullets || b.table || Visual ? 1 : 0 }}>{b.text}</Typography>}
              {b.bullets && <ul className="article-list">{b.bullets.map((x) => <li key={x}>{x}</li>)}</ul>}
              {Visual && <div className="article-visual"><Visual v={{}} lists={{}} mode="" /></div>}
              {head && (
                <ScrollX label={`${b.heading} (scrolls sideways)`}>
                  <Table size="small" aria-label={b.heading}>
                    <TableHead><TableRow>{head.map((h) => <TableCell key={h}>{h}</TableCell>)}</TableRow></TableHead>
                    <TableBody>
                      {rows.map((r) => <TableRow key={r.join('|')}>{r.map((c, i) => (i === 0 ? <TableCell key={i} component="th" scope="row" sx={{ fontWeight: 600 }}>{c}</TableCell> : <TableCell key={i}>{c}</TableCell>))}</TableRow>)}
                    </TableBody>
                  </Table>
                </ScrollX>
              )}
            </CardContent>
          </AnchorCard>
        )
      })}
    </>
  )
}
