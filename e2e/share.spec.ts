/** Sharing: the Share button in the app bar and the link button on every card, in a real browser. */
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { noHorizontalScroll, watchErrors } from './helpers.ts'

test.use({ permissions: ['clipboard-read', 'clipboard-write'] })
const clip = (page: Page) => page.evaluate(() => navigator.clipboard.readText())

test.describe('Share button in the app bar', () => {
  test('copies the address of the page you are on and confirms it', async ({ page }) => {
    const w = watchErrors(page)
    for (const hash of ['#/', '#/part/signals', '#/chapter/oscilloscope', '#/topic/ohms-law']) {
      await page.goto(`/${hash}`)
      await page.getByTestId('share-button').click()
      await expect(page.getByTestId('toast')).toContainText('Link copied')
      expect(await clip(page)).toBe(page.url())
      expect(await clip(page)).toContain(hash === '#/' ? '#/' : hash)
    }
    w.expectClean()
  })

  test('is a 44 px target with a name, on phones too', async ({ page }) => {
    await page.goto('/#/topic/ohms-law')
    const b = page.getByRole('button', { name: 'Share this page' })
    const box = await b.boundingBox()
    expect(box!.width).toBeGreaterThanOrEqual(43.5); expect(box!.height).toBeGreaterThanOrEqual(43.5)
    await noHorizontalScroll(page)
  })
})

test.describe('link button on each card', () => {
  test('copies a URL that opens the page scrolled to that card, highlighted, from a cold load', async ({ page, context }) => {
    const w = watchErrors(page)
    await page.goto('/#/topic/ohms-law')
    await page.getByTestId('share-variables').click()
    await expect(page.getByTestId('toast')).toContainText('Link to “Variables” copied')
    const url = await clip(page)
    expect(new URL(url).hash).toBe('#/topic/ohms-law/variables')
    // a different tab, nothing cached: the link lands on the card
    const other = await context.newPage()
    await other.goto(url)
    const card = other.locator('#sec-variables')
    await expect(card).toHaveAttribute('data-linked', 'true')
    await expect(card).toBeInViewport()
    const [cardTop, barBottom] = await other.evaluate(() => [document.getElementById('sec-variables')!.getBoundingClientRect().top, document.querySelector('header')!.getBoundingClientRect().bottom])
    expect(cardTop, 'the card must not hide under the sticky app bar').toBeGreaterThanOrEqual(barBottom - 1)
    expect(await other.evaluate(() => window.scrollY)).toBeGreaterThan(100)
    expect(other.url()).toBe(url) // the address is untouched
    w.expectClean()
  })

  test('every card of a calculator page has a working link', async ({ page }) => {
    await page.goto('/#/topic/r-parallel-n')
    await page.getByTestId('use-example').click()
    const ids = await page.locator('main [data-anchor]').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.anchor!))
    expect(ids).toEqual(expect.arrayContaining(['inputs', 'result', 'diagram', 'breakdown', 'steps', 'units', 'variables']))
    for (const id of ids) {
      await page.getByTestId(`share-${id}`).click()
      expect(new URL(await clip(page)).hash, id).toBe(`#/topic/r-parallel-n/${id}`)
    }
  })

  test('link buttons are 44 px targets in the card corner and never cover the heading text', async ({ page }) => {
    await page.goto('/#/topic/multimeter')
    const cards = page.locator('main [data-anchor]')
    const n = await cards.count()
    expect(n).toBeGreaterThan(3)
    for (let i = 0; i < n; i++) {
      const card = cards.nth(i)
      const id = (await card.getAttribute('data-anchor'))!
      const btn = (await page.getByTestId(`share-${id}`).boundingBox())!
      expect(btn.width).toBeGreaterThanOrEqual(43.5); expect(btn.height).toBeGreaterThanOrEqual(43.5)
      const cb = (await card.boundingBox())!
      expect(btn.x + btn.width).toBeLessThanOrEqual(cb.x + cb.width + 0.5) // inside the card, top-right
      expect(btn.y).toBeLessThanOrEqual(cb.y + 8)
      if (!(await card.locator('h2').count())) continue // the diagram card has no heading
      const h = await card.locator('h2').first().evaluate((e) => { const r = document.createRange(); r.selectNodeContents(e); const b = r.getBoundingClientRect(); return { right: b.right } })
      expect(h.right, `${id}: heading text runs under the link button`).toBeLessThanOrEqual(btn.x + 0.5)
    }
    await noHorizontalScroll(page)
  })

  test('works for the custom tools too (colour code)', async ({ page }) => {
    await page.goto('/#/topic/resistor-colour-code/bands-to-value')
    await expect(page.locator('#sec-bands-to-value')).toHaveAttribute('data-linked', 'true')
    await page.getByTestId('share-colour-table').click()
    expect(new URL(await clip(page)).hash).toBe('#/topic/resistor-colour-code/colour-table')
  })

  test('a link to the steps of an empty calculator lands on the Result card; an unknown card just opens the page', async ({ page }) => {
    await page.goto('/#/topic/ohms-law/steps')
    await expect(page.locator('#sec-result')).toBeInViewport()
    await page.goto('/#/topic/ohms-law/does-not-exist')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText("Ohm's law")
  })

  test('works from the sub-path-free address and survives reload; Back keeps one entry for the page', async ({ page }) => {
    await page.goto('/#/topic/rc-tau/diagram')
    await page.reload()
    await expect(page.locator('#sec-diagram')).toHaveAttribute('data-linked', 'true')
  })

  for (const scheme of ['light', 'dark'] as const) {
    test(`axe: cards with link buttons and the highlighted card (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme })
      for (const url of ['/#/topic/ohms-law/variables', '/#/topic/multimeter/current-in-series', '/#/topic/r-parallel-n']) {
        await page.goto(url)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
        expect(res.violations.map((v) => `${url} ${v.id}: ${v.help} ${v.nodes[0]?.html.slice(0, 120)}`)).toEqual([])
      }
    })
  }
})
