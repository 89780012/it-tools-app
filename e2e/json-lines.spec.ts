import { expect, test, type Download } from '@playwright/test'
import { readFileSync } from 'node:fs'

async function downloadedText(download: Download) {
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

let runtimeErrors: string[] = []
test.beforeEach(async ({ page }) => {
  runtimeErrors = []
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  // A local converter must work even when all API calls are unavailable.
  await page.route('**/api/**', (route) => route.abort())
})
test.afterEach(() => expect(runtimeErrors).toEqual([]))

test('JSON Lines: example, clipboard, download, errors and clear', async ({
  page,
}) => {
  await page.goto('/tools/json-lines-converter')
  const tool = page.locator('[data-tool="json-lines-converter"]')
  const output = tool.getByTestId('tool-output')
  await tool.getByRole('button', { name: 'Load example' }).click()
  await tool.getByRole('button', { name: 'Convert', exact: true }).click()
  const result = await output.inputValue()
  expect(result).toContain('9007199254740993')
  expect(result.split('\n')).toHaveLength(3)
  await tool.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(tool.getByText('Copied', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(result)
  const event = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Download', exact: true }).click()
  const file = await event
  expect(file.suggestedFilename()).toBe('result.jsonl')
  expect(await downloadedText(file)).toBe(result)
  await tool.getByTestId('json-lines-input').fill('[{"bad":}]')
  await expect(output).toHaveValue('')
  await expect(
    tool.getByRole('button', { name: 'Download', exact: true }),
  ).toBeDisabled()
  await tool.getByRole('button', { name: 'Convert', exact: true }).click()
  await expect(tool.getByRole('alert')).toContainText('Invalid JSON')
  await tool.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(tool.getByTestId('json-lines-input')).toHaveValue('')
  await expect(tool.getByRole('alert')).toHaveCount(0)
  await tool.getByTestId('json-lines-input').fill('[]')
  await tool.getByRole('button', { name: 'Convert', exact: true }).click()
  await expect(
    tool.getByText('0 records converted; 0 blank lines skipped.'),
  ).toBeVisible()
  const emptyEvent = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Download', exact: true }).click()
  expect(await downloadedText(await emptyEvent)).toBe('')
})

test('JSON Lines: file import, reverse conversion, strict blank lines and encoding errors', async ({
  page,
}) => {
  await page.goto('/tools/json-lines-converter')
  const tool = page.locator('[data-tool="json-lines-converter"]')
  await tool.getByLabel('Import file').setInputFiles({
    name: 'logs.ndjson',
    mimeType: 'application/x-ndjson',
    buffer: Buffer.from(
      '\uFEFF{"id":9007199254740993}\r\n\r\nnull\r\nfalse\r\n',
    ),
  })
  await expect(tool.getByLabel('Conversion direction')).toHaveValue('toJson')
  await tool.getByRole('button', { name: 'Convert', exact: true }).click()
  await expect(
    tool.getByText('3 records converted; 1 blank lines skipped.'),
  ).toBeVisible()
  await expect(tool.getByTestId('tool-output')).toHaveValue(
    '[\n  {"id":9007199254740993},\n  null,\n  false\n]',
  )
  const event = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Download', exact: true }).click()
  const file = await event
  expect(file.suggestedFilename()).toBe('result.json')
  expect(await downloadedText(file)).toContain('9007199254740993')
  await tool.getByLabel('Skip blank lines').uncheck()
  await expect(tool.getByTestId('tool-output')).toHaveValue('')
  await tool.getByRole('button', { name: 'Convert', exact: true }).click()
  await expect(tool.getByRole('alert')).toContainText('Blank line at line 2')
  await tool.getByTestId('json-lines-input').fill('null\n{bad}')
  await tool.getByRole('button', { name: 'Convert', exact: true }).click()
  await expect(tool.getByRole('alert')).toContainText(
    'Invalid JSON record at line 2',
  )
  await tool
    .getByLabel('Import file')
    .setInputFiles({
      name: 'bad.json',
      mimeType: 'application/json',
      buffer: Buffer.from([0xff]),
    })
  await expect(tool.getByRole('alert')).toContainText('not valid UTF-8')
  await expect(tool.getByTestId('tool-output')).toHaveValue('')
  await tool
    .getByLabel('Import file')
    .setInputFiles({
      name: 'data.json',
      mimeType: 'application/json',
      buffer: Buffer.from('[true]'),
    })
  await expect(tool.getByLabel('Conversion direction')).toHaveValue('toLines')
  await tool.getByRole('button', { name: 'Convert', exact: true }).click()
  await expect(tool.getByTestId('tool-output')).toHaveValue('true\n')
})

test('JSON Lines: all 12 locales, SEO, RTL, mobile and desktop themes', async ({
  page,
}, testInfo) => {
  for (const locale of [
    'en',
    'zh',
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
  ]) {
    const messages = JSON.parse(
      readFileSync(
        `src/i18n/messages/json-lines-additions/${locale}.json`,
        'utf8',
      ),
    )
    const route = `${locale === 'en' ? '' : '/' + locale}/tools/json-lines-converter`
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(route)
    const tool = page.locator('[data-tool="json-lines-converter"]')
    await expect(
      tool.getByRole('heading', {
        name: messages.tools['json-lines-converter'].name,
        exact: true,
      }),
    ).toBeVisible()
    await expect(page).toHaveTitle(
      messages.tools['json-lines-converter'].meta.title +
        ' - IT Tools Collection',
    )
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://www.toolkitpub.com' + route,
    )
    await expect(page.locator('link[rel="alternate"]')).toHaveCount(12)
    await expect(page.locator('html')).toHaveAttribute(
      'dir',
      locale === 'ar' ? 'rtl' : 'ltr',
    )
    expect(await tool.innerText()).not.toMatch(
      /jsonLines\.|tools\.json-lines-converter\./,
    )
    await tool.getByTestId('json-lines-input').fill('[{"id":9007199254740993}]')
    await tool
      .getByRole('button', { name: messages.jsonLines.convert, exact: true })
      .click()
    await expect(tool.getByTestId('tool-output')).toHaveValue(
      '{"id":9007199254740993}\n',
    )
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true)
    if (locale === 'zh' || locale === 'ar') {
      await page.screenshot({
        path: testInfo.outputPath(`${locale}-mobile.png`),
        fullPage: true,
      })
    }
  }
  await page.goto('/tools/json-lines-converter')
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 960 })
    for (const theme of ['Dark', 'Light']) {
      await page
        .getByRole('button', { name: 'Toggle theme', exact: true })
        .click()
      await page.getByRole('menuitem', { name: theme, exact: true }).click()
      await expect(page.locator('html')).toHaveClass(
        new RegExp(theme.toLowerCase()),
      )
      await page
        .locator('[data-tool="json-lines-converter"]')
        .getByRole('button', { name: 'Load example' })
        .click()
      await page.getByRole('button', { name: 'Convert', exact: true }).click()
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
