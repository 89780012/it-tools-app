import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { locales } from '../src/i18n/config'

const id = 'ipv4-cidr-aggregator'
const path = `/tools/${id}`
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

test('search, example, exact aggregation, statistics, clipboard, download, errors and reset', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByTestId('tool-search').fill('CIDR aggregate')
  await page.getByTestId(`tool-card-${id}`).getByRole('link').click()
  await expect(page).toHaveURL(new RegExp(`${path}$`))
  const tool = page.locator(`[data-tool="${id}"]`)
  const input = tool.getByLabel('IPv4 addresses or CIDRs', { exact: true })
  const output = tool.getByLabel('Aggregated CIDRs', { exact: true })
  const aggregate = tool.getByRole('button', {
    name: 'Aggregate networks',
    exact: true,
  })
  await tool.getByRole('button', { name: 'Load example' }).click()
  await aggregate.click()
  const expected = '192.0.2.0/24\n198.51.100.9/32'
  await expect(output).toHaveValue(expected)
  for (const [key, value] of Object.entries({
    inputCount: '5',
    outputCount: '2',
    addressCount: '257',
    normalizedEntries: '1',
  }))
    await expect(tool.getByTestId(`cidr-${key}`)).toHaveText(value)
  await tool.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(tool.getByRole('status')).toHaveText('Copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    expected,
  )
  const downloading = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Download', exact: true }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('aggregated-ipv4-cidrs.txt')
  expect(readFileSync((await download.path())!, 'utf8')).toBe(expected)
  await input.fill('192.0.2.1\n192.0.2.2\n192.0.2.3\n192.0.2.5')
  await expect(output).toHaveCount(0)
  await aggregate.click()
  await expect(output).toHaveValue('192.0.2.1/32\n192.0.2.2/31\n192.0.2.5/32')
  await expect(tool.getByRole('status')).toHaveText('')
  await input.fill('0.0.0.0/1\n128.0.0.0/1')
  await aggregate.click()
  await expect(output).toHaveValue('0.0.0.0/0')
  await expect(tool.getByTestId('cidr-addressCount')).toHaveText('4294967296')
  for (const [text, error] of [
    ['\n192.0.2.1/33', 'Line 2: use a single /'],
    ['192.0.02.1', 'Line 1: enter four decimal'],
    ['', 'Enter at least one'],
  ]) {
    await input.fill(text)
    await aggregate.click()
    await expect(tool.getByRole('alert')).toContainText(error)
    await expect(input).toBeFocused()
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toHaveAttribute(
      'aria-describedby',
      'cidr-hint cidr-error',
    )
    await expect(output).toHaveCount(0)
  }
  const largeList = Array.from(
    { length: 10000 },
    (_, index) => `10.0.${Math.floor(index / 128)}.${(index % 128) * 2}`,
  ).join('\n')
  // Chromium's insertText path used by fill is slow for thousands of lines,
  // even on a bare HTML textarea. Exercise the actual clipboard paste path.
  async function paste(value: string) {
    await page.evaluate((text) => navigator.clipboard.writeText(text), value)
    await input.focus()
    await input.press('ControlOrMeta+A')
    await input.press('ControlOrMeta+V')
    await expect(input).toHaveValue(value)
  }
  await paste(largeList)
  await aggregate.click()
  await expect(tool.getByTestId('cidr-outputCount')).toHaveText('10000')
  await expect(tool.getByTestId('cidr-addressCount')).toHaveText('10000')
  expect((await output.inputValue()).split('\n')).toHaveLength(10000)
  for (const textarea of [input, output]) {
    await expect(textarea).toHaveCSS('field-sizing', 'fixed')
    expect((await textarea.boundingBox())!.height).toBeLessThan(400)
  }
  await paste('1.2.3.4\n'.repeat(10001))
  await aggregate.click()
  await expect(tool.getByRole('alert')).toContainText('line 10001')
  await tool.getByRole('button', { name: 'Load example' }).click()
  await aggregate.click()
  await expect(output).toHaveValue(expected)
  await tool.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(input).toHaveValue('')
  await expect(output).toHaveCount(0)
  await expect(tool.getByRole('alert')).toHaveCount(0)
})

test('all locales support aggregation, mobile, RTL, SEO, prerendered content and sitemaps', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const locale of locales) {
    const messages = JSON.parse(
      readFileSync(
        `src/i18n/messages/cidr-aggregator-additions/${locale}.json`,
        'utf8',
      ),
    )
    const labels = messages.cidrAggregator
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
    await tool
      .getByLabel(labels.input, { exact: true })
      .fill('192.0.2.7/25\n192.0.2.128/25\n255.255.255.255')
    await tool
      .getByRole('button', { name: labels.aggregate, exact: true })
      .click()
    await expect(tool.getByLabel(labels.output, { exact: true })).toHaveValue(
      '192.0.2.0/24\n255.255.255.255/32',
    )
    await expect(tool.getByTestId('cidr-addressCount')).toHaveText('257')
    expect(await tool.innerText()).not.toMatch(
      /cidrAggregator\.|tools\.ipv4-cidr-aggregator\./,
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

test('light and dark themes on mobile and desktop preserve readable controls and results', async ({
  page,
}, testInfo) => {
  await page.goto(path)
  const tool = page.locator(`[data-tool="${id}"]`)
  await tool.getByRole('button', { name: 'Load example' }).click()
  await tool
    .getByRole('button', { name: 'Aggregate networks', exact: true })
    .click()
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const theme of ['Light', 'Dark']) {
      await page.getByRole('button', { name: 'Toggle theme' }).click()
      await page.getByRole('menuitem', { name: theme, exact: true }).click()
      await expect(page.locator('html')).toHaveClass(
        new RegExp(`\\b${theme.toLowerCase()}\\b`),
      )
      await expect(page.getByRole('menu')).toBeHidden()
      await expect(
        tool.getByLabel('Aggregated CIDRs', { exact: true }),
      ).toHaveValue('192.0.2.0/24\n198.51.100.9/32')
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
