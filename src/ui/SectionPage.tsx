import { memo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { SECTIONS, topicsOf } from '../formulas/index.ts'
import type { Formula } from '../core/types.ts'
import { hrefFormula } from './router.ts'
import { Thumb } from './Thumb.tsx'

/** one topic row: a plain link (a section can list ~25 of these, each with a diagram thumbnail) */
const TopicRow = memo(function TopicRow({ f }: { f: Formula }) {
  return (
    <li className="list-row">
      <a className="topic-row" href={hrefFormula(f.id)} data-testid={`formula-${f.id}`}>
        <Thumb visual={f.visual} id={f.id} />
        <span className="topic-row-text">
          <span className="topic-row-title">{f.title}</span>
          <span className="topic-row-eq">{f.equation}</span>
        </span>
      </a>
    </li>
  )
})

export function SectionPage({ id }: { id: string }) {
  const section = SECTIONS.find((s) => s.id === id)
  if (!section) return <Typography role="alert">Section not found. <a href="#/">Go home</a>.</Typography>
  return (
    <Box>
      <Typography variant="overline" color="primary">Section {section.number}</Typography>
      <Typography component="h1" variant="h1">{section.title}</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>{section.blurb}</Typography>
      {topicsOf(id).map((t) => (
        <Box key={t.group?.id ?? 'all'} sx={{ mb: 2 }}>
          {t.group && <Typography component="h2" variant="h3" sx={{ mb: 1 }} data-testid={`group-${t.group.id}`}>{t.group.title}</Typography>}
          <ul className="topic-list" aria-label={`Topics in ${t.group?.title ?? section.title}`}>
            {t.formulas.map((f) => <TopicRow key={f.id} f={f} />)}
          </ul>
        </Box>
      ))}
    </Box>
  )
}
