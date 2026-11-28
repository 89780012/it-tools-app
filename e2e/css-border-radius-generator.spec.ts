import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { locales } from '../src/i18n/config'
const id = 'css-border-radius-generator'
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

test('search, live corners, elliptical axes, exact clipboard/download, errors and clear', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByTestId('tool-search').fill('rounded corners')
  await page.getByTestId(`tool-card-${id}`).getByRole('link').click()
  await expect(page).toHaveURL(new RegExp(`${path}$`))
  const tool = page.locator(`[data-tool="${id}"]`)
  const output = tool.getByLabel('Generated CSS', { exact: true })
  await expect(output).toHaveValue('border-radius: 24px;')
  await tool.getByLabel('Top left · Horizontal (px)', { exact: true }).fill('0')
  await expect(output).toHaveValue('border-radius: 0px 24px 24px;')
  await tool.getByLabel('Set vertical radii separately').check()
  await expect(
    tool.getByLabel('Top left · Vertical (px)', { exact: true }),
  ).toHaveValue('0')
  await tool
    .getByLabel('Top left · Vertical (px)', { exact: true })
    .fill('8.25')
  await expect(output).toHaveValue(
    'border-radius: 0px 24px 24px / 8.25px 24px 24px;',
  )
  expect(
    await tool
      .getByTestId('radius-preview')
      .evaluate((node) => getComputedStyle(node).borderTopLeftRadius),
  ).toBe('0px 8.25px')
  await tool.getByRole('button', { name: 'Load example' }).click()
  const example = 'border-radius: 30% 70% 60% 40% / 40% 30% 70% 60%;'
  await expect(output).toHaveValue(example)
  expect(
    await tool
      .getByTestId('radius-preview')
      .evaluate((node) => getComputedStyle(node).borderTopLeftRadius),
  ).toBe('30% 40%')
  await tool.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(tool.getByRole('status')).toHaveText('Copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    example,
  )
  const downloading = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Download', exact: true }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('border-radius.css')
  expect(readFileSync((await download.path())!, 'utf8')).toBe(example)
  await tool
    .getByLabel('Bottom left · Vertical (%)', { exact: true })
    .fill('50')
  await expect(tool.getByRole('status')).toHaveText('')
  for (const invalid of ['-1', '100.01', '1e2', '0.001', '4px', '']) {
    const input = tool.getByLabel('Top right · Horizontal (%)', {
      exact: true,
    })
    await input.fill(invalid)
    await expect(tool.getByRole('alert')).toContainText(
      'Top right · Horizontal',
    )
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toHaveAttribute(
      'aria-describedby',
      'radius-hint radius-error',
    )
    await expect(output).toHaveCount(0)
    await expect(tool.getByTestId('radius-preview')).toBeHidden()
    await input.fill('70')
    await expect(tool.getByRole('alert')).toHaveCount(0)
    await expect(output).toBeVisible()
  }
  await tool.getByLabel('Unit', { exact: true }).selectOption('px')
  await tool
    .getByLabel('Top left · Horizontal (px)', { exact: true })
    .fill('1000')
  await expect(output).toHaveValue(/1000px/)
  await tool.getByLabel('Unit', { exact: true }).selectOption('%')
  await expect(tool.getByRole('alert')).toContainText('0 to 100')
  await expect(
    tool.getByLabel('Top left · Horizontal (%)', { exact: true }),
  ).toHaveValue('1000')
  await tool.getByRole('button', { name: 'Ellipse preset' }).click()
  await expect(output).toHaveValue('border-radius: 50%;')
  await expect(
    tool.getByLabel('Set vertical radii separately'),
  ).not.toBeChecked()
  await tool.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(
    tool.getByLabel('Top left · Horizontal (px)', { exact: true }),
  ).toHaveValue('')
  await expect(
    tool.getByLabel('Top left · Horizontal (px)', { exact: true }),
  ).toBeFocused()
  await expect(output).toHaveCount(0)
  await expect(tool.getByRole('alert')).toHaveCount(0)
  await expect(tool.getByTestId('radius-preview')).toBeHidden()
})

test('all 12 mobile locales: interactions, errors, RTL, metadata and prerendered pages', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const locale of locales) {
    const messages = JSON.parse(
      readFileSync(
        `src/i18n/messages/border-radius-additions/${locale}.json`,
        'utf8',
      ),
    )
    const labels = messages.borderRadius
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
    const label = (axis: string, corner: string, unit: string) =>
      labels.fieldLabel
        .replace('{corner}', labels[corner])
        .replace('{axis}', labels[axis])
        .replace('{unit}', unit)
    const input = tool.getByLabel(label('horizontal', 'bottomRight', 'px'), {
      exact: true,
    })
    const output = tool.getByLabel(labels.output, { exact: true })
    await input.fill('12.5')
    await expect(output).toHaveValue('border-radius: 24px 24px 12.5px;')
    await tool.getByLabel(labels.elliptical).check()
    const vertical = tool.getByLabel(label('vertical', 'bottomRight', 'px'), {
      exact: true,
    })
    await expect(vertical).toHaveValue('12.5')
    await vertical.fill('-1')
    const expectedError = labels.invalidRadius
      .replace('{corner}', labels.bottomRight)
      .replace('{axis}', labels.vertical)
      .replace('{limit}', '1000')
    await expect(tool.getByRole('alert')).toHaveText(expectedError)
    await expect(vertical).toHaveAttribute('aria-invalid', 'true')
    await expect(output).toHaveCount(0)
    await vertical.fill('35')
    await expect(output).toHaveValue(
      'border-radius: 24px 24px 12.5px / 24px 24px 35px;',
    )
    expect(await tool.innerText()).not.toMatch(
      /borderRadius\.|tools\.css-border-radius-generator\./,
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

test('desktop/mobile light and dark themes render valid corner shapes', async ({
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
        'border-radius: 30% 70% 60% 40% / 40% 30% 70% 60%;',
      )
      const preview = tool.getByTestId('radius-preview')
      const computed = await preview.evaluate((node) => {
        const css = getComputedStyle(node)
        return [
          css.borderTopLeftRadius,
          css.borderTopRightRadius,
          css.borderBottomRightRadius,
          css.borderBottomLeftRadius,
        ]
      })
      expect(computed).toEqual(['30% 40%', '70% 30%', '60% 70%', '40% 60%'])
      const box = (await preview.boundingBox())!
      expect(box.width).toBeGreaterThan(200)
      expect(box.width).toBeLessThanOrEqual(320)
      expect(box.height).toBe(180)
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
