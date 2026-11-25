import assert from 'node:assert/strict'
import { createHash, createHmac } from 'node:crypto'
import { deflateSync } from 'node:zlib'

// Original HEAD registry, excluding the three tools covered by enhanced.mjs.
// Every case navigates independently. All controls are scoped to the inner main;
// textarea/readonly selectors are intentional: most original pages have no label IDs.
export const coveredRoutes = [
  'json-to-csv',
  'json-to-yaml',
  'json-to-xml',
  'json-to-toml',
  'yaml-to-json',
  'yaml-to-toml',
  'toml-to-json',
  'toml-to-yaml',
  'csv-to-json',
  'xml-to-json',
  'base64-encoder-decoder',
  'url-encoder-decoder',
  'hex-encoder-decoder',
  'binary-encoder-decoder',
  'md5-hash',
  'sha1-hash',
  'sha256-hash',
  'aes-encrypt-decrypt',
  'rsa-encrypt-decrypt',
  'hmac-generator',
  'password-generator',
  'uuid-generator',
  'json-formatter',
  'json-diff',
  'json-visualizer',
  'json-key-fixer',
  'i18n-json-translator',
  'color-converter',
  'qr-code-generator',
  'svg-placeholder-generator',
  'icon-designer',
  'base64-file-converter',
  'image-to-dot-matrix',
  'docker-run-to-compose',
  'cron-expression-parser',
  'git-cheatsheet',
  'nginx-cheatsheet',
  'firewall-cheatsheet',
  'linux-log-helper',
  'docker-cheatsheet',
  'ip-lookup',
]

// Valid opaque 16×16 PNG, generated in Node without exercising application code.
function pngFixture() {
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data])
    let crc = 0xffffffff
    for (const byte of body) {
      crc ^= byte
      for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
    const size = Buffer.alloc(4),
      tail = Buffer.alloc(4)
    size.writeUInt32BE(data.length)
    tail.writeUInt32BE((crc ^ 0xffffffff) >>> 0)
    return Buffer.concat([size, body, tail])
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(16, 0)
  header.writeUInt32BE(16, 4)
  header[8] = 8
  header[9] = 6
  const pixels = Buffer.alloc(16 * (1 + 16 * 4))
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const i = y * 65 + 1 + x * 4
      pixels[i] = x < 8 ? 0 : 255
      pixels[i + 1] = 0
      pixels[i + 2] = 0
      pixels[i + 3] = 255
    }
  return {
    name: 'browser-fixture.png',
    mimeType: 'image/png',
    buffer: Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk('IHDR', header),
      chunk('IDAT', deflateSync(pixels)),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  }
}

export async function run(page, check) {
  const main = () => page.locator('main main')
  const input = () => main().locator('textarea:not([readonly])').first()
  const output = () => main().locator('textarea[readonly]').first()
  const click = (name) => main().getByRole('button', { name }).click()
  const open = async (id) => {
    await page.goto(`/tools/${id}`)
    await main().waitFor({ state: 'visible', timeout: 10000 })
  }
  const value = async (locator, expected) => {
    await locator.waitFor({ state: 'attached', timeout: 8000 })
    // Poll only rendered DOM output, never application internals.
    const element = await locator.elementHandle()
    try {
      await page.waitForFunction(
        ({ element, expected }) =>
          expected === null
            ? element.value.length > 0
            : element.value === expected,
        { element, expected: expected ?? null },
        { timeout: 8000 },
      )
    } catch (cause) {
      if (expected !== undefined)
        assert.equal(
          await locator.inputValue(),
          expected,
          'rendered output did not match',
        )
      throw cause
    }
    const actual = await locator.inputValue()
    if (expected !== undefined) assert.equal(actual, expected)
    else assert.ok(actual.length > 0, 'expected nonempty UI output')
    return actual
  }
  const text = async (locator, expected) => {
    await locator
      .filter({ hasText: expected })
      .first()
      .waitFor({ timeout: 8000 })
    assert.match(await locator.first().innerText(), expected)
  }
  const error = async () => {
    const visibleError = main()
      .locator(
        '.text-destructive, .text-red-500, .text-red-600, [role="alert"]',
      )
      .filter({ hasText: /.+/ })
      .first()
    await visibleError.waitFor({ state: 'visible', timeout: 8000 })
    assert.ok(
      (await visibleError.innerText()).trim(),
      'error message must be visible',
    )
  }
  // Radix select options are portalled outside main; only the trigger is in main.
  const select = async (trigger, option) => {
    await trigger.click()
    await page.getByRole('option', { name: option, exact: true }).click()
  }
  const download = async (button, filename) => {
    const [file] = await Promise.all([
      page.waitForEvent('download', { timeout: 8000 }),
      button.click(),
    ])
    assert.match(file.suggestedFilename(), filename)
    const stream = await file.createReadStream()
    const chunks = []
    for await (const chunk of stream) chunks.push(chunk)
    const bytes = Buffer.concat(chunks)
    assert.ok(bytes.length > 0, 'download must contain data')
    return bytes
  }
  const caseFor = async (id, mode, fn) =>
    check(`existing/${id}: ${mode}`, async () => {
      await open(id)
      await fn()
    })

  const data = { name: 'Ada', age: 37, active: true }
  const formats = [
    [
      'json-to-csv',
      '[{"name":"Ada","age":37,"active":true}]',
      /active,age,name\r?\ntrue,37,Ada/,
      '{',
    ],
    [
      'json-to-yaml',
      JSON.stringify(data),
      /name: Ada\nage: 37\nactive: true/,
      '{',
    ],
    [
      'json-to-xml',
      JSON.stringify(data),
      /<name>Ada<\/name>[\s\S]*<age>37<\/age>/,
      '{',
    ],
    [
      'json-to-toml',
      JSON.stringify(data),
      /name\s*=\s*"Ada"[\s\S]*age\s*=\s*37/,
      '{',
    ],
    ['yaml-to-json', 'name: Ada\nage: 37\nactive: true', data, 'name: ['],
    [
      'yaml-to-toml',
      'name: Ada\nage: 37',
      /name\s*=\s*"Ada"[\s\S]*age\s*=\s*37/,
      'name: [',
    ],
    ['toml-to-json', 'name = "Ada"\nage = 37\nactive = true', data, 'name = ['],
    [
      'toml-to-yaml',
      'name = "Ada"\nage = 37',
      /name: Ada\nage: 37/,
      'name = [',
    ],
    [
      'csv-to-json',
      'name,age,active\nAda,37,true',
      [data],
      'name,age\n"unterminated,37',
    ],
    [
      'xml-to-json',
      '<root><name>Ada</name><age>37</age><active>true</active></root>',
      { root: data },
      '<root><name>Ada</root>',
    ],
  ]
  for (const [id, source, expected, invalid] of formats) {
    await caseFor(id, 'convert real input locally', async () => {
      await input().fill(source)
      await click(/Convert/)
      const result = await value(output())
      if (expected instanceof RegExp) assert.match(result, expected)
      else assert.deepEqual(JSON.parse(result), expected)
    })
    await caseFor(id, 'reject malformed input', async () => {
      await input().fill(invalid)
      await click(/Convert/)
      await error()
      assert.equal(await output().inputValue(), '')
    })
  }

  const unicode = 'Hello 世界 🌍 café & + /'
  for (const id of [
    'base64-encoder-decoder',
    'url-encoder-decoder',
    'hex-encoder-decoder',
    'binary-encoder-decoder',
  ]) {
    await caseFor(id, 'Unicode encode/decode roundtrip locally', async () => {
      await input().fill(unicode)
      await click(/^Encode/)
      const encoded = await value(output())
      assert.notEqual(encoded, unicode)
      if (id.startsWith('base64'))
        assert.equal(encoded, Buffer.from(unicode).toString('base64'))
      if (id.startsWith('url'))
        assert.equal(encoded, encodeURIComponent(unicode))
      if (id.startsWith('hex'))
        assert.equal(
          encoded.replace(/\s/g, ''),
          Buffer.from(unicode).toString('hex'),
        )
      await input().fill(encoded)
      await click(/^Decode/)
      await value(output(), unicode)
    })
    await caseFor(id, 'malformed decode', async () => {
      await input().fill(id.startsWith('url') ? '%ZZ' : '%%%not-an-encoding')
      await click(/^Decode/)
      await error()
    })
  }
  await caseFor(
    'base64-encoder-decoder',
    'batch mode preserves lines',
    async () => {
      await main().locator('#batch-mode').click()
      await input().fill('Hello\n世界')
      await click(/^Encode/)
      await value(output(), 'SGVsbG8=\n5LiW55WM')
      await input().fill('SGVsbG8=\n5LiW55WM')
      await click(/^Decode/)
      await value(output(), 'Hello\n世界')
    },
  )
  for (const [id, algorithm] of [
    ['md5-hash', 'md5'],
    ['sha1-hash', 'sha1'],
    ['sha256-hash', 'sha256'],
  ]) {
    await caseFor(id, 'standard abc digest locally', async () => {
      await input().fill('abc')
      await click(/Generate/)
      await value(output(), createHash(algorithm).update('abc').digest('hex'))
    })
  }
  await caseFor(
    'aes-encrypt-decrypt',
    'AES CBC Unicode roundtrip locally',
    async () => {
      await input().fill(unicode)
      await main().locator('#key').fill('0123456789abcdef0123456789abcdef')
      await main().locator('#iv').fill('0123456789abcdef')
      await click(/^Encrypt/)
      const ciphertext = await value(output())
      assert.match(ciphertext, /^[A-Za-z0-9+/]+=*$/)
      assert.notEqual(ciphertext, unicode)
      await input().fill(ciphertext)
      await click(/^Decrypt/)
      await value(output(), unicode)
    },
  )
  await caseFor(
    'aes-encrypt-decrypt',
    'generate key and IV controls',
    async () => {
      await click(/Generate Key/)
      await click(/Generate IV/)
      assert.equal((await main().locator('#key').inputValue()).length, 32)
      assert.equal((await main().locator('#iv').inputValue()).length, 16)
    },
  )
  await caseFor(
    'rsa-encrypt-decrypt',
    'generate RSA keys and roundtrip locally',
    async () => {
      await click(/Generate Key/)
      // Public/private key textareas precede the message input in this original page.
      const fields = main().locator('textarea:not([readonly])')
      await page.waitForFunction(
        () =>
          document
            .querySelector('main main textarea')
            ?.value.includes('BEGIN PUBLIC KEY'),
        null,
        { timeout: 10000 },
      )
      assert.match(await fields.nth(0).inputValue(), /BEGIN PUBLIC KEY/)
      assert.match(await fields.nth(1).inputValue(), /BEGIN PRIVATE KEY/)
      await fields.nth(2).fill(unicode)
      await click(/^RSA Encrypt$/)
      const ciphertext = await value(output())
      assert.equal(Buffer.from(ciphertext, 'base64').length, 256)
      await fields.nth(2).fill(ciphertext)
      await click(/^RSA Decrypt$/)
      await value(output(), unicode)
    },
  )
  await caseFor(
    'hmac-generator',
    'known SHA256 and SHA1 digest locally',
    async () => {
      const message = 'The quick brown fox jumps over the lazy dog'
      await input().fill(message)
      await main().locator('#secretKey').fill('key')
      await click(/^Generate HMAC/)
      await value(
        output(),
        'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8',
      )
      await select(main().getByRole('combobox').first(), 'HMAC-SHA1')
      await click(/^Generate HMAC/)
      await value(
        output(),
        createHmac('sha1', 'key').update(message).digest('hex'),
      )
    },
  )

  await caseFor(
    'password-generator',
    'length and character controls locally',
    async () => {
      await main().locator('#length').fill('24')
      await click(/Generate Password/)
      assert.equal((await value(output())).length, 24)
      for (const id of ['uppercase', 'lowercase', 'symbols']) {
        const control = main().locator(`#${id}`)
        if ((await control.getAttribute('data-state')) === 'checked')
          await control.click()
      }
      if (
        (await main().locator('#numbers').getAttribute('data-state')) !==
        'checked'
      )
        await main().locator('#numbers').click()
      await click(/Generate Password/)
      assert.match(await value(output()), /^\d{24}$/)
    },
  )
  await caseFor(
    'uuid-generator',
    'count and output format locally',
    async () => {
      await main().locator('#count').fill('3')
      await click(/Generate/)
      const ids = (await value(output())).trim().split('\n')
      assert.equal(ids.length, 3)
      assert.equal(new Set(ids).size, 3)
      for (const id of ids)
        assert.match(
          id,
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        )
      await main().locator('#format').click()
      await page
        .getByRole('option')
        .filter({ hasText: /Uppercase/ })
        .first()
        .click()
      await click(/Generate/)
      assert.equal(
        await output().inputValue(),
        (await output().inputValue()).toUpperCase(),
      )
    },
  )
  await caseFor('json-formatter', 'format and minify locally', async () => {
    await input().fill('{"name":"Ada","nested":{"count":2}}')
    await click(/^Format/)
    const formatted = await value(output())
    assert.match(formatted, /\n\s+"name": "Ada"/)
    assert.deepEqual(JSON.parse(formatted), {
      name: 'Ada',
      nested: { count: 2 },
    })
    await click(/Minify/)
    await value(output(), '{"name":"Ada","nested":{"count":2}}')
  })
  await caseFor('json-formatter', 'invalid JSON', async () => {
    await input().fill('{')
    await click(/^Format/)
    await error()
  })
  await caseFor(
    'json-diff',
    'compare changed values and switch display locally',
    async () => {
      const fields = main().locator('textarea')
      await fields.nth(0).fill('{"name":"before"}')
      await fields.nth(1).fill('{"name":"after"}')
      await click(/Compare/)
      await text(main().locator('table').first(), /before/)
      assert.match(await main().locator('table').first().innerText(), /after/)
      await main().getByRole('switch').first().click()
      assert.match(
        await main().locator('table').first().innerText(),
        /before[\s\S]*after/,
      )
    },
  )
  await caseFor('json-visualizer', 'tree and raw views locally', async () => {
    await input().fill('{"person":{"name":"Ada"},"enabled":true}')
    await click(/Parse|Visualize/)
    await text(main(), /person/)
    await click(/Raw/)
    assert.deepEqual(
      JSON.parse(await main().locator('pre').first().innerText()),
      { person: { name: 'Ada' }, enabled: true },
    )
    await click(/Tree/)
    assert.match(await main().innerText(), /person/)
  })

  // REMOTE FIXTURES: these assert UI serialization/rendering only. No live AI,
  // language detection, geolocation service, API key, or translation quality is tested.
  await caseFor(
    'i18n-json-translator',
    'remote translation response fixture',
    async () => {
      const requests = []
      const handler = async (route) => {
        const body = route.request().postDataJSON()
        requests.push(body)
        assert.ok(body.entries.length > 0)
        await route.fulfill({
          json: {
            translations: Object.fromEntries(
              body.entries.map((entry) => [
                entry.key,
                `Fixture ${entry.value}`,
              ]),
            ),
          },
        })
      }
      await page.route('**/api/i18n-translate', handler)
      try {
        await input().fill(
          '{"hello":"Hello world","count":3,"nested":{"label":"Welcome friend"}}',
        )
        await click(/^Start translation$/i)
        const translated = JSON.parse(await value(output()))
        assert.equal(translated.hello, 'Fixture Hello world')
        assert.equal(translated.nested.label, 'Fixture Welcome friend')
        assert.equal(translated.count, 3)
        assert.ok(requests.length > 0)
        assert.ok(
          requests.every((body) => typeof body.targetLanguage === 'string'),
        )
      } finally {
        await page.unroute('**/api/i18n-translate', handler)
      }
    },
  )
  await caseFor(
    'json-key-fixer',
    'upload, source selection and local fix with remote detection fixture',
    async () => {
      let detected = 0
      const handler = async (route) => {
        detected++
        await route.fulfill({
          json: { language: 'en', languageName: 'English', confidence: 0.99 },
        })
      }
      await page.route('**/api/detect-language', handler)
      try {
        await main()
          .locator('input[type="file"]')
          .setInputFiles([
            {
              name: 'source-en.json',
              mimeType: 'application/json',
              buffer: Buffer.from('{"first":"Hello","second":"World"}'),
            },
            {
              name: 'target-en.json',
              mimeType: 'application/json',
              buffer: Buffer.from(
                '{"second":"Monde","first":"Bonjour","extra":"Remove me"}',
              ),
            },
          ])
        await main().getByRole('radio').first().waitFor({ timeout: 10000 })
        await main().getByRole('radio').first().click()
        // No missing values: order/removal are local, detection alone is mocked.
        await main().locator('#fill-missing').click()
        await main().locator('#remove-extra').click()
        await click(/开始修复|Start Fix/)
        await main()
          .getByRole('button', { name: /View Details|查看详情/ })
          .first()
          .waitFor({ timeout: 10000 })
        const bytes = await download(
          main().getByRole('button', { name: /下载ZIP|Download ZIP/ }),
          /\.zip$/i,
        )
        const { default: JSZip } = await import('jszip')
        const zip = await JSZip.loadAsync(bytes)
        const target = Object.values(zip.files).find((file) =>
          /target-en\.json$/.test(file.name),
        )
        assert.ok(target, 'fixed target must be in ZIP')
        const fixed = JSON.parse(await target.async('string'))
        assert.deepEqual(fixed, { first: 'Bonjour', second: 'Monde' })
        assert.deepEqual(Object.keys(fixed), ['first', 'second'])
        assert.equal(detected, 2)
      } finally {
        await page.unroute('**/api/detect-language', handler)
      }
    },
  )

  await caseFor(
    'color-converter',
    'HEX RGB HSL conversion locally',
    async () => {
      const field = main().locator('input:not([readonly]):not([type="color"])')
      await field.fill('#ff0000')
      const fields = main().locator('input[readonly]')
      await value(fields.nth(0), '#FF0000')
      await value(fields.nth(1), 'rgb(255, 0, 0)')
      await value(fields.nth(2), 'hsl(0, 100%, 50%)')
      await field.fill('rgb(0, 128, 255)')
      await value(fields.nth(0), '#0080FF')
    },
  )
  await caseFor(
    'qr-code-generator',
    'SVG and PNG generation/download locally',
    async () => {
      await input().fill('https://example.com/browser-regression?name=Ada')
      await main().locator('svg.qr-code-svg').waitFor()
      const svg = await download(
        main().getByRole('button', { name: /Download SVG/ }),
        /\.svg$/,
      )
      assert.match(svg.toString(), /<svg[\s\S]*<path/)
      await select(main().getByRole('combobox').last(), 'PNG')
      await main().locator('canvas.qr-code-canvas').waitFor()
      const png = await download(
        main().getByRole('button', { name: /Download PNG/ }),
        /\.png$/,
      )
      assert.equal(png.subarray(1, 4).toString(), 'PNG')
    },
  )
  await caseFor(
    'svg-placeholder-generator',
    'dimensions and text locally',
    async () => {
      await main().locator('#width').fill('320')
      await main().locator('#height').fill('180')
      await main().locator('#text').fill('Browser fixture')
      await text(main().locator('pre'), /Browser fixture/)
      const svg = await main().locator('pre').innerText()
      assert.match(svg, /width="320"/)
      assert.match(svg, /height="180"/)
      await select(main().getByRole('combobox'), 'Gradient Background')
      await text(main().locator('pre'), /linearGradient/)
    },
  )
  await caseFor('icon-designer', 'text icon SVG export locally', async () => {
    await main().locator('#text').fill('QA')
    await text(main().locator('pre'), />QA<\/text>/)
    const bytes = await download(
      main()
        .getByRole('button', { name: /^SVG \(\d+px\)$/ })
        .first(),
      /\.svg$/,
    )
    assert.match(bytes.toString(), />QA<\/text>/)
  })
  await caseFor(
    'base64-file-converter',
    'PNG upload and base64-to-image roundtrip locally',
    async () => {
      const fixture = pngFixture()
      await main().locator('input[type="file"]').setInputFiles(fixture)
      const encoded = await value(output())
      assert.equal(
        encoded.replace(/^data:image\/png;base64,/, ''),
        fixture.buffer.toString('base64'),
      )
      await main().getByRole('combobox').click()
      await page
        .getByRole('option')
        .filter({ hasText: /Base64 to Image/i })
        .click()
      await input().fill(
        `data:image/png;base64,${fixture.buffer.toString('base64')}`,
      )
      await click(/^Convert to Image$/)
      const image = main().locator('img').last()
      await image.waitFor()
      await page.waitForFunction(
        (img) => img.complete && img.naturalWidth === 16,
        await image.elementHandle(),
        { timeout: 8000 },
      )
      assert.equal(await image.evaluate((img) => img.naturalHeight), 16)
    },
  )
  for (const mode of ['PNG upload', 'text']) {
    await caseFor(
      'image-to-dot-matrix',
      `${mode} dot matrix and SVG export locally`,
      async () => {
        if (mode === 'PNG upload')
          await main().locator('input[type="file"]').setInputFiles(pngFixture())
        else {
          await click(/^Text/)
          await input().fill('QA')
        }
        await click(/Generate/)
        const bytes = await download(
          main().getByRole('button', { name: /Download SVG/ }),
          /\.svg$/,
        )
        assert.match(bytes.toString(), /<svg/)
        assert.match(bytes.toString(), /<(circle|rect|path|polygon)\b/)
        assert.ok(
          await main()
            .locator('canvas')
            .evaluate((canvas) => canvas.width > 0 && canvas.height > 0),
        )
      },
    )
  }

  await caseFor(
    'docker-run-to-compose',
    'ports environment volumes locally',
    async () => {
      await input().fill(
        'docker run -d --name web -p 8080:80 -e NODE_ENV=production -v /data:/app/data nginx:alpine',
      )
      await click(/Convert/)
      const result = await value(output())
      assert.match(result, /services:/)
      assert.match(result, /image:.*nginx:alpine/)
      assert.match(result, /8080:80/)
      assert.match(result, /NODE_ENV.*production/)
      assert.match(result, /\/data:\/app\/data/)
    },
  )
  await caseFor(
    'cron-expression-parser',
    'parse schedule and invalid syntax locally',
    async () => {
      await main().locator('#cron-expression').fill('*/15 * * * *')
      const rows = main().locator('table tbody tr')
      await rows.first().waitFor()
      assert.match(await rows.first().innerText(), /0.*15.*30.*45/)
      await main().locator('#preview-count').fill('3')
      assert.equal(await rows.count(), 5)
      await main().locator('#cron-expression').fill('99 * * * *')
      await error()
    },
  )
  for (const [id, query, command] of [
    ['git-cheatsheet', 'git status', /git status/],
    ['nginx-cheatsheet', 'proxy_pass', /proxy_pass/],
    ['firewall-cheatsheet', 'iptables', /iptables/],
    ['linux-log-helper', 'grep', /grep/],
    ['docker-cheatsheet', 'docker ps', /docker ps/],
  ]) {
    await caseFor(id, 'search filters matching commands locally', async () => {
      const search = main().getByRole('textbox').first()
      await search.fill(query)
      const commands = main().locator('pre, code')
      await commands.first().waitFor()
      assert.match(
        await commands.allTextContents().then((parts) => parts.join('\n')),
        command,
      )
      await search.fill('no-such-command-browser-763091')
      assert.equal(await commands.count(), 0)
      assert.match(
        await main().innerText(),
        /No .*found|No results|no matching/i,
      )
    })
  }
  // Third-party HTTP fixture installed BEFORE navigation, including auto-detection.
  for (const failing of [false, true]) {
    await check(
      `existing/ip-lookup: remote HTTP ${failing ? 'error' : 'success'} fixture`,
      async () => {
        let queries = 0
        const handler = async (route) => {
          const url = new URL(route.request().url())
          const ip = url.pathname.split('/')[2] || '203.0.113.10'
          queries++
          await route.fulfill({
            json:
              failing && ip === '1.1.1.1'
                ? { status: 'fail', message: 'Fixture lookup denied' }
                : {
                    status: 'success',
                    query: ip,
                    country: 'Fixture Country',
                    countryCode: 'US',
                    region: 'CA',
                    regionName: 'Fixture Region',
                    city: 'Fixture City',
                    zip: '94000',
                    lat: 37.4,
                    lon: -122.1,
                    timezone: 'America/Los_Angeles',
                    isp: 'Fixture ISP',
                    org: 'Fixture Org',
                    as: 'AS64500 Fixture',
                    proxy: false,
                    hosting: true,
                    mobile: false,
                  },
          })
        }
        await page.route('http://ip-api.com/json**', handler)
        try {
          await open('ip-lookup')
          await main()
            .locator('#ip-input')
            .fill(failing ? '1.1.1.1' : '8.8.8.8')
          await main().locator('#ip-input').press('Enter')
          if (failing) await text(main(), /Fixture lookup denied/)
          else {
            await text(main(), /Fixture City/)
            assert.match(await main().innerText(), /Fixture ISP/)
            const exported = JSON.parse(
              (
                await download(
                  main().getByRole('button', { name: /Export/ }),
                  /\.json$/,
                )
              ).toString(),
            )
            assert.equal(exported.ip_address, '8.8.8.8')
            assert.equal(exported.location.city, 'Fixture City')
          }
          assert.ok(queries > 0, 'must exercise HTTP fixture')
        } finally {
          await page.unroute('http://ip-api.com/json**', handler)
        }
      },
    )
  }
}
