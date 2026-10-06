import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../src/App.tsx'
import { FORMULAS } from '../src/formulas/index.ts'
import { CHAPTERS, PARTS } from '../src/learn/book.ts'
import { ChapterPage, PartPage } from '../src/ui/BookPages.tsx'
import { NavTree, locate } from '../src/ui/NavTree.tsx'
import { BOOK_ICONS } from '../src/ui/icons.tsx'
import { GLYPH_NAMES, TOPIC_ICONS } from '../src/ui/topicIcons.tsx'

beforeEach(() => { localStorage.clear(); window.location.hash = '' })

const at = (topic?: string, chapter?: string, part?: string) => locate({ topic, chapter, part })
/** open every part and chapter of the tree */
async function expandAll(user: ReturnType<typeof userEvent.setup>) {
  for (const p of PARTS) {
    await user.click(screen.getByTestId(`toggle-${p.id}`))
    for (const c of p.chapters) await user.click(screen.getByTestId(`toggle-${c.id}`))
  }
}

describe('sidebar hierarchy: part → chapter → topic', () => {
  it('every part and chapter row has its icon, and every topic row has its own icon too', () => {
    for (const id of [...PARTS.map((p) => p.id), ...CHAPTERS.map((c) => c.id)]) expect(BOOK_ICONS[id], `no icon for ${id}`).toBeDefined()
    render(<NavTree here={at('rc-tau')} />)
    // 5 parts + the chapters of the open part
    expect(screen.getAllByTestId(/^nav-icon-/)).toHaveLength(PARTS.length + PARTS.find((p) => p.id === 'components')!.chapters.length)
    const icon = screen.getByTestId('nav-topic-rc-tau').querySelector('svg')!
    expect(icon).toHaveAttribute('aria-hidden', 'true') // decorative — the text names the link
  })

  it('parents start collapsed (except the current page) and expand/collapse with their chevron', async () => {
    const user = userEvent.setup()
    render(<NavTree here={{}} />)
    const part = screen.getByTestId('toggle-components')
    expect(part).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByTestId('toggle-resistors')).not.toBeInTheDocument()
    await user.click(part)
    expect(part).toHaveAttribute('aria-expanded', 'true')
    expect(part).toHaveAccessibleName(/Collapse Components/)
    const chapter = screen.getByTestId('toggle-resistors')
    expect(screen.queryByTestId('nav-topic-voltage-divider')).not.toBeInTheDocument()
    await user.click(chapter)
    expect(chapter).toHaveAccessibleName(/Collapse 4\.2 Resistors/)
    expect(screen.getByTestId('nav-topic-voltage-divider')).toHaveAttribute('href', '#/topic/voltage-divider')
    await user.click(chapter)
    expect(chapter).toHaveAttribute('aria-expanded', 'false')
  })

  it('works from the keyboard', async () => {
    const user = userEvent.setup()
    render(<NavTree here={{}} />)
    screen.getByTestId('toggle-basics').focus()
    await user.keyboard('{Enter}')
    expect(screen.getByTestId('toggle-voltage-current-resistance')).toBeInTheDocument()
    await user.keyboard(' ')
    expect(screen.queryByTestId('toggle-voltage-current-resistance')).not.toBeInTheDocument()
  })

  it('keeps keyboard focus on the chevron after toggling (it must not remount)', async () => {
    const user = userEvent.setup()
    render(<NavTree here={{}} />)
    const toggle = screen.getByTestId('toggle-signals')
    toggle.focus()
    await user.keyboard('{Enter}')
    expect(document.activeElement).toBe(toggle)
    expect(toggle.isConnected).toBe(true)
    await user.keyboard('{Enter}')
    expect(document.activeElement).toBe(toggle)
  })

  it('opens the current page\'s part and chapter and marks the topic as current', () => {
    render(<NavTree here={at('rc-cutoff')} />)
    expect(screen.getByTestId('toggle-advanced')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('toggle-ac-filters')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('nav-topic-rc-cutoff')).toHaveAttribute('aria-current', 'page')
    expect(screen.getAllByRole('link', { current: 'page' })).toHaveLength(1)
  })

  it('every topic appears exactly once once everything is expanded, in reading order, with its permanent URL', async () => {
    const user = userEvent.setup()
    render(<NavTree here={{}} />)
    await expandAll(user)
    const links = screen.getAllByTestId(/^nav-topic-/)
    expect(links).toHaveLength(FORMULAS.length)
    expect(links.map((l) => l.getAttribute('data-testid')!.replace('nav-topic-', ''))).toEqual(CHAPTERS.flatMap((c) => c.items))
    for (const f of FORMULAS) expect(screen.getByTestId(`nav-topic-${f.id}`)).toHaveAttribute('href', `#/topic/${f.id}`)
  })

  it('remembers what you opened', async () => {
    const user = userEvent.setup()
    const first = render(<NavTree here={{}} />)
    await user.click(screen.getByTestId('toggle-measurements'))
    first.unmount()
    render(<NavTree here={{}} />)
    expect(screen.getByTestId('toggle-measurements')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('toggle-signals')).toHaveAttribute('aria-expanded', 'false')
  })

  it('follows navigation: moving to another chapter reveals it', () => {
    const { rerender } = render(<NavTree here={at('ohms-law')} />)
    expect(screen.getByTestId('toggle-voltage-current-resistance')).toHaveAttribute('aria-expanded', 'true')
    rerender(<NavTree here={at('555-monostable')} />)
    expect(screen.getByTestId('toggle-timers-ics')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('nav-topic-555-monostable')).toHaveAttribute('aria-current', 'page')
  })

  it('part and chapter rows link to their pages and are highlighted there', () => {
    const { rerender } = render(<NavTree here={at(undefined, 'diodes-leds')} />)
    const row = screen.getByTestId('nav-chapter-diodes-leds')
    const link = within(row).getAllByRole('link')[0]!
    expect(link).toHaveAccessibleName(/4\.5 Diodes & LEDs/)
    expect(link).toHaveAttribute('href', '#/chapter/diodes-leds')
    expect(link).toHaveAttribute('aria-current', 'page')
    rerender(<NavTree here={at(undefined, undefined, 'signals')} />)
    const part = within(screen.getByTestId('nav-part-signals')).getAllByRole('link')[0]!
    expect(part).toHaveAttribute('href', '#/part/signals')
    expect(part).toHaveAttribute('aria-current', 'page')
  })
})

describe('part and chapter pages', () => {
  it('a part page lists its chapters as cards', () => {
    render(<PartPage id="measurements" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Basic measurements')
    for (const c of PARTS[1]!.chapters) expect(screen.getByTestId(`chapter-${c.id}`)).toHaveAttribute('href', `#/chapter/${c.id}`)
  })

  it('a chapter page lists its topics in order, links back to its part and on to the next chapter', () => {
    render(<ChapterPage id="resistors" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('4.2 Resistors')
    const list = screen.getByRole('list', { name: 'Topics in Resistors' })
    const items = within(list).getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(items).toEqual(CHAPTERS.find((c) => c.id === 'resistors')!.items.map((id) => `#/topic/${id}`))
    expect(screen.getByRole('link', { name: /Part 4 · Components/ })).toHaveAttribute('href', '#/part/components')
    expect(screen.getByTestId('chapter-nav-prev')).toHaveAttribute('href', '#/chapter/wires')
    expect(screen.getByTestId('chapter-nav-next')).toHaveAttribute('href', '#/chapter/capacitors')
  })

  it('unknown ids show a friendly message', () => {
    render(<ChapterPage id="nope" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Chapter not found')
  })
})

describe('sidebar in the app', () => {
  it('opening a topic expands its part and chapter in the drawer and highlights it', async () => {
    const user = userEvent.setup()
    render(<App />)
    act(() => { window.location.hash = '#/topic/p9-time-to-voltage'; window.dispatchEvent(new HashChangeEvent('hashchange')) })
    await user.click(await screen.findByRole('button', { name: 'Open contents menu' }))
    const nav = await screen.findByRole('navigation', { name: 'Book contents' })
    expect(within(nav).getByTestId('toggle-components')).toHaveAttribute('aria-expanded', 'true')
    expect(within(nav).getByTestId('toggle-capacitors')).toHaveAttribute('aria-expanded', 'true')
    expect(within(nav).getByTestId('nav-topic-p9-time-to-voltage')).toHaveAttribute('aria-current', 'page')
  })
})

describe('topic icons', () => {
  it('every topic has an icon spec, every spec points at a real topic and a drawn glyph', () => {
    const ids = new Set(FORMULAS.map((f) => f.id))
    for (const f of FORMULAS) expect(TOPIC_ICONS[f.id], `no icon for ${f.id}`).toBeDefined()
    for (const [id, [glyph]] of Object.entries(TOPIC_ICONS)) {
      expect(ids.has(id), `icon for unknown topic ${id}`).toBe(true)
      expect(GLYPH_NAMES, `${id}: glyph ${glyph} is not drawn`).toContain(glyph)
    }
  })

  it('no two topics share the same picture (glyph + badge)', () => {
    const seen = new Map<string, string>()
    for (const f of FORMULAS) {
      const key = TOPIC_ICONS[f.id]!.join('|')
      expect(seen.get(key), `${f.id} looks identical to ${seen.get(key)}`).toBeUndefined()
      seen.set(key, f.id)
    }
  })

  it('badges stay short enough to read at icon size', () => {
    for (const [id, [, badge]] of Object.entries(TOPIC_ICONS)) expect([...badge].length, `${id}: badge "${badge}"`).toBeLessThanOrEqual(4)
  })

  it('every topic icon renders (with its glyph path) in the sidebar once expanded', async () => {
    const user = userEvent.setup()
    render(<NavTree here={{}} />)
    await expandAll(user)
    for (const f of FORMULAS) {
      const icon = screen.getByTestId(`topic-icon-${f.id}`)
      expect(icon.querySelector('path'), `${f.id}: no glyph path`).toBeTruthy()
      expect(icon.getAttribute('data-glyph')).toBe(TOPIC_ICONS[f.id]![0])
    }
  })
})
