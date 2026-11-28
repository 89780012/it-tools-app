import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { locales } from '../src/i18n/config'

const id = 'iso-week-calculator'
const path = `/tools/${id}`
let errors: string[] = []
test.beforeEach(async ({ page, baseURL }) => {
  errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url())
    return url.origin === new URL(baseURL!).origin &&
      !url.pathname.startsWith('/api/')
      ? route.continue()
      : route.abort()
  })
})
test.afterEach(() => expect(errors).toEqual([]))

test('catalog, both conversions, keyboard, errors, copy, download and clear', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByTestId('tool-search').fill('ISO week')
  await page.getByTestId(`tool-card-${id}`).getByRole('link').click()
  await expect(page).toHaveURL(new RegExp(`${path}$`))
  const tool = page.locator(`[data-tool="${id}"]`)
  const output = tool.getByLabel('Conversion summary', { exact: true })
  const input = tool.getByLabel('Calendar date', { exact: true })
  const convert = tool.getByRole('button', { name: 'Convert', exact: true })
  await tool.getByRole('button', { name: 'Load example' }).click()
  await input.press('Enter')
  const expected =
    'Calendar date: 2021-01-01\nISO week date: 2020-W53-5\nISO week year: 2020\nWeek number: 53\nDay of week: 5 (Friday)\nWeek start (Monday): 2020-12-28\nWeek end (Sunday): 2021-01-03\nWeeks in ISO year: 53'
  await expect(output).toHaveValue(expected)
  await tool.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(tool.getByRole('status')).toHaveText('Copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    expected,
  )
  const downloading = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Download', exact: true }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('iso-week.txt')
  expect(readFileSync((await download.path())!, 'utf8')).toBe(expected)
  await input.fill('2021-02-29')
  await expect(output).toHaveCount(0)
  await convert.click()
  await expect(tool.getByRole('alert')).toContainText('real calendar date')
  await expect(input).toBeFocused()
  await expect(input).toHaveAttribute(
    'aria-describedby',
    'iso-week-hint iso-week-error',
  )
  await input.fill('2024-02-29')
  await input.press('Enter')
  await expect(output).toHaveValue(/2024-W09-4/)
  await tool.getByLabel('Conversion direction').selectOption('week')
  await expect(output).toHaveCount(0)
  const weekInput = tool.getByLabel('ISO week date', { exact: true })
  await expect(weekInput).toHaveValue('')
  await tool.getByRole('button', { name: 'Load example' }).click()
  await convert.click()
  await expect(output).toHaveValue(expected)
  for (const [value, message] of [
    ['2021-W53-1', 'only 52 weeks'],
    ['2026-w01-1', 'Use uppercase W'],
    ['9999-W52-7', 'outside the supported'],
  ]) {
    await weekInput.fill(value)
    await convert.click()
    await expect(tool.getByRole('alert')).toContainText(message)
    await expect(weekInput).toBeFocused()
    await expect(output).toHaveCount(0)
  }
  await weekInput.fill('0001-W01-1')
  await weekInput.press('Enter')
  await expect(output).toHaveValue(/Calendar date: 0001-01-01/)
  await expect(tool.getByRole('alert')).toHaveCount(0)
  await tool.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(weekInput).toHaveValue('')
  await expect(output).toHaveCount(0)
  await expect(weekInput).toBeFocused()
  await convert.click()
  await expect(tool.getByRole('alert')).toContainText('Enter YYYY-Www-D')
})

test('12 locales: mobile, reverse conversion, errors, RTL, SEO and prerender', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const locale of locales) {
    const messages = JSON.parse(
      readFileSync(
        `src/i18n/messages/iso-week-additions/${locale}.json`,
        'utf8',
      ),
    )
    const labels = messages.isoWeek
    const info = messages.tools[id]
    const route = `${locale === 'en' ? '' : `/${locale}`}${path}`
    const canonical = `https://www.toolkitpub.com${route}`
    expect((await page.goto(route))?.ok()).toBe(true)
    await expect(page).toHaveTitle(`${info.meta.title} - IT Tools Collection`)
    await expect(page.locator('html')).toHaveAttribute('lang', locale)
    await expect(page.locator('html')).toHaveAttribute(
      'dir',
      locale === 'ar' ? 'rtl' : 'ltr',
    )
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      canonical,
    )
    await expect(page.locator('link[rel="alternate"]')).toHaveCount(12)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      info.meta.description,
    )
    const prerender = await page.evaluate(
      (html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html')
        return {
          title: doc.title,
          heading: doc.querySelector('[data-tool] h1')?.textContent,
          description: doc
            .querySelector('meta[name="description"]')
            ?.getAttribute('content'),
          canonical: doc
            .querySelector('link[rel="canonical"]')
            ?.getAttribute('href'),
          alternates: doc.querySelectorAll('link[rel="alternate"]').length,
        }
      },
      readFileSync(`dist${route}/index.html`, 'utf8'),
    )
    expect(prerender).toEqual({
      title: `${info.meta.title} - IT Tools Collection`,
      heading: info.name,
      description: info.meta.description,
      canonical,
      alternates: 12,
    })
    expect(readFileSync(`dist/sitemap-${locale}.xml`, 'utf8')).toContain(
      `<loc>${canonical}</loc>`,
    )
    const tool = page.locator(`[data-tool="${id}"]`)
    await tool.getByLabel(labels.date, { exact: true }).fill('2018-12-31')
    await tool
      .getByRole('button', { name: labels.convert, exact: true })
      .click()
    const output = tool.getByLabel(labels.summary, { exact: true })
    await expect(output).toHaveValue(/2019-W01-1/)
    await tool.getByLabel(labels.mode, { exact: true }).selectOption('week')
    await tool.getByLabel(labels.weekDate, { exact: true }).fill('2020-W53-5')
    await tool
      .getByRole('button', { name: labels.convert, exact: true })
      .click()
    const plain = `${labels.date}: 2021-01-01\n${labels.weekDate}: 2020-W53-5\n${labels.weekYear}: 2020\n${labels.week}: 53\n${labels.weekday}: 5 (${labels.friday})\n${labels.weekStart}: 2020-12-28\n${labels.weekEnd}: 2021-01-03\n${labels.weeksInYear}: 53`
    const expected =
      locale === 'ar' ? plain.replace(/: (.*)/g, ': \u2066$1\u2069') : plain
    await expect(output).toHaveValue(expected)
    expect(await tool.innerText()).not.toMatch(
      /isoWeek\.|tools\.iso-week-calculator\./,
    )
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true)
    if (locale === 'zh' || locale === 'ar') {
      // The real downloaded UTF-8 file must retain every localized label.
      const downloading = page.waitForEvent('download')
      await tool
        .locator('button')
        .filter({ has: page.locator('svg.lucide-download') })
        .click()
      expect(readFileSync((await (await downloading).path())!, 'utf8')).toBe(
        expected,
      )
      await page.screenshot({
        path: testInfo.outputPath(`${locale}-mobile.png`),
        fullPage: true,
      })
    }
    await tool.getByLabel(labels.weekDate, { exact: true }).fill('2021-W53-1')
    await tool
      .getByRole('button', { name: labels.convert, exact: true })
      .click()
    await expect(tool.getByRole('alert')).toHaveText(labels.missingWeek)
  }
})

test('mobile/desktop light/dark themes and upper boundary', async ({
  page,
}, testInfo) => {
  await page.goto(path)
  const tool = page.locator(`[data-tool="${id}"]`)
  await tool.getByLabel('Calendar date', { exact: true }).fill('9999-12-31')
  await tool.getByRole('button', { name: 'Convert', exact: true }).click()
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const theme of ['Light', 'Dark']) {
      await page.getByRole('button', { name: 'Toggle theme' }).click()
      await page.getByRole('menuitem', { name: theme, exact: true }).click()
      await expect(page.locator('html')).toHaveClass(
        new RegExp(`\\b${theme.toLowerCase()}\\b`),
      )
      await expect(page.getByRole('menu')).toBeHidden()
      await expect(tool.getByLabel('Conversion summary')).toHaveValue(
        /Week end \(Sunday\): \+010000-01-02/,
      )
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

test('date-only conversion is identical in three host time zones', async ({
  browser,
  baseURL,
}) => {
  for (const timezoneId of [
    'America/Los_Angeles',
    'Asia/Shanghai',
    'Pacific/Kiritimati',
  ]) {
    const context = await browser.newContext({ timezoneId, baseURL })
    await context.route('**/*', (route) =>
      new URL(route.request().url()).origin === new URL(baseURL!).origin
        ? route.continue()
        : route.abort(),
    )
    const page = await context.newPage()
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(path)
    for (const [date, week] of [
      ['2021-01-01', '2020-W53-5'],
      ['2026-03-08', '2026-W10-7'],
      ['2026-11-01', '2026-W44-7'],
    ]) {
      await page.getByLabel('Calendar date', { exact: true }).fill(date)
      await page.getByRole('button', { name: 'Convert', exact: true }).click()
      await expect(page.getByLabel('Conversion summary')).toHaveValue(
        new RegExp(week),
      )
    }
    await context.close()
  }
})
