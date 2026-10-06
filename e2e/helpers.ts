import { expect, type Page } from '@playwright/test'

/** Collect console errors / page errors; call `expectClean()` at the end of a test. */
export function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })
  return { errors, expectClean: () => expect(errors, errors.join('\n')).toEqual([]) }
}

export const noHorizontalScroll = async (page: Page) => {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(over, 'page must not scroll sideways').toBeLessThanOrEqual(1)
}

/**
 * Number of pairs of text labels in the first diagram that collide. Two labels count as colliding when more than
 * 30% of the smaller one is covered — stacked name/value lines that merely touch (font metrics) don't count.
 */
export const overlappingLabels = (page: Page) => page.evaluate(() => {
  const boxes = [...document.querySelectorAll('main svg[role="img"] text')].map((t) => (t as SVGTextElement).getBoundingClientRect()).filter((r) => r.width > 0)
  let n = 0
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i]!, b = boxes[j]!
    const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
    if (ox > 0 && oy > 0 && (ox * oy) / Math.min(a.width * a.height, b.width * b.height) > 0.3) n++
  }
  return n
})
