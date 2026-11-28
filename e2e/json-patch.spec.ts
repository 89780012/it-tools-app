import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const id = 'json-patch'
const path = `/tools/${id}`
const locales = [
  'en',
  'zh',
  'es',
  'de',
  'fr',
  'it',
  'pt',
  'ru',
  'ja',
  'ko',
  'ar',
  'hi',
]
let pageErrors: string[]
test.beforeEach(async ({ page, baseURL }) => {
  pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url())
    return url.origin === new URL(baseURL!).origin &&
      !url.pathname.startsWith('/api/')
      ? route.continue()
      : route.abort()
  })
})
test.afterEach(() => expect(pageErrors).toEqual([]))

test('search, six operations, exact copy/download, errors and clear', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByTestId('tool-search').fill('RFC 6902')
  await page.getByTestId(`tool-card-${id}`).getByRole('link').click()
  await expect(page).toHaveURL(new RegExp(`${path}$`))
  const tool = page.locator(`[data-tool="${id}"]`)
  const target = tool.getByLabel('Target JSON', { exact: true })
  const patch = tool.getByLabel('Patch operations (JSON array)', {
    exact: true,
  })
  const output = tool.getByLabel('Patched JSON', { exact: true })
  const apply = tool.getByRole('button', { name: 'Apply patch', exact: true })
  await tool.getByRole('button', { name: 'Load example' }).click()
  await apply.click()
  const expected =
    '{\n  "tags": [\n    "old",\n    "keep",\n    "new"\n  ],\n  "settings": {\n    "enabled": true\n  },\n  "id": 9007199254740993,\n  "backup": {\n    "enabled": true\n  },\n  "title": "demo"\n}'
  await expect(output).toHaveValue(expected)
  await tool.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(tool.getByRole('status')).toHaveText('Copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    expected,
  )
  const downloading = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Download', exact: true }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('patched.json')
  expect(readFileSync((await download.path())!, 'utf8')).toBe(expected)
  await patch.fill(
    '[{"op":"add","path":"/added","value":true},{"op":"test","path":"/id","value":9007199254740992}]',
  )
  await expect(output).toHaveCount(0)
  await apply.click()
  await expect(tool.getByRole('alert')).toContainText(
    'Operation 2: The test value does not match',
  )
  await expect(patch).toBeFocused()
  await expect(patch).toHaveAttribute(
    'aria-describedby',
    'json-patch-hint json-patch-error',
  )
  await expect(output).toHaveCount(0)
  await expect(target).not.toHaveValue(/added/)
  await target.fill('["a","b","c"]')
  await patch.fill('[{"op":"move","from":"/0","path":"/2"}]')
  await apply.click()
  await expect(output).toHaveValue('[\n  "b",\n  "c",\n  "a"\n]')
  await expect(tool.getByRole('alert')).toHaveCount(0)
  await target.fill('{')
  await apply.click()
  await expect(tool.getByRole('alert')).toContainText(
    'Target JSON: Invalid JSON syntax',
  )
  await expect(target).toBeFocused()
  await tool.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(target).toHaveValue('')
  await expect(patch).toHaveValue('')
  await expect(output).toHaveCount(0)
  await expect(tool.getByRole('alert')).toHaveCount(0)
  await expect(target).toBeFocused()
})

test('12 languages on mobile: operations, errors, RTL, metadata and prerender', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const locale of locales) {
    const messages = JSON.parse(
      readFileSync(
        `src/i18n/messages/json-patch-additions/${locale}.json`,
        'utf8',
      ),
    )
    const t = messages.jsonPatch
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
    const staticHead = await page.evaluate(
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
    expect(staticHead).toEqual({
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
    const target = tool.getByLabel(t.target, { exact: true })
    const patch = tool.getByLabel(t.patch, { exact: true })
    const output = tool.getByLabel(t.output, { exact: true })
    const apply = tool.getByRole('button', { name: t.apply, exact: true })
    await target.fill('{"a/b":{"~":9007199254740993},"tags":[]}')
    await patch.fill(
      '[{"op":"test","path":"/a~1b/~0","value":9007199254740993},{"op":"add","path":"/tags/-","value":"你好 🌍"}]',
    )
    await apply.click()
    const expected =
      '{\n  "a/b": {\n    "~": 9007199254740993\n  },\n  "tags": [\n    "你好 🌍"\n  ]\n}'
    await expect(output).toHaveValue(expected)
    expect(await tool.innerText()).not.toMatch(
      /jsonPatch\.|tools\.json-patch\./,
    )
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true)
    if (locale === 'zh' || locale === 'ar') {
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
    await patch.fill('[{"op":"remove","path":"/missing"}]')
    await apply.click()
    await expect(tool.getByRole('alert')).toHaveText(
      `${t.patch} · ${t.operation.replace('{number}', '1')}: ${t.missingPath}`,
    )
    await expect(patch).toBeFocused()
    await expect(output).toHaveCount(0)
  }
})

test('mobile/desktop light/dark and long result layout', async ({
  page,
}, testInfo) => {
  await page.goto(path)
  const tool = page.locator(`[data-tool="${id}"]`)
  await tool
    .getByLabel('Target JSON', { exact: true })
    .fill(JSON.stringify({ long: 'x'.repeat(2000), values: [1, 2, 3] }))
  await tool
    .getByLabel('Patch operations (JSON array)', { exact: true })
    .fill('[{"op":"copy","from":"/values","path":"/backup"}]')
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
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true)
      await expect(
        tool.getByLabel('Patched JSON', { exact: true }),
      ).toHaveValue(/"backup"/)
      for (const label of ['Target JSON', 'Patched JSON']) {
        const bounds = await tool
          .getByLabel(label, { exact: true })
          .boundingBox()
        expect(bounds!.height).toBeLessThanOrEqual(384)
      }
      await page.screenshot({
        path: testInfo.outputPath(`${theme.toLowerCase()}-${width}.png`),
        fullPage: true,
      })
    }
  }
})
