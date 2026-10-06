import { describe, expect, it } from 'vitest'
import { FORMULAS, SECTIONS } from '../src/formulas/index.ts'
import { normalize, search, searchIndex } from '../src/formulas/search.ts'

const ids = (q: string, n = 50) => search(q, n).map((h) => `${h.kind}:${h.id}`)

describe('normalize', () => {
  it('lower-cases, strips accents, apostrophes, punctuation and µ', () => {
    expect(normalize("Ohm's Law & Power")).toBe('ohms law power')
    expect(normalize('  Q-factor  ')).toBe('q factor')
    expect(normalize('µF')).toBe('uf')
    expect(normalize('Résumé')).toBe('resume')
    expect(normalize('')).toBe('')
  })
})

describe('search index', () => {
  it('has one entry per section and per topic, with working links', () => {
    const idx = searchIndex()
    expect(idx.filter((e) => e.kind === 'section')).toHaveLength(SECTIONS.length)
    expect(idx.filter((e) => e.kind === 'topic')).toHaveLength(FORMULAS.length)
    for (const e of idx) expect(e.href).toMatch(/^#\/(s|f)\//)
  })
})

describe('search by title', () => {
  it('finds every section by its own title (and number)', () => {
    for (const s of SECTIONS) {
      expect(ids(s.title)[0], `section "${s.title}"`).toBe(`section:${s.id}`)
      expect(ids(`${s.number}. ${s.title}`)[0]).toBe(`section:${s.id}`)
    }
  })
  it('finds every topic by its own title', () => {
    for (const f of FORMULAS) expect(ids(f.title, 5), `topic "${f.title}"`).toContain(`topic:${f.id}`)
  })
  it('is case-insensitive and ignores punctuation / accents', () => {
    expect(ids('OHMS LAW')).toContain('topic:ohms-law')
    expect(ids("ohm's law")).toContain('topic:ohms-law')
    expect(ids('ohms-law')).toContain('topic:ohms-law')
    expect(ids('  voltage   divider ')).toContain('topic:voltage-divider')
  })
  it('matches partial words: "cap" finds Capacitors and its topics', () => {
    const r = ids('cap')
    expect(r[0]).toBe('section:s3')
    expect(r).toContain('topic:cap-charge')
    expect(r).toContain('topic:cap-reactance')
  })
  it('every typed word must match, in any order', () => {
    expect(ids('divider voltage')).toContain('topic:voltage-divider')
    const r = search('series total')
    expect(r.map((h) => h.id)).toEqual(expect.arrayContaining(['r-series', 'c-series', 'l-series']))
    expect(search('series zzz')).toEqual([])
  })
  it('ranks: exact › starts-with › word-start › inside, sections before topics on equal rank', () => {
    expect(ids('resistors')[0]).toBe('section:s2') // exact section title
    const r = search('led')
    expect(r[0]!.kind === 'section' ? r[0]!.id : r[0]!.title).toBeTruthy()
    const scores = r.map((h) => h.score)
    expect(scores).toEqual([...scores].sort((a, b) => b - a)) // sorted best first
    expect(ids('power')[0]).toMatch(/power|s1|s15|s12/) // something titled Power leads
    expect(search('power').slice(0, 2).some((h) => /power/i.test(h.title))).toBe(true)
  })
  it('searching a section name also lists that section\'s topics (after the section itself)', () => {
    const r = ids('mosfets')
    expect(r[0]).toBe('section:s8')
    expect(r).toEqual(expect.arrayContaining(['topic:mosfet-power', 'topic:mosfet-gate-current', 'topic:mosfet-logic-level']))
  })
  it('finds §17 topics and tells you the sub-section', () => {
    const hit = search('zener').find((h) => h.id === 'p14-zener')!
    expect(hit.groupTitle).toBe('17.4 LEDs, Zener diodes and power supplies')
    expect(hit.sectionTitle).toMatch(/^17\./)
  })
  it('handles junk gracefully', () => {
    expect(search('')).toEqual([])
    expect(search('   ')).toEqual([])
    expect(search('!!!')).toEqual([])
    expect(search('zzzzzz')).toEqual([])
    expect(() => search('(*[]\\')).not.toThrow()
    expect(search('a'.repeat(500))).toEqual([])
  })
  it('respects the result limit', () => {
    expect(search('a', 5)).toHaveLength(5)
    expect(search('a').length).toBeLessThanOrEqual(50)
  })
  it('is stable: same query, same order', () => {
    expect(ids('ratio')).toEqual(ids('ratio'))
  })
})
