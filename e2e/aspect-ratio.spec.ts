import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { locales } from '../src/i18n/config'

const id = 'aspect-ratio-calculator'
const path = `/tools/${id}`
const runtimeErrors: string[] = []

const calculator = (page: Page) => page.locator(`[data-tool="${id}"]`)

test.beforeEach(async ({ page, baseURL }) => {
  runtimeErrors.length = 0
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url())
    return url.origin === new URL(baseURL!).origin && !url.pathname.startsWith('/api/')
      ? route.continue()
      : route.abort()
  })
})

test.afterEach(() => expect(runtimeErrors).toEqual([]))

test('calculates, copies, validates and resets all four modes', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('tool-search').fill('16:9')
  await page.getByTestId(`tool-card-${id}`).getByRole('link').click()
  await expect(page).toHaveURL(new RegExp(`${path}$`))
  const tool = calculator(page)
  const mode = tool.getByLabel('Calculation mode')
  const sourceWidth = tool.getByLabel('Original width (px)')
  const sourceHeight = tool.getByLabel('Original height (px)')
  const calculate = tool.getByRole('button', { name: 'Calculate', exact: true })
  const copy = tool.getByRole('button', { name: 'Copy', exact: true })

  await tool.getByRole('button', { name: 'Load example' }).click()
  await expect(mode).toHaveValue('fit')
  await calculate.click()
  await expect(tool.getByText('16:9', { exact: true })).toBeVisible()
  await expect(tool.getByText('1000 × 563', { exact: true })).toBeVisible()
  await expect(tool.getByText(/rounded to the nearest/)).toBeVisible()
  await copy.click()
  await expect(tool.getByRole('status')).toHaveText('Copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('16:9\n1000 × 563')

  await mode.selectOption('width')
  await expect(copy).toHaveCount(0)
  await expect(tool.getByLabel('Target height (px)')).toHaveCount(0)
  await tool.getByLabel('Target width (px)').fill('1280')
  await calculate.click()
  await expect(tool.getByText('1280 × 720', { exact: true })).toBeVisible()

  await mode.selectOption('height')
  const targetHeight = tool.getByLabel('Target height (px)')
  await targetHeight.fill('1e3')
  await calculate.click()
  await expect(targetHeight).toBeFocused()
  await expect(targetHeight).toHaveAttribute('aria-invalid', 'true')
  await expect(tool.getByRole('alert')).toContainText('Target height (px) must be a whole number')
  await targetHeight.fill('540')
  await expect(tool.getByRole('alert')).toHaveCount(0)
  await targetHeight.press('Enter')
  await expect(tool.getByText('960 × 540', { exact: true })).toBeVisible()

  await mode.selectOption('ratio')
  await sourceWidth.fill('1080')
  await sourceHeight.fill('1920')
  await calculate.click()
  await expect(tool.getByText('9:16', { exact: true })).toBeVisible()
  await copy.click()
  await expect(tool.getByRole('status')).toHaveText('Copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('9:16')
  await tool.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(sourceWidth).toHaveValue('')
  await expect(sourceHeight).toHaveValue('')
  await expect(mode).toHaveValue('ratio')
  await expect(copy).toHaveCount(0)
  await calculate.click()
  await expect(sourceWidth).toBeFocused()
  await expect(tool.getByRole('alert')).toContainText('Original width (px)')
})

test('renders localized pages, SEO and calculations at mobile width', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const locale of locales) {
    const messages = JSON.parse(readFileSync(`src/i18n/messages/aspect-ratio-additions/${locale}.json`, 'utf8'))
    const labels = messages.aspectRatio
    const toolInfo = messages.tools[id]
    const route = locale === 'en' ? path : `/${locale}${path}`
    const canonical = `https://www.toolkitpub.com${route}`
    const title = `${toolInfo.meta.title} - IT Tools Collection`
    expect((await page.goto(route))?.ok()).toBe(true)
    if (testInfo.project.metadata.checkPrerender) {
      const response = await page.request.get(`${route}/index.html`)
      expect(response.ok()).toBe(true)
      const prerender = await page.evaluate((html) => {
        const document = new DOMParser().parseFromString(html, 'text/html')
        return {
          heading: document.querySelector('[data-tool] h1')?.textContent,
          title: document.title,
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
          description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
          alternates: document.querySelectorAll('link[rel="alternate"]').length,
        }
      }, await response.text())
      expect(prerender).toEqual({
        heading: toolInfo.name,
        title,
        canonical,
        description: toolInfo.meta.description,
        alternates: 12,
      })
      const sitemap = await page.request.get(`/sitemap-${locale}.xml`)
      expect(sitemap.ok()).toBe(true)
      expect(await sitemap.text()).toContain(`<loc>${canonical}</loc>`)
    }
    await expect(page).toHaveTitle(title)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', toolInfo.meta.description)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical)
    await expect(page.locator('link[rel="alternate"]')).toHaveCount(12)
    await expect(page.locator('html')).toHaveAttribute('lang', locale)
    await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr')

    const tool = calculator(page)
    await expect(tool.getByRole('heading', { name: toolInfo.name })).toBeVisible()
    await tool.getByLabel(labels.sourceWidth).fill(locale === 'ar' ? '١٩٢٠' : '1920')
    await tool.getByLabel(labels.sourceHeight).fill(locale === 'hi' ? '१०८०' : '1080')
    await tool.getByLabel(labels.mode).selectOption('fit')
    await tool.getByLabel(labels.targetWidth).fill('1000')
    await tool.getByLabel(labels.targetHeight).fill('1000')
    await tool.getByRole('button', { name: labels.calculate, exact: true }).click()
    await expect(tool.getByText('16:9', { exact: true })).toBeVisible()
    await expect(tool.getByText('1000 × 563', { exact: true })).toBeVisible()
    await expect(tool.getByText(labels.rounded, { exact: true })).toBeVisible()
    expect(await tool.innerText()).not.toMatch(/aspectRatio\.|tools\.aspect-ratio-calculator\./)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    if (locale === 'ar' || locale === 'zh') {
      await page.screenshot({ path: testInfo.outputPath(`${locale}-mobile.png`), fullPage: true })
    }
  }
})

test('switches both themes with results visible at mobile and desktop widths', async ({ page }, testInfo) => {
  await page.goto(path)
  const tool = calculator(page)
  await tool.getByRole('button', { name: 'Load example' }).click()
  await tool.getByRole('button', { name: 'Calculate', exact: true }).click()
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const theme of ['Light', 'Dark']) {
      await page.getByRole('button', { name: 'Toggle theme' }).click()
      await page.getByRole('menuitem', { name: theme, exact: true }).click()
      await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${theme.toLowerCase()}\\b`))
      await expect(page.getByRole('menu')).toBeHidden()
      await expect(tool.getByText('1000 × 563', { exact: true })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
      await page.screenshot({ path: testInfo.outputPath(`${theme.toLowerCase()}-${width}.png`), fullPage: true })
    }
  }
})
