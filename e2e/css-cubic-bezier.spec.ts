import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { locales } from '../src/i18n/config'

const id = 'css-cubic-bezier'
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

test('catalog navigation, presets, browser animation parity, copy/download, errors and clear', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByTestId('tool-search').fill('easing curve')
  await page.getByTestId(`tool-card-${id}`).getByRole('link').click()
  await expect(page).toHaveURL(new RegExp(`${path}$`))
  const tool = page.locator(`[data-tool="${id}"]`)
  const generate = tool.getByRole('button', {
    name: 'Generate CSS',
    exact: true,
  })
  const output = tool.getByLabel('CSS declarations', { exact: true })
  await tool.getByRole('button', { name: 'Load example' }).click()
  await generate.click()
  const css =
    'transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);\nanimation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);'
  await expect(output).toHaveValue(css)
  await tool.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(tool.getByRole('status')).toHaveText('Copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(css)
  const downloading = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Download', exact: true }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('cubic-bezier.css')
  expect(readFileSync((await download.path())!, 'utf8')).toBe(css)

  // Compare the simulator against Chromium's independent CSS animation engine.
  for (const values of [
    ['0', '0', '1', '1'],
    ['0.25', '0.1', '0.25', '1'],
    ['0.42', '0', '1', '1'],
    ['0', '0', '0.58', '1'],
    ['0.42', '0', '0.58', '1'],
    ['0.34', '1.56', '0.64', '1'],
    ['0', '0', '0', '1'],
    ['1', '0', '1', '1'],
    ['1', '0', '0', '1'],
    ['0.5', '-5', '0.5', '-5'],
    ['0.5', '5', '0.5', '5'],
  ]) {
    for (const [index, label] of [
      'Control point 1: X',
      'Control point 1: Y',
      'Control point 2: X',
      'Control point 2: Y',
    ].entries()) {
      await tool.getByLabel(label, { exact: true }).fill(values[index])
    }
    await expect(output).toHaveCount(0)
    await generate.click()
    const easing = (await output.inputValue()).match(
      /cubic-bezier\([^)]*\)/,
    )![0]
    expect(
      await page.evaluate(
        (value) => CSS.supports('transition-timing-function', value),
        easing,
      ),
    ).toBe(true)
    for (const time of [0, 0.125, 0.5, 0.875, 1]) {
      await tool
        .getByLabel('Elapsed time', { exact: true })
        .evaluate((element, value) => {
          Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
          )!.set!.call(element, String(value))
          element.dispatchEvent(new Event('input', { bubbles: true }))
        }, time)
      await expect(tool.getByTestId('bezier-marker')).toHaveAttribute(
        'cx',
        String(36 + 288 * time),
      )
      const progress =
        Number(
          (await tool.getByTestId('bezier-sample').innerText()).match(
            /progress (-?[\d.]+)%/,
          )![1],
        ) / 100
      const actual = await page.evaluate(
        async ({ easing, time }) => {
          const element = document.createElement('div')
          document.body.append(element)
          const animation = element.animate(
            [
              { transform: 'translateX(0px)' },
              { transform: 'translateX(1000px)' },
            ],
            { duration: 1000, easing, fill: 'both' },
          )
          animation.pause()
          animation.currentTime = time * 1000
          await new Promise(requestAnimationFrame)
          const progress =
            new DOMMatrixReadOnly(getComputedStyle(element).transform).m41 /
            1000
          animation.cancel()
          element.remove()
          return progress
        },
        { easing, time },
      )
      expect(Math.abs(actual - progress)).toBeLessThan(0.0006)
    }
  }
  await tool.getByLabel('Control point 1: X', { exact: true }).fill('1.0001')
  await generate.click()
  const invalid = tool.getByLabel('Control point 1: X', { exact: true })
  await expect(invalid).toBeFocused()
  await expect(invalid).toHaveAttribute('aria-invalid', 'true')
  await expect(invalid).toHaveAttribute(
    'aria-describedby',
    'bezier-hint bezier-error',
  )
  await expect(tool.getByRole('alert')).toContainText('Enter an X coordinate')
  await expect(output).toHaveCount(0)
  await tool.getByRole('button', { name: 'Clear', exact: true }).click()
  for (const label of [
    'Control point 1: X',
    'Control point 1: Y',
    'Control point 2: X',
    'Control point 2: Y',
  ]) {
    await expect(tool.getByLabel(label, { exact: true })).toHaveValue('')
  }
  await expect(tool.getByRole('alert')).toHaveCount(0)
  await expect(invalid).toBeFocused()
  await tool.getByRole('button', { name: 'Ease in out', exact: true }).click()
  await generate.click()
  await expect(output).toHaveValue(
    'transition-timing-function: cubic-bezier(0.42, 0, 0.58, 1);\nanimation-timing-function: cubic-bezier(0.42, 0, 0.58, 1);',
  )
})

test('12 locales: mobile input, local errors, RTL, SEO, prerender and sitemap', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const locale of locales) {
    const messages = JSON.parse(
      readFileSync(
        `src/i18n/messages/cubic-bezier-additions/${locale}.json`,
        'utf8',
      ),
    )
    const labels = messages.cubicBezier
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
    await tool.getByLabel(labels.y1, { exact: true }).fill('-5')
    await tool.getByLabel(labels.y2, { exact: true }).fill('5')
    await tool
      .getByRole('button', { name: labels.generate, exact: true })
      .click()
    await expect(tool.getByLabel(labels.output, { exact: true })).toHaveValue(
      'transition-timing-function: cubic-bezier(0.25, -5, 0.25, 5);\nanimation-timing-function: cubic-bezier(0.25, -5, 0.25, 5);',
    )
    await tool.getByLabel(labels.time, { exact: true }).press('End')
    await expect(tool.getByTestId('bezier-marker')).toHaveAttribute('cx', '324')
    await expect(tool.getByTestId('bezier-sample')).toHaveAttribute(
      'dir',
      'auto',
    )
    await expect(
      tool.getByTestId('bezier-sample').locator('bdi[dir="ltr"]'),
    ).toHaveText(['100.0%', '100.00%'])
    expect(await tool.innerText()).not.toMatch(
      /cubicBezier\.|tools\.css-cubic-bezier\./,
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
    await tool.getByLabel(labels.y1, { exact: true }).fill('5.0001')
    await tool
      .getByRole('button', { name: labels.generate, exact: true })
      .click()
    await expect(tool.getByRole('alert')).toHaveText(labels.invalidY)
    await expect(tool.getByLabel(labels.y1, { exact: true })).toBeFocused()
  }
})

test('mobile and desktop light/dark themes', async ({ page }, testInfo) => {
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
      await expect(
        tool.getByRole('img', { name: 'Cubic Bézier easing curve' }),
      ).toBeVisible()
      await expect(tool.getByTestId('bezier-sample')).toContainText(
        'Time 50.0%',
      )
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
