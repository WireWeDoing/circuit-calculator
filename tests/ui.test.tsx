import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../src/App.tsx'
import { FORMULAS } from '../src/formulas/index.ts'
import { CHAPTERS, PARTS } from '../src/learn/book.ts'
import { FormulaPage } from '../src/ui/FormulaPage.tsx'
import { ChapterPage } from '../src/ui/BookPages.tsx'
import { Calculator } from '../src/ui/Calculator.tsx'
import { formulaById } from '../src/formulas/index.ts'
import { FLOW_VISUALS } from '../src/visuals/index.ts'

const go = (hash: string) => { act(() => { window.location.hash = hash; window.dispatchEvent(new HashChangeEvent('hashchange')) }) }
const BAD = /NaN|undefined|Infinity|\[object/

beforeEach(() => { window.location.hash = '' })

describe('every formula page renders for newcomers', () => {
  it.each(FORMULAS.map((f) => [f.id, f] as const))('%s: heading, equation, diagram, units note', (_id, f) => {
    const { container } = render(<FormulaPage formula={f} />)
    expect(screen.getByRole('heading', { level: 1, name: f.title })).toBeInTheDocument()
    expect(screen.getByTestId('equation')).toHaveTextContent(f.equation.slice(0, 6))
    expect(screen.getByTestId('meaning')).toBeInTheDocument()
    if (!f.article) expect(screen.getByTestId('units-note')).toBeInTheDocument()
    // a diagram (svg with an accessible name) is always present
    const svgs = container.querySelectorAll('svg[role="img"]')
    expect(svgs.length, `${f.id} needs a visualisation`).toBeGreaterThan(0)
    for (const s of svgs) expect(s.getAttribute('aria-label')?.length).toBeGreaterThan(8)
    expect(container.textContent).not.toMatch(BAD)
  })
})

describe('every calculator mode works end-to-end from the "use example" button', () => {
  const cases = FORMULAS.filter((f) => f.modes.length).flatMap((f) => f.modes.map((m) => [`${f.id} / ${m.id}`, f.id, m.id] as const))
  it.each(cases)('%s', async (_name, id, modeId) => {
    const f = formulaById(id)!
    const user = userEvent.setup()
    const { container } = render(<Calculator formula={f} />)
    if (f.modes.length > 1) await user.click(screen.getByTestId(`mode-${modeId}`))
    expect(screen.getByTestId('result')).toHaveAttribute('data-status', 'incomplete')
    await user.click(screen.getByTestId('use-example'))
    const mode = f.modes.find((m) => m.id === modeId)!
    expect(screen.getByTestId('result'), `${_name}: ${container.textContent}`).toHaveAttribute('data-status', 'ok')
    for (const o of mode.outputs) expect(screen.getByTestId(`out-${o}`).textContent).not.toMatch(BAD)
    expect(screen.getByTestId('steps').querySelectorAll('li').length).toBeGreaterThan(0)
    expect(container.textContent).not.toMatch(BAD)
    expect(container.querySelector('svg[role="img"]')).toBeTruthy()
    // clearing resets to incomplete again
    await user.click(screen.getByTestId('clear'))
    expect(screen.getByTestId('result')).toHaveAttribute('data-status', 'incomplete')
    expect(container.textContent).not.toMatch(BAD)
  })
})

describe('calculator behaviour', () => {
  it("Ohm's law: typing values with a unit prefix converts to base units", async () => {
    const user = userEvent.setup()
    render(<Calculator formula={formulaById('ohms-law')!} />)
    await user.click(screen.getByTestId('mode-V'))
    await user.type(screen.getByTestId('in-I'), '20')
    await user.selectOptions(screen.getByTestId('unit-in-I'), 'mA')
    await user.type(screen.getByTestId('in-R'), '4.7')
    await user.selectOptions(screen.getByTestId('unit-in-R'), 'kΩ')
    expect(screen.getByTestId('out-V')).toHaveTextContent('94 V')
    // the conversion is explained
    expect(screen.getByTestId('steps')).toHaveTextContent('20 mA = 0.02 A')
    expect(screen.getByTestId('steps')).toHaveTextContent('4.7 kΩ = 4700 Ω')
  })

  it('shows validation errors next to the field and no result', async () => {
    const user = userEvent.setup()
    render(<Calculator formula={formulaById('ohms-law')!} />)
    await user.click(screen.getByTestId('mode-R'))
    await user.type(screen.getByTestId('in-V'), '5')
    await user.type(screen.getByTestId('in-I'), '0')
    expect(screen.getByTestId('result')).toHaveAttribute('data-status', 'invalid')
    expect(screen.getByTestId('result-error')).toHaveTextContent(/greater than 0/)
    await user.clear(screen.getByTestId('in-I'))
    await user.type(screen.getByTestId('in-I'), '-1')
    expect(screen.getByTestId('result')).toHaveAttribute('data-status', 'invalid')
    expect(screen.getAllByText(/cannot be negative/).length).toBeGreaterThanOrEqual(1) // field helper text + result summary
    expect(screen.getByTestId('in-I')).toHaveAttribute('aria-invalid', 'true')
  })

  it('rejects non-numeric text', async () => {
    const user = userEvent.setup()
    render(<Calculator formula={formulaById('ohms-law')!} />)
    await user.type(screen.getByTestId('in-I'), 'abc')
    expect(screen.getByText(/plain number/)).toBeInTheDocument()
    expect(screen.getByTestId('in-I')).toHaveAttribute('aria-invalid', 'true')
  })

  it('accepts a decimal comma and scientific notation', async () => {
    const user = userEvent.setup()
    render(<Calculator formula={formulaById('ohms-law')!} />)
    await user.type(screen.getByTestId('in-I'), '2,5e-3')
    await user.type(screen.getByTestId('in-R'), '1000')
    expect(screen.getByTestId('out-V')).toHaveTextContent('2.5 V')
  })

  it('cross-field check: parallel reverse formula explains the impossible measurement', async () => {
    const user = userEvent.setup()
    render(<Calculator formula={formulaById('reverse-formulas')!} />)
    await user.click(screen.getByTestId('mode-Rp'))
    await user.type(screen.getByTestId('in-Rt'), '2000')
    await user.type(screen.getByTestId('in-R1'), '1000')
    expect(screen.getByTestId('result-error')).toHaveTextContent(/smaller than the known resistor/)
  })

  it('list inputs: add/remove rows and compute', async () => {
    const user = userEvent.setup()
    render(<Calculator formula={formulaById('r-parallel-n')!} />)
    const rows = () => screen.getAllByTestId(/^in-R-\d$/)
    expect(rows()).toHaveLength(2)
    await user.type(rows()[0]!, '1'); await user.selectOptions(screen.getByTestId('unit-in-R-0'), 'kΩ')
    await user.type(rows()[1]!, '2'); await user.selectOptions(screen.getByTestId('unit-in-R-1'), 'kΩ')
    await user.click(screen.getByRole('button', { name: 'Add another' }))
    expect(rows()).toHaveLength(3)
    expect(screen.getByTestId('result')).toHaveAttribute('data-status', 'incomplete')
    await user.type(rows()[2]!, '2'); await user.selectOptions(screen.getByTestId('unit-in-R-2'), 'kΩ')
    expect(screen.getByTestId('out-Rt')).toHaveTextContent('500 Ω')
    await user.click(screen.getByRole('button', { name: 'Remove R3' }))
    expect(rows()).toHaveLength(2)
    expect(screen.getByTestId('out-Rt')).toHaveTextContent('666.7 Ω')
  })

  it('switching mode changes the inputs and equation', async () => {
    const user = userEvent.setup()
    render(<Calculator formula={formulaById('ohms-law')!} />)
    expect(screen.getByTestId('mode-equation')).toHaveTextContent('V = I × R')
    await user.click(screen.getByTestId('mode-I'))
    expect(screen.getByTestId('mode-equation')).toHaveTextContent('I = V / R')
    expect(screen.queryByTestId('in-I')).not.toBeInTheDocument()
    expect(screen.getByTestId('in-V')).toBeInTheDocument()
  })

  it('presets fill a field (copper resistivity)', async () => {
    const user = userEvent.setup()
    render(<Calculator formula={formulaById('wire-resistance')!} />)
    await user.click(screen.getByRole('button', { name: 'Copper' }))
    expect((screen.getByTestId('in-rho') as HTMLInputElement).value).toBe('1.68e-8')
  })

  it('warnings are shown with the result (LED resistor → round up)', async () => {
    const user = userEvent.setup()
    render(<Calculator formula={formulaById('led-resistor')!} />)
    await user.click(screen.getByTestId('use-example'))
    expect(screen.getAllByTestId('warning')[0]).toHaveTextContent(/standard value/)
  })

  it('result region is an aria-live region', () => {
    render(<Calculator formula={formulaById('ohms-law')!} />)
    expect(screen.getByTestId('result')).toHaveAttribute('aria-live', 'polite')
  })
})

describe('app shell and navigation', () => {
  it('home lists the five parts with all their chapters, and has a labelled search', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    for (const p of PARTS) expect(within(screen.getByTestId(`part-${p.id}`)).getByRole('heading', { level: 2 })).toHaveTextContent(p.title)
    for (const c of CHAPTERS) expect(screen.getByTestId(`chapter-${c.id}`)).toHaveAttribute('href', `#/chapter/${c.id}`)
    expect(screen.getByLabelText(/Search formulas/)).toBeInTheDocument()
  })

  it('search finds formulas by name, symbol and keyword', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByTestId('search'), 'led')
    const list = screen.getByTestId('search-results')
    expect(within(list).getByText('LED series resistor')).toBeInTheDocument()
    await user.clear(screen.getByTestId('search'))
    await user.type(screen.getByTestId('search'), 'zzzz-nothing')
    expect(screen.getByRole('status')).toHaveTextContent('0 results')
  })

  it('routes: home → chapter → topic → back', async () => {
    render(<App />)
    go('#/chapter/capacitors')
    expect(await screen.findByRole('heading', { level: 1, name: '4.3 Capacitors' })).toBeInTheDocument()
    expect(document.title).toBe('Capacitors · Circuit Calculator')
    expect(screen.getByTestId('formula-rc-tau')).toHaveAttribute('href', '#/topic/rc-tau')
    go('#/topic/rc-tau')
    expect(await screen.findByRole('heading', { level: 1, name: 'RC time constant' })).toBeInTheDocument()
    // child pages show the menu button (not a parent-page arrow); the Back button goes to the page you came from
    expect(screen.getByRole('button', { name: 'Open contents menu' })).toBeInTheDocument()
    expect(screen.getByTestId('back-button')).toHaveAccessibleName('Back to Capacitors')
    expect(document.title).toContain('RC time constant')
  })

  it('unknown routes show a friendly message', async () => {
    render(<App />)
    go('#/topic/does-not-exist')
    expect(await screen.findByRole('alert')).toHaveTextContent(/not found/i)
    go('#/chapter/nope')
    expect(await screen.findByRole('alert')).toHaveTextContent(/not found/i)
    go('#/part/nope')
    expect(await screen.findByRole('alert')).toHaveTextContent(/not found/i)
  })

  it('opens the contents drawer; parts are collapsed parents with an icon each', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Open contents menu' }))
    const nav = await screen.findByRole('navigation', { name: 'Book contents' })
    for (const p of PARTS) {
      expect(within(nav).getByTestId(`nav-part-${p.id}`)).toBeInTheDocument()
      expect(within(nav).getByTestId(`nav-icon-${p.id}`).querySelector('svg')).toBeTruthy()
    }
    expect(within(nav).queryByTestId('nav-topic-ohms-law')).not.toBeInTheDocument() // children stay hidden until expanded
  })

  it('theme toggle cycles and persists', async () => {
    const user = userEvent.setup()
    render(<App />)
    const btn = screen.getByTestId('theme-toggle')
    expect(btn).toHaveAccessibleName(/Theme: system/)
    await user.click(btn)
    expect(screen.getByTestId('theme-toggle')).toHaveAccessibleName(/Theme: light/)
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('has a skip link and a main landmark', () => {
    render(<App />)
    expect(screen.getByText('Skip to content')).toHaveAttribute('href', '#main')
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('shows the datasheet disclaimer from the cheat sheet', () => {
    render(<App />)
    expect(screen.getByText(/always confirm device-specific limits/)).toBeInTheDocument()
  })
})

describe('tools', () => {
  it('colour code: decodes the cheat-sheet example and encodes a value', async () => {
    const user = userEvent.setup()
    render(<FormulaPage formula={formulaById('resistor-colour-code')!} />)
    expect(screen.getByTestId('colour-result')).toHaveTextContent('1 kΩ ±5%')
    await user.selectOptions(screen.getByTestId('band-2'), 'orange')
    expect(screen.getByTestId('colour-result')).toHaveTextContent('10 kΩ ±5%')
    await user.click(screen.getByRole('button', { name: '5 bands' }))
    expect(screen.getByTestId('colour-result')).toHaveTextContent('1 kΩ ±1%')
    await user.click(screen.getByRole('button', { name: '4 bands' }))
    await user.type(screen.getByTestId('colour-value'), '4.7')
    await user.selectOptions(screen.getByTestId('unit-colour-value'), 'kΩ')
    expect(screen.getByTestId('colour-bands')).toHaveTextContent('yellow – violet – red – gold')
  })

  it('units tool: prefix conversion and markings', async () => {
    const user = userEvent.setup()
    render(<FormulaPage formula={formulaById('units-and-prefixes')!} />)
    expect(screen.getByTestId('prefix-result')).toHaveTextContent('4.7 k = 4700')
    await user.clear(screen.getByTestId('prefix-value')); await user.type(screen.getByTestId('prefix-value'), '100')
    await user.selectOptions(screen.getByTestId('prefix-from'), 'n'); await user.selectOptions(screen.getByTestId('prefix-to'), 'µ')
    expect(screen.getByTestId('prefix-result')).toHaveTextContent('0.1 µ')
    expect(screen.getByTestId('marking-result')).toHaveTextContent('4.7 kΩ')
    fireEvent.change(screen.getByTestId('marking-input'), { target: { value: 'x' } })
    expect(screen.getByTestId('marking-result')).toHaveTextContent(/Use a form like/)
    await user.click(screen.getByRole('button', { name: '3-digit capacitor' }))
    expect(screen.getByTestId('marking-result')).toHaveTextContent('100 nF')
  })

  it('state of charge tool', () => {
    render(<FormulaPage formula={formulaById('state-of-charge')!} />)
    expect(screen.getByTestId('soc-result')).toHaveTextContent('50')
    fireEvent.change(screen.getByRole('slider'), { target: { value: '4.2' } })
    expect(screen.getByTestId('soc-result')).toHaveTextContent('100')
  })

  it('solving-method guide shows the six steps', () => {
    render(<FormulaPage formula={formulaById('solving-method')!} />)
    expect(screen.getByText(/Draw the circuit/)).toBeInTheDocument()
    expect(screen.getByText(/Check: put the result back/)).toBeInTheDocument()
  })

  it('reference-only formulas show their table', () => {
    render(<FormulaPage formula={formulaById('led-vf')!} />)
    expect(screen.getByRole('table', { name: 'Reference values' })).toHaveTextContent('Blue / white')
  })
})

describe('glossary for newcomers', () => {
  it('complex formulas explain their concepts', () => {
    render(<FormulaPage formula={formulaById('rc-charging')!} />)
    expect(screen.getByText(/New to this\? e \(Euler/)).toBeInTheDocument()
  })
})

describe('network diagrams follow what you type', () => {
  const partIds = (c: HTMLElement) => [...c.querySelectorAll('[data-testid^="part-"]')].map((e) => e.getAttribute('data-testid')!.replace('part-', ''))

  async function fillRows(user: ReturnType<typeof userEvent.setup>, key: string, values: string[]) {
    for (const [i, v] of values.entries()) {
      const input = screen.getByTestId(`in-${key}-${i}`)
      await user.clear(input); await user.type(input, v)
    }
  }

  it('parallel: four resistors → four branches with values, then current per branch from a supply voltage', async () => {
    const user = userEvent.setup()
    const { container } = render(<Calculator formula={formulaById('r-parallel-n')!} />)
    expect(partIds(container)).toEqual(['R1', 'R2']) // starts with the 2 empty rows
    await user.click(screen.getByRole('button', { name: 'Add another' }))
    await user.click(screen.getByRole('button', { name: 'Add another' }))
    expect(partIds(container)).toEqual(['R1', 'R2', 'R3', 'R4']) // diagram grows with the rows, even while empty
    await fillRows(user, 'R', ['1000', '2000', '2000', '500'])
    const svg = container.querySelector('svg[role="img"]')!
    expect(svg.textContent).toContain('1 kΩ'); expect(svg.textContent).toContain('500 Ω')
    expect(svg.textContent).toContain('Rt = 250 Ω')
    // shares shown without any supply
    expect(screen.getByTestId('breakdown')).toBeInTheDocument()
    // now add a supply voltage
    await user.click(screen.getByTestId('mode-withV'))
    await user.type(screen.getByTestId('in-V'), '5')
    expect(screen.getByTestId('out-I')).toHaveTextContent('20 mA')
    expect(screen.getByTestId('R1-I')).toHaveTextContent('5 mA')
    expect(screen.getByTestId('R2-I')).toHaveTextContent('2.5 mA')
    expect(screen.getByTestId('R4-I')).toHaveTextContent('10 mA')
    expect(screen.getByTestId('R3-V')).toHaveTextContent('5 V')
    expect(screen.getByTestId('row-total')).toHaveTextContent('20 mA')
    const text = container.querySelector('svg[role="img"]')!.textContent!
    expect(text).toContain('10 mA'); expect(text).toContain('same voltage across every branch: V = 5 V')
    expect(text).not.toMatch(/NaN|undefined/)
    // removing a row removes the branch
    await user.click(screen.getByRole('button', { name: 'Remove R4' }))
    expect(partIds(container)).toEqual(['R1', 'R2', 'R3'])
    expect(screen.getByTestId('out-I')).toHaveTextContent('10 mA')
  })

  it('series: voltage drop on each resistor and a second row of parts past five', async () => {
    const user = userEvent.setup()
    const { container } = render(<Calculator formula={formulaById('r-series')!} />)
    await user.click(screen.getByTestId('mode-withV'))
    for (let i = 0; i < 6; i++) await user.click(screen.getByRole('button', { name: 'Add another' })) // 8 rows
    expect(partIds(container)).toHaveLength(8)
    await fillRows(user, 'R', ['1000', '1000', '1000', '1000', '1000', '1000', '1000', '1000'])
    await user.type(screen.getByTestId('in-V'), '8')
    expect(screen.getByTestId('out-I')).toHaveTextContent('1 mA')
    for (let i = 1; i <= 8; i++) expect(screen.getByTestId(`R${i}-V`)).toHaveTextContent('1 V')
    expect(screen.getByTestId('row-total')).toHaveTextContent('8 V')
    const parts = [...container.querySelectorAll('[data-testid^="part-"]')]
    expect(parts).toHaveLength(8)
    // two rails: parts sit at two different heights
    const ys = new Set(parts.map((g) => /translate\(([\d.]+) ([\d.]+)\)/.exec(g.querySelector('g[transform]')!.getAttribute('transform')!)![2]))
    expect(ys.size).toBe(2)
  })

  it('capacitors: series shows the same charge and unequal voltages', async () => {
    const user = userEvent.setup()
    const { container } = render(<Calculator formula={formulaById('c-series')!} />)
    await user.click(screen.getByTestId('mode-withV'))
    await fillRows(user, 'C', ['10', '10'])
    await user.selectOptions(screen.getByTestId('unit-in-C-0'), 'µF'); await user.selectOptions(screen.getByTestId('unit-in-C-1'), 'µF')
    await user.type(screen.getByTestId('in-V'), '12')
    expect(screen.getByTestId('out-Ct')).toHaveTextContent('5 µF')
    expect(screen.getByTestId('C1-V')).toHaveTextContent('6 V')
    expect(container.querySelector('svg[role="img"]')!.textContent).toContain('same charge on every part')
  })

  it('two-resistor parallel formula draws its two parts and the current split', async () => {
    const user = userEvent.setup()
    const { container } = render(<Calculator formula={formulaById('r-parallel-2')!} />)
    await user.click(screen.getByTestId('mode-withI'))
    await user.click(screen.getByTestId('use-example'))
    expect(partIds(container)).toEqual(['R1', 'R2'])
    expect(screen.getByTestId('R1-I')).toHaveTextContent('12 mA')
    expect(screen.getByTestId('R2-I')).toHaveTextContent('6 mA')
  })

  it('invalid input hides the table (never shows stale or NaN numbers)', async () => {
    const user = userEvent.setup()
    render(<Calculator formula={formulaById('r-parallel-n')!} />)
    await user.click(screen.getByTestId('mode-withV'))
    await user.click(screen.getByTestId('use-example'))
    expect(screen.getByTestId('breakdown')).toBeInTheDocument()
    await user.clear(screen.getByTestId('in-R-0')); await user.type(screen.getByTestId('in-R-0'), '0')
    expect(screen.queryByTestId('breakdown')).not.toBeInTheDocument()
    expect(screen.getByTestId('result')).toHaveAttribute('data-status', 'invalid')
  })
})

describe('list thumbnails', () => {
  it('every topic in a chapter list shows a picture of what it calculates', () => {
    for (const c of CHAPTERS) {
      const { unmount } = render(<ChapterPage id={c.id} />)
      for (const id of c.items) {
        const f = formulaById(id)!
        const thumb = screen.getByTestId(`thumb-${f.id}`)
        expect(thumb.querySelector('svg'), `${f.id}`).toBeTruthy()
        expect(thumb).toHaveAttribute('aria-hidden', 'true') // decorative: the text link already names it
        expect(thumb.textContent).not.toMatch(/NaN|undefined|Infinity/)
      }
      unmount()
    }
  })
  it('thumbnails drop the captions that would be unreadable at that size', () => {
    render(<ChapterPage id="capacitors" />)
    expect(screen.getByTestId('thumb-rc-charging').textContent).not.toContain('Charging: 63%')
  })
  it('home cards and search results have pictures too', async () => {
    const user = userEvent.setup()
    render(<App />)
    for (const c of CHAPTERS) expect(screen.getByTestId(`thumb-chapter-${c.id}`).querySelector('svg')).toBeTruthy()
    await user.type(screen.getByTestId('search'), 'divider')
    expect(screen.getByTestId('thumb-voltage-divider')).toBeInTheDocument()
  })
  it('every chapter has a valid hero topic', () => {
    for (const c of CHAPTERS) expect(formulaById(c.hero), c.id).toBeDefined()
  })
})

describe('current-flow arrows', () => {
  const arrows = (c: HTMLElement) => [...c.querySelectorAll<SVGGElement>('svg[role="img"] [data-testid="flow-arrow"]')]
  const dirs = (c: HTMLElement) => Object.fromEntries(arrows(c).map((a) => [a.getAttribute('data-part') ?? '?', a.getAttribute('data-dir')!]))

  async function fillRows(user: ReturnType<typeof userEvent.setup>, key: string, values: string[]) {
    for (const [i, v] of values.entries()) { const el = screen.getByTestId(`in-${key}-${i}`); await user.clear(el); await user.type(el, v) }
  }

  beforeEach(() => { localStorage.clear() })

  it('parallel: one arrow per branch, all pointing down from the + rail (conventional)', async () => {
    const user = userEvent.setup()
    const { container } = render(<Calculator formula={formulaById('r-parallel-n')!} />)
    await user.click(screen.getByTestId('mode-withV'))
    expect(arrows(container)).toHaveLength(0) // nothing to show before the numbers exist
    await user.click(screen.getByTestId('use-example'))
    expect(dirs(container)).toEqual({ supply: 'up', R1: 'down', R2: 'down', R3: 'down', R4: 'down' }) // the supply arrow leaves the battery's + terminal upwards
  })

  it('series: top row flows right (away from +), bottom row flows back left', async () => {
    const user = userEvent.setup()
    const { container } = render(<Calculator formula={formulaById('r-series')!} />)
    await user.click(screen.getByTestId('mode-withV'))
    for (let i = 0; i < 6; i++) await user.click(screen.getByRole('button', { name: 'Add another' }))
    await fillRows(user, 'R', Array(8).fill('1000'))
    await user.type(screen.getByTestId('in-V'), '8')
    expect(dirs(container)).toEqual({ supply: 'up', R1: 'right', R2: 'right', R3: 'right', R4: 'right', R5: 'left', R6: 'left', R7: 'left', R8: 'left' })
    // the value sits right next to its arrow, inside the same part group
    for (let i = 1; i <= 8; i++) expect(container.querySelector(`[data-testid="part-R${i}"]`)!.textContent).toContain('1 mA')
  })

  it('electron-flow switch reverses every arrow, explains itself and is remembered', async () => {
    const user = userEvent.setup()
    const first = render(<Calculator formula={formulaById('r-parallel-n')!} />)
    await user.click(screen.getByTestId('mode-withV'))
    await user.click(screen.getByTestId('use-example'))
    expect(screen.getByTestId('flow-note')).toHaveTextContent(/conventional current/)
    await user.click(screen.getByTestId('flow-electron'))
    expect(Object.values(dirs(first.container))).toEqual(['down', 'up', 'up', 'up', 'up']) // supply flips too: down, then the four branches up
    expect(screen.getByTestId('flow-note')).toHaveTextContent(/electron flow/)
    expect(localStorage.getItem('flow')).toBe('electron')
    first.unmount()
    // a new page remembers the choice
    const second = render(<Calculator formula={formulaById('r-series')!} />)
    await user.click(screen.getByTestId('mode-withV'))
    await user.click(screen.getByTestId('use-example'))
    expect(Object.entries(dirs(second.container)).filter(([k]) => k !== 'supply').every(([, d]) => d === 'left' || d === 'right')).toBe(true)
    expect(dirs(second.container).R1).toBe('left') // top row is reversed in electron mode
    await user.click(screen.getByTestId('flow-conventional'))
    expect(dirs(second.container).R1).toBe('right')
  })

  it('the switch only appears on circuits that have arrows', () => {
    render(<Calculator formula={formulaById('ohms-law')!} />)
    expect(screen.queryByTestId('flow-note')).not.toBeInTheDocument()
  })

  it('a negative current reverses its own arrow (Millman: the 12 V source charges the 5 V one)', async () => {
    const user = userEvent.setup()
    const { container } = render(<Calculator formula={formulaById('p5-millman')!} />)
    await user.click(screen.getByTestId('use-example'))
    // I1 > 0 (flows right), I2 < 0 so its conventional "left" flips to "right", I3 > 0 (down)
    expect(dirs(container)).toEqual({ R1: 'right', R2: 'right', R3: 'down' })
  })

  it('every circuit with arrows draws its battery with + on top (so "away from +" is true)', async () => {
    const user = userEvent.setup()
    for (const f of FORMULAS.filter((x) => x.modes.length && FLOW_VISUALS.has(x.visual))) {
      const { container, unmount } = render(<Calculator formula={f} />)
      await user.click(screen.getByTestId('use-example'))
      for (const g of container.querySelectorAll('svg[role="img"] [data-kind="V"][data-vertical="true"]')) {
        expect(Number(g.getAttribute('data-plus-y')), `${f.id}: + terminal must be above −`).toBeLessThan(Number(g.getAttribute('data-minus-y')))
      }
      unmount()
    }
  })

  it('every circuit diagram draws arrows when it has current values, and electron mode flips all of them', async () => {
    const user = userEvent.setup()
    const seen = new Set<string>()
    for (const f of FORMULAS.filter((x) => x.modes.length && FLOW_VISUALS.has(x.visual))) {
      for (const m of f.modes) {
        const { container, unmount } = render(<Calculator formula={f} />)
        if (f.modes.length > 1) await user.click(screen.getByTestId(`mode-${m.id}`))
        await user.click(screen.getByTestId('use-example'))
        const conv = arrows(container).map((a) => [a.getAttribute('data-part'), a.getAttribute('data-dir')])
        if (conv.length) {
          seen.add(f.visual)
          await user.click(screen.getByTestId('flow-electron'))
          const elec = arrows(container).map((a) => [a.getAttribute('data-part'), a.getAttribute('data-dir')])
          const opposite: Record<string, string> = { up: 'down', down: 'up', left: 'right', right: 'left' }
          expect(elec, `${f.id}/${m.id}`).toEqual(conv.map(([p, d]) => [p, opposite[d!]]))
          await user.click(screen.getByTestId('flow-conventional'))
        }
        expect(container.textContent).not.toMatch(BAD)
        unmount()
      }
    }
    // each arrow-capable diagram shows arrows in at least one of its calculators
    for (const v of FLOW_VISUALS) expect(seen.has(v), `no mode of a "${v}" formula produced arrows`).toBe(true)
  })
})

describe('home chapter cards: picture + number in one row, title and description under', () => {
  it('has the picture and the chapter number together in the first row, and title/description after it', () => {
    render(<App />)
    for (const s of CHAPTERS) {
      const head = screen.getByTestId(`card-head-${s.id}`)
      expect(within(head).getByTestId(`thumb-chapter-${s.id}`)).toBeInTheDocument()
      expect(within(head).getByTestId(`chapter-number-${s.id}`)).toHaveTextContent(`Chapter${s.number}`)
      const title = screen.getByTestId(`card-title-${s.id}`), desc = screen.getByTestId(`card-desc-${s.id}`)
      expect(head.contains(title)).toBe(false) // title and description are NOT in the picture row…
      expect(head.contains(desc)).toBe(false)
      // …they come after it, in that order
      expect(head.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(title.compareDocumentPosition(desc) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(title).toHaveTextContent(s.title)
      expect(desc).toHaveTextContent(s.blurb)
    }
  })
  it('the whole card is still one link with a sensible name', () => {
    render(<App />)
    const link = screen.getByTestId('chapter-capacitors')
    expect(link).toHaveAttribute('href', '#/chapter/capacitors')
    expect(link).toHaveTextContent(/Chapter\s*4\.3\s*Capacitors/)
  })
})

describe('current arrows sit beside the wire, not on it', () => {
  it('every arrow records its distance from the wire (≈15–24 px on screen = 9–24 SVG units)', async () => {
    const user = userEvent.setup()
    for (const f of FORMULAS.filter((x) => x.modes.length && FLOW_VISUALS.has(x.visual))) {
      for (const m of f.modes) {
        const { container, unmount } = render(<Calculator formula={f} />)
        if (f.modes.length > 1) await user.click(screen.getByTestId(`mode-${m.id}`))
        await user.click(screen.getByTestId('use-example'))
        for (const a of container.querySelectorAll('[data-testid="flow-arrow"]')) {
          const offset = Number(a.getAttribute('data-offset'))
          expect(offset, `${f.id}/${m.id}: arrow "${a.getAttribute('data-part')}" is drawn on the wire (no offset)`).toBeGreaterThanOrEqual(9)
          expect(offset).toBeLessThanOrEqual(24)
        }
        unmount()
      }
    }
  })

  it('diagrams cannot draw a raw FlowArrow: they must use FlowBeside (which enforces the gap)', async () => {
    const { readdirSync, readFileSync } = await import('node:fs')
    const dir = 'src/visuals'
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.tsx') && f !== 'kit.tsx')) {
      expect(readFileSync(`${dir}/${file}`, 'utf8'), `${file} uses <FlowArrow> directly`).not.toMatch(/<FlowArrow[\s/]/)
    }
  })
})

describe('totals shown on the circuit diagram', () => {
  const strip = (c: HTMLElement) => Object.fromEntries([...c.querySelectorAll('svg[role="img"] [data-testid="totals"] [data-total]')].map((t) => [t.getAttribute('data-total')!, t.textContent!.replace(/\s+/g, ' ').trim()]))

  it('parallel network: supply, total current, power and Rt are written under the drawing', async () => {
    const user = userEvent.setup()
    const { container } = render(<Calculator formula={formulaById('r-parallel-n')!} />)
    await user.click(screen.getByTestId('mode-withV'))
    expect(container.querySelector('[data-testid="totals"]')).toBeNull() // nothing until there is a result
    await user.click(screen.getByTestId('use-example'))
    expect(strip(container)).toEqual({ V: 'Supply 5 V', I: 'Total I 20 mA', P: 'Power 100 mW', Rt: 'Rt 250 Ω' })
  })

  it('series network shows the same current everywhere, and an arrow with the value on the supply wire', async () => {
    const user = userEvent.setup()
    const { container } = render(<Calculator formula={formulaById('r-series')!} />)
    await user.click(screen.getByTestId('mode-withV'))
    await user.click(screen.getByTestId('use-example'))
    expect(strip(container)).toMatchObject({ V: 'Supply 9 V', I: 'Total I 2.25 mA', Rt: 'Rt 4 kΩ' })
    const src = container.querySelector('[data-testid="source-current"]')!
    expect(src).toHaveTextContent('2.25 mA')
    expect(src.querySelector('[data-testid="flow-arrow"]')).toHaveAttribute('data-dir', 'up') // conventional: out of the battery's + terminal
    await user.click(screen.getByTestId('flow-electron'))
    expect(container.querySelector('[data-testid="source-current"] [data-testid="flow-arrow"]')).toHaveAttribute('data-dir', 'down')
  })

  it('capacitor networks show supply, equivalent capacitance, charge and energy', async () => {
    const user = userEvent.setup()
    const { container } = render(<Calculator formula={formulaById('c-series')!} />)
    await user.click(screen.getByTestId('mode-withV'))
    await user.click(screen.getByTestId('use-example'))
    expect(strip(container)).toEqual({ V: 'Supply 12 V', Ct: 'Ct 5 µF', Q: 'Charge 60 µC', E: 'Energy 360 µJ' })
  })

  it('every circuit with arrows also shows its totals, and they agree with the calculator output', async () => {
    const user = userEvent.setup()
    for (const f of FORMULAS.filter((x) => x.modes.length && FLOW_VISUALS.has(x.visual))) {
      for (const m of f.modes) {
        const { container, unmount } = render(<Calculator formula={f} />)
        if (f.modes.length > 1) await user.click(screen.getByTestId(`mode-${m.id}`))
        await user.click(screen.getByTestId('use-example'))
        const hasArrows = container.querySelector('[data-testid="flow-arrow"]')
        const t = strip(container)
        if (hasArrows) expect(Object.keys(t).length, `${f.id}/${m.id}: arrows but no totals`).toBeGreaterThan(0)
        for (const text of Object.values(t)) expect(text, `${f.id}/${m.id}`).not.toMatch(/NaN|undefined|Infinity/)
        unmount()
      }
    }
  })

  it('the total current on the strip equals the sum of the branch currents (parallel, any size)', async () => {
    const user = userEvent.setup()
    const { container } = render(<Calculator formula={formulaById('r-parallel-n')!} />)
    await user.click(screen.getByTestId('mode-withV'))
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole('button', { name: 'Add another' }))
    const vals = ['100', '220', '330', '470', '680', '1000']
    for (const [i, v] of vals.entries()) await user.type(screen.getByTestId(`in-R-${i}`), v)
    await user.type(screen.getByTestId('in-V'), '9')
    const shown = /([\d.]+ [^\d\s]+)\s*$/.exec(screen.getByTestId('out-I').textContent!)![1]! // e.g. "412.6 mA" from the result card
    expect(strip(container).I).toBe(`Total I ${shown}`)
  })
})
