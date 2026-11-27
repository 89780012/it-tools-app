import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { locales } from '../src/i18n/config'

const id = 'date-duration-calculator'
const path = `/tools/${id}`
const calculator = (page: Page) => page.locator(`[data-tool="${id}"]`)
let runtimeErrors: string[] = []

test.beforeEach(async ({ page, baseURL }) => {
  runtimeErrors = []
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url())
    return url.origin === new URL(baseURL!).origin &&
      !url.pathname.startsWith('/api/')
      ? route.continue()
      : route.abort()
  })
})
test.afterEach(() => expect(runtimeErrors).toEqual([]))

test('finds the tool, calculates, copies, downloads, validates and clears', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByTestId('tool-search').fill('business days')
  await page.getByTestId(`tool-card-${id}`).getByRole('link').click()
  await expect(page).toHaveURL(new RegExp(`${path}$`))
  const tool = calculator(page)
  const calculate = tool.getByRole('button', {
    name: 'Calculate',
    exact: true,
  })
  await tool.getByRole('button', { name: 'Load example' }).click()
  await calculate.click()
  await expect(tool.getByTestId('calendarDays')).toHaveText('7')
  await expect(tool.getByTestId('businessDays')).toHaveText('4')
  const summary = await tool.getByLabel('Result summary').inputValue()
  expect(summary).toContain('Weekday holidays deducted: 1')
  await tool.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(tool.getByRole('status')).toHaveText('Copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    summary,
  )
  const downloading = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Download', exact: true }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('date-duration.txt')
  expect(readFileSync((await download.path())!, 'utf8')).toBe(summary)

  await tool.getByLabel('Include end date').check()
  await expect(tool.getByLabel('Result summary')).toHaveCount(0)
  await calculate.click()
  await expect(tool.getByTestId('calendarDays')).toHaveText('8')
  await expect(tool.getByTestId('businessDays')).toHaveText('5')
  const holidays = tool.getByLabel('Holidays (optional)')
  await holidays.fill('\n2026-02-29')
  await calculate.click()
  await expect(tool.getByRole('alert')).toContainText('line 2')
  await expect(holidays).toBeFocused()
  await expect(holidays).toHaveAttribute('aria-invalid', 'true')
  await holidays.fill('')
  await expect(tool.getByRole('alert')).toHaveCount(0)
  await tool.getByLabel('End date', { exact: true }).fill('2026-11-20')
  await calculate.click()
  await expect(tool.getByRole('alert')).toContainText(
    'End date must be on or after',
  )
  await expect(tool.getByLabel('End date', { exact: true })).toBeFocused()
  await tool.getByLabel('End date', { exact: true }).fill('2026-11-23')
  await tool.getByLabel('End date', { exact: true }).press('Enter')
  await expect(tool.getByTestId('calendarDays')).toHaveText('1')
  await expect(tool.getByTestId('businessDays')).toHaveText('1')
  await tool.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(tool.getByLabel('Start date')).toHaveValue('')
  await expect(tool.getByLabel('End date', { exact: true })).toHaveValue('')
  await expect(holidays).toHaveValue('')
  await expect(tool.getByLabel('Include end date')).not.toBeChecked()
  await expect(tool.getByLabel('Result summary')).toHaveCount(0)
  await calculate.click()
  await expect(tool.getByLabel('Start date')).toBeFocused()
  await expect(tool.getByRole('alert')).toContainText(
    'Start date must be a valid',
  )
})

test('checks all 12 locales, mobile layouts and prerendered SEO', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const locale of locales) {
    const messages = JSON.parse(
      readFileSync(
        `src/i18n/messages/date-duration-additions/${locale}.json`,
        'utf8',
      ),
    )
    const labels = messages.dateDuration
    const info = messages.tools[id]
    const route = `${locale === 'en' ? '' : `/${locale}`}${path}`
    const canonical = `https://www.toolkitpub.com${route}`
    const title = `${info.meta.title} - IT Tools Collection`
    expect((await page.goto(route))?.ok()).toBe(true)
    const response = await page.request.get(`${route}/index.html`)
    expect(response.ok()).toBe(true)
    const prerender = await page.evaluate(
      (html) => {
        const document = new DOMParser().parseFromString(html, 'text/html')
        return {
          heading: document.querySelector('[data-tool] h1')?.textContent,
          title: document.title,
          canonical: document
            .querySelector('link[rel="canonical"]')
            ?.getAttribute('href'),
          description: document
            .querySelector('meta[name="description"]')
            ?.getAttribute('content'),
          alternates: document.querySelectorAll('link[rel="alternate"]').length,
        }
      },
      await response.text(),
    )
    expect(prerender).toEqual({
      heading: info.name,
      title,
      canonical,
      description: info.meta.description,
      alternates: 12,
    })
    const sitemap = await page.request.get(`/sitemap-${locale}.xml`)
    expect(await sitemap.text()).toContain(`<loc>${canonical}</loc>`)
    await expect(page).toHaveTitle(title)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      info.meta.description,
    )
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      canonical,
    )
    await expect(page.locator('link[rel="alternate"]')).toHaveCount(12)
    await expect(page.locator('html')).toHaveAttribute('lang', locale)
    await expect(page.locator('html')).toHaveAttribute(
      'dir',
      locale === 'ar' ? 'rtl' : 'ltr',
    )

    const tool = calculator(page)
    await tool.getByLabel(labels.start, { exact: true }).fill('2026-11-23')
    await tool.getByLabel(labels.end, { exact: true }).fill('2026-11-30')
    await tool
      .getByLabel(labels.holidays, { exact: true })
      .fill('2026-11-26\n2026-11-26\n2026-11-28')
    await tool
      .getByRole('button', { name: labels.calculate, exact: true })
      .click()
    await expect(tool.getByTestId('calendarDays')).toHaveText('7')
    await expect(tool.getByTestId('businessDays')).toHaveText('4')
    await expect(tool.getByLabel(labels.summary)).toHaveValue(
      new RegExp(`${labels.excludedHolidays}: 1`),
    )
    expect(await tool.innerText()).not.toMatch(
      /dateDuration\.|tools\.date-duration-calculator\./,
    )
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true)
    if (locale === 'zh' || locale === 'ar')
      await page.screenshot({
        path: testInfo.outputPath(`${locale}-mobile.png`),
        fullPage: true,
      })
  }
})

test('keeps controls and results usable in both themes at mobile and desktop sizes', async ({
  page,
}, testInfo) => {
  await page.goto(path)
  const tool = calculator(page)
  await tool.getByRole('button', { name: 'Load example' }).click()
  await tool.getByRole('button', { name: 'Calculate', exact: true }).click()
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const theme of ['Light', 'Dark']) {
      await page.getByRole('button', { name: 'Toggle theme' }).click()
      await page.getByRole('menuitem', { name: theme, exact: true }).click()
      await expect(page.locator('html')).toHaveClass(
        new RegExp(`\\b${theme.toLowerCase()}\\b`),
      )
      await expect(page.getByRole('menu')).toBeHidden()
      await expect(tool.getByTestId('businessDays')).toHaveText('4')
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true)
      await page.screenshot({
        path: testInfo.outputPath(`${theme.toLowerCase()}-${width}.png`),
        fullPage: true,
      })
    }
  }
})
