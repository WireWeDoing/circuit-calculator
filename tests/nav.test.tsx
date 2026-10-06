import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../src/App.tsx'
import { FORMULAS, SECTIONS, formulasInSection, topicsOf } from '../src/formulas/index.ts'
import { NavTree } from '../src/ui/NavTree.tsx'
import { SECTION_ICONS } from '../src/ui/icons.tsx'
import { GLYPH_NAMES, TOPIC_ICONS } from '../src/ui/topicIcons.tsx'
import { SectionPage } from '../src/ui/SectionPage.tsx'

beforeEach(() => { localStorage.clear(); window.location.hash = '' })

describe('sidebar hierarchy', () => {
  it('every section row has its element icon, and every topic row has its own icon too', () => {
    for (const s of SECTIONS) expect(SECTION_ICONS[s.id], `no icon for ${s.id}`).toBeDefined()
    render(<NavTree sectionId="s3" formulaId="rc-tau" />)
    expect(screen.getAllByTestId(/^nav-icon-/)).toHaveLength(SECTIONS.length)
    const topic = screen.getByTestId('nav-topic-rc-tau')
    const icon = topic.querySelector('svg')!
    expect(icon).toBeTruthy()
    expect(icon).toHaveAttribute('aria-hidden', 'true') // decorative — the text names the link
  })

  it('parents start collapsed (except the current page) and expand/collapse with their chevron', async () => {
    const user = userEvent.setup()
    render(<NavTree />)
    const toggle = screen.getByTestId('toggle-s2')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByTestId('nav-topic-voltage-divider')).not.toBeInTheDocument()
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(toggle).toHaveAccessibleName(/Collapse Resistors/)
    expect(screen.getByTestId('nav-topic-voltage-divider')).toHaveAttribute('href', '#/f/voltage-divider')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('works from the keyboard', async () => {
    const user = userEvent.setup()
    render(<NavTree />)
    screen.getByTestId('toggle-s1').focus()
    await user.keyboard('{Enter}')
    expect(screen.getByTestId('nav-topic-ohms-law')).toBeInTheDocument()
    await user.keyboard(' ')
    expect(screen.queryByTestId('nav-topic-ohms-law')).not.toBeInTheDocument()
  })

  it('keeps keyboard focus on the chevron after toggling (it must not remount)', async () => {
    const user = userEvent.setup()
    render(<NavTree />)
    const toggle = screen.getByTestId('toggle-s9')
    toggle.focus()
    await user.keyboard('{Enter}')
    expect(document.activeElement).toBe(toggle)
    expect(toggle.isConnected).toBe(true)
    await user.keyboard('{Enter}')
    expect(document.activeElement).toBe(toggle)
  })

  it('opens the current page\'s section and marks the topic as current', () => {
    render(<NavTree sectionId="s5" formulaId="rc-cutoff" />)
    expect(screen.getByTestId('toggle-s5')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('nav-topic-rc-cutoff')).toHaveAttribute('aria-current', 'page')
  })

  it('every topic appears exactly once once everything is expanded, with the right link', async () => {
    const user = userEvent.setup()
    render(<NavTree />)
    for (const s of SECTIONS) {
      await user.click(screen.getByTestId(`toggle-${s.id}`))
      for (const t of topicsOf(s.id)) if (t.group) await user.click(screen.getByTestId(`toggle-${t.group.id}`))
    }
    const links = screen.getAllByTestId(/^nav-topic-/)
    expect(links).toHaveLength(FORMULAS.length)
    for (const f of FORMULAS) expect(screen.getByTestId(`nav-topic-${f.id}`)).toHaveAttribute('href', `#/f/${f.id}`)
  })

  it('§17 shows the cheat sheet\'s sub-sections 17.1 … 17.6 as nested, collapsible groups', async () => {
    const user = userEvent.setup()
    render(<NavTree />)
    await user.click(screen.getByTestId('toggle-s17'))
    const s17 = screen.getByTestId('nav-section-s17')
    for (const t of ['17.1 Resistor networks', '17.2 Voltage dividers, sensors and bridges', '17.3 Capacitors, inductors and timing', '17.4 LEDs, Zener diodes and power supplies', '17.5 Transistor circuits', '17.6 Batteries and sources']) {
      expect(within(s17).getByText(t)).toBeInTheDocument()
    }
    expect(within(s17).queryByTestId('nav-topic-p1-unknown-parallel')).not.toBeInTheDocument() // sub-section collapsed
    await user.click(within(s17).getByTestId('toggle-g17-1'))
    expect(within(s17).getByTestId('nav-topic-p1-unknown-parallel')).toBeInTheDocument()
    expect(within(s17).queryByTestId('nav-topic-p6-adc-divider')).not.toBeInTheDocument() // siblings unaffected
    await user.click(within(s17).getByTestId('toggle-g17-1'))
    expect(within(s17).queryByTestId('nav-topic-p1-unknown-parallel')).not.toBeInTheDocument()
  })

  it('remembers what you opened', async () => {
    const user = userEvent.setup()
    const first = render(<NavTree />)
    await user.click(screen.getByTestId('toggle-s4'))
    first.unmount()
    render(<NavTree />)
    expect(screen.getByTestId('toggle-s4')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('toggle-s3')).toHaveAttribute('aria-expanded', 'false')
  })

  it('follows navigation: moving to another section reveals it', async () => {
    const { rerender } = render(<NavTree sectionId="s1" formulaId="ohms-law" />)
    expect(screen.getByTestId('toggle-s1')).toHaveAttribute('aria-expanded', 'true')
    rerender(<NavTree sectionId="s10" formulaId="555-monostable" />)
    expect(screen.getByTestId('toggle-s10')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('nav-topic-555-monostable')).toHaveAttribute('aria-current', 'page')
  })

  it('parent rows still link to their section page', () => {
    render(<NavTree />)
    const row = screen.getByTestId('nav-section-s6')
    expect(within(row).getByRole('link', { name: /6\. Diodes & LEDs/ })).toHaveAttribute('href', '#/s/s6')
  })
})

describe('sub-sections', () => {
  it('only §17 declares sub-sections and every grouped topic belongs to a declared group', () => {
    for (const s of SECTIONS) if (s.id !== 's17') expect(s.groups).toBeUndefined()
    const ids = new Set(SECTIONS.find((s) => s.id === 's17')!.groups!.map((g) => g.id))
    for (const f of formulasInSection('s17')) expect(ids.has(f.group!), `${f.id} has no valid group`).toBe(true)
    expect(topicsOf('s17').flatMap((t) => t.formulas)).toHaveLength(formulasInSection('s17').length)
  })

  it('the §17 section page shows each sub-section as a heading with its topics', () => {
    render(<SectionPage id="s17" />)
    expect(screen.getByTestId('group-g17-5')).toHaveTextContent('17.5 Transistor circuits')
    const list = screen.getByRole('list', { name: 'Topics in 17.5 Transistor circuits' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(3) // P17, P18, P19
  })
})

describe('sidebar in the app', () => {
  it('opening a formula expands its section in the drawer and highlights it', async () => {
    const user = userEvent.setup()
    render(<App />)
    act(() => { window.location.hash = '#/f/p9-time-to-voltage'; window.dispatchEvent(new HashChangeEvent('hashchange')) })
    await user.click(await screen.findByRole('button', { name: 'Open sections menu' }))
    const nav = await screen.findByRole('navigation', { name: 'Sections' })
    expect(within(nav).getByTestId('toggle-s17')).toHaveAttribute('aria-expanded', 'true')
    expect(within(nav).getByTestId('toggle-g17-3')).toHaveAttribute('aria-expanded', 'true')
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
    render(<NavTree />)
    for (const s of SECTIONS) {
      await user.click(screen.getByTestId(`toggle-${s.id}`))
      for (const t of topicsOf(s.id)) if (t.group) await user.click(screen.getByTestId(`toggle-${t.group.id}`))
    }
    for (const f of FORMULAS) {
      const icon = screen.getByTestId(`topic-icon-${f.id}`)
      expect(icon.querySelector('path'), `${f.id}: no glyph path`).toBeTruthy()
      expect(icon.getAttribute('data-glyph')).toBe(TOPIC_ICONS[f.id]![0])
    }
  })
})
