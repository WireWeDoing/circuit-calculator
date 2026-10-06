import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App.tsx'
import { FORMULAS, formulaById } from '../src/formulas/index.ts'
import { FormulaPage } from '../src/ui/FormulaPage.tsx'
import { absoluteUrl, copyText, shareLink } from '../src/ui/share.ts'
import { ToastProvider } from '../src/ui/toast.tsx'

const go = (hash: string) => act(() => { window.location.hash = hash; window.dispatchEvent(new HashChangeEvent('hashchange')) })
let written: string[]
const mockClipboard = () => { written = []; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn(async (t: string) => { written.push(t) }) } }) }

beforeEach(() => { localStorage.clear(); window.location.hash = ''; mockClipboard() })
afterEach(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }); Object.defineProperty(navigator, 'share', { configurable: true, value: undefined }); vi.restoreAllMocks() })

describe('share helpers', () => {
  it('builds absolute URLs that keep the origin and path', () => {
    expect(absoluteUrl('#/topic/ohms-law/result')).toBe(`${window.location.origin}${window.location.pathname}#/topic/ohms-law/result`)
  })
  it('copies with the clipboard API, and reports failure instead of throwing', async () => {
    expect(await copyText('hello')).toBe(true)
    expect(written).toEqual(['hello'])
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('denied') } } })
    expect(await copyText('x')).toBe(false) // jsdom has no execCommand either
  })
  it('falls back to execCommand when there is no clipboard API', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    document.execCommand = vi.fn(() => true)
    expect(await copyText('x')).toBe(true)
    expect(document.execCommand).toHaveBeenCalledWith('copy')
  })
  it('uses the native share sheet on touch devices, and copies when the user is on a mouse device', async () => {
    const share = vi.fn(async () => {})
    Object.defineProperty(navigator, 'share', { configurable: true, value: share })
    window.matchMedia = ((q: string) => ({ matches: q.includes('coarse'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as typeof window.matchMedia
    expect(await shareLink({ url: 'https://x/#/', title: 'T' })).toBe('shared')
    expect(share).toHaveBeenCalledWith({ url: 'https://x/#/', title: 'T' })
    share.mockRejectedValueOnce(Object.assign(new Error('closed'), { name: 'AbortError' }))
    expect(await shareLink({ url: 'u', title: 'T' })).toBe('cancelled')
    expect(written).toEqual([]) // cancelling the sheet must not also copy
    window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as typeof window.matchMedia
    expect(await shareLink({ url: 'u2', title: 'T' })).toBe('copied')
    expect(written).toEqual(['u2'])
  })
})

describe('share button in the app bar', () => {
  it('is on every page, named, and copies the address you are on', async () => {
    const user = userEvent.setup()
    render(<App />)
    const btn = screen.getByRole('button', { name: 'Share this page' })
    await user.click(btn)
    await waitFor(async () => expect(await navigator.clipboard.readText()).toBe(window.location.href)) // user-event provides its own clipboard
    expect(await screen.findByText('Link copied')).toBeInTheDocument()
    go('#/topic/rc-tau')
    await screen.findByRole('heading', { level: 1, name: 'RC time constant' })
    await user.click(screen.getByRole('button', { name: 'Share this page' }))
    await waitFor(async () => expect(await navigator.clipboard.readText()).toMatch(/#\/topic\/rc-tau$/))
  })
  it('shares the card link when the page was opened on one', async () => {
    const user = userEvent.setup()
    go('#/topic/rc-tau/variables')
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Share this page' }))
    await waitFor(async () => expect(await navigator.clipboard.readText()).toMatch(/#\/topic\/rc-tau\/variables$/))
  })
})

describe('a link button on every card of a topic page', () => {
  const page = (id: string, anchor?: string) => render(<ToastProvider><FormulaPage formula={formulaById(id)!} anchor={anchor} /></ToastProvider>)

  it('copies the URL of that card and says so', async () => {
    const user = userEvent.setup()
    page('ohms-law')
    await user.click(screen.getByRole('button', { name: 'Copy link to Variables' }))
    expect(await navigator.clipboard.readText()).toBe(absoluteUrl('#/topic/ohms-law/variables'))
    expect(await screen.findByText('Link to “Variables” copied')).toBeInTheDocument()
  })

  it('calculator cards each have one: inputs, result, diagram, units, variables', () => {
    page('ohms-law')
    for (const id of ['inputs', 'result', 'diagram', 'units', 'variables']) expect(screen.getByTestId(`share-${id}`), id).toHaveAccessibleName(/^Copy link to /)
  })

  it('"How it was calculated" and "Each part in detail" get one once they appear', async () => {
    const user = userEvent.setup()
    page('r-parallel-n')
    expect(screen.queryByTestId('share-steps')).not.toBeInTheDocument()
    await user.click(screen.getByTestId('use-example'))
    expect(screen.getByTestId('share-steps')).toBeInTheDocument()
    expect(screen.getByTestId('share-breakdown')).toBeInTheDocument()
  })

  it('reference pages: one per section, named after its heading', () => {
    page('multimeter')
    const f = formulaById('multimeter')!
    for (const b of f.article!) expect(screen.getByRole('button', { name: `Copy link to ${b.heading}` })).toBeInTheDocument()
  })

  it('every topic page: card ids are unique, every card has a link button with the same id, no stray ids', () => {
    for (const f of FORMULAS) {
      const { container, unmount } = page(f.id)
      const cards = [...container.querySelectorAll<HTMLElement>('[data-anchor]')]
      const ids = cards.map((c) => c.dataset.anchor!)
      expect(new Set(ids).size, `${f.id}: duplicate anchors ${ids.join(',')}`).toBe(ids.length)
      expect(ids.length, `${f.id} has no shareable card`).toBeGreaterThan(0)
      for (const c of cards) {
        expect(c.id).toBe(`sec-${c.dataset.anchor}`)
        expect(within(c).getByTestId(`share-${c.dataset.anchor}`), `${f.id}/${c.dataset.anchor}`).toBeInTheDocument()
        expect(c.dataset.anchor).toMatch(/^[a-z0-9-]+$/)
      }
      unmount()
    }
  })

  it('the card the URL points at is highlighted and scrolled to', async () => {
    const scroll = vi.fn()
    Element.prototype.scrollIntoView = scroll
    const { container } = page('ohms-law', 'variables')
    expect(container.querySelector('[data-anchor="variables"]')).toHaveAttribute('data-linked', 'true')
    expect(container.querySelector('[data-anchor="units"]')).not.toHaveAttribute('data-linked')
    await waitFor(() => expect(scroll).toHaveBeenCalledTimes(1))
    expect(scroll.mock.contexts[0]).toBe(container.querySelector('#sec-variables'))
  })

  it('a link to a card that only exists with a result falls back to the Result card; an unknown card scrolls nowhere', async () => {
    const scroll = vi.fn()
    Element.prototype.scrollIntoView = scroll
    const a = page('ohms-law', 'steps')
    await waitFor(() => expect(scroll).toHaveBeenCalledTimes(1))
    expect(scroll.mock.contexts[0]).toBe(a.container.querySelector('#sec-result'))
    a.unmount(); scroll.mockClear()
    page('ohms-law', 'nope')
    await act(async () => { await new Promise((r) => requestAnimationFrame(() => r(null))) })
    expect(scroll).not.toHaveBeenCalled()
  })

  it('in the app, opening a card link does not jump back to the top', async () => {
    const top = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    go('#/topic/ohms-law/variables')
    render(<App />)
    await screen.findByRole('heading', { level: 1, name: "Ohm's law" })
    expect(top).not.toHaveBeenCalled()
    go('#/topic/rc-tau')
    await screen.findByRole('heading', { level: 1, name: 'RC time constant' })
    expect(top).toHaveBeenCalled() // normal pages still start at the top
  })
})
