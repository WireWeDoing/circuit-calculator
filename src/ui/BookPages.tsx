import { memo } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { formulaById } from '../formulas/index.ts'
import { CHAPTERS, chapterById, neighbours, partById, partOf, type Chapter } from '../learn/book.ts'
import { hrefChapter, hrefPart, hrefTopic } from './router.ts'
import { Thumb } from './Thumb.tsx'

const topicCount = (c: Chapter) => `${c.items.length} ${c.items.length === 1 ? 'topic' : 'topics'}`

/** one topic row: a plain link (a chapter lists up to ~15 of these, each with a diagram thumbnail) */
const TopicRow = memo(function TopicRow({ id }: { id: string }) {
  const f = formulaById(id)
  if (!f) return null
  return (
    <li className="list-row">
      <a className="topic-row" href={hrefTopic(f.id)} data-testid={`formula-${f.id}`}>
        <Thumb visual={f.visual} id={f.id} />
        <span className="topic-row-text">
          <span className="topic-row-title">{f.title}</span>
          <span className="topic-row-eq">{f.equation}</span>
        </span>
      </a>
    </li>
  )
})

/** a chapter card: picture and chapter number in one row, title and description underneath */
export const ChapterCard = memo(function ChapterCard({ chapter: c }: { chapter: Chapter }) {
  return (
    <Card variant="outlined">
      <CardActionArea component="a" href={hrefChapter(c.id)} sx={{ height: '100%' }} data-testid={`chapter-${c.id}`}>
        <CardContent>
          <Box className="card-head" data-testid={`card-head-${c.id}`} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, minHeight: 120 }}>
            <Thumb visual={formulaById(c.hero)?.visual ?? ''} id={`chapter-${c.id}`} width={140} />
            <Box sx={{ lineHeight: 1 }} data-testid={`chapter-number-${c.id}`}>
              <Typography component="span" variant="overline" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>Chapter</Typography>
              <Typography component="span" sx={{ fontSize: '2.4rem', fontWeight: 800, color: 'primary.main', lineHeight: 1 }}>{c.number}</Typography>
            </Box>
          </Box>
          <Typography component="h3" variant="h3" data-testid={`card-title-${c.id}`}>{c.title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} data-testid={`card-desc-${c.id}`}>{c.blurb}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{topicCount(c)}</Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  )
})

export function ChapterGrid({ chapters, label }: { chapters: Chapter[]; label: string }) {
  return (
    <Box component="section" aria-label={label} sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' } }}>
      {chapters.map((c) => <ChapterCard key={c.id} chapter={c} />)}
    </Box>
  )
}

const NotFound = ({ what }: { what: string }) => <Typography role="alert">{what} not found. <a href="#/">Go home</a>.</Typography>

export function PartPage({ id }: { id: string }) {
  const part = partById(id)
  if (!part) return <NotFound what="Part" />
  return (
    <Box>
      <Typography variant="overline" color="primary">Part {part.number}</Typography>
      <Typography component="h1" variant="h1">{part.title}</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>{part.blurb}</Typography>
      <ChapterGrid chapters={part.chapters} label={`Chapters of ${part.title}`} />
    </Box>
  )
}

/** "← previous · next →" links between neighbouring pages of the book */
function PrevNext({ prev, next, testid }: { prev?: { href: string; label: string }; next?: { href: string; label: string }; testid: string }) {
  if (!prev && !next) return null
  return (
    <nav className="prev-next" aria-label="Previous and next" data-testid={testid}>
      {prev ? <a className="prev-next-link" href={prev.href} rel="prev" data-testid={`${testid}-prev`}><span className="prev-next-dir">← Previous</span><span className="prev-next-title">{prev.label}</span></a> : <span />}
      {next ? <a className="prev-next-link is-next" href={next.href} rel="next" data-testid={`${testid}-next`}><span className="prev-next-dir">Next →</span><span className="prev-next-title">{next.label}</span></a> : <span />}
    </nav>
  )
}

export function ChapterPage({ id }: { id: string }) {
  const chapter = chapterById(id)
  if (!chapter) return <NotFound what="Chapter" />
  const part = partOf(chapter)
  const i = CHAPTERS.indexOf(chapter)
  const link = (c?: Chapter) => (c ? { href: hrefChapter(c.id), label: `${c.number} ${c.title}` } : undefined)
  return (
    <Box>
      <Typography variant="overline" color="primary" component="p"><a className="crumb" href={hrefPart(part.id)}>Part {part.number} · {part.title}</a></Typography>
      <Typography component="h1" variant="h1"><span className="title-num">{chapter.number}</span> {chapter.title}</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>{chapter.blurb}</Typography>
      <ul className="topic-list" aria-label={`Topics in ${chapter.title}`}>
        {chapter.items.map((t) => <TopicRow key={t} id={t} />)}
      </ul>
      <PrevNext prev={link(CHAPTERS[i - 1])} next={link(CHAPTERS[i + 1])} testid="chapter-nav" />
    </Box>
  )
}

/** links to the topics before and after this one in reading order (they cross chapter boundaries) */
export function TopicNav({ id }: { id: string }) {
  const { prev, next } = neighbours(id)
  const link = (t?: string) => { const f = t ? formulaById(t) : undefined; return f ? { href: hrefTopic(f.id), label: f.title } : undefined }
  return <PrevNext prev={link(prev)} next={link(next)} testid="topic-nav" />
}
