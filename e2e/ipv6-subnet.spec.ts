import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { locales } from '../src/i18n/config'

const id = 'ipv6-subnet-calculator'
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

test('discovers, calculates, copies, downloads, rejects invalid input and clears', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByTestId('tool-search').fill('IPv6 CIDR')
  await page.getByTestId(`tool-card-${id}`).getByRole('link').click()
  await expect(page).toHaveURL(new RegExp(`${path}$`))
  const tool = page.locator(`[data-tool="${id}"]`)
  const input = tool.getByLabel('IPv6 address / prefix', { exact: true })
  const output = tool.getByLabel('Subnet summary', { exact: true })
  const calculate = tool.getByRole('button', {
    name: 'Calculate subnet',
    exact: true,
  })
  await tool.getByRole('button', { name: 'Load example' }).click()
  await calculate.click()
  const text = await output.inputValue()
  expect(text).toContain('Network CIDR: 2001:db8:1234:5678::/64')
  expect(text).toContain('Total addresses: 18446744073709551616')
  await tool.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(tool.getByRole('status')).toHaveText('Copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(text)
  const downloading = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Download', exact: true }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('ipv6-subnet.txt')
  expect(readFileSync((await download.path())!, 'utf8')).toBe(text)
  await input.fill('1::2::3/64')
  await expect(output).toHaveCount(0)
  await calculate.click()
  await expect(tool.getByRole('alert')).toContainText('Invalid IPv6 address')
  await expect(input).toBeFocused()
  await expect(input).toHaveAttribute('aria-invalid', 'true')
  await input.fill('::/129')
  await expect(tool.getByRole('alert')).toHaveCount(0)
  await calculate.click()
  await expect(tool.getByRole('alert')).toContainText(
    'Prefix must be an integer',
  )
  await input.fill('::/0')
  await calculate.click()
  await expect(output).toContainText('340282366920938463463374607431768211456')
  await input.fill('::ffff:192.0.2.128/120')
  await calculate.click()
  await expect(output).toContainText('Network CIDR: ::ffff:c000:200/120')
  await expect(output).toContainText('Total addresses: 256')
  await input.fill('::1/128')
  await calculate.click()
  await expect(output).toContainText('Total addresses: 1')
  await tool.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(input).toHaveValue('')
  await expect(output).toHaveCount(0)
  await calculate.click()
  await expect(input).toBeFocused()
  await expect(tool.getByRole('alert')).toContainText(
    'Enter an IPv6 address and prefix',
  )
})

test('checks all locales, mobile RTL, static SEO and sitemaps', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const locale of locales) {
    const messages = JSON.parse(
      readFileSync(
        `src/i18n/messages/ipv6-subnet-additions/${locale}.json`,
        'utf8',
      ),
    )
    const labels = messages.ipv6Subnet
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
      .getByLabel(labels.cidr, { exact: true })
      .fill('2001:db8::abcd/64')
    await tool
      .getByRole('button', { name: labels.calculate, exact: true })
      .click()
    const value = await tool
      .getByLabel(labels.output, { exact: true })
      .inputValue()
    expect(value).toContain(`${labels.network}: 2001:db8::/64`)
    expect(value).toContain(`${labels.count}: 18446744073709551616`)
    expect(await tool.innerText()).not.toMatch(
      /ipv6Subnet\.|tools\.ipv6-subnet-calculator\./,
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
  await tool
    .getByRole('button', { name: 'Calculate subnet', exact: true })
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
      expect(
        await tool.getByLabel('Subnet summary', { exact: true }).inputValue(),
      ).toContain('18446744073709551616')
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
