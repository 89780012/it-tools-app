import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { locales } from '../src/i18n/config'

const id = 'json-pointer'
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

test('search, example, URI fragments, roots, precision, clipboard, download and validation', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByTestId('tool-search').fill('RFC 6901')
  await page.getByTestId(`tool-card-${id}`).getByRole('link').click()
  await expect(page).toHaveURL(new RegExp(`${path}$`))
  const tool = page.locator(`[data-tool="${id}"]`)
  const source = tool.getByLabel('JSON document', { exact: true })
  const pointer = tool.getByLabel('JSON Pointer or URI fragment', {
    exact: true,
  })
  const output = tool.getByLabel('Selected JSON value', { exact: true })
  const resolve = tool.getByRole('button', {
    name: 'Resolve pointer',
    exact: true,
  })
  await tool.getByRole('button', { name: 'Load example' }).click()
  await resolve.click()
  await expect(output).toHaveValue('"ready"')
  await expect(tool.getByTestId('pointer-type')).toHaveText('String')
  await tool.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(tool.getByRole('status')).toHaveText('Copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    '"ready"',
  )
  const downloading = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Download', exact: true }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('json-pointer-result.json')
  expect(readFileSync((await download.path())!, 'utf8')).toBe('"ready"')
  for (const [pathValue, expected, type] of [
    ['/orders/0/id', '9007199254740993', 'Number'],
    ['#/a%20b', 'true', 'Boolean'],
    ['/', '"empty key"', 'String'],
  ]) {
    await pointer.fill(pathValue)
    await expect(output).toHaveCount(0)
    await resolve.click()
    await expect(output).toHaveValue(expected)
    await expect(tool.getByTestId('pointer-type')).toHaveText(type)
    await expect(tool.getByRole('status')).toHaveText('')
  }
  await source.fill('{"a":[null,false,0,""],"~1":3}')
  for (const [pathValue, expected] of [
    ['/a/0', 'null'],
    ['/a/1', 'false'],
    ['/a/2', '0'],
    ['/a/3', '""'],
    ['/~01', '3'],
  ]) {
    await pointer.fill(pathValue)
    await resolve.click()
    await expect(output).toHaveValue(expected)
  }
  for (const [pathValue, error] of [
    ['/a/01', 'Step 2: use an array index'],
    ['/a/-', 'Step 2: use an array index'],
    ['/a/4', 'Step 2: array index is out of bounds'],
    ['/missing', 'Step 1: this object'],
    ['/a/0/x', 'Step 3: cannot descend'],
    ['/~2', 'Step 1: ~'],
    ['#/%FF', 'Invalid URI fragment'],
    ['$.a', 'A pointer must be empty'],
  ]) {
    await pointer.fill(pathValue)
    await resolve.click()
    await expect(tool.getByRole('alert')).toContainText(error)
    await expect(pointer).toBeFocused()
    await expect(pointer).toHaveAttribute('aria-invalid', 'true')
    await expect(pointer).toHaveAttribute(
      'aria-describedby',
      'pointer-hint pointer-error',
    )
    await expect(output).toHaveCount(0)
  }
  await pointer.fill('')
  for (const [text, error] of [
    ['', 'Enter a JSON document'],
    ['{', 'Invalid JSON'],
    ['{"a":1,"a":1}', 'Duplicate object keys'],
    ['['.repeat(65) + '0' + ']'.repeat(65), 'JSON must not exceed 64'],
  ]) {
    await source.fill(text)
    await resolve.click()
    await expect(tool.getByRole('alert')).toContainText(error)
    await expect(source).toBeFocused()
    await expect(source).toHaveAttribute('aria-invalid', 'true')
    await expect(source).toHaveAttribute(
      'aria-describedby',
      'pointer-limits pointer-error',
    )
    await expect(output).toHaveCount(0)
  }
  for (const [json, pathValue] of [
    ['9007199254740993', ''],
    ['false', '#'],
    ['null', ''],
  ]) {
    await source.fill(json)
    await pointer.fill(pathValue)
    await resolve.click()
    await expect(output).toHaveValue(json)
    await expect(tool.getByTestId('resolved-pointer')).toHaveText(
      'Document root',
    )
  }
  await tool.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(source).toHaveValue('')
  await expect(pointer).toHaveValue('')
  await expect(output).toHaveCount(0)
  await expect(tool.getByRole('alert')).toHaveCount(0)
})

test('all 12 locales resolve on mobile with RTL, localized SEO, prerendered HTML and sitemap entries', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const locale of locales) {
    const messages = JSON.parse(
      readFileSync(
        `src/i18n/messages/json-pointer-additions/${locale}.json`,
        'utf8',
      ),
    )
    const labels = messages.jsonPointer
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
      .getByLabel(labels.source, { exact: true })
      .fill('{"中": {"a/b": 9007199254740993}}')
    await tool
      .getByLabel(labels.pointer, { exact: true })
      .fill('#/%E4%B8%AD/a~1b')
    await tool
      .getByRole('button', { name: labels.resolve, exact: true })
      .click()
    await expect(tool.getByLabel(labels.output, { exact: true })).toHaveValue(
      '9007199254740993',
    )
    await expect(tool.getByTestId('pointer-type')).toHaveText(
      labels.types.number,
    )
    await tool.getByLabel(labels.pointer, { exact: true }).fill('/missing')
    await tool
      .getByRole('button', { name: labels.resolve, exact: true })
      .click()
    await expect(tool.getByRole('alert')).toHaveText(
      labels.missingKey.replace('{step}', '1'),
    )
    expect(await tool.innerText()).not.toMatch(
      /jsonPointer\.|tools\.json-pointer\./,
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

test('light and dark themes retain controls and results on mobile and desktop', async ({
  page,
}, testInfo) => {
  await page.goto(path)
  const tool = page.locator(`[data-tool="${id}"]`)
  await tool.getByRole('button', { name: 'Load example' }).click()
  await tool
    .getByRole('button', { name: 'Resolve pointer', exact: true })
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
        tool.getByLabel('Selected JSON value', { exact: true }),
      ).toHaveValue('"ready"')
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
