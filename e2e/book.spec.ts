/** The book's reading order and its permanent URLs, in a real browser. */
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { CHAPTERS, PARTS } from '../src/learn/book.ts'
import { noHorizontalScroll, overlappingLabels, watchErrors } from './helpers.ts'

const heading = (page: Page) => page.getByRole('heading', { level: 1 })

test.describe('permanent URLs', () => {
  test('every kind of page opens directly from its URL (cold load) with its own title', async ({ page }) => {
    const w = watchErrors(page)
    const cases: Array<[string, string, string]> = [
      ['/#/part/measurements', 'Basic measurements', 'Basic measurements · Circuit Calculator'],
      ['/#/chapter/oscilloscope', '3.2 Using an oscilloscope', 'Using an oscilloscope · Circuit Calculator'],
      ['/#/topic/meter-loading', 'Voltmeter loading', 'Voltmeter loading · Circuit Calculator'],
      ['/#/topic/ohms-law', "Ohm's law", "Ohm's law · Circuit Calculator"],
    ]
    for (const [url, h1, title] of cases) {
      await page.goto(url)
      await expect(heading(page)).toHaveText(h1)
      await expect(page).toHaveTitle(title)
      await page.reload()
      await expect(heading(page)).toHaveText(h1) // survives a reload
    }
    w.expectClean()
  })

  test('old cheat-sheet links still open the right page, and the address bar shows the new URL', async ({ page }) => {
    await page.goto('/#/f/rc-tau')
    await expect(heading(page)).toHaveText('RC time constant')
    expect(new URL(page.url()).hash).toBe('#/topic/rc-tau')
    await page.goto('/#/s/s2')
    await expect(heading(page)).toHaveText('4.2 Resistors')
    expect(new URL(page.url()).hash).toBe('#/chapter/resistors')
  })

  test('a query after the URL is kept and does not break the page', async ({ page }) => {
    await page.goto('/#/topic/ohms-law?mode=I&V=12')
    await expect(heading(page)).toHaveText("Ohm's law")
    expect(new URL(page.url()).hash).toBe('#/topic/ohms-law?mode=I&V=12')
  })
})

test.describe('reading the book', () => {
  test('Home → part → chapter → topic → Next → … crosses into the next chapter', async ({ page }) => {
    const w = watchErrors(page)
    await page.goto('/')
    await page.getByRole('main').getByRole('link', { name: 'Basic measurements' }).click()
    await expect(heading(page)).toHaveText('Basic measurements')
    await page.getByTestId('chapter-multimeter').click()
    await expect(heading(page)).toHaveText('2.1 Using a multimeter')
    await page.getByTestId('formula-multimeter').click()
    await expect(heading(page)).toHaveText('Using a multimeter')
    await expect(page.getByTestId('chapter-chip')).toHaveText('2.1 Using a multimeter')
    await page.getByTestId('topic-nav-next').click() // diode-vf, last of the chapter
    await expect(heading(page)).toHaveText('Diode forward drop (typical)')
    await page.getByTestId('topic-nav-next').click() // into 2.2
    await expect(heading(page)).toHaveText('Voltmeter loading')
    await expect(page.getByTestId('chapter-chip')).toHaveText('2.2 Measurement errors')
    await page.getByTestId('topic-nav-prev').click()
    await expect(heading(page)).toHaveText('Diode forward drop (typical)')
    await noHorizontalScroll(page)
    w.expectClean()
  })

  test('a cheat-sheet topic still says where it came from', async ({ page }) => {
    await page.goto('/#/topic/p9-time-to-voltage')
    await expect(page.getByTestId('cheat-sheet-source')).toContainText('§17')
    await page.goto('/#/topic/multimeter')
    await expect(page.getByTestId('cheat-sheet-source')).toHaveCount(0) // new page, not from the cheat sheet
  })

  test('home shows the five parts in order with their chapter cards', async ({ page }) => {
    await page.goto('/')
    const parts = page.locator('main section[data-testid^="part-"]')
    await expect(parts).toHaveCount(PARTS.length)
    for (let i = 0; i < PARTS.length; i++) await expect(parts.nth(i)).toHaveAttribute('data-testid', `part-${PARTS[i]!.id}`)
    await expect(page.locator('main a[data-testid^="chapter-"]')).toHaveCount(CHAPTERS.length)
    await noHorizontalScroll(page)
  })

  test('reference pages render their sections and diagrams without overlapping labels', async ({ page }) => {
    const w = watchErrors(page)
    for (const id of ['vir-explained', 'schematic-symbols', 'breadboard', 'bench-safety', 'multimeter', 'signals-explained', 'oscilloscope', 'logic-analyser']) {
      await page.goto(`/#/topic/${id}`)
      await expect(page.locator('main section[data-testid^="article-"]').first()).toBeVisible()
      expect(await overlappingLabels(page), `${id}: overlapping labels`).toBe(0)
      await noHorizontalScroll(page)
    }
    w.expectClean()
  })

  for (const scheme of ['light', 'dark'] as const) {
    test(`axe: part page, chapter page and a reference page (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme })
      for (const url of ['/#/part/signals', '/#/chapter/digital-signals', '/#/topic/multimeter']) {
        await page.goto(url)
        await expect(heading(page)).toBeVisible()
        const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
        expect(res.violations.map((v) => `${url} ${v.id}: ${v.help} ${v.nodes[0]?.html.slice(0, 120)}`)).toEqual([])
      }
    })
  }
})
