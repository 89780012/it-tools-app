import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { locales } from '../src/i18n/config'

const id = 'totp-generator'
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

test('discovers the tool, generates RFC codes, copies, downloads, validates and clears', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByTestId('tool-search').fill('2FA')
  await page.getByTestId(`tool-card-${id}`).getByRole('link').click()
  await expect(page).toHaveURL(new RegExp(`${path}$`))
  const tool = page.locator(`[data-tool="${id}"]`)
  const secret = tool.getByLabel('Base32 secret', { exact: true })
  const timestamp = tool.getByLabel('Unix timestamp (seconds, optional)', {
    exact: true,
  })
  const period = tool.getByLabel('Period (seconds)', { exact: true })
  const output = tool.getByLabel('One-time code', { exact: true })
  const generate = tool.getByRole('button', {
    name: 'Generate code',
    exact: true,
  })
  await tool.getByRole('button', { name: 'Load example' }).click()
  await expect(secret).toHaveAttribute('type', 'password')
  await generate.click()
  await expect(output).toHaveValue('94287082')
  await tool.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(tool.getByRole('status')).toHaveText('Copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    '94287082',
  )
  const downloading = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Download', exact: true }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('totp-code.txt')
  expect(readFileSync((await download.path())!, 'utf8')).toBe('94287082')
  const testSecret = await secret.inputValue()
  expect(
    await page.evaluate(() =>
      JSON.stringify({ ...localStorage, ...sessionStorage }),
    ),
  ).not.toContain(testSecret)
  await timestamp.fill('1111111109')
  await expect(output).toHaveCount(0)
  await generate.click()
  await expect(output).toHaveValue('07081804')
  await tool.getByLabel('Code digits', { exact: true }).selectOption('6')
  await generate.click()
  await expect(output).toHaveValue('081804')
  await timestamp.fill('59')
  await tool.getByLabel('Code digits', { exact: true }).selectOption('8')
  for (const [algorithm, key, expected] of [
    [
      'SHA256',
      'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZA',
      '46119246',
    ],
    [
      'SHA512',
      'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNA',
      '90693936',
    ],
  ]) {
    await secret.fill(key)
    await tool
      .getByLabel('Hash algorithm', { exact: true })
      .selectOption(algorithm)
    await expect(output).toHaveCount(0)
    await generate.click()
    await expect(output).toHaveValue(expected)
  }
  await secret.fill('otpauth://totp/example?secret=AA')
  await generate.click()
  await expect(tool.getByRole('alert')).toContainText('Invalid Base32 secret')
  await expect(secret).toBeFocused()
  await expect(secret).toHaveAttribute('aria-invalid', 'true')
  await tool.getByRole('button', { name: 'Load example' }).click()
  await period.fill('0')
  await generate.click()
  await expect(tool.getByRole('alert')).toContainText(
    'Period must be an integer',
  )
  await expect(period).toBeFocused()
  await period.fill('30')
  await timestamp.fill('-1')
  await generate.click()
  await expect(tool.getByRole('alert')).toContainText(
    'Timestamp must be an integer',
  )
  await expect(timestamp).toBeFocused()
  await timestamp.fill('0')
  await generate.click()
  await expect(output).toHaveValue('84755224')
  await tool.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(secret).toHaveValue('')
  await expect(timestamp).toHaveValue('')
  await expect(period).toHaveValue('30')
  await expect(output).toHaveCount(0)
  await generate.click()
  await expect(tool.getByRole('alert')).toContainText('Enter a Base32 secret.')
})

test('refreshes the live code at the boundary, resets copy notice and stops for fixed time', async ({
  page,
}) => {
  await page.clock.install()
  await page.goto(path)
  const tool = page.locator(`[data-tool="${id}"]`)
  const timestamp = tool.getByLabel('Unix timestamp (seconds, optional)', {
    exact: true,
  })
  const output = tool.getByLabel('One-time code', { exact: true })
  const generate = tool.getByRole('button', {
    name: 'Generate code',
    exact: true,
  })
  await tool.getByRole('button', { name: 'Load example' }).click()
  await timestamp.fill('')
  // Pin just before generating, so navigation time cannot cross the boundary.
  await page.clock.setFixedTime(new Date(59000))
  await generate.click()
  await expect(output).toHaveValue('94287082')
  await expect(tool.getByTestId('totp-remaining')).toHaveText('1 s')
  await tool.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(tool.getByRole('status')).toHaveText('Copied')
  await page.clock.setFixedTime(new Date(60000))
  await page.clock.runFor(1000)
  await expect(output).toHaveValue('37359152')
  await expect(tool.getByRole('status')).toHaveText('')
  await expect(tool.getByTestId('totp-remaining')).toHaveText('30 s')
  await timestamp.fill('59')
  await generate.click()
  await page.clock.runFor(60000)
  await expect(output).toHaveValue('94287082')
  await expect(
    tool.getByText('Fixed timestamp · automatic refresh off'),
  ).toBeVisible()
})

test('all locales have working mobile forms, RTL, prerendered SEO and sitemap entries', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const locale of locales) {
    const messages = JSON.parse(
      readFileSync(`src/i18n/messages/totp-additions/${locale}.json`, 'utf8'),
    )
    const labels = messages.totp
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
      .getByLabel(labels.secret, { exact: true })
      .fill('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ')
    await tool.getByLabel(labels.digits, { exact: true }).selectOption('8')
    await tool.getByLabel(labels.timestamp, { exact: true }).fill('59')
    await tool
      .getByRole('button', { name: labels.generate, exact: true })
      .click()
    await expect(tool.getByLabel(labels.code, { exact: true })).toHaveValue(
      '94287082',
    )
    expect(await tool.innerText()).not.toMatch(/totp\.|tools\.totp-generator\./)
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

test('light and dark themes remain usable on mobile and desktop', async ({
  page,
}, testInfo) => {
  await page.goto(path)
  const tool = page.locator(`[data-tool="${id}"]`)
  await tool.getByRole('button', { name: 'Load example' }).click()
  await tool.getByRole('button', { name: 'Generate code', exact: true }).click()
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
        tool.getByLabel('One-time code', { exact: true }),
      ).toHaveValue('94287082')
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
