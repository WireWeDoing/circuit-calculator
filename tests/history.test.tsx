import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App.tsx'
import { MAX_HISTORY, popHistory, pushHistory, routeHref, routeKey, routeLabel } from '../src/ui/navHistory.ts'
import { NavTree } from '../src/ui/NavTree.tsx'
import type { Route } from '../src/ui/router.ts'

const home: Route = { page: 'home' }
const sec = (id: string): Route => ({ page: 'section', id })
const f = (id: string): Route => ({ page: 'formula', id })
const go = (hash: string) => act(() => { window.location.hash = hash; window.dispatchEvent(new HashChangeEvent('hashchange')) })

beforeEach(() => { localStorage.clear(); window.location.hash = '' })

describe('history stack (pure)', () => {
  it('remembers at most three pages, dropping the oldest', () => {
    expect(MAX_HISTORY).toBe(3)
    let s: Route[] = []
    for (const r of [home, sec('s1'), sec('s2'), sec('s3'), sec('s4')]) s = pushHistory(s, r)
    expect(s.map(routeKey)).toEqual(['section:s2', 'section:s3', 'section:s4'])
  })
  it('does not stack the same page twice in a row, but does allow A → B → A', () => {
    let s = pushHistory([], sec('s1'))
    s = pushHistory(s, sec('s1'))
    expect(s).toHaveLength(1)
    s = pushHistory(s, sec('s2')); s = pushHistory(s, sec('s1'))
    expect(s.map(routeKey)).toEqual(['section:s1', 'section:s2', 'section:s1'])
  })
  it('pop returns the most recent page and leaves the rest', () => {
    const { target, rest } = popHistory([sec('s1'), sec('s2'), sec('s3')])
    expect(routeKey(target!)).toBe('section:s3')
    expect(rest.map(routeKey)).toEqual(['section:s1', 'section:s2'])
    expect(popHistory([])).toEqual({ target: undefined, rest: [] })
  })
  it('does not mutate its input', () => {
    const s = [sec('s1')]
    pushHistory(s, sec('s2')); popHistory(s)
    expect(s).toHaveLength(1)
  })
  it('names pages for "Back to …" and builds links', () => {
    expect(routeLabel(home)).toBe('Home')
    expect(routeLabel(sec('s2'))).toBe('Resistors')
    expect(routeLabel(f('ohms-law'))).toBe("Ohm's law")
    expect(routeLabel(f('nope'))).toBe('Page')
    expect(routeHref(home)).toBe('#/'); expect(routeHref(sec('s2'))).toBe('#/s/s2'); expect(routeHref(f('ohms-law'))).toBe('#/f/ohms-law')
  })
})

describe('app bar', () => {
  it('menu button on every page; no parent-arrow; Back appears only once there is somewhere to go back to', async () => {
    render(<App />)
    expect(screen.getByTestId('menu-button')).toBeInTheDocument()
    expect(screen.queryByTestId('back-button')).not.toBeInTheDocument()
    go('#/f/ohms-law')
    expect(await screen.findByRole('heading', { level: 1, name: "Ohm's law" })).toBeInTheDocument()
    expect(screen.getByTestId('menu-button')).toHaveAccessibleName('Open sections menu') // child page: menu, not a back arrow
    expect(screen.queryByRole('link', { name: 'Back' })).not.toBeInTheDocument()
    expect(screen.getByTestId('back-button')).toHaveAccessibleName('Back to Home')
  })

  it('Back jumps to the previous page, and again, up to three pages', async () => {
    const user = userEvent.setup()
    render(<App />)
    go('#/s/s2'); go('#/s/s3'); go('#/f/rc-tau'); go('#/f/ohms-law')
    expect(screen.getByTestId('back-button')).toHaveAccessibleName('Back to RC time constant')
    expect(screen.getByTestId('back-count')).toHaveTextContent('3') // Home fell off: only the last three are kept
    await user.click(screen.getByTestId('back-button'))
    expect(await screen.findByRole('heading', { level: 1, name: 'RC time constant' })).toBeInTheDocument()
    expect(screen.getByTestId('back-button')).toHaveAccessibleName('Back to Capacitors')
    await user.click(screen.getByTestId('back-button'))
    expect(await screen.findByRole('heading', { level: 1, name: 'Capacitors' })).toBeInTheDocument()
    await user.click(screen.getByTestId('back-button'))
    expect(await screen.findByRole('heading', { level: 1, name: 'Resistors' })).toBeInTheDocument()
    expect(screen.queryByTestId('back-button')).not.toBeInTheDocument() // Home was dropped (4th page back)
  })

  it('the example from the brief: resistors → capacitors → Back → resistors', async () => {
    const user = userEvent.setup()
    render(<App />)
    go('#/s/s2'); go('#/s/s3')
    await user.click(screen.getByTestId('back-button'))
    expect(await screen.findByRole('heading', { level: 1, name: 'Resistors' })).toBeInTheDocument()
  })

  it('pressing Back does not re-add the page you left (no ping-pong)', async () => {
    const user = userEvent.setup()
    render(<App />)
    go('#/s/s2'); go('#/s/s3')
    await user.click(screen.getByTestId('back-button')) // → Resistors
    await user.click(screen.getByTestId('back-button')) // → Home (stack was [Home, Resistors])
    expect(await screen.findByRole('heading', { level: 1, name: /Electronics cheat sheet/ })).toBeInTheDocument()
    expect(screen.queryByTestId('back-button')).not.toBeInTheDocument() // nothing left; Capacitors was not re-added
  })

  it('the menu still works at the same time as Back', async () => {
    const user = userEvent.setup()
    render(<App />)
    go('#/s/s2'); go('#/f/rc-tau')
    await user.click(screen.getByTestId('menu-button'))
    const nav = await screen.findByRole('navigation', { name: 'Sections' })
    await user.click(within(nav).getByTestId('toggle-s1'))
    await user.click(within(nav).getByTestId('nav-topic-ohms-law'))
    expect(await screen.findByRole('heading', { level: 1, name: "Ohm's law" })).toBeInTheDocument()
    expect(screen.getByTestId('back-button')).toHaveAccessibleName('Back to RC time constant') // jumping via the menu is remembered too
  })

  it('is kept in memory only (a fresh app starts with no Back)', () => {
    go('#/f/ohms-law')
    const first = render(<App />)
    first.unmount()
    window.location.hash = ''
    render(<App />)
    expect(screen.queryByTestId('back-button')).not.toBeInTheDocument()
  })
})

describe('sidebar highlight', () => {
  it('marks the open topic (selected + aria-current), one row only', () => {
    render(<NavTree sectionId="s3" formulaId="rc-tau" />)
    const row = screen.getByTestId('nav-topic-rc-tau')
    expect(row).toHaveAttribute('aria-current', 'page')
    expect(row.className).toMatch(/is-current/)
    expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1)
    expect(screen.getByTestId('nav-topic-cap-charge').className).not.toMatch(/is-current/)
  })

  /** jsdom has no layout, so give the sidebar scroller and the current row fake rectangles */
  function withRects(rowRect: { top: number; bottom: number }) {
    const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const r = this.getAttribute('aria-current') === 'page' ? { ...rowRect, height: 44 } : this.classList.contains('MuiDrawer-paper') ? { top: 0, bottom: 800, height: 800 } : { top: 0, bottom: 0, height: 0 }
      return { x: 0, y: r.top, left: 0, right: 0, width: 0, toJSON: () => ({}), ...r } as DOMRect
    })
    return spy
  }

  it('scrolls the sidebar (not the page) to the open topic when it is out of view', async () => {
    const spy = withRects({ top: 1500, bottom: 1544 })
    const pageScroll = vi.fn(); Element.prototype.scrollIntoView = pageScroll
    render(<div className="MuiDrawer-paper"><NavTree sectionId="s3" formulaId="rc-tau" /></div>)
    const scroller = document.querySelector('.MuiDrawer-paper') as HTMLElement
    await waitFor(() => expect(scroller.scrollTop).toBeGreaterThan(1000)) // centred: 1500 − (800 − 44)/2
    expect(pageScroll).not.toHaveBeenCalled() // the expensive whole-page scroll is gone
    spy.mockRestore()
  })

  it('does not scroll at all when the open topic is already visible', async () => {
    const spy = withRects({ top: 200, bottom: 244 })
    render(<div className="MuiDrawer-paper"><NavTree sectionId="s3" formulaId="rc-tau" /></div>)
    const scroller = document.querySelector('.MuiDrawer-paper') as HTMLElement
    await act(async () => { await new Promise((r) => requestAnimationFrame(() => r(null))) })
    expect(scroller.scrollTop).toBe(0)
    spy.mockRestore()
  })

  it('expanding or collapsing a branch never moves the scroll position', async () => {
    const spy = withRects({ top: 1500, bottom: 1544 })
    const user = userEvent.setup()
    render(<div className="MuiDrawer-paper"><NavTree sectionId="s3" formulaId="rc-tau" /></div>)
    const scroller = document.querySelector('.MuiDrawer-paper') as HTMLElement
    await waitFor(() => expect(scroller.scrollTop).toBeGreaterThan(0))
    const before = scroller.scrollTop
    await user.click(screen.getByTestId('toggle-s2'))
    await user.click(screen.getByTestId('toggle-s2'))
    await act(async () => { await new Promise((r) => requestAnimationFrame(() => r(null))) })
    expect(scroller.scrollTop).toBe(before)
    spy.mockRestore()
  })

  it('highlights the section row when on a section page, and a §17 topic inside its sub-section', () => {
    const a = render(<NavTree sectionId="s6" />)
    expect(a.container.querySelector('[aria-current="page"]')?.textContent).toMatch(/6\. Diodes/)
    a.unmount()
    render(<NavTree sectionId="s17" formulaId="p9-time-to-voltage" />)
    expect(screen.getByTestId('nav-topic-p9-time-to-voltage')).toHaveAttribute('aria-current', 'page')
  })

  it('the drawer opened from a child page shows that page highlighted', async () => {
    const user = userEvent.setup()
    render(<App />)
    go('#/f/rl-cutoff')
    await user.click(await screen.findByTestId('menu-button'))
    const nav = await screen.findByRole('navigation', { name: 'Sections' })
    expect(within(nav).getByTestId('nav-topic-rl-cutoff')).toHaveAttribute('aria-current', 'page')
  })
})
