import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { expect, test, type Page } from '@playwright/test'

/**
 * Performance budgets. Interaction timings run in real Chromium with the CPU slowed 4× (≈ a mid-range phone),
 * measure "action → two painted frames", take the median of several runs and allow a few attempts, so a noisy
 * machine doesn't cause false alarms — but returning to a slow implementation (animated tree, MUI tabs,
 * scrollIntoView on every navigation…) fails clearly. Budgets are ~3× what the app measures today.
 */
test.describe('interaction budgets (4× CPU throttle)', () => {
  test.describe.configure({ mode: 'serial' })
  test.beforeEach(({ browserName }, info) => { test.skip(browserName !== 'chromium' || info.project.name !== 'desktop-chromium', 'timings are measured on desktop Chromium with CPU throttling') })

  async function throttled(page: Page) {
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  }

  const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!

  /** best median of up to three attempts */
  async function budget(label: string, limitMs: number, run: () => Promise<number[]>) {
    let best = Infinity
    for (let attempt = 0; attempt < 3 && best > limitMs; attempt++) best = Math.min(best, median(await run()))
    expect(best, `${label}: ${Math.round(best)} ms (budget ${limitMs} ms)`).toBeLessThanOrEqual(limitMs)
  }

  test('expanding and collapsing sidebar branches is instant', async ({ page }) => {
    await page.goto('/'); await page.waitForTimeout(500); await throttled(page)
    const toggleAll = () => page.evaluate(async () => {
      const ids = ['components', 'resistors', 'capacitors', 'inductors', 'diodes-leds'] // a part, then four of its chapters
      const click = async (id: string) => {
        const t0 = performance.now()
        ;(document.querySelector(`[data-testid="toggle-${id}"]`) as HTMLElement).click()
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
        return performance.now() - t0
      }
      const expand: number[] = [], collapse: number[] = []
      for (const id of ids) expand.push(await click(id))
      for (const id of [...ids].reverse()) collapse.push(await click(id)) // chapters first, then the part
      return { expand, collapse } // ends with everything collapsed again, so attempts are repeatable
    })
    let best = { expand: Infinity, collapse: Infinity }
    for (let attempt = 0; attempt < 3 && (best.expand > 150 || best.collapse > 150); attempt++) {
      const r = await toggleAll()
      best = { expand: Math.min(best.expand, median(r.expand)), collapse: Math.min(best.collapse, median(r.collapse)) }
    }
    expect(best.expand, `expand median ${Math.round(best.expand)} ms (budget 150)`).toBeLessThanOrEqual(150)
    expect(best.collapse, `collapse median ${Math.round(best.collapse)} ms (budget 150)`).toBeLessThanOrEqual(150)
  })

  test('opening topics, chapter pages and home is quick', async ({ page }) => {
    await page.goto('/'); await page.waitForTimeout(500); await throttled(page)
    const go = (hash: string) => page.evaluate(async (h) => {
      const t0 = performance.now(); location.hash = h
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      return performance.now() - t0
    }, hash)
    await go('#/topic/rc-charging') // warm-up: first render JIT-compiles the page components
    await budget('open a topic', 300, async () => { const o: number[] = []; for (const h of ['#/topic/voltage-divider', '#/topic/ohms-law', '#/topic/r-parallel-n', '#/topic/led-resistor', '#/topic/p9-time-to-voltage']) { o.push(await go(h)); await page.waitForTimeout(80) } return o })
    await budget('open a chapter (up to 14 diagram thumbnails)', 250, async () => { const o: number[] = []; for (const h of ['#/chapter/resistors', '#/chapter/capacitors', '#/chapter/resistors', '#/chapter/ac-filters', '#/chapter/resistors']) { o.push(await go(h)); await page.waitForTimeout(80) } return o })
    await budget('open home', 250, async () => { const o: number[] = []; for (const h of ['#/', '#/chapter/capacitors', '#/', '#/chapter/resistors', '#/']) { o.push(await go(h)); await page.waitForTimeout(80) } return o })
  })

  test('opening search is quick', async ({ page }) => {
    await page.goto('/'); await page.waitForTimeout(500); await throttled(page)
    await budget('open + close search', 300, async () => {
      const o: number[] = []
      for (let i = 0; i < 4; i++) {
        o.push(await page.evaluate(async () => { const t0 = performance.now(); (document.querySelector('[data-testid="search-button"]') as HTMLElement).click(); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); return performance.now() - t0 }))
        await page.keyboard.press('Escape'); await page.waitForTimeout(400)
      }
      return o
    })
  })

  test('typing stays responsive on the heaviest calculator (10 parallel resistors + table + diagram)', async ({ page }) => {
    await page.goto('/#/topic/r-parallel-n')
    await page.getByTestId('mode-withV').click()
    for (let i = 0; i < 8; i++) await page.getByRole('button', { name: 'Add another' }).click()
    const vals = ['100', '220', '330', '470', '680', '1000', '2200', '4700', '10000', '47000']
    for (let i = 0; i < 10; i++) await page.getByTestId(`in-R-${i}`).fill(vals[i]!)
    await page.getByTestId('in-V').fill('9')
    await throttled(page)
    await budget('keystroke → painted', 130, async () => page.evaluate(async () => {
      const el = document.querySelector('[data-testid="in-R-3"]') as HTMLInputElement
      el.focus(); el.select()
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      const out: number[] = []; let cur = ''
      for (const ch of '47001234') { cur += ch; const t0 = performance.now(); set.call(el, cur); el.dispatchEvent(new Event('input', { bubbles: true })); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); out.push(performance.now() - t0) }
      return out
    }))
  })
})

test.describe('bundle size budget', () => {
  test('JavaScript and CSS stay small, and vendor code is split into cacheable chunks', () => {
    const dir = join(process.cwd(), 'dist', 'assets')
    const files = readdirSync(dir).filter((f) => statSync(join(dir, f)).isFile())
    const gz = (f: string) => gzipSync(readFileSync(join(dir, f))).length
    const js = files.filter((f) => f.endsWith('.js')), css = files.filter((f) => f.endsWith('.css'))
    const totalJs = js.reduce((a, f) => a + gz(f), 0)
    const biggest = Math.max(...js.map(gz))
    expect(totalJs / 1024, `total JS gzip ${(totalJs / 1024).toFixed(0)} KB`).toBeLessThan(300)
    expect(biggest / 1024, `largest chunk gzip ${(biggest / 1024).toFixed(0)} KB`).toBeLessThan(130)
    expect(css.reduce((a, f) => a + gz(f), 0) / 1024).toBeLessThan(12)
    expect(js.some((f) => f.startsWith('react-')), 'react vendor chunk').toBe(true)
    expect(js.some((f) => f.startsWith('mui-')), 'mui vendor chunk').toBe(true)
    // nothing from the test/dev tooling may leak into the app bundle
    for (const f of js) expect(readFileSync(join(dir, f), 'utf8')).not.toMatch(/@testing-library|playwright|vitest/)
  })
})
