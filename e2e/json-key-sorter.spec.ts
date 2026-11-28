import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { locales } from '../src/i18n/config'
const id = 'json-key-sorter'
const path = `/tools/${id}`
// Existing index.html loads these two scripts on every page. Keep them blocked,
// and fail for any additional external/API request made while using the tool.
const baselineScripts = [
  'https://www.googletagmanager.com/gtag/js?id=G-8Q613219YV',
  'https://analytics.ahrefs.com/analytics.js',
].sort()
let runtimeErrors: string[]
let blockedRequests: string[]
test.beforeEach(async ({ page, baseURL }) => {
  runtimeErrors = []
  blockedRequests = []
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (
      url.origin === new URL(baseURL!).origin &&
      !url.pathname.startsWith('/api/')
    )
      return route.continue()
    blockedRequests.push(url.href)
    if (baselineScripts.includes(url.href)) {
      expect(route.request().resourceType()).toBe('script')
      expect(route.request().method()).toBe('GET')
    }
    return route.abort()
  })
})
test.afterEach(() => {
  expect(runtimeErrors).toEqual([])
  expect([...new Set(blockedRequests)].sort()).toEqual(baselineScripts)
})

test('search, recursive sorting, exact clipboard/download, validation and reset', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByTestId('tool-search').fill('JSON sort keys')
  await page.getByTestId(`tool-card-${id}`).getByRole('link').click()
  await expect(page).toHaveURL(new RegExp(`${path}$`))
  const tool = page.locator(`[data-tool="${id}"]`)
  const input = tool.getByLabel('Input JSON', { exact: true })
  const output = tool.getByLabel('Sorted JSON', { exact: true })
  const sort = tool.getByRole('button', { name: 'Sort keys', exact: true })
  await tool.getByRole('button', { name: 'Load example' }).click()
  await sort.click()
  const example = await output.inputValue()
  expect(example).toContain('9007199254740993')
  expect(example.indexOf('"10"')).toBeLessThan(example.indexOf('"2"'))
  await tool.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(tool.getByRole('status')).toHaveText('Copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    example,
  )
  const downloading = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Download', exact: true }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('sorted.json')
  expect(readFileSync((await download.path())!, 'utf8')).toBe(example)
  await tool.getByLabel('Sort order', { exact: true }).selectOption('desc')
  await expect(output).toHaveCount(0)
  await tool
    .getByLabel('Output format', { exact: true })
    .selectOption('compact')
  await input.fill('[{"2":2,"10":10,"a":9007199254740993},3,1]')
  await sort.click()
  await expect(output).toHaveValue('[{"a":9007199254740993,"2":2,"10":10},3,1]')
  await expect(tool.getByRole('status')).toHaveText('')
  for (const [text, message] of [
    ['', 'Enter JSON to sort.'],
    ['{', 'Invalid JSON'],
    ['{"a":1,"\\u0061":1}', 'Duplicate object keys'],
    ['['.repeat(65) + '0' + ']'.repeat(65), 'at most 64'],
    ['"' + 'x'.repeat(500000) + '"', 'at most 500000'],
  ]) {
    await input.fill(text)
    await expect(output).toHaveCount(0)
    await sort.click()
    await expect(tool.getByRole('alert')).toContainText(message)
    await expect(input).toBeFocused()
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toHaveAttribute(
      'aria-describedby',
      'sort-hint sort-error',
    )
  }
  await tool.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(input).toHaveValue('')
  await expect(input).toBeFocused()
  await expect(tool.getByLabel('Sort order', { exact: true })).toHaveValue(
    'asc',
  )
  await expect(tool.getByLabel('Output format', { exact: true })).toHaveValue(
    '2',
  )
  await expect(tool.getByRole('alert')).toHaveCount(0)
})

test('all 12 locales on mobile: sorting, errors, RTL, SEO and prerendered pages', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const locale of locales) {
    const messages = JSON.parse(
      readFileSync(
        `src/i18n/messages/json-key-sorter-additions/${locale}.json`,
        'utf8',
      ),
    )
    const labels = messages.jsonKeySorter
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
    const input = tool.getByLabel(labels.data, { exact: true })
    const output = tool.getByLabel(labels.output, { exact: true })
    const sort = tool.getByRole('button', { name: labels.sort, exact: true })
    await input.fill('{"z":[3,{"z":1,"a":2}],"a":9007199254740993}')
    await tool
      .getByLabel(labels.indent, { exact: true })
      .selectOption('compact')
    await sort.click()
    await expect(output).toHaveValue(
      '{"a":9007199254740993,"z":[3,{"a":2,"z":1}]}',
    )
    await input.fill('{"x":1,"x":1}')
    await sort.click()
    await expect(tool.getByRole('alert')).toHaveText(labels.duplicateKey)
    await expect(input).toBeFocused()
    await input.fill('null')
    await sort.click()
    await expect(output).toHaveValue('null')
    expect(await tool.innerText()).not.toMatch(
      /jsonKeySorter\.|tools\.json-key-sorter\./,
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

test('light and dark themes at desktop and mobile sizes', async ({
  page,
}, testInfo) => {
  await page.goto(path)
  const tool = page.locator(`[data-tool="${id}"]`)
  await tool.getByRole('button', { name: 'Load example' }).click()
  await tool.getByRole('button', { name: 'Sort keys', exact: true }).click()
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const theme of ['Light', 'Dark']) {
      await page.getByRole('button', { name: 'Toggle theme' }).click()
      await page.getByRole('menuitem', { name: theme, exact: true }).click()
      await expect(page.locator('html')).toHaveClass(
        new RegExp(`\\b${theme.toLowerCase()}\\b`),
      )
      await expect(page.getByRole('menu')).toBeHidden()
      expect(await tool.getByLabel('Sorted JSON').inputValue()).toContain(
        '9007199254740993',
      )
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true)
      await page.screenshot({
        path: testInfo.outputPath(`${theme.toLowerCase()}-${width}.png`),
        fullPage: true,
        animations: 'disabled',
      })
    }
  }
})
