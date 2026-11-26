import { test, expect } from '@playwright/test'
import { createHash } from 'node:crypto'
import JSZip from 'jszip'

let runtimeErrors: string[] = []
test.beforeEach(({ page }) => { runtimeErrors = []; page.on('pageerror', error => runtimeErrors.push(error.message)) })
test.afterEach(() => expect(runtimeErrors).toEqual([]))

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEUlEQVR4nGP4z8DwnwEEYAwAK+YD/WmG8G4AAAAASUVORK5CYII=',
  'base64',
)
const output = (page: import('@playwright/test').Page) =>
  page.getByTestId('tool-output').first()
async function bytes(download: import('@playwright/test').Download) {
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(chunk)
  return Buffer.concat(chunks)
}

test('expansion: hashes uploaded files and compares checksums', async ({
  page,
}) => {
  await page.goto('/tools/file-hash')
  await page.getByTestId('hash-files').setInputFiles([
    { name: 'abc.txt', mimeType: 'text/plain', buffer: Buffer.from('abc') },
    { name: 'empty.txt', mimeType: 'text/plain', buffer: Buffer.alloc(0) },
  ])
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  const expected = createHash('sha256').update('abc').digest('hex')
  await expect(output(page)).toHaveValue(expected)
  await expect(page.getByTestId('tool-output').nth(1)).toHaveValue(
    createHash('sha256').update('').digest('hex'),
  )
  await page.getByLabel('Expected hash (optional)').fill(expected.toUpperCase())
  await expect(page.getByText('Hash matches', { exact: true })).toBeVisible()
  await expect(
    page.getByText('Hash does not match', { exact: true }),
  ).toBeVisible()
})

test('expansion: list operations, CSV filtering and SQL generation', async ({
  page,
}) => {
  await page.goto('/tools/text-set-operations')
  await page.getByTestId('set-left').fill('Ada\nLin\nAda')
  await page.getByTestId('set-right').fill('Ada\nBob')
  await expect(output(page)).toHaveValue('Ada')
  await page.getByRole('combobox').selectOption('leftOnly')
  await expect(output(page)).toHaveValue('Lin')
  await page.goto('/tools/csv-table-editor')
  await page
    .getByTestId('table-input')
    .fill('id,name\n001,Ada\n002,Lin\n002,Lin')
  await page.getByTestId('table-run').click()
  await page.getByLabel('Deduplicate by column').selectOption('id')
  await page.getByLabel('Filter rows').fill('Lin')
  await expect(output(page)).toHaveValue('id,name\n002,Lin')
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download', exact: true }).click()
  expect((await bytes(await downloadEvent)).toString()).toBe(
    'id,name\r\n002,Lin',
  )
  await page.goto('/tools/data-to-sql')
  await page
    .getByTestId('sql-insert-input')
    .fill('[{"id":1,"name":"O\'Reilly"},{"id":2}]')
  await page.getByTestId('sql-insert-run').click()
  await expect(output(page)).toHaveValue(/O''Reilly/)
  await expect(output(page)).toHaveValue(/\(2, NULL\)/)
})

test('expansion: QR generation round-trips through image recognition', async ({
  page,
}) => {
  await page.goto('/tools/qr-code-generator')
  await page
    .locator('main textarea')
    .first()
    .fill('https://example.com/二维码?x=1')
  await page.locator('main [role=combobox]').last().click()
  await page.getByRole('option', { name: 'PNG', exact: true }).click()
  const canvas = page.locator('main canvas').first()
  await expect(canvas).toBeAttached()
  const data = await canvas.evaluate((element) =>
    (element as HTMLCanvasElement).toDataURL('image/png'),
  )
  await page.goto('/tools/qr-code-reader')
  await page
    .getByTestId('qr-reader-file')
    .setInputFiles({
      name: 'qr.png',
      mimeType: 'image/png',
      buffer: Buffer.from(data.split(',')[1], 'base64'),
    })
  await expect(output(page)).toHaveValue('https://example.com/二维码?x=1')
  await page
    .getByTestId('qr-reader-file')
    .setInputFiles({
      name: 'bad.png',
      mimeType: 'image/png',
      buffer: Buffer.from('bad'),
    })
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(output(page)).toHaveValue('')
})

test('expansion: batch image ZIP, crop and rotation dimensions', async ({
  page,
}) => {
  await page.goto('/tools/image-compressor')
  await page.getByTestId('batch-images').setInputFiles([
    { name: 'one.png', mimeType: 'image/png', buffer: png },
    { name: 'two.png', mimeType: 'image/png', buffer: png },
  ])
  await page
    .getByRole('button', { name: 'Process images', exact: true })
    .click()
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('link', { name: 'Download ZIP' }).click()
  const zip = await JSZip.loadAsync(await bytes(await downloadEvent))
  expect(Object.keys(zip.files)).toEqual(['1-one.webp', '2-two.webp'])
  expect(
    (await zip.file('1-one.webp')!.async('uint8array')).length,
  ).toBeGreaterThan(10)
  await page
    .getByTestId('image-upload')
    .setInputFiles({ name: 'crop.png', mimeType: 'image/png', buffer: png })
  await page.getByLabel('Crop width', { exact: true }).fill('1')
  await page.getByLabel('Rotation', { exact: true }).first().selectOption('90')
  await expect(page.getByTestId('image-width')).toHaveValue('2')
  await expect(page.getByTestId('image-height')).toHaveValue('1')
  await page.getByTestId('image-format').selectOption('image/png')
  await page.getByTestId('image-compress').click()
  await expect(page.getByTestId('image-download')).toBeVisible()
  const croppedDownload = page.waitForEvent('download')
  await page.getByTestId('image-download').click()
  const cropped = await bytes(await croppedDownload)
  const dimensions = await page.evaluate(async (base64) => {
    const buffer = Uint8Array.from(atob(base64), (character) =>
      character.charCodeAt(0),
    )
    const bitmap = await createImageBitmap(
      new Blob([buffer], { type: 'image/png' }),
    )
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext('2d')!
    context.drawImage(bitmap, 0, 0)
    const pixels = Array.from(
      context.getImageData(0, 0, bitmap.width, bitmap.height).data,
    )
    const result = { width: bitmap.width, height: bitmap.height, pixels }
    bitmap.close()
    return result
  }, cropped.toString('base64'))
  expect(dimensions).toEqual({
    width: 2,
    height: 1,
    pixels: [255, 0, 0, 255, 255, 0, 0, 255],
  })
})

test('expansion: AliDNS lookup and TLS report with deterministic responses', async ({
  page,
}) => {
  await page.route('**/api/dns', async (route) => {
    const request = route.request().postDataJSON()
    await route.fulfill({
      json: {
        resolver: request.resolver,
        status: 0,
        answers: [
          { name: 'example.com', type: 1, TTL: 300, data: '93.184.216.34' },
        ],
      },
    })
  })
  await page.goto('/tools/dns-lookup')
  await page.getByTestId('dns-name').fill('example.com')
  const resolver = page.getByRole('combobox', { name: 'DNS resolver', exact: true })
  await expect(resolver).toBeDisabled()
  await expect(resolver.locator('option')).toHaveCount(1)
  await expect(resolver).toHaveValue('alidns')
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(output(page)).toHaveValue(/alidns/)
  await expect(output(page)).toHaveValue(/93\.184\.216\.34/)
  await page.route('**/api/tls', (route) =>
    route.fulfill({
      json: {
        host: 'example.com',
        version: 'TLS 1.3',
        cipher: 'TLS_AES_128_GCM_SHA256',
        hostnameValid: true,
        chainValid: true,
        validNow: true,
        daysRemaining: 30,
        certificates: [],
        checkedAt: '2026-11-26T00:00:00Z',
      },
    }),
  )
  await page.goto('/tools/tls-checker')
  await page.getByTestId('tls-host').fill('example.com')
  await page.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(page.getByText('30', { exact: true })).toBeVisible()
  await expect(output(page)).toHaveValue(/TLS 1.3/)
})

test('expansion: WebSocket echo, SSE events and disconnect', async ({
  page,
}) => {
  await page.routeWebSocket('wss://echo.example.com', (socket) =>
    socket.onMessage((message) => socket.send(`echo ${message}`)),
  )
  await page.goto('/tools/stream-debugger')
  await page.getByLabel('URL', { exact: true }).fill('wss://echo.example.com')
  await page.getByRole('button', { name: 'Connect', exact: true }).click()
  await expect(page.getByText('Connected', { exact: true })).toBeVisible()
  await page.locator('main textarea').first().fill('hello')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(output(page)).toHaveValue(/echo hello/)
  await page.getByRole('button', { name: 'Disconnect', exact: true }).click()
  await page.getByLabel('Protocol', { exact: true }).selectOption('sse')
  await page
    .getByLabel('URL', { exact: true })
    .fill('https://example.com/events')
  await page.route('**/api/stream', (route) =>
    route.fulfill({
      contentType: 'text/event-stream',
      body: 'id: 1\nevent: update\ndata: hello\ndata: world\n\ndata: last event\r\r',
    }),
  )
  await page.getByRole('button', { name: 'Connect', exact: true }).click()
  await expect(output(page)).toHaveValue(/hello\\nworld/)
  await expect(output(page)).toHaveValue(/last event/)
  await expect(page.getByText('Disconnected', { exact: true })).toBeVisible()
})

test('expansion: cron generation, JSON repair and model language controls', async ({
  page,
}) => {
  await page.goto('/tools/cron-expression-parser')
  await page.getByLabel('Schedule', { exact: true }).selectOption('weekly')
  await page.getByLabel('Weekday', { exact: true }).selectOption('1')
  await page
    .getByLabel('Time zone', { exact: true })
    .first()
    .fill('Asia/Shanghai')
  await page.getByRole('button', { name: 'Apply expression' }).click()
  await expect(page.locator('#cron-expression')).toHaveValue('0 9 * * 1')
  await expect(page.locator('#cron-zone')).toHaveValue('Asia/Shanghai')
  await page.goto('/tools/json-formatter')
  await page.locator('main textarea').first().fill("{name:'Ada',}")
  await page.getByTestId('json-repair').click()
  await expect(page.locator('main textarea').nth(1)).toHaveValue(
    '{\n  "name": "Ada"\n}',
  )
  await page.goto('/tools/json-to-types')
  await page.getByTestId('types-input').fill('{"name":"Ada"}')
  for (const [language, snippet] of [
    ['java', '@JsonProperty'],
    ['python', 'TypedDict'],
    ['csharp', 'JsonPropertyName'],
    ['schema', 'draft-07'],
  ]) {
    await page.getByTestId('types-language').selectOption(language)
    await expect(output(page)).toHaveValue(new RegExp(snippet))
  }
  await page.keyboard.press('Control+k')
  await page.getByRole('dialog').getByRole('textbox').fill('证书到期')
  await page.getByRole('dialog').getByRole('link').click()
  await expect(page).toHaveURL(/tools\/tls-checker/)
})

test('expansion: HTTP auth, forms, multipart and exported cURL', async ({
  page,
}) => {
  await page.goto('/tools/curl-converter')
  await page.getByTestId('curl-url').fill('https://example.com/upload')
  await page.getByTestId('curl-method').selectOption('POST')
  await page
    .getByLabel('Authentication', { exact: true })
    .selectOption('bearer')
  await page.getByLabel('Token', { exact: true }).fill('test-token')
  await page.getByTestId('curl-body-mode').selectOption('multipart')
  await page.getByRole('button', { name: 'Add field', exact: true }).click()
  await page.getByLabel('Field name', { exact: true }).fill('name')
  await page.getByLabel('Field value', { exact: true }).fill('Ada')
  await page
    .locator('main input[type=file]')
    .setInputFiles({
      name: 'abc.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('abc'),
    })
  await expect(page.getByTestId('curl-output')).toHaveValue(
    /--form-string 'name=Ada'/,
  )
  await expect(page.getByTestId('curl-output')).toHaveValue(/Bearer test-token/)
  let posted = ''
  await page.route('**/api/proxy', (route) => {
    posted = route.request().postData() ?? ''
    return route.fulfill({
      json: { status: 200, statusText: 'OK', headers: {}, body: 'uploaded' },
    })
  })
  await page.getByTestId('curl-send').click()
  await expect(page.getByTestId('curl-response')).toHaveValue(/uploaded/)
  expect(posted).toContain('abc.txt')
  expect(posted).toContain('abc')
  expect(posted).toContain('test-token')
})
