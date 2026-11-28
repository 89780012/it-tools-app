import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { locales } from '../src/i18n/config'
const id = 'css-gradient-generator'
const path = `/tools/${id}`
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
    return route.abort()
  })
})
test.afterEach(() => {
  expect(runtimeErrors).toEqual([])
  expect([...new Set(blockedRequests)].sort()).toEqual(baselineScripts)
})

test('search, live preview, hard stops, exact clipboard/download, validation and clear', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByTestId('tool-search').fill('linear gradient')
  await page.getByTestId(`tool-card-${id}`).getByRole('link').click()
  await expect(page).toHaveURL(new RegExp(`${path}$`))
  const tool = page.locator(`[data-tool="${id}"]`)
  const output = tool.getByLabel('Generated CSS', { exact: true })
  await expect(output).toHaveValue(
    'background-image: linear-gradient(90deg, #2563eb 0%, #ec4899 100%);',
  )
  await tool.getByRole('button', { name: 'Load example' }).click()
  const example = await output.inputValue()
  expect(example).toContain('rgba(168, 85, 247, 0.8) 50%')
  expect(
    await tool
      .getByTestId('gradient-preview')
      .evaluate((node) => getComputedStyle(node).backgroundImage),
  ).toContain('linear-gradient(135deg')
  await tool.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(tool.getByRole('status')).toHaveText('Copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    example,
  )
  const downloading = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Download', exact: true }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('gradient.css')
  expect(readFileSync((await download.path())!, 'utf8')).toBe(example)
  await tool.getByLabel('Position (%) · 1', { exact: true }).fill('50')
  await expect(tool.getByRole('status')).toHaveText('')
  await expect(output).toHaveValue(/#2563eb 50%, rgba\(168, 85, 247, 0.8\) 50%/)
  for (const [label, invalid, valid, message] of [
    ['Angle (degrees)', '361', '-360', 'whole-number angle'],
    ['Hex color · 2', '#fff', '#ffffff', 'six-digit hex color'],
    ['Position (%) · 2', '49', '50', 'at least the previous'],
    ['Position (%) · 2', '100.5', '50', 'whole-number position'],
    ['Opacity (%) · 2', '-1', '0', 'whole-number opacity'],
  ]) {
    const input = tool.getByLabel(label, { exact: true })
    await input.fill(invalid)
    await expect(tool.getByRole('alert')).toContainText(message)
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toHaveAttribute(
      'aria-describedby',
      'gradient-hint gradient-error',
    )
    await expect(output).toHaveCount(0)
    expect(
      await tool
        .getByTestId('gradient-preview')
        .evaluate((node) => getComputedStyle(node).backgroundImage),
    ).toBe('none')
    await input.fill(valid)
    await expect(tool.getByRole('alert')).toHaveCount(0)
    await expect(output).toBeVisible()
  }
  for (let i = 0; i < 5; i++)
    await tool
      .getByRole('button', { name: 'Add color stop', exact: true })
      .click()
  await expect(tool.getByRole('group')).toHaveCount(8)
  await expect(
    tool.getByRole('button', { name: 'Add color stop', exact: true }),
  ).toBeDisabled()
  await tool
    .getByRole('button', { name: 'Remove color stop 2', exact: true })
    .click()
  await expect(tool.getByRole('group')).toHaveCount(7)
  await tool.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(tool.getByLabel('Angle (degrees)')).toHaveValue('')
  await expect(tool.getByLabel('Angle (degrees)')).toBeFocused()
  await expect(tool.getByLabel('Hex color · 1', { exact: true })).toHaveValue(
    '',
  )
  await expect(tool.getByRole('group')).toHaveCount(2)
  await expect(
    tool.getByRole('button', { name: 'Remove color stop 1', exact: true }),
  ).toBeDisabled()
  await expect(tool.getByRole('alert')).toHaveCount(0)
  await expect(output).toHaveCount(0)
})

test('all 12 mobile locales: live interaction, errors, RTL, SEO and prerendered HTML', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const locale of locales) {
    const messages = JSON.parse(
      readFileSync(
        `src/i18n/messages/css-gradient-additions/${locale}.json`,
        'utf8',
      ),
    )
    const labels = messages.cssGradient
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
    const angle = tool.getByLabel(labels.angle, { exact: true })
    const output = tool.getByLabel(labels.output, { exact: true })
    await angle.fill('180')
    await expect(output).toHaveValue(
      'background-image: linear-gradient(180deg, #2563eb 0%, #ec4899 100%);',
    )
    await angle.fill('1.5')
    await expect(tool.getByRole('alert')).toHaveText(labels.invalidAngle)
    await expect(angle).toHaveAttribute('aria-invalid', 'true')
    await expect(output).toHaveCount(0)
    await angle.fill('360')
    await expect(output).toHaveValue(/360deg/)
    expect(await tool.innerText()).not.toMatch(
      /cssGradient\.|tools\.css-gradient-generator\./,
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

test('desktop and mobile light/dark previews render CSS and transparent pixels', async ({
  page,
}, testInfo) => {
  await page.goto(path)
  const tool = page.locator(`[data-tool="${id}"]`)
  await tool.getByRole('button', { name: 'Load example' }).click()
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const theme of ['Light', 'Dark']) {
      await page.getByRole('button', { name: 'Toggle theme' }).click()
      await page.getByRole('menuitem', { name: theme, exact: true }).click()
      await expect(page.locator('html')).toHaveClass(
        new RegExp(`\\b${theme.toLowerCase()}\\b`),
      )
      await expect(page.getByRole('menu')).toBeHidden()
      await expect(tool.getByLabel('Generated CSS')).toHaveValue(
        /rgba\(236, 72, 153, 0.4\) 100%/,
      )
      const preview = tool.getByTestId('gradient-preview')
      const value = await preview.evaluate(
        (node) => getComputedStyle(node).backgroundImage,
      )
      expect(value).toContain('linear-gradient(135deg')
      expect(value).toContain('rgba(236, 72, 153, 0.4)')
      const box = (await preview.boundingBox())!
      expect(box.width).toBeGreaterThan(250)
      expect(box.height).toBe(256)
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
