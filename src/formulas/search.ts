import { FORMULAS, SECTIONS } from './index.ts'

export interface SearchEntry {
  kind: 'section' | 'topic'
  /** section id or formula id */
  id: string
  title: string
  /** for topics: the section it lives in (and sub-section, if any) */
  sectionId?: string
  sectionTitle?: string
  groupTitle?: string
  /** "#/s/…" or "#/f/…" */
  href: string
  /** normalised title for matching (without the section number) */
  key: string
  /** sections only: the same title prefixed with its number, so "3 capacitors" / "3. Capacitors" also match */
  numberedKey?: string
  /** normalised parent-section title (topics only) */
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
/** one entry per section and per topic (built once) */
export function searchIndex(): SearchEntry[] {
  if (index) return index
  const out: SearchEntry[] = SECTIONS.map((s) => ({
    kind: 'section', id: s.id, title: `${s.number}. ${s.title}`, href: `#/s/${encodeURIComponent(s.id)}`, key: normalize(s.title), numberedKey: normalize(`${s.number} ${s.title}`), parentKey: '',
  }))
  for (const f of FORMULAS) {
    const s = SECTIONS.find((x) => x.id === f.section)!
    out.push({
      kind: 'topic', id: f.id, title: f.title, sectionId: s.id, sectionTitle: `${s.number}. ${s.title}`, groupTitle: s.groups?.find((g) => g.id === f.group)?.title,
      href: `#/f/${encodeURIComponent(f.id)}`, key: normalize(f.title), parentKey: normalize(s.title),
    })
  }
  return (index = out)
}

const wordStarts = (key: string, token: string) => key.split(' ').some((w) => w.startsWith(token))

/**
 * Search by title. Every word you type must match (as the start of a word, or anywhere inside a word).
 * Ranking: exact title › title starts with the query › every word starts a title word › text inside a title ›
 * topics whose SECTION title matches (typing "capacitors" lists the section, then its topics).
 * Sections come before topics at equal score; ties keep the cheat sheet's order.
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
    if (score) hits.push({ ...e, score: score + (e.kind === 'section' ? 1 : 0) - order / 10000 })
  })
  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}
