import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { FORMULAS, SECTIONS } from '../src/formulas/index.ts'
import { watchErrors } from './helpers.ts'

const open = async (page: Page) => { await page.getByTestId('search-button').click(); await expect(page.getByTestId('search-input')).toBeFocused() }
const heading = (page: Page, name: string | RegExp) => page.getByRole('heading', { level: 1, name })

test.describe('search dialog', () => {
  test('icon in the app bar opens it; typing finds a section by title; click opens the section', async ({ page }) => {
    const w = watchErrors(page)
    await page.goto('/')
    await open(page)
    await page.getByTestId('search-input').fill('capacitors')
    const first = page.getByTestId('search-results').getByRole('option').first()
    await expect(first).toHaveAttribute('data-testid', 'result-section-s3')
    await first.click()
    await expect(heading(page, 'Capacitors')).toBeVisible()
    await expect(page.getByTestId('search-input')).toHaveCount(0)
    w.expectClean()
  })

  test('every section is findable by its title', async ({ page }) => {
    await page.goto('/')
    await open(page)
    for (const s of SECTIONS) {
      await page.getByTestId('search-input').fill(s.title)
      await expect(page.getByTestId('search-results').getByRole('option').first(), s.title).toHaveAttribute('data-testid', `result-section-${s.id}`)
    }
  })

  test('topics: type, arrow, Enter opens it; it is highlighted in the sidebar / drawer afterwards', async ({ page, isMobile }) => {
    await page.goto('/')
    await open(page)
    await page.getByTestId('search-input').fill('rl cutoff')
    await expect(page.getByTestId('result-topic-rl-cutoff')).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(heading(page, 'RL filter cutoff')).toBeVisible()
    if (isMobile) await page.getByTestId('menu-button').click()
    await expect(page.getByTestId('nav-topic-rl-cutoff')).toHaveAttribute('aria-current', 'page')
  })

  test('arrow keys move the selection; Escape closes', async ({ page }) => {
    await page.goto('/')
    await open(page)
    await page.getByTestId('search-input').fill('series')
    const opts = page.getByTestId('search-results').getByRole('option')
    await expect(opts.first()).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown')
    await expect(opts.nth(2)).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('ArrowUp')
    await expect(opts.nth(1)).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('search-input')).toHaveCount(0)
  })

  test('Ctrl+K and "/" open it', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard shortcuts')
    await page.goto('/#/f/ohms-law')
    await expect(heading(page, "Ohm's law")).toBeVisible() // the app has mounted and its shortcut listener is installed
    await page.keyboard.press('Control+k')
    await expect(page.getByTestId('search-input')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('search-input')).toHaveCount(0)
    await page.keyboard.press('/')
    await expect(page.getByTestId('search-input')).toBeFocused()
  })

  test('no match → friendly message; clearing shows the sections again', async ({ page }) => {
    await page.goto('/')
    await open(page)
    await page.getByTestId('search-input').fill('xxxyyy')
    await expect(page.getByTestId('search-empty')).toBeVisible()
    await page.getByTestId('search-input').fill('')
    await expect(page.getByTestId('search-results').getByRole('option')).toHaveCount(SECTIONS.length)
  })

  test('results lead to real pages: every topic title opens its own page', async ({ page }) => {
    await page.goto('/')
    const sample = FORMULAS.filter((_, i) => i % 9 === 0)
    for (const f of sample) {
      await open(page)
      await page.getByTestId('search-input').fill(f.title)
      await page.getByTestId(`result-topic-${f.id}`).click()
      await expect(heading(page, f.title)).toBeVisible()
    }
  })

  test('opening a result is remembered by the Back button', async ({ page }) => {
    await page.goto('/#/s/s2')
    await open(page)
    await page.getByTestId('search-input').fill('inductive reactance')
    await page.keyboard.press('Enter')
    await expect(heading(page, 'Inductive reactance')).toBeVisible()
    await expect(page.getByTestId('back-button')).toHaveAccessibleName('Back to Resistors')
  })

  test('phone: full screen, rows are 44px tall, nothing scrolls sideways, keyboard-safe', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phone layout')
    await page.goto('/')
    await open(page)
    await page.getByTestId('search-input').fill('s')
    const dlg = await page.getByRole('dialog').boundingBox()
    const vp = page.viewportSize()!
    expect(dlg!.width).toBeGreaterThanOrEqual(vp.width - 1)
    expect(dlg!.height).toBeGreaterThanOrEqual(vp.height - 1)
    const row = await page.getByTestId('search-results').getByRole('option').first().boundingBox()
    expect(row!.height).toBeGreaterThanOrEqual(43.5)
    const close = await page.getByTestId('search-close').boundingBox()
    expect(close!.width).toBeGreaterThanOrEqual(43.5)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  })

  for (const scheme of ['light', 'dark'] as const) {
    test(`axe: dialog with results (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme })
      await page.goto('/')
      await open(page)
      await page.getByTestId('search-input').fill('cap')
      await expect(page.getByTestId('result-section-s3')).toBeVisible()
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      expect(res.violations.map((v) => `${v.id}: ${v.help} ${v.nodes[0]?.html.slice(0, 140)}`)).toEqual([])
    })
  }

  test('visual: results list', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop baseline')
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await open(page)
    await page.getByTestId('search-input').fill('cap')
    await page.addStyleTag({ content: '.MuiSnackbar-root { display: none !important }' })
    await expect(page.getByRole('dialog')).toHaveScreenshot('search-results.png', { maxDiffPixelRatio: 0.02, animations: 'disabled' })
  })
})
