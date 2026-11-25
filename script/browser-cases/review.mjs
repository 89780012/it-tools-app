import assert from 'node:assert/strict'

export async function run(page, check) {
  await check(
    'review/schema: async schemas are rejected and backtracking times out with recovery',
    async () => {
      await page.goto('/tools/json-schema-validator')
      await page
        .getByTestId('schema-input')
        .fill('{"$async":true,"type":"number"}')
      await page.getByTestId('tool-input').fill('"abc"')
      await page.getByTestId('tool-run').click()
      await page.getByRole('alert').waitFor()
      assert.equal(await page.getByTestId('tool-output').inputValue(), '')
      await page
        .getByTestId('schema-input')
        .fill('{"type":"string","pattern":"^(a+)+$"}')
      await page
        .getByTestId('tool-input')
        .fill(JSON.stringify('a'.repeat(64) + '!'))
      await page.getByTestId('tool-run').click()
      assert.equal(await page.evaluate(() => 21 * 2), 42)
      await page.getByRole('alert').waitFor({ timeout: 6000 })
      assert.match(
        await page.getByRole('alert').innerText(),
        /exceeded 2 seconds/,
      )
      await page.getByTestId('tool-example').click()
      await page.getByTestId('tool-run').click()
      await page.waitForFunction(() =>
        document
          .querySelector('[data-testid="tool-output"]')
          ?.value.startsWith('Valid:'),
      )
    },
  )
  await check(
    'review/yaml: unsafe integers fail explicitly while quoted IDs are preserved',
    async () => {
      await page.goto('/tools/yaml-formatter')
      await page.getByTestId('tool-input').fill('id: 9007199254740993')
      await page.getByTestId('tool-run').click()
      await page.getByRole('alert').waitFor()
      assert.match(
        await page.getByRole('alert').innerText(),
        /safe integer range/,
      )
      assert.equal(await page.getByTestId('tool-output').inputValue(), '')
      await page.getByTestId('tool-input').fill('id: "9007199254740993"')
      await page.getByTestId('tool-run').click()
      await page.waitForFunction(() =>
        document
          .querySelector('[data-testid="tool-output"]')
          ?.value.includes('9007199254740993'),
      )
    },
  )
  await check(
    'review/jwt: malformed time claim objects remain visible without crashing',
    async () => {
      await page.goto('/tools/jwt-decoder')
      const encode = (value) =>
        Buffer.from(JSON.stringify(value)).toString('base64url')
      await page
        .getByTestId('jwt-token')
        .fill(
          `${encode({ alg: 'none' })}.${encode({ exp: { toString: null }, iat: [1, 2], nbf: null })}.`,
        )
      await page.getByTestId('jwt-decode').click()
      assert.match(
        await page.getByTestId('jwt-claims').innerText(),
        /\{"toString":null\}/,
      )
      assert.match(await page.getByTestId('jwt-claims').innerText(), /\[1,2\]/)
      assert.match(
        await page.getByTestId('jwt-verification').innerText(),
        /not verified/,
      )
    },
  )
  await check(
    'review/curl: default form header is generated and an edited request aborts old output',
    async () => {
      await page.goto('/tools/curl-converter')
      await page
        .getByTestId('curl-input')
        .fill("curl https://example.com/login -d 'name=Ada'")
      await page.getByTestId('curl-convert').click()
      assert.equal(
        await page.getByTestId('curl-headers-key-0').inputValue(),
        'Content-Type',
      )
      assert.equal(
        await page.getByTestId('curl-headers-value-0').inputValue(),
        'application/x-www-form-urlencoded',
      )
      assert.match(
        await page.getByTestId('curl-output').inputValue(),
        /application\/x-www-form-urlencoded/,
      )
      let release = () => {}
      let sent
      const received = new Promise((resolve) => {
        sent = resolve
      })
      await page.route('**/api/proxy', async (route) => {
        sent()
        await new Promise((resolve) => {
          release = resolve
        })
        await route
          .fulfill({
            status: 200,
            contentType: 'application/json',
            body: '{"status":200,"statusText":"OK","headers":{},"body":"stale-response-A"}',
          })
          .catch(() => {})
      })
      try {
        await page.getByTestId('curl-send').click()
        await received
        const aborted = page.waitForEvent('requestfailed', {
          predicate: (request) => request.url().endsWith('/api/proxy'),
          timeout: 5000,
        })
        await page.getByTestId('curl-url').fill('https://example.com/new')
        await aborted
        release()
        assert.equal(await page.getByTestId('curl-status').count(), 0)
        assert.equal(await page.getByTestId('curl-send').isEnabled(), true)
      } finally {
        release()
        await page.unroute('**/api/proxy')
      }
    },
  )
}
