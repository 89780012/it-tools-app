import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { locales } from '../src/i18n/config'

const id = 'unicode-normalizer'
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

test('search, all four forms, previews, real clipboard, download, errors and reset', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByTestId('tool-search').fill('NFKC')
  await page.getByTestId(`tool-card-${id}`).getByRole('link').click()
  await expect(page).toHaveURL(new RegExp(`${path}$`))
  const tool = page.locator(`[data-tool="${id}"]`)
  const input = tool.getByLabel('Text to normalize', { exact: true })
  const output = tool.getByLabel('Normalized text', { exact: true })
  const form = tool.getByLabel('Normalization form', { exact: true })
  const normalize = tool.getByRole('button', {
    name: 'Normalize text',
    exact: true,
  })
  await tool.getByRole('button', { name: 'Load example' }).click()
  await normalize.click()
  await expect(output).toHaveValue('Café / Café\nＡＢＣ ﬃ ①\n가 / 가\n👩‍💻')
  for (const [mode, expected] of [
    ['NFC', 'é Ａ ﬃ ① 가 👩‍💻'],
    ['NFD', 'e\u0301 Ａ ﬃ ① \u1100\u1161 👩‍💻'],
    ['NFKC', 'é A ffi 1 가 👩‍💻'],
    ['NFKD', 'e\u0301 A ffi 1 \u1100\u1161 👩‍💻'],
  ]) {
    await input.fill('é Ａ ﬃ ① 가 👩‍💻')
    await form.selectOption(mode)
    await expect(output).toHaveCount(0)
    await normalize.click()
    await expect(output).toHaveValue(expected)
  }
  await tool.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(tool.getByRole('status')).toHaveText('Copied')
  const expected = 'e\u0301 A ffi 1 \u1100\u1161 👩‍💻'
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    expected,
  )
  const downloading = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Download', exact: true }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('normalized-nfkd.txt')
  expect(readFileSync((await download.path())!, 'utf8')).toBe(expected)
  await input.fill('😀'.repeat(70))
  await normalize.click()
  await expect(output).toHaveValue('😀'.repeat(70))
  await expect(tool.getByTestId('unicode-after')).toHaveText(
    `${Array(64).fill('U+1F600').join(' ')} …`,
  )
  await expect(tool.getByTestId('unicode-change')).toHaveText(
    'The text is already in the selected form.',
  )
  await input.fill('x'.repeat(100001))
  await normalize.click()
  await expect(tool.getByRole('alert')).toContainText('at most 100000')
  await expect(input).toBeFocused()
  await expect(input).toHaveAttribute('aria-invalid', 'true')
  await expect(input).toHaveAttribute(
    'aria-describedby',
    'unicode-hint unicode-error',
  )
  await tool.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(input).toHaveValue('')
  await expect(form).toHaveValue('NFC')
  await expect(output).toHaveCount(0)
  await expect(tool.getByRole('alert')).toHaveCount(0)
  await normalize.click()
  await expect(tool.getByRole('alert')).toHaveText('Enter text to normalize.')
  await input.fill(' \te\u0301\n')
  await normalize.click()
  await expect(output).toHaveValue(' \té\n')
  await expect(tool.getByRole('alert')).toHaveCount(0)
})

test('all 12 locales work on mobile with RTL, SEO, prerendered content and sitemap entries', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const locale of locales) {
    const messages = JSON.parse(
      readFileSync(
        `src/i18n/messages/unicode-additions/${locale}.json`,
        'utf8',
      ),
    )
    const labels = messages.unicodeNormalizer
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
      .getByLabel(labels.text, { exact: true })
      .fill('Cafe\u0301 Ａ ﬃ ① 가 👩‍💻')
    await tool.getByLabel(labels.form, { exact: true }).selectOption('NFKC')
    await tool
      .getByRole('button', { name: labels.normalize, exact: true })
      .click()
    await expect(tool.getByLabel(labels.output, { exact: true })).toHaveValue(
      'Café A ffi 1 가 👩‍💻',
    )
    await expect(tool.getByRole('table')).toBeVisible()
    expect(await tool.innerText()).not.toMatch(
      /unicodeNormalizer\.|tools\.unicode-normalizer\./,
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

test('light and dark themes support mobile and desktop without horizontal overflow', async ({
  page,
}, testInfo) => {
  await page.goto(path)
  const tool = page.locator(`[data-tool="${id}"]`)
  await tool.getByRole('button', { name: 'Load example' }).click()
  await tool
    .getByRole('button', { name: 'Normalize text', exact: true })
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
        tool.getByLabel('Normalized text', { exact: true }),
      ).toHaveValue('Café / Café\nＡＢＣ ﬃ ①\n가 / 가\n👩‍💻')
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
