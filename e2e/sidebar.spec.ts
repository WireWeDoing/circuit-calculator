import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { FORMULAS } from '../src/formulas/index.ts'
import { PARTS } from '../src/learn/book.ts'
import { noHorizontalScroll, watchErrors } from './helpers.ts'

type Page = import('@playwright/test').Page
const nav = (page: Page) => page.getByRole('navigation', { name: 'Book contents' })
async function expandAll(page: Page) {
  for (const p of PARTS) {
    await page.getByTestId(`toggle-${p.id}`).click()
    for (const c of p.chapters) await page.getByTestId(`toggle-${c.id}`).click()
  }
}

test.describe('wide screens: permanent sidebar', () => {
  test.beforeEach(({ browserName }, info) => { test.skip(browserName !== 'chromium' || info.project.name !== 'desktop-chromium', 'desktop layout') })

  test('is always visible, hierarchical, and every part and chapter has its icon', async ({ page }) => {
    const w = watchErrors(page)
    await page.goto('/')
    await expect(nav(page)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open contents menu' })).toHaveCount(0) // no hamburger needed
    for (const p of PARTS) {
      await expect(page.getByTestId(`nav-icon-${p.id}`).locator('svg')).toBeVisible()
      await expect(page.getByTestId(`toggle-${p.id}`)).toHaveAttribute('aria-expanded', 'false')
    }
    await page.getByTestId('toggle-components').click()
    for (const c of PARTS[3]!.chapters) await expect(page.getByTestId(`nav-icon-${c.id}`).locator('svg')).toBeVisible()
    // topics have their own, smaller icon
    await page.getByTestId('toggle-resistors').click()
    await expect(page.getByTestId('nav-topic-voltage-divider')).toBeVisible()
    await expect(page.getByTestId('topic-icon-voltage-divider')).toBeVisible()
    const child = await page.getByTestId('topic-icon-voltage-divider').boundingBox()
    expect(child!.width).toBeGreaterThanOrEqual(24) // big enough to read the badge
    await noHorizontalScroll(page)
    w.expectClean()
  })

  test('collapse / expand, navigate from the tree, and the tree follows the page', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('toggle-components').click()
    await page.getByTestId('toggle-capacitors').click()
    await page.getByTestId('nav-topic-rc-tau').click()
    await expect(page.getByRole('heading', { level: 1, name: 'RC time constant' })).toBeVisible()
    await expect(page.getByTestId('nav-topic-rc-tau')).toHaveAttribute('aria-current', 'page')
    // collapse it — the page stays, the children go
    await page.getByTestId('toggle-capacitors').click()
    await expect(page.getByTestId('nav-topic-rc-tau')).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1, name: 'RC time constant' })).toBeVisible()
    // a deep link opens the part AND the chapter
    await page.goto('/#/topic/p17-bjt-switch')
    await expect(page.getByTestId('toggle-components')).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('toggle-bjt')).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('nav-topic-p17-bjt-switch')).toHaveAttribute('aria-current', 'page')
    await expect(page.getByTestId('toggle-mosfets')).toHaveAttribute('aria-expanded', 'false')
  })

  test('expanding a branch has no animation (so nothing is measured half-faded)', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('toggle-components').click()
    const anim = await page.getByTestId('nav-part-components').locator('ul.nav-list').first().evaluate((e) => getComputedStyle(e).animationName)
    expect(anim).toBe('none')
  })

  test('open state survives a reload', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('toggle-components').click()
    await page.getByTestId('toggle-diodes-leds').click()
    await page.reload()
    await expect(page.getByTestId('toggle-diodes-leds')).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('nav-topic-led-resistor')).toBeVisible()
  })

  test('keyboard: Tab to a chevron, Enter toggles and focus stays', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('toggle-basics').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('toggle-voltage-current-resistance')).toBeVisible()
    await expect(page.getByTestId('toggle-basics')).toBeFocused()
  })

  test('the whole tree can be expanded: every topic reachable exactly once', async ({ page }) => {
    await page.goto('/')
    await expandAll(page)
    await expect(page.locator('[data-testid^="nav-topic-"]')).toHaveCount(FORMULAS.length)
  })

  test('every topic icon is drawn (non-empty) and fits inside its box', async ({ page }) => {
    await page.goto('/')
    await expandAll(page)
    const bad = await page.evaluate(() => {
      const out: string[] = []
      for (const el of document.querySelectorAll<SVGSVGElement>('[data-testid^="topic-icon-"]')) {
        const box = el.getBoundingClientRect()
        const ink = (el.querySelector('path') as SVGGraphicsElement | null)?.getBoundingClientRect()
        if (!ink || ink.width < 4 || ink.height < 2.5) out.push(`${el.dataset.testid}: empty`)
        else if (ink.left < box.left - 1.5 || ink.right > box.right + 1.5 || ink.top < box.top - 1.5 || ink.bottom > box.bottom + 1.5) out.push(`${el.dataset.testid}: outside`)
        const badge = el.querySelector('text')?.getBoundingClientRect()
        if (badge && (badge.right > box.right + 1.5 || badge.bottom > box.bottom + 1.5 || badge.left < box.left - 1.5)) out.push(`${el.dataset.testid}: badge clipped`)
      }
      return out
    })
    expect(bad).toEqual([])
  })

  test('content is not hidden behind the sidebar', async ({ page }) => {
    await page.goto('/#/topic/ohms-law')
    const sidebar = await nav(page).boundingBox(), main = await page.getByRole('main').boundingBox()
    expect(main!.x).toBeGreaterThanOrEqual(sidebar!.x + sidebar!.width - 2)
    await noHorizontalScroll(page)
  })

  for (const scheme of ['light', 'dark'] as const) {
    test(`axe with an expanded tree (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme })
      await page.goto('/#/topic/p9-time-to-voltage')
      await page.getByTestId('toggle-measurements').click()
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      expect(res.violations.map((v) => `${v.id}: ${v.help} ${v.nodes[0]?.html.slice(0, 100)}`)).toEqual([])
    })
  }

  test('visual: sidebar with a part and a chapter open', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/#/topic/p9-time-to-voltage')
    await page.getByTestId('toggle-measurements').click()
    // the visible panel (the nav itself scrolls inside it); the one-off "ready offline" toast is removed so it can't leak into the picture
    await page.addStyleTag({ content: '.MuiSnackbar-root { display: none !important }' })
    await expect(page.locator('.MuiDrawer-paper')).toHaveScreenshot('sidebar-open.png', { maxDiffPixelRatio: 0.02, animations: 'disabled' })
  })
})

test.describe('phones: slide-in drawer', () => {
  test.beforeEach(({ isMobile }) => { test.skip(!isMobile, 'mobile only') })

  test('menu button opens a hierarchical drawer; choosing a topic closes it', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Open contents menu' }).click()
    await expect(nav(page)).toBeVisible()
    await page.getByTestId('toggle-components').click()
    await page.getByTestId('toggle-inductors').click()
    await expect(page.getByTestId('nav-topic-ind-reactance')).toBeVisible()
    const row = await page.getByTestId('nav-topic-ind-reactance').boundingBox()
    expect(row!.height).toBeGreaterThanOrEqual(43.5) // tappable
    await page.getByTestId('nav-topic-ind-reactance').click()
    await expect(page.getByRole('heading', { level: 1, name: 'Inductive reactance' })).toBeVisible()
    await expect(nav(page)).toBeHidden()
    await noHorizontalScroll(page)
  })

  test('chevrons are 44px tap targets', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Open contents menu' }).click()
    const box = await page.getByTestId('toggle-basics').boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(43.5); expect(box!.width).toBeGreaterThanOrEqual(43.5)
  })
})
