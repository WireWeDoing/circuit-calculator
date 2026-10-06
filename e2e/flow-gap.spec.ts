import { expect, test, type Page } from '@playwright/test'
import { overlappingLabels } from './helpers.ts'

/**
 * Geometry check in a real browser: the arrow must sit clear of every wire (≈15–24 px away on screen),
 * so it is easy to tell apart from the line it describes.
 */
async function arrowClearance(page: Page) {
  return page.evaluate(() => {
    const svg = document.querySelector('main svg[role="img"]') as SVGSVGElement
    const arrows = [...svg.querySelectorAll<SVGGElement>('[data-testid="flow-arrow"]')]
    // every drawn stroke/shape that is not an arrow and not text: wires, component bodies, boxes
    const shapes = [...svg.querySelectorAll<SVGGeometryElement>('path, line, polyline, polygon, rect, circle, ellipse')].filter((e) => !e.closest('[data-testid="flow-arrow"]') && !e.closest('title') && e.getAttribute('stroke') !== 'none')
    const toScreen = (el: SVGGraphicsElement, x: number, y: number) => { const m = el.getScreenCTM()!; return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f } }
    const scale = svg.getScreenCTM()!.a
    return arrows.map((g) => {
      const b = g.getBoundingClientRect()
      const cx = b.x + b.width / 2, cy = b.y + b.height / 2
      let best = Infinity
      for (const w of shapes) {
        let len: number
        try { len = w.getTotalLength() } catch { continue }
        const step = Math.max(1, len / 400)
        for (let l = 0; l <= len; l += step) { const p = w.getPointAtLength(l); const q = toScreen(w, p.x, p.y); const d = Math.hypot(q.x - cx, q.y - cy); if (d < best) best = d }
      }
      return { part: g.getAttribute('data-part') ?? '?', clearancePx: best, sidePx: Number(g.getAttribute('data-offset')) * scale }
    })
  })
}

const circuits: Array<[string, string]> = [
  ['p1-unknown-parallel', 'A'], ['p2-series-parallel', 'A'], ['p3-unknown-series', 'I'], ['p4-thevenin', 'divider'], ['p5-millman', 'V'],
  ['p13-several-leds', 'R'], ['p14-zener', 'R'], ['p20-internal-resistance', 'Rint'], ['led-resistor', 'R'], ['p17-bjt-switch', 'RB'],
  ['voltage-divider', 'Vout'], ['current-divider', 'I1'], ['r-series', 'withV'], ['r-parallel-2', 'withV'], ['r-parallel-n', 'withV'],
]

for (const [id, mode] of circuits) {
  test(`${id}: arrows sit beside the line and clear of everything else`, async ({ page, isMobile }) => {
    await page.goto(`/#/f/${id}`)
    const tab = page.getByTestId(`mode-${mode}`)
    if (await tab.count()) await tab.click()
    await page.getByTestId('use-example').click()
    await expect(page.getByTestId('result')).toHaveAttribute('data-status', 'ok')
    const arrows = await arrowClearance(page)
    expect(arrows.length, `${id}: no arrows`).toBeGreaterThan(0)
    for (const a of arrows) {
      // the arrow is placed 15–20+ px to the side of its line (a phone shows the diagram smaller than a desktop does)…
      expect(a.sidePx, `${id}: arrow "${a.part}" is placed only ${a.sidePx.toFixed(1)} px from its line`).toBeGreaterThanOrEqual(isMobile ? 12 : 15)
      expect(a.sidePx, `${id}: arrow "${a.part}" is ${a.sidePx.toFixed(1)} px away — too far to belong to its line`).toBeLessThanOrEqual(34)
      // …and it is not touching anything else that is drawn (rails, parts, boxes)
      expect(a.clearancePx, `${id}: arrow "${a.part}" is only ${a.clearancePx.toFixed(1)} px from another drawn line`).toBeGreaterThanOrEqual(isMobile ? 7 : 9)
    }
    expect(await overlappingLabels(page), `${id}: overlapping labels`).toBe(0)
  })
}

test('ten parallel branches: arrows still clear of their wire (tighter gap, but never on it)', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop')
  await page.goto('/#/f/r-parallel-n')
  await page.getByTestId('mode-withV').click()
  for (let i = 0; i < 8; i++) await page.getByRole('button', { name: 'Add another' }).click()
  const vals = ['100', '220', '330', '470', '680', '1000', '2200', '4700', '10000', '47000']
  for (let i = 0; i < 10; i++) await page.getByTestId(`in-R-${i}`).fill(vals[i]!)
  await page.getByTestId('in-V').fill('9')
  const arrows = await arrowClearance(page)
  expect(arrows).toHaveLength(11) // ten branches + the supply arrow
  for (const a of arrows) { expect(a.sidePx, `arrow ${a.part}`).toBeGreaterThanOrEqual(10); expect(a.clearancePx, `arrow ${a.part}`).toBeGreaterThanOrEqual(6) }
})
