import { expect, test } from '@playwright/test'
import { FORMULAS, SECTIONS } from '../src/formulas/index.ts'
import { noHorizontalScroll, watchErrors } from './helpers.ts'

test.describe('whole app smoke', () => {
  test('home shows every section; search works', async ({ page }) => {
    const w = watchErrors(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    for (const s of SECTIONS) await expect(page.getByTestId(`section-${s.id}`)).toBeVisible()
    await page.getByTestId('search').fill('555')
    await expect(page.getByTestId('search-results').getByText('Astable frequency')).toBeVisible()
    await noHorizontalScroll(page)
    w.expectClean()
  })

  test('every section lists its topics', async ({ page }) => {
    const w = watchErrors(page)
    for (const s of SECTIONS) {
      await page.goto(`/#/s/${s.id}`)
      await expect(page.getByRole('heading', { level: 1, name: s.title })).toBeVisible()
      const count = FORMULAS.filter((f) => f.section === s.id).length
      await expect(page.locator('main [data-testid^="formula-"]')).toHaveCount(count) // lists are split by sub-section in §17
    }
    w.expectClean()
  })

  test('every formula page renders a diagram, fits the screen and has no console errors', async ({ page }) => {
    const w = watchErrors(page)
    await page.goto('/')
    for (const f of FORMULAS) {
      await page.evaluate((id) => { window.location.hash = `#/f/${id}` }, f.id)
      await expect(page.getByRole('heading', { level: 1, name: f.title })).toBeVisible()
      await expect(page.locator('main svg[role="img"]').first()).toBeVisible()
      await noHorizontalScroll(page)
    }
    w.expectClean()
  })

  test('every calculator mode computes its cheat-sheet example in the real browser', async ({ page }) => {
    const w = watchErrors(page)
    await page.goto('/')
    for (const f of FORMULAS.filter((x) => x.modes.length)) {
      await page.evaluate((id) => { window.location.hash = `#/f/${id}` }, f.id)
      await expect(page.getByRole('heading', { level: 1, name: f.title })).toBeVisible()
      for (const m of f.modes) {
        if (f.modes.length > 1) await page.getByTestId(`mode-${m.id}`).click()
        await page.getByTestId('use-example').click()
        await expect(page.getByTestId('result'), `${f.id}/${m.id}`).toHaveAttribute('data-status', 'ok')
        const text = await page.getByTestId('result').innerText()
        expect(text, `${f.id}/${m.id}`).not.toMatch(/NaN|undefined|Infinity/)
        await page.getByTestId('clear').click()
      }
    }
    w.expectClean()
  })
})

test.describe('user journeys', () => {
  test("Ohm's law with unit prefixes", async ({ page }) => {
    await page.goto('/#/f/ohms-law')
    await page.getByTestId('mode-V').click()
    await page.getByTestId('in-I').fill('20')
    await page.getByTestId('unit-in-I').selectOption('mA')
    await page.getByTestId('in-R').fill('4.7')
    await page.getByTestId('unit-in-R').selectOption('kΩ')
    await expect(page.getByTestId('out-V')).toContainText('94 V')
    await expect(page.getByTestId('steps')).toContainText('20 mA = 0.02 A')
  })

  test('invalid input shows a clear error and no number', async ({ page }) => {
    await page.goto('/#/f/ohms-law')
    await page.getByTestId('mode-R').click()
    await page.getByTestId('in-V').fill('5')
    await page.getByTestId('in-I').fill('0')
    await expect(page.getByTestId('result-error')).toContainText('greater than 0')
    await expect(page.getByTestId('result')).not.toContainText('Infinity')
  })

  test('RC charging: step explanation mentions e and shows the concept help', async ({ page }) => {
    await page.goto('/#/f/rc-charging')
    await page.getByTestId('use-example').click()
    await expect(page.getByTestId('out-V')).toContainText('4.323 V')
    await page.getByRole('button', { name: /New to this\? e \(Euler/ }).click()
    await expect(page.getByText(/base of natural growth/)).toBeVisible()
  })

  test('colour-code tool decodes brown-black-red-gold', async ({ page }) => {
    await page.goto('/#/f/resistor-colour-code')
    await expect(page.getByTestId('colour-result')).toContainText('1 kΩ ±5%')
    await page.getByTestId('band-0').selectOption('yellow')
    await page.getByTestId('band-1').selectOption('violet')
    await expect(page.getByTestId('colour-result')).toContainText('4.7 kΩ')
  })

  test('browser back returns to the section', async ({ page }) => {
    await page.goto('/#/s/s2')
    await page.getByTestId('formula-voltage-divider').click()
    await expect(page.getByRole('heading', { level: 1, name: 'Voltage divider' })).toBeVisible()
    await page.goBack()
    await expect(page.getByRole('heading', { level: 1, name: 'Resistors' })).toBeVisible()
  })

  test('deep link to a formula works on a cold load', async ({ page }) => {
    await page.goto('/#/f/q-series')
    await expect(page.getByRole('heading', { level: 1, name: 'Q factor, series RLC' })).toBeVisible()
  })
})
