import { expect, test } from '@playwright/test'

test.describe('PWA', () => {
  test('web manifest is linked and installable', async ({ page, request }) => {
    await page.goto('/')
    const href = await page.locator('link[rel="manifest"]').getAttribute('href')
    expect(href).toBeTruthy()
    const res = await request.get(new URL(href!, page.url()).toString())
    expect(res.ok()).toBe(true)
    const m = await res.json()
    expect(m.name).toMatch(/Circuit Calculator/)
    expect(m.short_name.length).toBeLessThanOrEqual(12)
    expect(m.display).toBe('standalone')
    expect(m.start_url).toBeTruthy()
    expect(m.theme_color).toMatch(/^#/)
    const sizes = m.icons.map((i: { sizes: string }) => i.sizes)
    expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']))
    expect(m.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true)
    for (const icon of m.icons) {
      const r = await request.get(new URL(icon.src, page.url()).toString())
      expect(r.ok(), icon.src).toBe(true)
      expect(r.headers()['content-type']).toContain('image/png')
    }
  })

  test('iOS needs: apple-touch-icon, viewport-fit and standalone meta', async ({ page, request }) => {
    await page.goto('/')
    const touch = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href')
    expect((await request.get(new URL(touch!, page.url()).toString())).ok()).toBe(true)
    expect(await page.locator('meta[name="viewport"]').getAttribute('content')).toContain('viewport-fit=cover')
    expect(await page.locator('meta[name="apple-mobile-web-app-capable"]').getAttribute('content')).toBe('yes')
    expect(await page.locator('meta[name="theme-color"]').getAttribute('content')).toMatch(/^#/)
  })

  test('service worker installs and the app works offline', async ({ page, context }, info) => {
    test.skip(info.project.name === 'ios-safari', 'verified on Chromium; WebKit offline simulation differs')
    await page.goto('/')
    await page.evaluate(async () => { await navigator.serviceWorker.ready })
    // wait until the worker controls the page (first load is uncontrolled)
    await page.reload()
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
    await context.setOffline(true)
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.goto('/#/f/ohms-law')
    await page.getByTestId('mode-V').click()
    await page.getByTestId('in-I').fill('2')
    await page.getByTestId('in-R').fill('10')
    await expect(page.getByTestId('out-V')).toContainText('20 V')
    await context.setOffline(false)
  })

  test('no network requests leave the origin (all calculation is client-side)', async ({ page }) => {
    const external: string[] = []
    page.on('request', (r) => { const u = new URL(r.url()); if (!['localhost', '127.0.0.1'].includes(u.hostname) && u.protocol.startsWith('http')) external.push(r.url()) })
    await page.goto('/')
    await page.goto('/#/f/rc-charging')
    await page.getByTestId('use-example').click()
    await expect(page.getByTestId('result')).toHaveAttribute('data-status', 'ok')
    expect(external).toEqual([])
  })

  test('no calculation request goes to a server (only static files are fetched)', async ({ page }) => {
    const posts: string[] = []
    page.on('request', (r) => { if (r.method() !== 'GET') posts.push(`${r.method()} ${r.url()}`) })
    await page.goto('/#/f/ohms-law')
    await page.getByTestId('use-example').click()
    expect(posts).toEqual([])
  })
})
