import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { locales } from '../src/i18n/config'
const id = 'css-clamp-generator'
const path = `/tools/${id}`
let errors: string[] = []
test.beforeEach(async ({ page, baseURL }) => {
  errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url())
    return url.origin === new URL(baseURL!).origin &&
      !url.pathname.startsWith('/api/')
      ? route.continue()
      : route.abort()
  })
})
test.afterEach(() => expect(errors).toEqual([]))
test('catalog, validation, preview, copy/download and real browser CSS interpolation', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByTestId('tool-search').fill('fluid typography')
  await page.getByTestId(`tool-card-${id}`).getByRole('link').click()
  await expect(page).toHaveURL(new RegExp(`${path}$`))
  const tool = page.locator(`[data-tool="${id}"]`)
  const generate = tool.getByRole('button', {
    name: 'Generate CSS',
    exact: true,
  })
  const output = tool.getByLabel('CSS declaration', { exact: true })
  await tool.getByRole('button', { name: 'Load example' }).click()
  await generate.click()
  const css = 'font-size: clamp(1rem, calc(0.5rem + 2.5vw), 2.5rem);'
  await expect(output).toHaveValue(css)
  await tool.getByLabel('Simulated viewport width').press('End')
  await expect(tool.getByTestId('clamp-preview-value')).toHaveText(
    '1280.0 px → 40.000 px',
  )
  await expect(tool.getByTestId('clamp-preview')).toHaveCSS('font-size', '40px')
  await tool.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(tool.getByRole('status')).toHaveText('Copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(css)
  const downloading = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Download', exact: true }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('fluid-font-size.css')
  expect(readFileSync((await download.path())!, 'utf8')).toBe(css)
  const start = tool.getByLabel('Font size at start (px)', { exact: true })
  const end = tool.getByLabel('Font size at end (px)', { exact: true })
  // Apply the emitted declaration to a separate element and compare the browser's
  // computed style against independently calculated sizes at real viewport widths.
  for (const [a, b] of [
    [16, 40],
    [40, 16],
    [0, 0],
    [16.125, 40.875],
  ]) {
    await start.fill(String(a))
    await end.fill(String(b))
    for (const unit of ['px', 'rem']) {
      await tool.getByLabel('Output unit', { exact: true }).selectOption(unit)
      await generate.click()
      const declaration = await output.inputValue()
      for (const width of [280, 320, 800, 1280, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        const size = await page.evaluate((declaration) => {
          const oldRoot = document.documentElement.style.fontSize
          document.documentElement.style.fontSize = '16px'
          const span = document.createElement('span')
          span.style.cssText = declaration
          document.body.append(span)
          const size = parseFloat(getComputedStyle(span).fontSize)
          span.remove()
          document.documentElement.style.fontSize = oldRoot
          return size
        }, declaration)
        const expected =
          a + Math.max(0, Math.min(1, (width - 320) / 960)) * (b - a)
        expect(size).toBeCloseTo(expected, 3)
      }
    }
  }
  await tool.getByRole('button', { name: 'Load example' }).click()
  await generate.click()
  await page.setViewportSize({ width: 800, height: 900 })
  const changedRootSize = await page.evaluate(
    (declaration) => {
      const previous = document.documentElement.style.fontSize
      document.documentElement.style.fontSize = '20px'
      const element = document.createElement('span')
      element.style.cssText = declaration
      document.body.append(element)
      const size = parseFloat(getComputedStyle(element).fontSize)
      element.remove()
      document.documentElement.style.fontSize = previous
      return size
    },
    await output.inputValue(),
  )
  expect(changedRootSize).toBeCloseTo(30, 3)
  await page.setViewportSize({ width: 1200, height: 900 })
  await tool.getByLabel('End viewport (px)', { exact: true }).fill('320')
  await expect(output).toHaveCount(0)
  await generate.click()
  await expect(tool.getByRole('alert')).toContainText('must be greater')
  await expect(
    tool.getByLabel('End viewport (px)', { exact: true }),
  ).toBeFocused()
  await expect(
    tool.getByLabel('End viewport (px)', { exact: true }),
  ).toHaveAttribute('aria-describedby', 'clamp-hint clamp-error')
  await tool.getByRole('button', { name: 'Load example' }).click()
  await start.fill('1e3')
  await generate.click()
  await expect(tool.getByRole('alert')).toContainText('Enter a font size')
  await expect(start).toBeFocused()
  await start.fill('10000')
  await end.fill('10000')
  await generate.click()
  await expect(tool.getByTestId('clamp-preview')).toHaveCSS(
    'font-size',
    '10000px',
  )
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true)
  await tool.getByRole('button', { name: 'Clear', exact: true }).click()
  for (const label of [
    'Start viewport (px)',
    'End viewport (px)',
    'Font size at start (px)',
    'Font size at end (px)',
    'Root font size (px)',
  ])
    await expect(tool.getByLabel(label, { exact: true })).toHaveValue('')
  await expect(output).toHaveCount(0)
  await expect(tool.getByRole('alert')).toHaveCount(0)
})

test('12 locales: mobile interaction, validation, RTL, SEO, prerender and sitemap', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const locale of locales) {
    const messages = JSON.parse(
      readFileSync(
        `src/i18n/messages/css-clamp-additions/${locale}.json`,
        'utf8',
      ),
    )
    const labels = messages.cssClamp
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
    await tool.getByLabel(labels.startSize, { exact: true }).fill('40')
    await tool.getByLabel(labels.endSize, { exact: true }).fill('16')
    await tool
      .getByRole('button', { name: labels.generate, exact: true })
      .click()
    await expect(tool.getByLabel(labels.output, { exact: true })).toHaveValue(
      'font-size: clamp(1rem, calc(3rem - 2.5vw), 2.5rem);',
    )
    await tool.getByLabel(labels.viewport, { exact: true }).press('End')
    await expect(tool.getByTestId('clamp-preview')).toHaveCSS(
      'font-size',
      '16px',
    )
    expect(await tool.innerText()).not.toMatch(
      /cssClamp\.|tools\.css-clamp-generator\./,
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
    await tool.getByLabel(labels.rootSize, { exact: true }).fill('0')
    await tool
      .getByRole('button', { name: labels.generate, exact: true })
      .click()
    await expect(tool.getByRole('alert')).toHaveText(labels.invalidRoot)
  }
})
test('mobile and desktop light/dark themes', async ({ page }, testInfo) => {
  await page.goto(path)
  const tool = page.locator(`[data-tool="${id}"]`)
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
      await expect(
        tool.getByLabel('CSS declaration', { exact: true }),
      ).toHaveValue('font-size: clamp(1rem, calc(0.5rem + 2.5vw), 2.5rem);')
      await expect(tool.getByTestId('clamp-preview')).toBeVisible()
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
