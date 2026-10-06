import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { noHorizontalScroll } from './helpers.ts'

const pages = ['/', '/#/part/basics', '/#/chapter/voltage-current-resistance', '/#/topic/multimeter', '/#/topic/oscilloscope', '/#/topic/scope-reading', '/#/topic/logic-levels', '/#/topic/op-amp-gain', '/#/topic/ohms-law', '/#/topic/r-parallel-n', '/#/topic/rc-charging', '/#/topic/resistor-colour-code', '/#/topic/units-and-prefixes', '/#/topic/p9-time-to-voltage', '/#/topic/state-of-charge', '/#/topic/led-vf']

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`accessibility (${scheme})`, () => {
    test.use({ colorScheme: scheme })
    for (const url of pages) {
      test(`axe: ${url}`, async ({ page }) => {
        await page.goto(url)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        // fill an example so the result/steps/diagram are part of what is audited
        if (await page.getByTestId('use-example').count()) await page.getByTestId('use-example').first().click()
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
        expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) ${v.nodes[0]?.html.slice(0, 120)}`)).toEqual([])
      })
    }
  })
}

test.describe('mobile ergonomics', () => {
  test('touch targets are at least 44px and nothing scrolls sideways', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile projects only')
    for (const url of ['/#/topic/ohms-law', '/#/topic/r-parallel-n', '/#/topic/p9-time-to-voltage']) {
      await page.goto(url)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await noHorizontalScroll(page)
      const small = await page.evaluate(() => {
        const out: string[] = []
        for (const el of document.querySelectorAll<HTMLElement>('main button, main select, main input, main a[role="button"], header button, header a')) {
          const r = el.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) continue
          if (r.height < 43.5 || r.width < 43.5) out.push(`${el.tagName} ${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30)} ${Math.round(r.width)}x${Math.round(r.height)}`)
        }
        return out
      })
      expect(small, `${url}: small targets`).toEqual([])
    }
  })

  test('numeric fields open a decimal keypad', async ({ page }) => {
    await page.goto('/#/topic/ohms-law')
    await expect(page.getByTestId('in-I')).toHaveAttribute('inputmode', 'decimal')
  })

  test('diagrams scale to the viewport', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'on wide screens the sidebar takes part of the width')
    await page.goto('/#/topic/voltage-divider')
    const box = await page.locator('main svg[role="img"]').first().boundingBox()
    const vp = page.viewportSize()!
    expect(box!.width).toBeLessThanOrEqual(vp.width)
    expect(box!.width).toBeGreaterThan(vp.width * 0.4)
  })
})

test('keyboard: can reach and operate the calculator without a mouse', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard path is a desktop concern')
  await page.goto('/#/topic/ohms-law')
  await page.getByTestId('mode-V').click()
  await page.getByTestId('in-I').focus()
  await page.keyboard.type('2')
  await page.keyboard.press('Tab') // unit select
  await page.keyboard.press('Tab') // R input
  await page.keyboard.type('50')
  await expect(page.getByTestId('out-V')).toContainText('100 V')
})
