import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { locales } from '../src/i18n/config'
const id = 'base32-encoder-decoder'
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

test('search, text and binary conversion, real clipboard/download, validation and reset', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByTestId('tool-search').fill('Base32hex')
  await page.getByTestId(`tool-card-${id}`).getByRole('link').click()
  await expect(page).toHaveURL(new RegExp(`${path}$`))
  const tool = page.locator(`[data-tool="${id}"]`)
  const input = tool.getByLabel('Input data', { exact: true })
  const output = tool.getByLabel('Conversion result', { exact: true })
  const convert = tool.getByRole('button', { name: 'Convert', exact: true })
  await tool.getByRole('button', { name: 'Load example' }).click()
  await convert.click()
  await expect(output).toHaveValue('MZXW6YTBOI======')
  await tool.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(tool.getByRole('status')).toHaveText('Copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'MZXW6YTBOI======',
  )
  const downloading = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Download', exact: true }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('base32.txt')
  expect(readFileSync((await download.path())!, 'utf8')).toBe(
    'MZXW6YTBOI======',
  )
  await tool.getByLabel('Include = padding').uncheck()
  await expect(output).toHaveCount(0)
  await convert.click()
  await expect(output).toHaveValue('MZXW6YTBOI')
  await expect(tool.getByRole('status')).toHaveText('')
  await tool.getByLabel('Alphabet', { exact: true }).selectOption('hex')
  await convert.click()
  await expect(output).toHaveValue('CPNMUOJ1E8')
  await tool.getByLabel('Operation', { exact: true }).selectOption('decode')
  await input.fill('cpnm\nuoj1e8======')
  await convert.click()
  await expect(output).toHaveValue('foobar')
  await tool.getByLabel('Alphabet', { exact: true }).selectOption('standard')
  await input.fill('74======')
  await convert.click()
  await expect(tool.getByRole('alert')).toContainText('not valid UTF-8')
  await expect(input).toBeFocused()
  await expect(input).toHaveAttribute('aria-invalid', 'true')
  await expect(input).toHaveAttribute(
    'aria-describedby',
    'base32-hint base32-error',
  )
  await tool
    .getByLabel('Byte representation', { exact: true })
    .selectOption('hex')
  await convert.click()
  await expect(output).toHaveValue('ff')
  const downloadingHex = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Download', exact: true }).click()
  const hexDownload = await downloadingHex
  expect(hexDownload.suggestedFilename()).toBe('decoded.hex.txt')
  expect(readFileSync((await hexDownload.path())!, 'utf8')).toBe('ff')
  for (const [text, message] of [
    ['MZ', 'Unused trailing bits'],
    ['MY=', 'Invalid = padding'],
    ['M0', 'outside the selected'],
    ['AAA', 'Invalid Base32 length'],
  ]) {
    await input.fill(text)
    await expect(output).toHaveCount(0)
    await convert.click()
    await expect(tool.getByRole('alert')).toContainText(message)
  }
  await tool.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(input).toHaveValue('')
  await expect(input).toBeFocused()
  await expect(tool.getByLabel('Operation', { exact: true })).toHaveValue(
    'encode',
  )
  await expect(
    tool.getByLabel('Byte representation', { exact: true }),
  ).toHaveValue('text')
  await expect(tool.getByLabel('Include = padding')).toBeChecked()
  await expect(tool.getByRole('alert')).toHaveCount(0)
  await convert.click()
  await expect(tool.getByRole('alert')).toHaveText('Enter data to convert.')
  const unicode = '\ufeff中文 👩‍💻\n'
  await input.fill(unicode)
  await convert.click()
  const encoded = await output.inputValue()
  // Independent bit-string encoder, separate from the app's accumulator algorithm.
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const bits = Array.from(Buffer.from(unicode))
    .map((byte) => byte.toString(2).padStart(8, '0'))
    .join('')
  const oracle = (bits.match(/.{1,5}/g) ?? [])
    .map((part) => alphabet[parseInt(part.padEnd(5, '0'), 2)])
    .join('')
  expect(encoded).toBe(oracle.padEnd(Math.ceil(oracle.length / 8) * 8, '='))
  await tool.getByLabel('Operation', { exact: true }).selectOption('decode')
  await input.fill(encoded)
  await convert.click()
  await expect(output).toHaveValue(unicode)
  await input.fill('A'.repeat(100001))
  await convert.click()
  await expect(tool.getByRole('alert')).toContainText('at most 100000')
})

test('all 12 locales on mobile: conversion, localized errors, RTL, SEO and prerendered pages', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const locale of locales) {
    const messages = JSON.parse(
      readFileSync(`src/i18n/messages/base32-additions/${locale}.json`, 'utf8'),
    )
    const labels = messages.base32
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
    const input = tool.getByLabel(labels.data, { exact: true })
    const output = tool.getByLabel(labels.output, { exact: true })
    const convert = tool.getByRole('button', {
      name: labels.convert,
      exact: true,
    })
    await input.fill('foobar')
    await convert.click()
    await expect(output).toHaveValue('MZXW6YTBOI======')
    await tool
      .getByLabel(labels.operation, { exact: true })
      .selectOption('decode')
    await tool.getByLabel(labels.variant, { exact: true }).selectOption('hex')
    await input.fill('cpnmuoj1e8')
    await convert.click()
    await expect(output).toHaveValue('foobar')
    await input.fill('CP======')
    await convert.click()
    await expect(tool.getByRole('alert')).toHaveText(labels.nonZeroBits)
    await expect(input).toBeFocused()
    await input.fill('CO======')
    await convert.click()
    await expect(output).toHaveValue('f')
    expect(await tool.innerText()).not.toMatch(
      /base32\.|tools\.base32-encoder-decoder\./,
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

test('light and dark themes at desktop and mobile sizes', async ({
  page,
}, testInfo) => {
  await page.goto(path)
  const tool = page.locator(`[data-tool="${id}"]`)
  await tool.getByRole('button', { name: 'Load example' }).click()
  await tool.getByRole('button', { name: 'Convert', exact: true }).click()
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const theme of ['Light', 'Dark']) {
      await page.getByRole('button', { name: 'Toggle theme' }).click()
      await page.getByRole('menuitem', { name: theme, exact: true }).click()
      await expect(page.locator('html')).toHaveClass(
        new RegExp(`\\b${theme.toLowerCase()}\\b`),
      )
      await expect(page.getByRole('menu')).toBeHidden()
      await expect(tool.getByLabel('Conversion result')).toHaveValue(
        'MZXW6YTBOI======',
      )
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
