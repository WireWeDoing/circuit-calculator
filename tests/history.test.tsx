import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App.tsx'
import { MAX_HISTORY, popHistory, pushHistory, routeHref, routeKey, routeLabel } from '../src/ui/navHistory.ts'
import { NavTree, locate } from '../src/ui/NavTree.tsx'
import type { Route } from '../src/ui/router.ts'

const home: Route = { page: 'home' }
const ch = (id: string): Route => ({ page: 'chapter', id })
const f = (id: string): Route => ({ page: 'topic', id })
const go = (hash: string) => act(() => { window.location.hash = hash; window.dispatchEvent(new HashChangeEvent('hashchange')) })

beforeEach(() => { localStorage.clear(); window.location.hash = '' })

describe('history stack (pure)', () => {
  it('remembers at most three pages, dropping the oldest', () => {
    expect(MAX_HISTORY).toBe(3)
    let s: Route[] = []
    for (const r of [home, ch('units'), ch('resistors'), ch('capacitors'), ch('inductors')]) s = pushHistory(s, r)
    expect(s.map(routeKey)).toEqual(['chapter:resistors', 'chapter:capacitors', 'chapter:inductors'])
  })
  it('does not stack the same page twice in a row, but does allow A → B → A', () => {
    let s = pushHistory([], ch('units'))
    s = pushHistory(s, ch('units'))
    expect(s).toHaveLength(1)
    s = pushHistory(s, ch('resistors')); s = pushHistory(s, ch('units'))
    expect(s.map(routeKey)).toEqual(['chapter:units', 'chapter:resistors', 'chapter:units'])
  })
  it('pop returns the most recent page and leaves the rest', () => {
    const { target, rest } = popHistory([ch('units'), ch('resistors'), ch('capacitors')])
    expect(routeKey(target!)).toBe('chapter:capacitors')
    expect(rest.map(routeKey)).toEqual(['chapter:units', 'chapter:resistors'])
    expect(popHistory([])).toEqual({ target: undefined, rest: [] })
  })
  it('does not mutate its input', () => {
    const s = [ch('units')]
    pushHistory(s, ch('resistors')); popHistory(s)
    expect(s).toHaveLength(1)
  })
  it('names pages for "Back to …" and builds links', () => {
    expect(routeLabel(home)).toBe('Home')
    expect(routeLabel(ch('resistors'))).toBe('Resistors')
    expect(routeLabel(f('ohms-law'))).toBe("Ohm's law")
    expect(routeLabel(f('nope'))).toBe('Page')
    expect(routeHref(home)).toBe('#/'); expect(routeHref(ch('resistors'))).toBe('#/chapter/resistors'); expect(routeHref(f('ohms-law'))).toBe('#/topic/ohms-law')
  })
})

describe('app bar', () => {
  it('menu button on every page; no parent-arrow; Back appears only once there is somewhere to go back to', async () => {
    render(<App />)
    expect(screen.getByTestId('menu-button')).toBeInTheDocument()
    expect(screen.queryByTestId('back-button')).not.toBeInTheDocument()
    go('#/topic/ohms-law')
    expect(await screen.findByRole('heading', { level: 1, name: "Ohm's law" })).toBeInTheDocument()
    expect(screen.getByTestId('menu-button')).toHaveAccessibleName('Open contents menu') // child page: menu, not a back arrow
    expect(screen.queryByRole('link', { name: 'Back' })).not.toBeInTheDocument()
    expect(screen.getByTestId('back-button')).toHaveAccessibleName('Back to Home')
  })

  it('Back jumps to the previous page, and again, up to three pages', async () => {
    const user = userEvent.setup()
    render(<App />)
    go('#/chapter/resistors'); go('#/chapter/capacitors'); go('#/topic/rc-tau'); go('#/topic/ohms-law')
    expect(screen.getByTestId('back-button')).toHaveAccessibleName('Back to RC time constant')
    expect(screen.getByTestId('back-count')).toHaveTextContent('3') // Home fell off: only the last three are kept
    await user.click(screen.getByTestId('back-button'))
    expect(await screen.findByRole('heading', { level: 1, name: 'RC time constant' })).toBeInTheDocument()
    expect(screen.getByTestId('back-button')).toHaveAccessibleName('Back to Capacitors')
    await user.click(screen.getByTestId('back-button'))
    expect(await screen.findByRole('heading', { level: 1, name: '4.3 Capacitors' })).toBeInTheDocument()
    await user.click(screen.getByTestId('back-button'))
    expect(await screen.findByRole('heading', { level: 1, name: '4.2 Resistors' })).toBeInTheDocument()
    expect(screen.queryByTestId('back-button')).not.toBeInTheDocument() // Home was dropped (4th page back)
  })

  it('the example from the brief: resistors → capacitors → Back → resistors', async () => {
    const user = userEvent.setup()
    render(<App />)
    go('#/chapter/resistors'); go('#/chapter/capacitors')
    await user.click(screen.getByTestId('back-button'))
    expect(await screen.findByRole('heading', { level: 1, name: '4.2 Resistors' })).toBeInTheDocument()
  })

  it('pressing Back does not re-add the page you left (no ping-pong)', async () => {
    const user = userEvent.setup()
    render(<App />)
    go('#/chapter/resistors'); go('#/chapter/capacitors')
    await user.click(screen.getByTestId('back-button')) // → Resistors
    await user.click(screen.getByTestId('back-button')) // → Home (stack was [Home, Resistors])
    expect(await screen.findByRole('heading', { level: 1, name: /Electronics, step by step/ })).toBeInTheDocument()
    expect(screen.queryByTestId('back-button')).not.toBeInTheDocument() // nothing left; Capacitors was not re-added
  })

  it('the menu still works at the same time as Back', async () => {
    const user = userEvent.setup()
    render(<App />)
    go('#/chapter/resistors'); go('#/topic/rc-tau')
    await user.click(screen.getByTestId('menu-button'))
    const nav = await screen.findByRole('navigation', { name: 'Book contents' })
    await user.click(within(nav).getByTestId('toggle-basics'))
    await user.click(within(nav).getByTestId('toggle-voltage-current-resistance'))
    await user.click(within(nav).getByTestId('nav-topic-ohms-law'))
    expect(await screen.findByRole('heading', { level: 1, name: "Ohm's law" })).toBeInTheDocument()
    expect(screen.getByTestId('back-button')).toHaveAccessibleName('Back to RC time constant') // jumping via the menu is remembered too
  })

  it('is kept in memory only (a fresh app starts with no Back)', () => {
    go('#/topic/ohms-law')
    const first = render(<App />)
    first.unmount()
    window.location.hash = ''
    render(<App />)
    expect(screen.queryByTestId('back-button')).not.toBeInTheDocument()
  })
})

describe('sidebar highlight', () => {
  it('marks the open topic (selected + aria-current), one row only', () => {
    render(<NavTree here={locate({ topic: 'rc-tau' })} />)
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
    render(<div className="MuiDrawer-paper"><NavTree here={locate({ topic: 'rc-tau' })} /></div>)
    const scroller = document.querySelector('.MuiDrawer-paper') as HTMLElement
    await waitFor(() => expect(scroller.scrollTop).toBeGreaterThan(1000)) // centred: 1500 − (800 − 44)/2
    expect(pageScroll).not.toHaveBeenCalled() // the expensive whole-page scroll is gone
    spy.mockRestore()
  })

  it('does not scroll at all when the open topic is already visible', async () => {
    const spy = withRects({ top: 200, bottom: 244 })
    render(<div className="MuiDrawer-paper"><NavTree here={locate({ topic: 'rc-tau' })} /></div>)
    const scroller = document.querySelector('.MuiDrawer-paper') as HTMLElement
    await act(async () => { await new Promise((r) => requestAnimationFrame(() => r(null))) })
    expect(scroller.scrollTop).toBe(0)
    spy.mockRestore()
  })

  it('expanding or collapsing a branch never moves the scroll position', async () => {
    const spy = withRects({ top: 1500, bottom: 1544 })
    const user = userEvent.setup()
    render(<div className="MuiDrawer-paper"><NavTree here={locate({ topic: 'rc-tau' })} /></div>)
    const scroller = document.querySelector('.MuiDrawer-paper') as HTMLElement
    await waitFor(() => expect(scroller.scrollTop).toBeGreaterThan(0))
    const before = scroller.scrollTop
    await user.click(screen.getByTestId('toggle-measurements'))
    await user.click(screen.getByTestId('toggle-measurements'))
    await act(async () => { await new Promise((r) => requestAnimationFrame(() => r(null))) })
    expect(scroller.scrollTop).toBe(before)
    spy.mockRestore()
  })

  it('highlights the chapter row on a chapter page, and a worked problem inside its chapter', () => {
    const a = render(<NavTree here={locate({ chapter: 'diodes-leds' })} />)
    expect(a.container.querySelector('[aria-current="page"]')?.textContent).toMatch(/4\.5 Diodes/)
    a.unmount()
    render(<NavTree here={locate({ topic: 'p9-time-to-voltage' })} />)
    expect(screen.getByTestId('nav-topic-p9-time-to-voltage')).toHaveAttribute('aria-current', 'page')
  })

  it('the drawer opened from a child page shows that page highlighted', async () => {
    const user = userEvent.setup()
    render(<App />)
    go('#/topic/rl-cutoff')
    await user.click(await screen.findByTestId('menu-button'))
    const nav = await screen.findByRole('navigation', { name: 'Book contents' })
    expect(within(nav).getByTestId('nav-topic-rl-cutoff')).toHaveAttribute('aria-current', 'page')
  })
})
