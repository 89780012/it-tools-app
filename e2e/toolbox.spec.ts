import { test, expect, type Page } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { allTools } from '../src/lib/tools-config'
import { locales } from '../src/i18n/config'

type Catalog = Record<string, unknown>
function merge(base: Catalog, extra: Catalog): Catalog {
  const result = { ...base }
  for (const [key, value] of Object.entries(extra))
    result[key] =
      value && typeof value === 'object' && !Array.isArray(value)
        ? merge((result[key] ?? {}) as Catalog, value as Catalog)
        : value
  return result
}
function dictionary(locale: string): Catalog {
  const root = path.resolve('src/i18n/messages')
  let result = JSON.parse(
    readFileSync(path.join(root, `${locale}.json`), 'utf8'),
  ) as Catalog
  for (const dir of readdirSync(root)
    .filter((name) => name.endsWith('-additions'))
    .sort())
    result = merge(
      result,
      JSON.parse(readFileSync(path.join(root, dir, `${locale}.json`), 'utf8')),
    )
  return result
}
const at = (object: unknown, key: string): string =>
  key
    .split('.')
    .reduce<unknown>(
      (value, name) => (value as Catalog)?.[name],
      object,
    ) as string
const toolMain = (page: Page) => page.locator('main main')

for (const group of [
  'developer',
  'text',
  'network',
  'frontend',
  'enhancements',
  'existing',
  'review',
  'certificates',
]) {
  test(`${group}: real tool interactions`, async ({ page }, testInfo) => {
    const results: { name: string; passed: boolean; error?: string }[] = []
    const runtimeErrors: string[] = []
    page.on('pageerror', (error) => runtimeErrors.push(error.message))
    const check = async (name: string, fn: () => Promise<void>) => {
      await test.step(name, async () => {
        const before = runtimeErrors.length
        try {
          await fn()
          expect(
            runtimeErrors.slice(before),
            `${name}: browser runtime errors`,
          ).toEqual([])
          results.push({ name, passed: true })
        } catch (error) {
          results.push({ name, passed: false, error: String(error) })
          await page
            .screenshot({
              path: testInfo.outputPath(`${results.length}-failure.png`),
              fullPage: true,
            })
            .catch(() => {})
          console.error(`FAILED ${name}: ${String(error)}`)
        }
      })
    }
    await page.goto('/')
    const module = await import(
      pathToFileURL(path.resolve(`script/browser-cases/${group}.mjs`)).href
    )
    await module.run(page, check)
    await testInfo.attach('case-results', {
      body: JSON.stringify(results, null, 2),
      contentType: 'application/json',
    })
    expect(results.length).toBeGreaterThan(0)
    expect(runtimeErrors, 'uncaught browser exceptions').toEqual([])
    expect(
      results.filter((result) => !result.passed),
      JSON.stringify(
        results.filter((result) => !result.passed),
        null,
        2,
      ),
    ).toEqual([])
  })
}

test('home: favorites, search, history, clipboard and downloads', async ({
  page,
}) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(page.getByTestId('tool-home')).toBeVisible()
  await expect(page.locator('[data-testid^="tool-card-"]')).toHaveCount(allTools.length)
  await page.getByTestId('favorite-json-formatter').click()
  await expect(page).toHaveURL(/\/$/)
  await page.getByTestId('view-favorites').click()
  await expect(page.locator('[data-testid^="tool-card-"]')).toHaveCount(1)
  await page.reload()
  await page.getByTestId('view-favorites').click()
  await expect(page.getByTestId('favorite-json-formatter')).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByTestId('tool-card-json-formatter').getByRole('link').click()
  await expect(toolMain(page).locator('textarea').first()).toBeVisible()
  await page.goto('/')
  await page.getByTestId('view-recent').click()
  await expect(page.getByTestId('tool-card-json-formatter')).toBeVisible()
  await page.getByRole('button', { name: 'Clear recent history' }).click()
  await expect(page.locator('[data-testid^="tool-card-"]')).toHaveCount(0)
  await page.getByTestId('view-all').click()
  await page.getByTestId('tool-search').fill('json-to-types')
  await expect(page.locator('[data-testid^="tool-card-"]')).toHaveCount(1)
  await page.getByTestId('category-network').click()
  await expect(page.locator('[data-testid^="tool-card-"]')).toHaveCount(0)
  await page.goto('/tools/json-to-types')
  const main = toolMain(page)
  // Type inference updates live as the input changes.
  await main
    .locator('textarea:not([readonly])')
    .first()
    .fill('{"name":"验收","count":0}')
  const output = main.getByTestId('tool-output')
  await expect(output).toHaveValue(/name/)
  await main.getByRole('button', { name: 'Copy', exact: true }).click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    'name',
  )
  const downloadEvent = page.waitForEvent('download')
  await main.getByRole('button', { name: 'Download', exact: true }).click()
  expect((await downloadEvent).suggestedFilename()).toMatch(/\.(ts|txt)$/)
})

test('locales: every route has localized headings and metadata', async ({
  page,
}, testInfo) => {
  const results: { locale: string; tools: number }[] = []
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  for (const locale of locales) {
    const messages = dictionary(locale)
    const prefix = locale === 'en' ? '' : `/${locale}`
    await page.goto(`${prefix}/tools/${allTools[0].id}`)
    for (const tool of allTools) {
      const route = `${prefix}${tool.path}`
      if (new URL(page.url()).pathname !== route) {
        // Exercise real React Router links rather than replacing application state.
        const sidebarLink = page.locator(
          `[data-slot="sidebar-container"] a[href="${route}"]`,
        )
        await sidebarLink.first().click()
      }
      await expect(page.locator('html')).toHaveAttribute('lang', locale)
      await expect(page).toHaveTitle(
        `${at(messages, `tools.${tool.id}.meta.title`)} - IT Tools Collection`,
      )
      await expect(toolMain(page)).not.toHaveText(/Loading tool…/)
      await expect(toolMain(page)).toContainText(
        at(messages, `tools.${tool.id}.name`),
      )
      const content = await toolMain(page).innerText()
      expect(content, `${locale}:${tool.id}`).not.toMatch(
        /tools\.[a-z-]+\.[a-zA-Z_]+|workbench\.[a-zA-Z_]+|expansion\.[a-zA-Z_]+/,
      )
    }
    results.push({ locale, tools: allTools.length })
  }
  await testInfo.attach('locale-route-results', {
    body: JSON.stringify(results),
    contentType: 'application/json',
  })
  expect(errors).toEqual([])
})

test('language menu preserves the tool path in all 12 languages', async ({
  page,
}) => {
  const menuOrder = [
    'zh',
    'en',
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
  await page.goto('/tools/json-to-types')
  for (const locale of menuOrder) {
    await page
      .getByRole('button', { name: 'Toggle language', exact: true })
      .click()
    await page.getByRole('menuitem').nth(menuOrder.indexOf(locale)).click()
    await expect(page).toHaveURL(
      new RegExp(`${locale === 'en' ? '' : `/${locale}`}/tools/json-to-types$`),
    )
    await expect(page.locator('html')).toHaveAttribute('lang', locale)
    await expect(page.locator('html')).toHaveAttribute(
      'dir',
      locale === 'ar' ? 'rtl' : 'ltr',
    )
    await expect(toolMain(page).locator('textarea').first()).toBeVisible()
  }
})

test('responsive layout, RTL and theme controls', async ({
  page,
}, testInfo) => {
  for (const locale of ['en', 'ar']) {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      for (const id of [
        'json-to-types',
        'url-parser',
        'markdown-preview',
        'image-compressor',
        'time-converter',
      ]) {
        await page.goto(`${locale === 'en' ? '' : `/${locale}`}/tools/${id}`)
        await expect(toolMain(page).locator('h1')).toBeVisible()
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth + 2,
          ),
          `${locale}:${width}:${id} overflows viewport`,
        ).toBe(true)
      }
      await page.screenshot({
        path: testInfo.outputPath(`${locale}-${width}.png`),
        fullPage: true,
      })
    }
  }
  await page.goto('/tools/css-formatter')
  await page.getByRole('button', { name: 'Toggle theme', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Dark', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.getByRole('button', { name: 'Toggle theme', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Light', exact: true }).click()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
})

test('Go API: health and real proxy validation', async ({ request }) => {
  const health = await request.get('http://localhost:8080/api/health')
  expect(health.ok()).toBe(true)
  expect((await health.json()).status).toBe('ok')
  const blocked = await request.post('/api/proxy', {
    data: {
      url: 'http://127.0.0.1:8080/api/health',
      method: 'GET',
      headers: {},
    },
  })
  expect(blocked.status()).toBe(400)
  expect((await blocked.json()).error).toContain('publicly reachable')
  const invalid = await request.post('/api/proxy', {
    data: { url: 'invalid', method: 'GET' },
  })
  expect(invalid.status()).toBe(400)
})
