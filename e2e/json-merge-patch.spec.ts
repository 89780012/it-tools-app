import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { locales } from '../src/i18n/config'

const id = 'json-merge-patch'
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

test('discovers, merges, copies, downloads, validates and clears JSON', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByTestId('tool-search').fill('RFC 7396')
  await page.getByTestId(`tool-card-${id}`).getByRole('link').click()
  await expect(page).toHaveURL(new RegExp(`${path}$`))
  const tool = page.locator(`[data-tool="${id}"]`)
  const target = tool.getByLabel('Target JSON', { exact: true })
  const patch = tool.getByLabel('Merge patch JSON', { exact: true })
  const output = tool.getByLabel('Merged JSON', { exact: true })
  const apply = tool.getByRole('button', { name: 'Apply patch', exact: true })
  await tool.getByRole('button', { name: 'Load example' }).click()
  await apply.click()
  const text = await output.inputValue()
  expect(text).toContain('9007199254740993')
  expect(JSON.parse(text)).toMatchObject({
    server: { host: 'localhost', port: 443, tls: true },
    tags: ['production'],
  })
  expect(JSON.parse(text)).not.toHaveProperty('obsolete')
  await tool.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(tool.getByRole('status')).toHaveText('Copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(text)
  const downloading = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Download', exact: true }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('merged.json')
  expect(readFileSync((await download.path())!, 'utf8')).toBe(text)
  await patch.fill('{bad}')
  await expect(output).toHaveCount(0)
  await apply.click()
  await expect(tool.getByRole('alert')).toContainText(
    'Merge patch JSON: Invalid JSON',
  )
  await expect(patch).toBeFocused()
  await expect(patch).toHaveAttribute('aria-invalid', 'true')
  await patch.fill('null')
  await expect(tool.getByRole('alert')).toHaveCount(0)
  await apply.click()
  await expect(output).toHaveValue('null')
  await patch.fill('{"a":{"remove":null},"arr":[null,2]}')
  await target.fill('{"a":{"keep":true,"remove":1},"arr":[1]}')
  await apply.click()
  expect(JSON.parse(await output.inputValue())).toEqual({
    a: { keep: true },
    arr: [null, 2],
  })
  await target.fill('false')
  await expect(output).toHaveCount(0)
  await apply.click()
  expect(JSON.parse(await output.inputValue())).toEqual({
    a: {},
    arr: [null, 2],
  })
  await tool.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(target).toHaveValue('')
  await expect(patch).toHaveValue('')
  await expect(output).toHaveCount(0)
  await apply.click()
  await expect(target).toBeFocused()
  await expect(tool.getByRole('alert')).toContainText('Enter a JSON value')
})

test('checks all locales, mobile RTL, static SEO and sitemaps', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const locale of locales) {
    const messages = JSON.parse(
      readFileSync(
        `src/i18n/messages/json-merge-patch-additions/${locale}.json`,
        'utf8',
      ),
    )
    const labels = messages.jsonMergePatch
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
    const html = readFileSync(`dist${route}/index.html`, 'utf8')
    const prerender = await page.evaluate((html) => {
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
    }, html)
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
      .getByLabel(labels.target, { exact: true })
      .fill('{"keep":true,"remove":1}')
    await tool
      .getByLabel(labels.patch, { exact: true })
      .fill('{"remove":null,"added":false}')
    await tool.getByRole('button', { name: labels.apply, exact: true }).click()
    expect(
      JSON.parse(
        await tool.getByLabel(labels.output, { exact: true }).inputValue(),
      ),
    ).toEqual({ keep: true, added: false })
    expect(await tool.innerText()).not.toMatch(
      /jsonMergePatch\.|tools\.json-merge-patch\./,
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
  await tool.getByRole('button', { name: 'Apply patch', exact: true }).click()
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const theme of ['Light', 'Dark']) {
      await page.getByRole('button', { name: 'Toggle theme' }).click()
      await page.getByRole('menuitem', { name: theme, exact: true }).click()
      await expect(page.locator('html')).toHaveClass(
        new RegExp(`\\b${theme.toLowerCase()}\\b`),
      )
      await expect(page.getByRole('menu')).toBeHidden()
      expect(
        await tool.getByLabel('Merged JSON', { exact: true }).inputValue(),
      ).toContain('9007199254740993')
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
