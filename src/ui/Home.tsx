import { useMemo, useState } from 'react'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import InputAdornment from '@mui/material/InputAdornment'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { FORMULAS } from '../formulas/index.ts'
import { chapterOf, PARTS } from '../learn/book.ts'
import { ChapterGrid } from './BookPages.tsx'
import { hrefPart, hrefTopic } from './router.ts'
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
        <Typography component="h1" variant="h1">Electronics, step by step</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>An interactive reference book: from units and your first multimeter reading to transistors, microcontrollers and RF. Every formula is a calculator with a diagram and step-by-step working. Works offline — all maths runs on your device.</Typography>
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
              <ListItem key={f.id} disablePadding><ListItemButton component="a" href={hrefTopic(f.id)}>
                <Thumb visual={f.visual} id={f.id} width={88} /><ListItemText sx={{ ml: 1.5 }} primary={f.title} secondary={`${chapterOf(f.id)?.number ?? ''} · ${f.equation}`} />
              </ListItemButton></ListItem>
            ))}
          </List>
        </Card>
      ) : (
        PARTS.map((p) => (
          <Box component="section" key={p.id} aria-labelledby={`part-${p.id}`} data-testid={`part-${p.id}`}>
            <Typography variant="overline" color="primary" component="p">Part {p.number}</Typography>
            <Typography id={`part-${p.id}`} component="h2" variant="h2"><a className="crumb" href={hrefPart(p.id)}>{p.title}</a></Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>{p.blurb}</Typography>
            <ChapterGrid chapters={p.chapters} label={`Chapters of ${p.title}`} />
          </Box>
        ))
      )}
    </Stack>
  )
}
