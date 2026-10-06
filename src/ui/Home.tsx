import { useMemo, useState } from 'react'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import InputAdornment from '@mui/material/InputAdornment'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { FORMULAS, formulaById, formulasInSection, SECTIONS } from '../formulas/index.ts'
import { hrefFormula, hrefSection } from './router.ts'
import { Thumb } from './Thumb.tsx'

export function Home() {
  const [q, setQ] = useState('')
  const hits = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return []
    return FORMULAS.filter((f) => [f.title, f.equation, f.meaning, ...(f.keywords ?? []), ...f.fields.map((x) => `${x.symbol} ${x.name}`)].join(' ').toLowerCase().includes(t)).slice(0, 30)
  }, [q])
  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="h1" variant="h1">Electronics cheat sheet, but interactive</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>Every formula from the reference sheet as a calculator with a diagram and step-by-step working. Works offline — all maths runs on your device.</Typography>
      </Box>
      <TextField
        label="Search formulas (e.g. ohm, LED, 555, dB)"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        fullWidth
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }, htmlInput: { 'data-testid': 'search' } }}
      />
      {q.trim() ? (
        <Card variant="outlined" component="section" aria-label="Search results">
          <List data-testid="search-results" subheader={<Typography sx={{ px: 2, pt: 1 }} variant="body2" color="text.secondary" role="status">{hits.length} result{hits.length === 1 ? '' : 's'}</Typography>}>
            {hits.map((f) => (
              <ListItem key={f.id} disablePadding><ListItemButton component="a" href={hrefFormula(f.id)}>
                <Thumb visual={f.visual} id={f.id} width={88} /><ListItemText sx={{ ml: 1.5 }} primary={f.title} secondary={`§${SECTIONS.find((s) => s.id === f.section)?.number} · ${f.equation}`} />
              </ListItemButton></ListItem>
            ))}
          </List>
        </Card>
      ) : (
        <Box component="section" aria-label="Sections" sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' } }}>
          {SECTIONS.map((s) => (
            <Card key={s.id} variant="outlined">
              <CardActionArea component="a" href={hrefSection(s.id)} sx={{ height: '100%' }} data-testid={`section-${s.id}`}>
                <CardContent>
                  {/* row 1: the picture and the section number side by side */}
                  <Box className="card-head" data-testid={`card-head-${s.id}`} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, minHeight: 120 }}>
                    <Thumb visual={formulaById(s.hero)?.visual ?? ''} id={`section-${s.id}`} width={140} />
                    <Box sx={{ lineHeight: 1 }} data-testid={`section-number-${s.id}`}>
                      <Typography component="span" variant="overline" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>Section</Typography>
                      <Typography component="span" sx={{ fontSize: '2.4rem', fontWeight: 800, color: 'primary.main', lineHeight: 1 }}>{s.number}</Typography>
                    </Box>
                  </Box>
                  {/* below: title and description */}
                  <Typography component="h2" variant="h3" data-testid={`card-title-${s.id}`}>{s.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} data-testid={`card-desc-${s.id}`}>{s.blurb}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{formulasInSection(s.id).length} {formulasInSection(s.id).length === 1 ? 'topic' : 'topics'}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}
    </Stack>
  )
}
