import { formulaById } from './index.ts'
import { PARTS } from '../learn/book.ts'
import { hrefChapter, hrefPart, hrefTopic } from '../ui/router.ts'

export interface SearchEntry {
  kind: 'part' | 'chapter' | 'topic'
  /** part, chapter or topic id */
  id: string
  /** what the result shows: "4.2 Resistors" for a chapter, the plain title for a topic */
  title: string
  /** where it sits: "Part 4 · Components" for a chapter, "4.2 Resistors" for a topic */
  where: string
  /** "#/part/…", "#/chapter/…" or "#/topic/…" */
  href: string
  /** normalised title for matching (without the number) */
  key: string
  /** parts and chapters: the same title prefixed with its number, so "4.2 resistors" / "4 components" also match */
  numberedKey?: string
  /** normalised parent title (the chapter of a topic, the part of a chapter) */
  parentKey: string
}
export interface SearchHit extends SearchEntry { score: number }

/** lower-case, strip accents and punctuation: "Ohm's law" → "ohms law", "µF" → "uf" */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, '')
    .replace(/µ/g, 'u')
    .replace(/[^a-z0-9Ͱ-Ͽ]+/g, ' ')
    .trim()
}

let index: SearchEntry[] | undefined
/** one entry per part, chapter and topic, in reading order (built once) */
export function searchIndex(): SearchEntry[] {
  if (index) return index
  const out: SearchEntry[] = []
  for (const p of PARTS) {
    out.push({ kind: 'part', id: p.id, title: `${p.number}. ${p.title}`, where: `Part ${p.number}`, href: hrefPart(p.id), key: normalize(p.title), numberedKey: normalize(`${p.number} ${p.title}`), parentKey: '' })
    for (const c of p.chapters) {
      out.push({ kind: 'chapter', id: c.id, title: `${c.number} ${c.title}`, where: `Part ${p.number} · ${p.title}`, href: hrefChapter(c.id), key: normalize(c.title), numberedKey: normalize(`${c.number} ${c.title}`), parentKey: normalize(p.title) })
    }
  }
  for (const c of PARTS.flatMap((p) => p.chapters)) {
    for (const id of c.items) {
      const f = formulaById(id)
      if (f) out.push({ kind: 'topic', id, title: f.title, where: `${c.number} ${c.title}`, href: hrefTopic(id), key: normalize(f.title), parentKey: normalize(c.title) })
    }
  }
  return (index = out)
}

const wordStarts = (key: string, token: string) => key.split(' ').some((w) => w.startsWith(token))

/**
 * Search by title. Every word you type must match (as the start of a word, or anywhere inside a word).
 * Ranking: exact title › title starts with the query › every word starts a title word › text inside a title ›
 * topics whose CHAPTER title matches (typing "capacitors" lists the chapter, then its topics).
 * Parts and chapters come before topics at equal score; ties keep the book's reading order.
 */
export function search(query: string, limit = 50): SearchHit[] {
  const q = normalize(query)
  if (!q) return []
  const tokens = q.split(' ')
  const hits: SearchHit[] = []
  searchIndex().forEach((e, order) => {
    let score = 0
    if (e.key === q || e.numberedKey === q) score = 100
    else if (e.key.startsWith(q) || e.numberedKey?.startsWith(q)) score = 85
    else if (tokens.every((t) => wordStarts(e.key, t))) score = 70
    else if (tokens.every((t) => e.key.includes(t))) score = 50
    else if (e.kind === 'topic' && tokens.every((t) => wordStarts(e.parentKey, t) || e.parentKey.includes(t))) score = 20
    if (score) hits.push({ ...e, score: score + (e.kind === 'topic' ? 0 : 1) - order / 10000 })
  })
  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}
