import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { locales } from '../src/i18n/config'
const id = 'css-box-shadow-generator'
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

test('search, layers, browser CSS rendering, clipboard, download, validation and clear', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByTestId('tool-search').fill('box-shadow')
  await page.getByTestId(`tool-card-${id}`).getByRole('link').click()
  await expect(page).toHaveURL(new RegExp(`${path}$`))
  const tool = page.locator(`[data-tool="${id}"]`)
  const generate = tool.getByRole('button', {
    name: 'Generate CSS',
    exact: true,
  })
  const output = tool.getByLabel('CSS declaration')
  await tool.getByRole('button', { name: 'Load example' }).click()
  await generate.click()
  const css =
    'box-shadow: 0px 8px 24px 0px rgba(0, 0, 0, 0.2),\n  inset 0px 2px 4px -1px rgba(37, 99, 235, 0.35);'
  await expect(output).toHaveValue(css)
  expect(
    await tool
      .getByTestId('shadow-preview')
      .evaluate((el) => getComputedStyle(el).boxShadow),
  ).toBe(
    'rgba(0, 0, 0, 0.2) 0px 8px 24px 0px, rgba(37, 99, 235, 0.35) 0px 2px 4px -1px inset',
  )
  await tool.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(tool.getByRole('status')).toHaveText('Copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(css)
  const downloading = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Download', exact: true }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('box-shadow.css')
  expect(readFileSync((await download.path())!, 'utf8')).toBe(css)
  await tool.getByLabel('Layer', { exact: true }).selectOption('1')
  await expect(tool.getByLabel('Inset shadow')).toBeChecked()
  await tool.getByLabel('Color (#RRGGBB)').fill('#ff0080')
  await expect(output).toHaveCount(0)
  await expect(tool.getByTestId('shadow-preview')).toHaveCSS(
    'box-shadow',
    'none',
  )
  await tool.getByLabel('Opacity (%)').fill('0')
  await generate.click()
  await expect(output).toHaveValue(
    css.replace('37, 99, 235, 0.35', '255, 0, 128, 0'),
  )
  await tool.getByLabel('Blur radius (px)').fill('-1')
  await tool.getByLabel('Layer', { exact: true }).selectOption('0')
  await generate.click()
  await expect(tool.getByRole('alert')).toHaveText(
    'Layer 2: blur radius must be between 0 and 500 px.',
  )
  await expect(tool.getByLabel('Layer', { exact: true })).toHaveValue('1')
  await expect(tool.getByLabel('Blur radius (px)')).toBeFocused()
  await expect(tool.getByLabel('Blur radius (px)')).toHaveAttribute(
    'aria-invalid',
    'true',
  )
  await expect(tool.getByLabel('Blur radius (px)')).toHaveAttribute(
    'aria-describedby',
    'shadow-hint shadow-error',
  )
  await tool.getByLabel('Blur radius (px)').fill('0')
  await tool.getByRole('button', { name: 'Remove layer' }).click()
  await expect(
    tool.getByRole('button', { name: 'Remove layer' }),
  ).toBeDisabled()
  for (let i = 1; i < 8; i++)
    await tool.getByRole('button', { name: 'Add layer' }).click()
  await expect(tool.getByRole('button', { name: 'Add layer' })).toBeDisabled()
  await generate.click()
  expect((await output.inputValue()).match(/rgba\(/g)).toHaveLength(8)
  await tool.getByLabel('Horizontal offset (px)').fill('-500')
  await tool.getByLabel('Vertical offset (px)').fill('500')
  await tool.getByLabel('Blur radius (px)').fill('500')
  await tool.getByLabel('Spread radius (px)').fill('-500')
  await generate.click()
  await expect(tool.getByRole('alert')).toHaveCount(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true)
  await tool.getByLabel('Color (#RRGGBB)').fill('#fff; color:red')
  await generate.click()
  await expect(tool.getByRole('alert')).toContainText(
    'enter a color as #RRGGBB',
  )
  await tool.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(tool.getByLabel('Horizontal offset (px)')).toHaveValue('')
  await expect(tool.getByLabel('Horizontal offset (px)')).toBeFocused()
  await expect(tool.getByRole('alert')).toHaveCount(0)
  await generate.click()
  await expect(tool.getByRole('alert')).toContainText('enter a whole number')
})

test('12 locales: mobile interactions, localized errors, RTL, SEO and prerender', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const locale of locales) {
    const messages = JSON.parse(
      readFileSync(
        `src/i18n/messages/box-shadow-additions/${locale}.json`,
        'utf8',
      ),
    )
    const labels = messages.boxShadow
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
    const generate = tool.getByRole('button', {
      name: labels.generate,
      exact: true,
    })
    await generate.click()
    await expect(tool.getByLabel(labels.output)).toHaveValue(
      'box-shadow: 0px 8px 24px 0px rgba(0, 0, 0, 0.2);',
    )
    await tool.getByLabel(labels.blur).fill('-1')
    await generate.click()
    await expect(tool.getByRole('alert')).toHaveText(
      labels.blurRange.replace('{number}', '1'),
    )
    await expect(tool.getByLabel(labels.blur)).toBeFocused()
    await tool.getByLabel(labels.blur).fill('0')
    await generate.click()
    expect(await tool.innerText()).not.toMatch(
      /boxShadow\.|tools\.css-box-shadow-generator\./,
    )
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true)
  }
})

test('desktop and mobile previews in light and dark themes', async ({
  page,
}, testInfo) => {
  await page.goto(path)
  const tool = page.locator(`[data-tool="${id}"]`)
  await tool.getByRole('button', { name: 'Load example' }).click()
  await tool.getByRole('button', { name: 'Generate CSS', exact: true }).click()
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const theme of ['Light', 'Dark']) {
      await page.getByRole('button', { name: 'Toggle theme' }).click()
      await page.getByRole('menuitem', { name: theme, exact: true }).click()
      await expect(page.locator('html')).toHaveClass(
        new RegExp(`\\b${theme.toLowerCase()}\\b`),
      )
      await expect(page.getByRole('menu')).toBeHidden()
      await expect(tool.getByLabel('CSS declaration')).toBeVisible()
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
