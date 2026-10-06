/**
 * Render-count guards: the expensive parts of the UI must only re-render what actually changed.
 * (Timing budgets in a real browser live in e2e/performance.spec.ts.)
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { formulaById } from '../src/formulas/index.ts'
import { Calculator } from '../src/ui/Calculator.tsx'
import { ModeTabs } from '../src/ui/ModeTabs.tsx'
import { chapterById, PARTS } from '../src/learn/book.ts'
import { locate, navHooks, NavTree } from '../src/ui/NavTree.tsx'
import { inputHooks } from '../src/ui/QuantityInput.tsx'

beforeEach(() => { localStorage.clear() })
afterEach(() => { navHooks.onRender = undefined; inputHooks.onRender = undefined })

const counter = () => { const c = { leaf: 0, part: 0, chapter: 0 }; navHooks.onRender = (k) => { c[k]++ }; return c }
const none = {}

describe('sidebar tree re-renders only what changed', () => {
  it('expanding one branch renders that branch\'s rows, not the other parts and chapters', async () => {
    const user = userEvent.setup()
    render(<NavTree here={none} />)
    await user.click(screen.getByTestId('toggle-components'))
    const c = counter()
    await user.click(screen.getByTestId('toggle-wires'))
    expect(c.leaf).toBe(2) // the two topics that appeared
    expect(c.chapter).toBe(1) // only the chapter whose state changed
    await user.click(screen.getByTestId('toggle-resistors'))
    expect(c.leaf).toBe(2 + chapterById('resistors')!.items.length)
    expect(c.chapter).toBe(1 + 1) // "wires" did NOT re-render when "resistors" opened
  })

  it('collapsing renders nothing new', async () => {
    const user = userEvent.setup()
    render(<NavTree here={none} />)
    await user.click(screen.getByTestId('toggle-measurements'))
    await user.click(screen.getByTestId('toggle-multimeter'))
    const c = counter()
    await user.click(screen.getByTestId('toggle-multimeter'))
    expect(c.leaf).toBe(0)
  })

  it('changing the current page re-renders only the two rows involved', () => {
    const { rerender } = render(<NavTree here={locate({ topic: 'rc-tau' })} />)
    const c = counter()
    rerender(<NavTree here={locate({ topic: 'rc-charging' })} />)
    expect(c.leaf).toBe(2) // the row that lost the highlight and the one that gained it
    expect(c.chapter).toBeLessThanOrEqual(1)
  })

  it('a long list stays cheap: opening every chapter renders each topic exactly once', async () => {
    const user = userEvent.setup()
    render(<NavTree here={none} />)
    const c = counter()
    for (const p of PARTS) {
      await user.click(screen.getByTestId(`toggle-${p.id}`))
      for (const ch of p.chapters) await user.click(screen.getByTestId(`toggle-${ch.id}`))
    }
    const topics = document.querySelectorAll('[data-testid^="nav-topic-"]').length
    expect(c.leaf).toBe(topics)
  })

  it('the sidebar uses plain elements for rows (no per-row styled wrappers)', () => {
    render(<NavTree here={locate({ topic: 'r-series' })} />)
    const row = screen.getByTestId('nav-topic-r-series')
    expect(row.tagName).toBe('A')
    expect(row.className).not.toMatch(/Mui|css-/)
  })

  it('expand/collapse is instant: children are mounted/unmounted, with no animation at all (a fade also made axe measure half-transparent text)', async () => {
    const user = userEvent.setup()
    render(<NavTree here={none} />)
    await user.click(screen.getByTestId('toggle-components'))
    await user.click(screen.getByTestId('toggle-resistors'))
    expect(screen.getByTestId('nav-topic-r-series')).toBeVisible() // immediately — no waiting for a transition
    await user.click(screen.getByTestId('toggle-resistors'))
    expect(screen.queryByTestId('nav-topic-r-series')).not.toBeInTheDocument()
    expect(document.querySelector('.MuiCollapse-root')).toBeNull()
  })
})

describe('calculator typing', () => {
  it('editing one of ten resistor rows re-renders that row only', async () => {
    const user = userEvent.setup()
    render(<Calculator formula={formulaById('r-parallel-n')!} />)
    await user.click(screen.getByTestId('mode-withV'))
    for (let i = 0; i < 8; i++) await user.click(screen.getByRole('button', { name: 'Add another' }))
    for (let i = 0; i < 10; i++) await user.type(screen.getByTestId(`in-R-${i}`), '1000')
    await user.type(screen.getByTestId('in-V'), '5')
    const seen: string[] = []
    inputHooks.onRender = (id) => seen.push(id)
    await user.type(screen.getByTestId('in-R-4'), '7')
    expect(seen.length).toBeGreaterThan(0)
    expect(new Set(seen)).toEqual(new Set(['R:4'])) // none of the other 9 rows or the voltage field rendered
  })

  it('typing in the supply voltage does not re-render the resistor rows', async () => {
    const user = userEvent.setup()
    render(<Calculator formula={formulaById('r-parallel-n')!} />)
    await user.click(screen.getByTestId('mode-withV'))
    await user.click(screen.getByTestId('use-example'))
    const seen: string[] = []
    inputHooks.onRender = (id) => seen.push(id)
    await user.clear(screen.getByTestId('in-V')); await user.type(screen.getByTestId('in-V'), '9')
    expect(new Set(seen)).toEqual(new Set(['V']))
  })
})

describe('mode tabs (replaced MUI Tabs, which measured layout on every render)', () => {
  const tabs = [{ id: 'a', label: 'Find A' }, { id: 'b', label: 'Find B' }, { id: 'c', label: 'Find C' }]

  it('is an accessible tab list with a roving tabindex', () => {
    render(<ModeTabs tabs={tabs} value="b" onChange={() => {}} label="Choose" />)
    const list = screen.getByRole('tablist', { name: 'Choose' })
    const t = within(list).getAllByRole('tab')
    expect(t.map((x) => x.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false'])
    expect(t.map((x) => x.tabIndex)).toEqual([-1, 0, -1])
  })

  it('arrow keys, Home and End move between tabs (wrapping), and clicking selects', async () => {
    const user = userEvent.setup()
    const picked: string[] = []
    const { rerender } = render(<ModeTabs tabs={tabs} value="a" onChange={(id) => picked.push(id)} label="Choose" />)
    screen.getByRole('tab', { name: 'Find A' }).focus()
    await user.keyboard('{ArrowRight}'); expect(picked.at(-1)).toBe('b')
    await user.keyboard('{ArrowLeft}'); expect(picked.at(-1)).toBe('c') // wraps from the first to the last
    await user.keyboard('{End}'); expect(picked.at(-1)).toBe('c')
    await user.keyboard('{Home}'); expect(picked.at(-1)).toBe('a')
    rerender(<ModeTabs tabs={tabs} value="a" onChange={(id) => picked.push(id)} label="Choose" />)
    await user.click(screen.getByRole('tab', { name: 'Find C' }))
    expect(picked.at(-1)).toBe('c')
  })
})
