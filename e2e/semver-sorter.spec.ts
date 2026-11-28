import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { locales } from '../src/i18n/config'

const id = 'semver-sorter'
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

test('discovers, sorts, copies, downloads, validates and clears release tags', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByTestId('tool-search').fill('semver')
  await page.getByTestId(`tool-card-${id}`).getByRole('link').click()
  await expect(page).toHaveURL(new RegExp(`${path}$`))
  const tool = page.locator(`[data-tool="${id}"]`)
  await tool.getByRole('button', { name: 'Load example' }).click()
  const sort = tool.getByRole('button', { name: 'Sort versions', exact: true })
  await sort.click()
  await expect(tool.getByTestId('semver-highest')).toHaveText('2.1.0-beta.1')
  await expect(tool.getByTestId('semver-stable')).toHaveText('2.0.0')
  const output = await tool.getByLabel('Sorted versions').inputValue()
  expect(output).toBe(
    '2.1.0-beta.1\n2.0.0\nv2.0.0-rc.10\nv2.0.0-rc.2\n1.10.0+build.7\n1.10.0+build.3\n1.9.0',
  )
  await tool.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(tool.getByRole('status')).toHaveText('Copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(output)
  const downloading = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Download', exact: true }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('sorted-versions.txt')
  expect(readFileSync((await download.path())!, 'utf8')).toBe(output)
  await tool.getByLabel('Sort order').selectOption('ascending')
  await expect(tool.getByLabel('Sorted versions')).toHaveCount(0)
  await sort.click()
  expect(
    (await tool.getByLabel('Sorted versions').inputValue()).split('\n')[0],
  ).toBe('1.9.0')
  const input = tool.getByLabel('Versions (one per line)')
  await input.fill('\n1.2.3\n01.0.0')
  await sort.click()
  await expect(tool.getByRole('alert')).toContainText('Line 3')
  await expect(input).toBeFocused()
  await expect(input).toHaveAttribute('aria-invalid', 'true')
  await input.fill('v1.0.0-alpha')
  await expect(tool.getByRole('alert')).toHaveCount(0)
  await sort.click()
  await expect(tool.getByTestId('semver-stable')).toHaveText(
    'No stable version',
  )
  await tool.getByLabel('Allow a lowercase v prefix').uncheck()
  await sort.click()
  await expect(tool.getByRole('alert')).toContainText('Line 1')
  await tool.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(input).toHaveValue('')
  await expect(tool.getByLabel('Sort order')).toHaveValue('descending')
  await expect(tool.getByLabel('Allow a lowercase v prefix')).toBeChecked()
  await expect(tool.getByLabel('Sorted versions')).toHaveCount(0)
  await sort.click()
  await expect(tool.getByRole('alert')).toContainText(
    'Enter at least one version',
  )
})

test('checks all locales, mobile RTL, static SEO and sitemaps', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const locale of locales) {
    const messages = JSON.parse(
      readFileSync(`src/i18n/messages/semver-additions/${locale}.json`, 'utf8'),
    )
    const labels = messages.semverSorter
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
    const staticHtml = readFileSync(`dist${route}/index.html`, 'utf8')
    const prerender = await page.evaluate((html) => {
      const document = new DOMParser().parseFromString(html, 'text/html')
      return {
        title: document.title,
        heading: document.querySelector('[data-tool] h1')?.textContent,
        description: document
          .querySelector('meta[name="description"]')
          ?.getAttribute('content'),
        canonical: document
          .querySelector('link[rel="canonical"]')
          ?.getAttribute('href'),
        alternates: document.querySelectorAll('link[rel="alternate"]').length,
      }
    }, staticHtml)
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
      .getByLabel(labels.versions, { exact: true })
      .fill('1.9.0\n1.10.0\n2.0.0-rc.1')
    await tool.getByRole('button', { name: labels.sort, exact: true }).click()
    await expect(tool.getByLabel(labels.output, { exact: true })).toHaveValue(
      '2.0.0-rc.1\n1.10.0\n1.9.0',
    )
    await expect(tool.getByTestId('semver-stable')).toHaveText('1.10.0')
    expect(await tool.innerText()).not.toMatch(
      /semverSorter\.|tools\.semver-sorter\./,
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

test('checks light and dark themes on mobile and desktop', async ({
  page,
}, testInfo) => {
  await page.goto(path)
  const tool = page.locator(`[data-tool="${id}"]`)
  await tool.getByRole('button', { name: 'Load example' }).click()
  await tool.getByRole('button', { name: 'Sort versions', exact: true }).click()
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const theme of ['Light', 'Dark']) {
      await page.getByRole('button', { name: 'Toggle theme' }).click()
      await page.getByRole('menuitem', { name: theme, exact: true }).click()
      await expect(page.locator('html')).toHaveClass(
        new RegExp(`\\b${theme.toLowerCase()}\\b`),
      )
      await expect(page.getByRole('menu')).toBeHidden()
      await expect(tool.getByTestId('semver-stable')).toHaveText('2.0.0')
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
