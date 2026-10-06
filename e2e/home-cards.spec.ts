import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { SECTIONS } from '../src/formulas/index.ts'
import { noHorizontalScroll } from './helpers.ts'

test.describe('home section cards', () => {
  test('picture and section number share a row; title and description sit underneath', async ({ page }) => {
    await page.goto('/')
    for (const s of SECTIONS) {
      const thumb = await page.getByTestId(`thumb-section-${s.id}`).boundingBox()
      const num = await page.getByTestId(`section-number-${s.id}`).boundingBox()
      const title = await page.getByTestId(`card-title-${s.id}`).boundingBox()
      const desc = await page.getByTestId(`card-desc-${s.id}`).boundingBox()
      expect(thumb && num && title && desc, s.id).toBeTruthy()
      // same row: vertical ranges overlap, number is to the right of the picture
      expect(Math.min(thumb!.y + thumb!.height, num!.y + num!.height) - Math.max(thumb!.y, num!.y), `${s.id}: picture and number must share a row`).toBeGreaterThan(10)
      expect(num!.x).toBeGreaterThanOrEqual(thumb!.x + thumb!.width - 1)
      // title and description are below that row, title first, same left edge as the picture
      expect(title!.y).toBeGreaterThanOrEqual(Math.max(thumb!.y + thumb!.height, num!.y + num!.height) - 1)
      expect(desc!.y).toBeGreaterThan(title!.y)
      expect(Math.abs(title!.x - thumb!.x)).toBeLessThanOrEqual(2)
    }
  })

  test('works on a phone: no sideways scroll, picture and number still side by side, whole card tappable', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phone layout')
    await page.goto('/')
    await noHorizontalScroll(page)
    const thumb = await page.getByTestId('thumb-section-s3').boundingBox(), num = await page.getByTestId('section-number-s3').boundingBox()
    expect(Math.abs((thumb!.y + thumb!.height / 2) - (num!.y + num!.height / 2))).toBeLessThan(thumb!.height / 2)
    expect(num!.x).toBeGreaterThan(thumb!.x)
    const card = await page.getByTestId('section-s3').boundingBox()
    expect(card!.height).toBeGreaterThanOrEqual(44)
    await page.getByTestId('section-s3').click()
    await expect(page.getByRole('heading', { level: 1, name: 'Capacitors' })).toBeVisible()
  })

  for (const scheme of ['light', 'dark'] as const) {
    test(`axe: home cards (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme })
      await page.goto('/')
      await expect(page.getByTestId('section-s1')).toBeVisible()
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      expect(res.violations.map((v) => `${v.id}: ${v.help} ${v.nodes[0]?.html.slice(0, 120)}`)).toEqual([])
    })
  }

  test('titles line up across a row (the picture row has a fixed height)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'cards are in one column on phones')
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/')
    // §3, §4, §5 are in the same grid row on a wide screen
    const ys = await Promise.all(['s3', 's4', 's5'].map(async (id) => (await page.getByTestId(`card-title-${id}`).boundingBox())!.y))
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThanOrEqual(2)
  })

  test('visual: two cards', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop baseline')
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/')
    await page.addStyleTag({ content: '.MuiSnackbar-root { display: none !important }' })
    for (const id of ['s3', 's10']) {
      await page.getByTestId(`section-${id}`).scrollIntoViewIfNeeded()
      await expect(page.getByTestId(`section-${id}`)).toHaveScreenshot(`card-${id}.png`, { maxDiffPixelRatio: 0.02, animations: 'disabled' })
    }
  })
})
