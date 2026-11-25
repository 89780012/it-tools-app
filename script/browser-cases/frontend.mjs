import assert from 'node:assert/strict'

// Generated 2×2 RGBA PNG: red left column, fully transparent right column.
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEUlEQVR4nGP4z8DwnwEEYAwAK+YD/WmG8G4AAAAASUVORK5CYII=',
  'base64',
)
async function downloadedBytes(download) {
  const stream = await download.createReadStream()
  assert.ok(stream)
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  return Buffer.concat(chunks)
}
async function pixels(page, bytes, mime) {
  return page.evaluate(
    async ({ base64, mime }) => {
      const binary = atob(base64),
        bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
      const bitmap = await createImageBitmap(new Blob([bytes], { type: mime }))
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const context = canvas.getContext('2d')
      context.drawImage(bitmap, 0, 0)
      const result = {
        width: bitmap.width,
        height: bitmap.height,
        pixels: [
          ...context.getImageData(0, 0, bitmap.width, bitmap.height).data,
        ],
      }
      bitmap.close()
      return result
    },
    { base64: bytes.toString('base64'), mime },
  )
}
/** @param {import('@playwright/test').Page} page */
export async function run(page, check) {
  await check(
    'Markdown live GFM, sanitized HTML export and editable table',
    async () => {
      await page.goto('/tools/markdown-preview')
      await page
        .getByTestId('markdown-input')
        .fill(
          '# Hello\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n```js\nconst x = 1\n```\n\n<script>window.__frontendXss=1</script><img src=x onerror="window.__frontendXss=2"><a href="javascript:alert(1)">bad</a>',
        )
      await page.getByTestId('markdown-preview').locator('table').waitFor()
      assert.equal(
        await page
          .getByTestId('markdown-preview')
          .locator('script,img,[href^="javascript:"]')
          .count(),
        0,
      )
      assert.equal(await page.evaluate(() => window.__frontendXss), undefined)
      const [htmlDownload] = await Promise.all([
        page.waitForEvent('download'),
        page.getByTestId('markdown-download-html').click(),
      ])
      assert.equal(htmlDownload.suggestedFilename(), 'document.html')
      const html = (await downloadedBytes(htmlDownload)).toString('utf8')
      assert.match(html, /<table>/)
      assert.match(html, /<pre><code>/)
      assert.doesNotMatch(html, /<script|onerror|javascript:/i)
      await page.getByTestId('markdown-clear').click()
      await page.getByTestId('markdown-rows').fill('3')
      await page.getByTestId('markdown-cell-0-0').fill('A|B')
      await page.getByTestId('markdown-cell-1-0').fill('Value')
      await page.getByTestId('markdown-insert-table').click()
      assert.match(
        await page.getByTestId('markdown-input').inputValue(),
        /A\\\|B/,
      )
      const [markdownDownload] = await Promise.all([
        page.waitForEvent('download'),
        page.getByTestId('markdown-download').click(),
      ])
      assert.match(
        (await downloadedBytes(markdownDownload)).toString(),
        /Value/,
      )
    },
  )
  await check(
    'CSS formats strings and calc, then rejects a syntax error',
    async () => {
      await page.goto('/tools/css-formatter')
      await page
        .getByTestId('css-input')
        .fill('a{content:"a  b";width:calc(100% - 2px)}')
      await page.getByTestId('css-indent').selectOption('4')
      await page.getByTestId('css-format').click()
      await page.waitForFunction(() =>
        document
          .querySelector('[data-testid="tool-output"]')
          ?.value.includes('    content:'),
      )
      assert.match(await page.getByTestId('tool-output').inputValue(), /"a  b"/)
      assert.match(
        await page.getByTestId('tool-output').inputValue(),
        /calc\(100% - 2px\)/,
      )
      await page.getByTestId('css-input').fill('a { color: red;')
      await page.getByTestId('css-format').click()
      await page.locator('[data-tool="css-formatter"] [role="alert"]').waitFor()
      assert.equal(await page.getByTestId('tool-output').inputValue(), '')
    },
  )
  await check(
    'Contrast uses correct ratios, synchronized colors and invalid input handling',
    async () => {
      await page.goto('/tools/color-contrast-checker')
      assert.equal(
        await page.getByTestId('contrast-ratio').textContent(),
        '21.00:1',
      )
      await page.getByTestId('contrast-foreground').fill('#777')
      assert.equal(
        await page.getByTestId('contrast-foreground-picker').inputValue(),
        '#777777',
      )
      assert.equal(
        await page.getByTestId('contrast-ratio').textContent(),
        '4.48:1',
      )
      assert.match(
        await page.getByTestId('contrast-aaNormal').textContent(),
        /Fail/,
      )
      await page.getByTestId('contrast-swap').click()
      assert.equal(
        await page.getByTestId('contrast-background').inputValue(),
        '#777',
      )
      await page.getByTestId('contrast-background').fill('invalid')
      await page
        .locator('[data-tool="color-contrast-checker"] [role="alert"]')
        .waitFor()
      assert.equal(await page.getByTestId('contrast-ratio').count(), 0)
    },
  )
  await check(
    'Image upload, PNG pixel preservation, resize, JPEG background and downloads',
    async () => {
      await page.goto('/tools/image-compressor')
      await page
        .getByTestId('image-upload')
        .setInputFiles({
          name: 'pixels.png',
          mimeType: 'image/png',
          buffer: png,
        })
      await page.waitForFunction(
        () =>
          document.querySelector('[data-testid="image-width"]')?.value === '2',
      )
      await page.getByTestId('image-format').selectOption('image/png')
      await page.getByTestId('image-compress').click()
      await page.getByTestId('image-download').waitFor()
      const [pngDownload] = await Promise.all([
        page.waitForEvent('download'),
        page.getByTestId('image-download').click(),
      ])
      assert.equal(pngDownload.suggestedFilename(), 'pixels-compressed.png')
      const pngBytes = await downloadedBytes(pngDownload)
      assert.deepEqual(
        [...pngBytes.subarray(0, 8)],
        [137, 80, 78, 71, 13, 10, 26, 10],
      )
      const output = await pixels(page, pngBytes, 'image/png')
      assert.equal(output.width, 2)
      assert.equal(output.height, 2)
      assert.deepEqual(output.pixels.slice(0, 4), [255, 0, 0, 255])
      assert.equal(output.pixels[7], 0)
      await page.getByTestId('image-width').fill('8')
      assert.equal(await page.getByTestId('image-height').inputValue(), '8')
      await page.getByTestId('image-format').selectOption('image/jpeg')
      await page.getByTestId('image-background').fill('#00ff00')
      await page.getByTestId('image-quality').focus()
      await page.getByTestId('image-quality').press('End')
      await page.getByTestId('image-compress').click()
      await page.getByTestId('image-download').waitFor()
      const [jpegDownload] = await Promise.all([
        page.waitForEvent('download'),
        page.getByTestId('image-download').click(),
      ])
      assert.equal(jpegDownload.suggestedFilename(), 'pixels-compressed.jpg')
      const jpegBytes = await downloadedBytes(jpegDownload)
      assert.deepEqual([...jpegBytes.subarray(0, 3)], [255, 216, 255])
      const jpeg = await pixels(page, jpegBytes, 'image/jpeg')
      assert.equal(jpeg.width, 8)
      assert.equal(jpeg.height, 8)
      const right = jpeg.pixels.slice(7 * 4, 8 * 4)
      assert.ok(
        right[1] > 180 && right[0] < 80 && right[2] < 80,
        `Expected green JPEG background, got ${right}`,
      )
      assert.equal(right[3], 255)
      await page
        .getByTestId('image-upload')
        .setInputFiles({
          name: 'invalid.png',
          mimeType: 'image/png',
          buffer: Buffer.from('not an image'),
        })
      await page
        .locator('[data-tool="image-compressor"] [role="alert"]')
        .waitFor()
      assert.equal(await page.getByTestId('image-result').count(), 0)
    },
  )
}
