import assert from 'node:assert/strict'

// Uses the caller's existing Playwright page and server. No browser launch or external HTTP requests.
export async function run(page, check) {
  const origin = /^https?:/.test(page.url())
    ? new URL(page.url()).origin
    : process.env.BROWSER_BASE_URL || 'http://127.0.0.1:5173'
  const go = (path) => page.goto(new URL(path, origin).href)
  const field = (id) => page.getByTestId(id)
  await check(
    'time: explicit seconds/milliseconds, zones, ISO and difference',
    async () => {
      await go('/tools/time-converter')
      await field('time-zone').fill('UTC')
      await field('time-unit').selectOption('seconds')
      await field('time-timestamp').fill('1700000000')
      assert.match(
        await field('time-iso').innerText(),
        /2023-11-14T22:13:20\.000Z/,
      )
      await field('time-unit').selectOption('milliseconds')
      assert.match(
        await field('time-iso').innerText(),
        /1970-01-20T16:13:20\.000Z/,
      )
      await field('time-zone').fill('Asia/Shanghai')
      await field('time-date').fill('2025-01-01 08:00:00')
      assert.equal(
        (await field('time-result').innerText()).trim(),
        '1735689600000',
      )
      await field('time-end').fill('2025-01-02T08:00:00+08:00')
      assert.match(await field('time-difference').innerText(), /86400000/)
      await field('time-date').fill('2025-01-01T00:00:00.123Z')
      assert.equal(
        (await field('time-result').innerText()).trim(),
        '1735689600123',
      )
      await field('time-zone').fill('local')
      assert.equal(
        (await field('time-result').innerText()).trim(),
        '1735689600123',
      )
      await field('time-zone').fill('Invalid/Zone')
      assert.equal(await field('time-result').count(), 0)
      assert.equal(await field('time-iso').count(), 0)
    },
  )
  await check(
    'time: strict dates, DST gaps and repeated time policy',
    async () => {
      await go('/tools/time-converter')
      await field('time-zone').fill('America/New_York')
      await field('time-date').fill('2024-11-03 01:30:00')
      assert.equal(
        (await field('time-result').innerText()).trim(),
        String(Date.parse('2024-11-03T05:30:00Z')),
      )
      await field('time-date').fill('2024-03-10 02:30:00')
      assert.equal(await field('time-result').count(), 0)
      await field('time-date').fill('2025-02-29 00:00:00')
      assert.equal(await field('time-result').count(), 0)
    },
  )
  await check(
    'curl: quoted parsing, editable rows, five code languages and JSON errors',
    async () => {
      await go('/tools/curl-converter')
      await field('curl-input').fill(
        `curl 'https://example.com/items?q=old' -X POST -H "X-Name: O'Reilly" --data-raw '{"text":"quoted value"}'`,
      )
      await field('curl-convert').click()
      assert.equal(await field('curl-headers-value-0').inputValue(), "O'Reilly")
      await field('curl-url').fill('https://example.com/edited')
      await field('curl-method').selectOption('PATCH')
      await field('curl-query-value-0').fill('two words')
      await field('curl-add-query').click()
      await field('curl-query-key-1').fill('page')
      await field('curl-query-value-1').fill('2')
      await field('curl-add-headers').click()
      await field('curl-headers-key-1').fill('Content-Type')
      await field('curl-headers-value-1').fill('application/json')
      await field('curl-body-mode').selectOption('json')
      await field('curl-body').fill('{"n":0,"quoted":"a\\\"b"}')
      for (const [language, marker] of [
        ['javascript', 'fetch('],
        ['python', 'requests.request('],
        ['nodejs', 'axios('],
        ['php', 'curl_setopt_array('],
        ['go', 'http.NewRequest('],
      ]) {
        await field('curl-language').selectOption(language)
        const output = await field('curl-output').inputValue()
        assert.ok(output.includes(marker))
        assert.ok(output.includes('PATCH'))
        assert.ok(output.includes('q=two+words'))
      }
      await field('curl-body').fill('{bad json')
      assert.equal(await field('curl-output').inputValue(), '')
      assert.equal(await field('curl-send').isDisabled(), true)
      assert.equal(await page.getByRole('alert').count(), 1)
      await field('curl-input').fill('curl "unterminated')
      await field('curl-convert').click()
      assert.equal(await field('curl-output').inputValue(), '')
    },
  )
  await check(
    'curl: proxy fixture response status, headers, body and timing',
    async () => {
      await go('/tools/curl-converter')
      let sent
      await page.route('**/api/proxy', async (route) => {
        sent = route.request().postDataJSON()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 201,
            statusText: 'Created',
            headers: {
              'X-Local-Fixture': 'yes',
              'Content-Type': 'application/json',
            },
            body: '{"created":true}',
          }),
        })
      })
      try {
        await field('curl-url').fill('https://example.com/fixture')
        await field('curl-method').selectOption('POST')
        await field('curl-body').fill('fixture body')
        await field('curl-send').click()
        await field('curl-status').waitFor()
        assert.equal(sent.url, 'https://example.com/fixture')
        assert.equal(sent.method, 'POST')
        assert.equal(sent.data, 'fixture body')
        assert.match(await field('curl-status').innerText(), /201 Created/)
        assert.match(
          await field('curl-response-headers').innerText(),
          /X-Local-Fixture/,
        )
        assert.deepEqual(
          JSON.parse(await field('curl-response').inputValue()),
          { created: true },
        )
        assert.match(await field('curl-timing').innerText(), /\d+ ms/)
      } finally {
        await page.unroute('**/api/proxy')
      }
      await page.route('**/api/proxy', (route) =>
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: '{"error":"url host is not publicly reachable"}',
        }),
      )
      try {
        await field('curl-send').click()
        await page.getByRole('alert').waitFor()
        assert.match(
          await page.getByRole('alert').innerText(),
          /not publicly reachable/,
        )
        assert.equal(await field('curl-status').count(), 0)
      } finally {
        await page.unroute('**/api/proxy')
      }
    },
  )
  await check(
    'curl: explicit sanitized save survives refresh without credentials',
    async () => {
      await go('/tools/curl-converter')
      await page.evaluate(() =>
        localStorage.removeItem('toolkit-curl-safe-templates-v1'),
      )
      await page.reload()
      await field('curl-input').fill(
        `curl 'https://example.com/secret-path?token=secret-query' -H 'Authorization: secret-header' -H 'Cookie: secret-cookie' -d 'password=secret-body'`,
      )
      await field('curl-convert').click()
      assert.equal(
        await page.evaluate(() =>
          localStorage.getItem('toolkit-curl-safe-templates-v1'),
        ),
        null,
      )
      await field('curl-save').click()
      const saved = await page.evaluate(() =>
        localStorage.getItem('toolkit-curl-safe-templates-v1'),
      )
      assert.ok(saved)
      assert.ok(!saved.includes('secret'))
      assert.equal(JSON.parse(saved).length, 1)
      await page.reload()
      await field('curl-template-0').click()
      assert.equal(await field('curl-url').inputValue(), 'https://example.com/')
      assert.equal(await field('curl-body').inputValue(), '')
      assert.equal(await field('curl-headers-value-0').count(), 0)
    },
  )
  await check(
    'generator: repeatable seeds, Chinese data and exact constraints',
    async () => {
      await go('/tools/json-generator')
      await field('json-rows').fill('4')
      await field('json-seed').fill('browser-seed-a')
      await field('json-min-0').fill('-3')
      await field('json-max-0').fill('0')
      await field('json-data-locale').selectOption('zh')
      await field('json-add-field').click()
      await field('json-name-3').fill('text')
      await field('json-length-3').fill('7')
      await field('json-generate').click()
      const first = await field('json-output').inputValue()
      const data = JSON.parse(first)
      assert.equal(data.length, 4)
      for (const row of data) {
        assert.ok(row.id >= -3 && row.id <= 0)
        assert.match(row.name, /[\u4e00-\u9fff]/)
        assert.equal(row.text.length, 7)
      }
      await field('json-generate').click()
      assert.equal(await field('json-output').inputValue(), first)
      await field('json-seed').fill('browser-seed-b')
      await field('json-generate').click()
      assert.notEqual(await field('json-output').inputValue(), first)
      await field('json-boundary').check()
      await field('json-format').selectOption('object')
      await field('json-generate').click()
      const wrapped = JSON.parse(await field('json-output').inputValue())
      assert.equal(wrapped.count, 4)
      assert.deepEqual(
        wrapped.data.map((row) => row.id),
        [-3, 0, -3, 0],
      )
    },
  )
  await check(
    'generator: null endpoints and rejected limits clear output',
    async () => {
      await go('/tools/json-generator')
      await field('json-null').fill('1')
      await field('json-generate').click()
      assert.ok(
        JSON.parse(await field('json-output').inputValue()).every((row) =>
          Object.values(row).every((value) => value === null),
        ),
      )
      await field('json-null').fill('0')
      await field('json-generate').click()
      assert.ok(
        JSON.parse(await field('json-output').inputValue()).every((row) =>
          Object.values(row).every((value) => value !== null),
        ),
      )
      await field('json-null').fill('1.1')
      await field('json-generate').click()
      assert.equal(await field('json-output').inputValue(), '')
      await field('json-null').fill('0')
      await field('json-rows').fill('1001')
      await field('json-generate').click()
      assert.equal(await field('json-output').inputValue(), '')
      await field('json-rows').fill('2')
      await field('json-type-1').selectOption('string')
      await field('json-length-1').fill('0')
      await field('json-generate').click()
      const data = JSON.parse(await field('json-output').inputValue())
      assert.equal(data.length, 2)
      assert.equal(data[0].name, '')
    },
  )
}
