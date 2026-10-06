import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { conceptById } from '../core/glossary.ts'
import type { Formula } from '../core/types.ts'
import { baseUnit } from '../core/units.ts'
import { SECTIONS } from '../formulas/index.ts'
import { VISUALS } from '../visuals/index.ts'
import { Calculator } from './Calculator.tsx'
import { ScrollX } from './ScrollX.tsx'
import { TOOLS } from './tools.tsx'
import { hrefSection } from './router.ts'

export function FormulaPage({ formula }: { formula: Formula }) {
  const section = SECTIONS.find((s) => s.id === formula.section)
  const Tool = formula.tool ? TOOLS[formula.tool] : undefined
  const Visual = VISUALS[formula.visual]
  return (
    <Stack spacing={2} component="article" aria-labelledby="formula-title">
      <Box>
        {section && <Chip component="a" href={hrefSection(section.id)} clickable size="small" label={`§${section.number} ${section.title}`} sx={{ mb: 1 }} />}
        <Typography id="formula-title" component="h1" variant="h1">{formula.title}</Typography>
        <Typography component="p" sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '1.15rem', fontWeight: 600, color: 'primary.main', mt: 0.5, wordBreak: 'break-word' }} data-testid="equation">{formula.equation}</Typography>
        <Typography sx={{ mt: 1 }} data-testid="meaning">{formula.meaning}</Typography>
        {formula.analogy && (
          <Card variant="outlined" sx={{ mt: 1.5, bgcolor: 'action.hover' }}><CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="body2"><strong>Think of it like this: </strong>{formula.analogy}</Typography>
          </CardContent></Card>
        )}
      </Box>

      {formula.modes.length > 0 && <Calculator key={formula.id} formula={formula} />}
      {Tool && <Tool />}
      {formula.modes.length === 0 && !Tool && Visual && <Card variant="outlined"><CardContent><Visual v={{}} lists={{}} mode="" /></CardContent></Card>}

      {formula.reference && (
        <Card variant="outlined"><CardContent>
          <Typography component="h2" variant="h3" gutterBottom>Reference values</Typography>
          <Table size="small" aria-label="Reference values"><TableBody>
            {formula.reference.rows.map(([k, v]) => <TableRow key={k}><TableCell component="th" scope="row">{k}</TableCell><TableCell>{v}</TableCell></TableRow>)}
          </TableBody></Table>
        </CardContent></Card>
      )}

      <Card variant="outlined"><CardContent>
        <Typography component="h2" variant="h3" gutterBottom>Units &amp; conversion</Typography>
        <Typography data-testid="units-note">{formula.unitsNote || 'Use consistent units; the calculator converts prefixes to base units for you.'}</Typography>
        {formula.exampleText && <Typography sx={{ mt: 1 }} color="text.secondary" data-testid="example-text"><strong>Worked example: </strong>{formula.exampleText}</Typography>}
      </CardContent></Card>

      {formula.fields.length > 0 && (
        <Card variant="outlined"><CardContent>
          <Typography component="h2" variant="h3" gutterBottom>Variables</Typography>
          <ScrollX label="Variables (scrolls sideways)">
            <Table size="small" aria-label="Variables">
              <TableHead><TableRow><TableCell>Symbol</TableCell><TableCell>Meaning</TableCell><TableCell>Base unit</TableCell></TableRow></TableHead>
              <TableBody>
                {formula.fields.map((f) => (
                  <TableRow key={f.key}><TableCell component="th" scope="row" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{f.symbol}</TableCell><TableCell>{f.name}{f.description ? ` — ${f.description}` : ''}</TableCell><TableCell>{baseUnit(f.dim).label || '—'}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollX>
        </CardContent></Card>
      )}

      {formula.concepts?.map((id) => {
        const c = conceptById(id)
        return c ? (
          <Accordion key={id} variant="outlined" disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`c-${id}`} id={`h-${id}`}><Typography sx={{ fontWeight: 600 }}>New to this? {c.title}</Typography></AccordionSummary>
            <AccordionDetails id={`c-${id}`}><Typography>{c.body}</Typography></AccordionDetails>
          </Accordion>
        ) : null
      })}
      {formula.page && <Typography variant="caption" color="text.secondary">Cheat sheet page {formula.page}</Typography>}
    </Stack>
  )
}
