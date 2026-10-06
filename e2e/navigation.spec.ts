import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { watchErrors } from './helpers.ts'

const heading = (page: Page, name: string | RegExp) => page.getByRole('heading', { level: 1, name })
const back = (page: Page) => page.getByTestId('back-button')

test.describe('app bar on child pages', () => {
  test('shows the menu button (not a back-to-parent arrow) on a topic page', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'the menu button is hidden when the sidebar is permanently open')
    await page.goto('/#/f/rc-tau')
    await expect(page.getByTestId('menu-button')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Back' })).toHaveCount(0)
    await expect(back(page)).toHaveCount(0) // nothing to go back to yet
  })

  test('on wide screens the sidebar replaces the menu button', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop layout')
    await page.goto('/#/f/rc-tau')
    await expect(page.getByTestId('menu-button')).toHaveCount(0)
    await expect(page.getByRole('navigation', { name: 'Sections' })).toBeVisible()
  })
})

test.describe('highlight in the sidebar', () => {
  test('the open topic is highlighted and scrolled into view, even deep in the list', async ({ page, isMobile }) => {
    await page.goto('/#/f/p21-battery-packs') // the very last topic
    if (isMobile) await page.getByTestId('menu-button').click()
    const row = page.getByTestId('nav-topic-p21-battery-packs')
    await expect(row).toHaveAttribute('aria-current', 'page')
    await expect(row).toHaveClass(/is-current/)
    await expect(row).toBeInViewport() // scrolled to, not hidden below the fold
    // a clear marker: a coloured bar on the left edge
    const shadow = await row.evaluate((e) => getComputedStyle(e).boxShadow)
    expect(shadow).not.toBe('none')
    await expect(page.locator('[aria-current="page"]')).toHaveCount(1)
  })
})

test.describe('Back to the previous page (up to 3 kept)', () => {
  test('resistors → capacitors → Back → resistors', async ({ page }) => {
    const w = watchErrors(page)
    await page.goto('/#/s/s2')
    await page.goto('/#/s/s3') // a hash change, so the app keeps its in-memory history
    await expect(heading(page, 'Capacitors')).toBeVisible()
    await expect(back(page)).toHaveAccessibleName('Back to Resistors')
    await back(page).click()
    await expect(heading(page, 'Resistors')).toBeVisible()
    w.expectClean()
  })

  test('works with the menu: jump via the menu, then Back; menu and Back coexist', async ({ page, isMobile }) => {
    await page.goto('/')
    await page.evaluate(() => { window.location.hash = '#/s/s2' })
    await page.evaluate(() => { window.location.hash = '#/f/voltage-divider' })
    await expect(heading(page, 'Voltage divider')).toBeVisible()
    if (isMobile) { await page.getByTestId('menu-button').click(); await expect(page.getByTestId('nav-topic-voltage-divider')).toHaveAttribute('aria-current', 'page') }
    await page.getByTestId('toggle-s3').click()
    await page.getByTestId('nav-topic-rc-tau').click()
    await expect(heading(page, 'RC time constant')).toBeVisible()
    await expect(back(page)).toHaveAccessibleName('Back to Voltage divider')
    await back(page).click()
    await expect(heading(page, 'Voltage divider')).toBeVisible()
    await expect(back(page)).toHaveAccessibleName('Back to Resistors')
  })

  test('remembers at most three pages', async ({ page }) => {
    await page.goto('/')
    const visit = async (hash: string) => { await page.evaluate((h) => { window.location.hash = h }, hash) }
    for (const h of ['#/s/s1', '#/s/s2', '#/s/s3', '#/s/s4', '#/s/s5']) await visit(h)
    await expect(heading(page, 'Resonance & Filters')).toBeVisible()
    await expect(page.getByTestId('back-count')).toHaveText('3')
    const seen: string[] = []
    while (await back(page).count()) {
      seen.push((await back(page).getAttribute('aria-label'))!)
      await back(page).click()
    }
    expect(seen).toEqual(['Back to Inductors', 'Back to Capacitors', 'Back to Resistors'])
    await expect(heading(page, 'Resistors')).toBeVisible() // Home and Ohm's law pages fell out of memory
  })

  test('Back is keyboard accessible and a proper 44px target on phones', async ({ page, isMobile }) => {
    await page.goto('/')
    await page.evaluate(() => { window.location.hash = '#/s/s2' })
    await page.evaluate(() => { window.location.hash = '#/s/s3' })
    const b = await back(page).boundingBox()
    expect(b!.height).toBeGreaterThanOrEqual(43.5)
    if (isMobile) expect(b!.width).toBeGreaterThanOrEqual(43.5)
    await back(page).focus()
    await page.keyboard.press('Enter')
    await expect(heading(page, 'Resistors')).toBeVisible()
  })

  for (const scheme of ['light', 'dark'] as const) {
    test(`axe: app bar with Back button and count (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme })
      await page.goto('/')
      for (const h of ['#/s/s1', '#/s/s2', '#/f/voltage-divider']) await page.evaluate((x) => { window.location.hash = x }, h)
      await expect(back(page)).toBeVisible()
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      expect(res.violations.map((v) => `${v.id}: ${v.help} ${v.nodes[0]?.html.slice(0, 120)}`)).toEqual([])
    })
  }
})
