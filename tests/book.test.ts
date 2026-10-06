/** The book's structure and its permanent URLs. */
import { describe, expect, it } from 'vitest'
import { FORMULAS, formulaById } from '../src/formulas/index.ts'
import { SECTIONS } from '../src/formulas/sections.ts'
import { CHAPTERS, PARTS, READING_ORDER, chapterOf, neighbours } from '../src/learn/book.ts'
import { hrefOf, parseHash, type Route } from '../src/ui/router.ts'
import { routeKey, routeLabel } from '../src/ui/navHistory.ts'

describe('book structure', () => {
  it('every topic in the app appears in the book exactly once', () => {
    const counts = new Map<string, number>()
    for (const id of READING_ORDER) counts.set(id, (counts.get(id) ?? 0) + 1)
    for (const f of FORMULAS) expect(counts.get(f.id), `${f.id} is ${counts.get(f.id) ? 'listed more than once' : 'missing from the book'}`).toBe(1)
    for (const id of READING_ORDER) expect(formulaById(id), `book lists unknown topic ${id}`).toBeDefined()
  })

  it('is split into 5 parts, from basics to advanced, each with chapters that have topics', () => {
    expect(PARTS.map((p) => p.id)).toEqual(['basics', 'measurements', 'signals', 'components', 'advanced'])
    for (const p of PARTS) {
      expect(p.chapters.length).toBeGreaterThan(0)
      for (const c of p.chapters) expect(c.items.length, `${c.id} is empty`).toBeGreaterThan(0)
    }
  })

  it('numbers chapters by part and position', () => {
    expect(CHAPTERS.find((c) => c.id === 'resistors')!.number).toBe('4.2')
    expect(CHAPTERS[0]!.number).toBe('1.1')
    for (const p of PARTS) p.chapters.forEach((c, i) => expect(c.number).toBe(`${p.number}.${i + 1}`))
  })

  it('every hero picture is a topic of its own chapter (or part)', () => {
    for (const c of CHAPTERS) expect(c.items, `${c.id}: hero ${c.hero}`).toContain(c.hero)
    for (const p of PARTS) expect(p.chapters.flatMap((c) => c.items), `${p.id}: hero ${p.hero}`).toContain(p.hero)
  })

  it('goes from easy to hard: measurements before signals, components after signals, the 555 at the end of components', () => {
    const pos = (id: string) => READING_ORDER.indexOf(id)
    expect(pos('units-and-prefixes')).toBe(0)
    expect(pos('ohms-law')).toBeLessThan(pos('multimeter'))
    expect(pos('multimeter')).toBeLessThan(pos('oscilloscope'))
    expect(pos('oscilloscope')).toBeLessThan(pos('r-series'))
    const components = PARTS.find((p) => p.id === 'components')!.chapters
    expect(components[components.length - 1]!.id).toBe('timers-ics')
    expect(pos('555-astable-frequency')).toBeLessThan(pos('adc-reading'))
    // worked problems sit next to the theory they use
    expect(chapterOf('p1-unknown-parallel')!.id).toBe('resistors')
    expect(chapterOf('p9-time-to-voltage')!.id).toBe('capacitors')
    expect(chapterOf('p17-bjt-switch')!.id).toBe('bjt')
  })

  it('previous / next follow the reading order across chapter boundaries', () => {
    expect(neighbours('units-and-prefixes')).toEqual({ prev: undefined, next: READING_ORDER[1] })
    const lastOfUnits = CHAPTERS[0]!.items.at(-1)!
    expect(neighbours(lastOfUnits).next).toBe(CHAPTERS[1]!.items[0])
    expect(neighbours(READING_ORDER.at(-1)!).next).toBeUndefined()
  })
})

describe('permanent URLs', () => {
  const allRoutes: Route[] = [
    { page: 'home' },
    ...PARTS.map((p) => ({ page: 'part' as const, id: p.id })),
    ...CHAPTERS.map((c) => ({ page: 'chapter' as const, id: c.id })),
    ...FORMULAS.map((f) => ({ page: 'topic' as const, id: f.id })),
  ]

  it('every page has a unique URL that leads back to it', () => {
    const urls = allRoutes.map(hrefOf)
    expect(new Set(urls).size).toBe(urls.length)
    for (const r of allRoutes) expect(parseHash(hrefOf(r))).toEqual(r)
  })

  it('ids are URL-safe slugs (so links never need escaping)', () => {
    for (const r of allRoutes) if (r.page !== 'home') expect(r.id, r.id).toMatch(/^[a-z0-9-]+$/)
  })

  it('every page has a human name for the title bar, history and shared links', () => {
    for (const r of allRoutes.slice(1)) expect(routeLabel(r), JSON.stringify(r)).not.toMatch(/^(Part|Chapter|Page)$/)
  })

  it('keeps anything after "?" for later (sharing calculator inputs)', () => {
    expect(parseHash('#/topic/ohms-law?mode=I&V=12')).toEqual({ page: 'topic', id: 'ohms-law', query: 'mode=I&V=12' })
    expect(hrefOf({ page: 'topic', id: 'ohms-law', query: 'mode=I' })).toBe('#/topic/ohms-law?mode=I')
  })

  it('a card inside a topic page has its own URL (…/<topic>/<card>), and the page it belongs to is unchanged', () => {
    expect(parseHash('#/topic/ohms-law/variables')).toEqual({ page: 'topic', id: 'ohms-law', anchor: 'variables' })
    expect(hrefOf({ page: 'topic', id: 'ohms-law', anchor: 'variables' })).toBe('#/topic/ohms-law/variables')
    expect(parseHash('#/topic/ohms-law/result?mode=I')).toEqual({ page: 'topic', id: 'ohms-law', anchor: 'result', query: 'mode=I' })
    expect(routeKey({ page: 'topic', id: 'ohms-law', anchor: 'variables' })).toBe(routeKey({ page: 'topic', id: 'ohms-law' })) // Back history treats it as the same page
    expect(routeLabel({ page: 'topic', id: 'ohms-law', anchor: 'variables' })).toBe("Ohm's law")
  })

  it('old cheat-sheet links still work: #/f/<id> opens the topic, #/s/<section> the chapter holding its main topic', () => {
    expect(parseHash('#/f/ohms-law')).toEqual({ page: 'topic', id: 'ohms-law', legacy: true })
    expect(parseHash('#/s/s2')).toEqual({ page: 'chapter', id: 'resistors', legacy: true })
    for (const s of SECTIONS) {
      const r = parseHash(`#/s/${s.id}`)
      expect(r.page, s.id).toBe('chapter')
    }
  })

  it('unknown or empty URLs fall back to home', () => {
    expect(parseHash('')).toEqual({ page: 'home' })
    expect(parseHash('#/whatever/x')).toEqual({ page: 'home' })
    expect(parseHash('#/topic')).toEqual({ page: 'home' })
  })
})
