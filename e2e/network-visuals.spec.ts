import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { noHorizontalScroll, overlappingLabels, watchErrors } from './helpers.ts'

/**
 * The series/parallel diagrams must follow the rows you type, show per-part current/voltage,
 * and keep looking right. Screenshot baselines (desktop Chromium) catch visual regressions:
 *   pnpm e2e:snapshots   to refresh them after an intended change.
 */
async function fillRows(page: Page, values: string[]) {
  const have = await page.getByTestId(/^in-(R|C)-\d+$/).count()
  for (let i = have; i < values.length; i++) await page.getByRole('button', { name: 'Add another' }).click()
  for (const [i, v] of values.entries()) await page.getByTestId(/^in-(R|C)-\d+$/).nth(i).fill(v)
}
const parts = (page: Page) => page.locator('main svg[role="img"] [data-testid^="part-"]')
const diagram = (page: Page) => page.locator('main svg[role="img"]').first()

test.describe('parallel resistors', () => {
  test('diagram shows one branch per row, with values, then current per branch', async ({ page }) => {
    const w = watchErrors(page)
    await page.goto('/#/f/r-parallel-n')
    await expect(parts(page)).toHaveCount(2)
    await page.getByRole('button', { name: 'Add another' }).click()
    await expect(parts(page)).toHaveCount(3) // grows even before a value is typed
    await fillRows(page, ['1000', '2000', '2000', '500'])
    await expect(parts(page)).toHaveCount(4)
    await expect(diagram(page)).toContainText('Rt = 250 Ω')
    await page.getByTestId('mode-withV').click()
    await page.getByTestId('in-V').fill('5')
    await expect(page.getByTestId('out-I')).toContainText('20 mA')
    for (const [id, i] of [['R1', '5 mA'], ['R2', '2.5 mA'], ['R3', '2.5 mA'], ['R4', '10 mA']] as const) {
      await expect(page.getByTestId(`${id}-I`)).toHaveText(i)
      await expect(page.locator(`[data-testid="part-${id}"]`)).toContainText(i) // …and on the picture
    }
    await expect(page.getByTestId('row-total')).toContainText('20 mA')
    await expect(diagram(page)).toContainText('same voltage across every branch: V = 5 V')
    await noHorizontalScroll(page)
    w.expectClean()
  })

  test('ten branches stay readable and inside the screen', async ({ page }) => {
    await page.goto('/#/f/r-parallel-n')
    await page.getByTestId('mode-withV').click()
    await fillRows(page, ['100', '220', '330', '470', '680', '1000', '2200', '4700', '10000', '47000'])
    await page.getByTestId('in-V').fill('9')
    await expect(parts(page)).toHaveCount(10)
    await expect(page.getByTestId('breakdown').locator('tbody tr')).toHaveCount(11) // 10 parts + total
    await noHorizontalScroll(page)
    const box = await diagram(page).boundingBox()
    expect(box!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
    // no two figure labels sit on top of each other
    const overlaps = await overlappingLabels(page)
    expect(overlaps, 'overlapping labels in the diagram').toBe(0)
  })
})

const arrowDirs = (page: Page) => page.locator('main svg[role="img"] [data-testid="flow-arrow"]').evaluateAll((els) => els.map((e) => `${e.getAttribute('data-part')}:${e.getAttribute('data-dir')}`))

test.describe('current-flow arrows', () => {
  test('arrows sit next to each part with its value; switch to electron flow reverses them', async ({ page }) => {
    const w = watchErrors(page)
    await page.goto('/#/f/r-parallel-n')
    await page.getByTestId('mode-withV').click()
    await fillRows(page, ['1000', '2000', '2000', '500'])
    await page.getByTestId('in-V').fill('5')
    expect(await arrowDirs(page)).toEqual(['supply:up', 'R1:down', 'R2:down', 'R3:down', 'R4:down'])
    await expect(page.locator('[data-testid="part-R4"]')).toContainText('10 mA')
    // 4 branches use the roomy-but-compact layout: the value is written under the rail, still inside the same part group
    await page.getByTestId('flow-electron').click()
    expect(await arrowDirs(page)).toEqual(['supply:down', 'R1:up', 'R2:up', 'R3:up', 'R4:up'])
    await page.reload()
    await expect(page.getByTestId('flow-electron')).toHaveAttribute('aria-pressed', 'true') // remembered
    expect(await overlappingLabels(page)).toBe(0)
    w.expectClean()
  })

  for (const [id, mode] of [['p1-unknown-parallel', 'A'], ['p2-series-parallel', 'A'], ['p3-unknown-series', 'I'], ['p4-thevenin', 'divider'], ['p5-millman', 'V'], ['p13-several-leds', 'R'], ['p14-zener', 'R'], ['p20-internal-resistance', 'Rint'], ['led-resistor', 'R'], ['p17-bjt-switch', 'RB'], ['voltage-divider', 'Vout'], ['current-divider', 'I1']] as const) {
    test(`${id}: arrows with values, nothing overlapping or clipped`, async ({ page }) => {
      await page.goto(`/#/f/${id}`)
      const tab = page.getByTestId(`mode-${mode}`)
      if (await tab.count()) await tab.click()
      await page.getByTestId('use-example').click()
      await expect(page.getByTestId('result')).toHaveAttribute('data-status', 'ok')
      expect((await arrowDirs(page)).length, `${id} shows no arrows`).toBeGreaterThan(0)
      expect(await overlappingLabels(page), `${id}: overlapping labels`).toBe(0)
      // everything must lie within the drawn area (the SVG viewBox mapped to the screen), otherwise it is clipped
      const inside = await page.evaluate(() => {
        const svg = document.querySelector('main svg[role="img"]') as SVGSVGElement
        const vb = svg.viewBox.baseVal, m = svg.getScreenCTM()!
        const left = m.e, top = m.f, right = m.e + vb.width * m.a, bottom = m.f + vb.height * m.d
        return [...svg.querySelectorAll('text, [data-testid="flow-arrow"]')].every((e) => { const r = e.getBoundingClientRect(); return r.left >= left - 1 && r.right <= right + 1 && r.top >= top - 1 && r.bottom <= bottom + 1 })
      })
      expect(inside, `${id}: something is drawn outside the diagram`).toBe(true)
    })
  }
})

test.describe('series resistors', () => {
  test('voltage drop on each part; chain wraps onto a second row after five', async ({ page }) => {
    await page.goto('/#/f/r-series')
    await page.getByTestId('mode-withV').click()
    await fillRows(page, ['1000', '1000', '1000', '1000', '1000', '1000', '1000', '1000'])
    await page.getByTestId('in-V').fill('8')
    await expect(parts(page)).toHaveCount(8)
    await expect(page.getByTestId('out-I')).toContainText('1 mA')
    for (let i = 1; i <= 8; i++) await expect(page.locator(`[data-testid="part-R${i}"]`)).toContainText('1 V')
    await expect(diagram(page)).toContainText('same current in every part: I = 1 mA')
    const overlaps = await overlappingLabels(page)
    expect(overlaps, 'overlapping labels in the diagram').toBe(0)
  })

  test('on a phone the diagram sits between the inputs and the result', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only')
    await page.goto('/#/f/r-series')
    await page.getByTestId('use-example').click()
    const y = async (sel: string) => (await page.locator(sel).first().boundingBox())!.y
    const inputs = await y('[data-testid="in-R-0"]'), svg = await y('main svg[role="img"]'), result = await y('[data-testid="result"]')
    expect(inputs).toBeLessThan(svg)
    expect(svg).toBeLessThan(result)
  })
})

test.describe('capacitors', () => {
  test('series: same charge, voltage split', async ({ page }) => {
    await page.goto('/#/f/c-series')
    await page.getByTestId('mode-withV').click()
    await fillRows(page, ['10', '10'])
    await page.getByTestId('unit-in-C-0').selectOption('µF'); await page.getByTestId('unit-in-C-1').selectOption('µF')
    await page.getByTestId('in-V').fill('12')
    await expect(page.getByTestId('C1-V')).toHaveText('6 V')
    await expect(diagram(page)).toContainText('same charge on every part')
  })
})

test.describe('thumbnails', () => {
  test('section list rows show a picture each', async ({ page }) => {
    await page.goto('/#/s/s2')
    const items = page.getByRole('list', { name: /Topics in/ }).getByRole('listitem')
    const n = await items.count()
    expect(n).toBeGreaterThan(4)
    for (let i = 0; i < n; i++) {
      const svg = items.nth(i).locator('[data-testid^="thumb-"] svg')
      await expect(svg).toBeVisible()
      const box = await svg.boundingBox()
      expect(box!.width).toBeGreaterThan(60)
    }
  })

  test('home cards show a picture each', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-testid^="thumb-section-"] svg')).toHaveCount(18)
  })
})

test.describe('accessibility of the new UI', () => {
  for (const scheme of ['light', 'dark'] as const) {
    test(`axe: breakdown table + diagram (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme })
      await page.goto('/#/f/r-parallel-n')
      await page.getByTestId('mode-withV').click()
      await fillRows(page, ['1000', '2000', '2000', '500'])
      await page.getByTestId('in-V').fill('5')
      await expect(page.getByTestId('breakdown')).toBeVisible()
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      expect(res.violations.map((v) => `${v.id}: ${v.help} ${v.nodes[0]?.html.slice(0, 140)} ${JSON.stringify(v.nodes[0]?.any[0]?.data ?? {}).slice(0, 160)}`)).toEqual([])
      await page.goto('/#/s/s3')
      await expect(page.locator('[data-testid^="thumb-"]').first()).toBeVisible()
      const res2 = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      expect(res2.violations.map((v) => `${v.id}: ${v.help} ${v.nodes[0]?.html.slice(0, 140)} ${JSON.stringify(v.nodes[0]?.any[0]?.data ?? {}).slice(0, 160)}`)).toEqual([])
    })
  }
})

test.describe('visual regression (desktop Chromium)', () => {
  test.beforeEach(({ browserName }, info) => { test.skip(browserName !== 'chromium' || info.project.name !== 'desktop-chromium', 'baselines are for desktop Chromium') })
  test.use({ viewport: { width: 1100, height: 900 } })
  const shot = { maxDiffPixelRatio: 0.02, animations: 'disabled' as const }

  test('parallel ×4 with supply', async ({ page }) => {
    await page.goto('/#/f/r-parallel-n'); await page.getByTestId('mode-withV').click()
    await fillRows(page, ['1000', '2000', '2000', '500']); await page.getByTestId('in-V').fill('5')
    await expect(page.getByTestId('breakdown')).toBeVisible()
    await expect(diagram(page)).toHaveScreenshot('parallel-4.png', shot)
    await expect(page.getByTestId('breakdown')).toHaveScreenshot('breakdown-parallel-4.png', shot)
  })
  test('parallel ×10', async ({ page }) => {
    await page.goto('/#/f/r-parallel-n'); await page.getByTestId('mode-withV').click()
    await fillRows(page, ['100', '220', '330', '470', '680', '1000', '2200', '4700', '10000', '47000']); await page.getByTestId('in-V').fill('9')
    await expect(diagram(page)).toHaveScreenshot('parallel-10.png', shot)
  })
  test('series ×4 and ×8', async ({ page }) => {
    await page.goto('/#/f/r-series'); await page.getByTestId('mode-withV').click()
    await fillRows(page, ['1000', '470', '2200', '330']); await page.getByTestId('in-V').fill('9')
    await expect(diagram(page)).toHaveScreenshot('series-4.png', shot)
    await fillRows(page, ['1000', '470', '2200', '330', '100', '4700', '680', '220']); await page.getByTestId('in-V').fill('12')
    await expect(diagram(page)).toHaveScreenshot('series-8.png', shot)
  })
  for (const [id, mode] of [['p2-series-parallel', 'A'], ['p5-millman', 'V'], ['led-resistor', 'R'], ['p17-bjt-switch', 'RB']] as const) {
    test(`circuit with arrows: ${id}`, async ({ page }) => {
      await page.goto(`/#/f/${id}`)
      const tab = page.getByTestId(`mode-${mode}`)
      if (await tab.count()) await tab.click()
      await page.getByTestId('use-example').click()
      await expect(diagram(page)).toHaveScreenshot(`flow-${id}.png`, shot)
    })
  }
  test('series capacitors', async ({ page }) => {
    await page.goto('/#/f/c-series'); await page.getByTestId('mode-withV').click()
    await fillRows(page, ['10', '22', '47']); for (let i = 0; i < 3; i++) await page.getByTestId(`unit-in-C-${i}`).selectOption('µF')
    await page.getByTestId('in-V').fill('12')
    await expect(diagram(page)).toHaveScreenshot('series-c-3.png', shot)
  })
  test('section list with thumbnails', async ({ page }) => {
    await page.goto('/#/s/s2')
    await expect(page.locator('[data-testid^="thumb-"]').first()).toBeVisible()
    await expect(page.getByRole('list', { name: /Topics in/ })).toHaveScreenshot('section-list.png', shot)
  })
})
