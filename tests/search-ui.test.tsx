import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../src/App.tsx'
import { SECTIONS } from '../src/formulas/index.ts'

const go = (hash: string) => act(() => { window.location.hash = hash; window.dispatchEvent(new HashChangeEvent('hashchange')) })
beforeEach(() => { localStorage.clear(); window.location.hash = '' })

async function openSearch(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId('search-button'))
  return screen.findByTestId('search-input')
}

describe('search dialog', () => {
  it('has a labelled search icon in the app bar; opens focused and lists the sections to begin with', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('button', { name: 'Search sections and topics' })).toBeInTheDocument()
    const input = await openSearch(user)
    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('role', 'combobox')
    const list = screen.getByTestId('search-results')
    expect(within(list).getAllByRole('option')).toHaveLength(SECTIONS.length)
    expect(screen.getByTestId('search-status')).toHaveTextContent(/Type to search/)
  })

  it('finds sections and topics by title as you type, sections first', async () => {
    const user = userEvent.setup()
    render(<App />)
    const input = await openSearch(user)
    await user.type(input, 'capac')
    const options = within(screen.getByTestId('search-results')).getAllByRole('option')
    expect(options[0]).toHaveAttribute('data-testid', 'result-section-s3')
    expect(options[0]).toHaveTextContent('Capacitors')
    expect(screen.getByTestId('result-topic-cap-reactance')).toHaveTextContent('3. Capacitors') // shows where the topic lives
    expect(screen.getByTestId('search-status')).toHaveTextContent(/\d+ results?/)
    // typed text is highlighted in the titles
    expect(options[0]!.querySelector('mark')?.textContent?.toLowerCase()).toBe('capac')
  })

  it('shows a friendly empty state', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(await openSearch(user), 'qwertyzz')
    expect(screen.getByTestId('search-empty')).toHaveTextContent(/No section or topic title matches/)
    expect(screen.getByTestId('search-status')).toHaveTextContent('0 results')
  })

  it('click a result: navigates there, closes, and the previous page is remembered for Back', async () => {
    const user = userEvent.setup()
    render(<App />)
    go('#/s/s2')
    await user.type(await openSearch(user), 'rc time')
    await user.click(screen.getByTestId('result-topic-rc-tau'))
    expect(await screen.findByRole('heading', { level: 1, name: 'RC time constant' })).toBeInTheDocument()
    expect(screen.queryByTestId('search-input')).not.toBeInTheDocument()
    expect(screen.getByTestId('back-button')).toHaveAccessibleName('Back to Resistors')
  })

  it('keyboard: arrows move the highlight, Enter opens it, Esc closes', async () => {
    const user = userEvent.setup()
    render(<App />)
    const input = await openSearch(user)
    await user.type(input, 'series')
    const opts = () => within(screen.getByTestId('search-results')).getAllByRole('option')
    expect(opts()[0]).toHaveAttribute('aria-selected', 'true')
    expect(input).toHaveAttribute('aria-activedescendant', opts()[0]!.id)
    await user.keyboard('{ArrowDown}')
    expect(opts()[1]).toHaveAttribute('aria-selected', 'true')
    expect(opts()[0]).toHaveAttribute('aria-selected', 'false')
    expect(input).toHaveAttribute('aria-activedescendant', opts()[1]!.id)
    await user.keyboard('{ArrowUp}{ArrowUp}') // can't go above the first
    expect(opts()[0]).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowDown}{Enter}')
    await waitFor(() => expect(screen.queryByTestId('search-input')).not.toBeInTheDocument()) // closing animates
    expect(window.location.hash).toMatch(/^#\/(s|f)\//)
    // reopen and press Escape
    await openSearch(user)
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByTestId('search-input')).not.toBeInTheDocument())
  })

  it('Enter on the first hit opens exactly that page', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(await openSearch(user), 'voltage divider{Enter}')
    expect(await screen.findByRole('heading', { level: 1, name: 'Voltage divider' })).toBeInTheDocument()
  })

  it('shortcuts: Ctrl+K and "/" open it; "/" does not hijack typing in a field', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.keyboard('{Control>}k{/Control}')
    expect(await screen.findByTestId('search-input')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await act(async () => { await new Promise((r) => setTimeout(r, 400)) })
    await user.keyboard('/')
    expect(await screen.findByTestId('search-input')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await act(async () => { await new Promise((r) => setTimeout(r, 400)) })
    // typing "/" in the home page's own search field must not open the dialog
    await user.click(screen.getByTestId('search'))
    await user.keyboard('a/b')
    expect(screen.queryByTestId('search-input')).not.toBeInTheDocument()
    expect((screen.getByTestId('search') as HTMLInputElement).value).toBe('a/b')
  })

  it('forgets the old query when reopened', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(await openSearch(user), 'led')
    await user.click(screen.getByTestId('search-close'))
    await act(async () => { await new Promise((r) => setTimeout(r, 400)) })
    expect(((await openSearch(user)) as HTMLInputElement).value).toBe('')
  })
})
