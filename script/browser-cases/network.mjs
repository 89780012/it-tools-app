import assert from 'node:assert/strict'

/** Called by the parent browser runner with an already-open Playwright page. */
export async function run(page, check) {
  const origin = /^https?:/.test(page.url())
    ? new URL(page.url()).origin
    : process.env.BASE_URL || 'http://127.0.0.1:5173'
  const go = async (id, locale = '') => {
    await page.goto(`${origin}${locale ? `/${locale}` : ''}/tools/${id}`)
    await page.locator(`[data-tool="${id}"]`).waitFor()
  }
  const fill = (id, value) => page.getByTestId(id).fill(value)
  const click = (id) => page.getByTestId(id).click()
  const output = () => page.getByTestId('tool-output').first().inputValue()
  const ready = () =>
    page.waitForFunction(
      () => !!document.querySelector('[data-testid="tool-output"]')?.value,
    )
  const error = async () => {
    await page.getByRole('alert').first().waitFor()
    assert.ok((await page.getByRole('alert').first().innerText()).trim())
    assert.equal(await output(), '')
  }

  await check(
    'network: JSON Schema validates and reports nested error paths',
    async () => {
      await go('json-schema-validator')
      await fill(
        'schema-input',
        '{"type":"object","properties":{"user":{"type":"object","properties":{"age":{"type":"integer","minimum":0}}}},"required":["user"]}',
      )
      await fill('tool-input', '{"user":{"age":2}}')
      await click('tool-run')
      await ready()
      assert.match(await output(), /^Valid:/)
      await fill('tool-input', '{"user":{"age":-1}}')
      await click('tool-run')
      await ready()
      assert.match(await output(), /Invalid:/)
      assert.match(await output(), /\/user\/age/)
    },
  )
  await check(
    'network: JSON Schema rejects invalid schemas and never fetches remote references',
    async () => {
      const remoteRequests = []
      const listener = (request) => {
        if (request.url().startsWith('https://example.com/schema.json'))
          remoteRequests.push(request.url())
      }
      page.on('request', listener)
      try {
        await fill('schema-input', '{"$ref":"https://example.com/schema.json"}')
        await click('tool-run')
        await error()
        assert.deepEqual(remoteRequests, [])
        await fill('schema-input', '{"type":"broken"}')
        await click('tool-run')
        await error()
        await click('tool-example')
        await click('tool-run')
        await ready()
        assert.match(await output(), /^Valid:/)
        await click('tool-clear')
        assert.equal(await page.getByTestId('schema-input').inputValue(), '')
      } finally {
        page.off('request', listener)
      }
    },
  )
  await check(
    'network: URL edits preserve duplicate keys, empty values and encoding',
    async () => {
      await go('url-parser')
      await fill(
        'tool-input',
        'https://example.com:8443/a%2Fb?q=one&q=two&empty=#old',
      )
      await click('tool-run')
      await ready()
      assert.equal(await page.getByTestId('param-value-1').inputValue(), 'two')
      await fill('url-protocol', 'http')
      await fill('url-host', 'example.org')
      await fill('url-port', '8080')
      await fill('url-path', '/new path')
      await fill('url-fragment', 'new')
      await fill('param-value-0', 'hello & 世界')
      await click('param-add')
      await fill('param-key-3', 'added')
      await click('url-rebuild')
      await ready()
      const url = new URL(await output())
      assert.equal(url.origin, 'http://example.org:8080')
      assert.equal(url.pathname, '/new%20path')
      assert.equal(url.hash, '#new')
      assert.deepEqual(url.searchParams.getAll('q'), ['hello & 世界', 'two'])
      assert.equal(url.searchParams.get('empty'), '')
      assert.equal(url.searchParams.get('added'), '')
      await click('param-remove-1')
      await click('url-rebuild')
      await ready()
      assert.deepEqual(new URL(await output()).searchParams.getAll('q'), [
        'hello & 世界',
      ])
    },
  )
  await check(
    'network: URL rejects malformed encoding and invalid ports',
    async () => {
      await fill('tool-input', 'https://example.com/%C0%AF')
      await click('tool-run')
      await error()
      await fill('url-port', '99999')
      await click('url-rebuild')
      await error()
    },
  )
  await check('network: YAML formats and switches to validation', async () => {
    await go('yaml-formatter')
    await fill('tool-input', 'items: [true, null, "001"]\nname: Alice')
    await click('tool-run')
    await ready()
    assert.match(await output(), /- true/)
    assert.match(await output(), /['"]001['"]/)
    await page.getByTestId('formatter-mode').selectOption('validate')
    await click('tool-run')
    await ready()
    assert.equal(await output(), 'Valid YAML.')
    await page.getByTestId('formatter-mode').selectOption('format')
    await click('tool-run')
    await ready()
    assert.match(await output(), /name: Alice/)
  })
  await check(
    'network: YAML rejects syntax errors and executable tags',
    async () => {
      for (const text of ['x: [1,', 'x: !!js/function "function(){}"']) {
        await fill('tool-input', text)
        await click('tool-run')
        await error()
      }
    },
  )
  await check(
    'network: XML preserves attributes, declaration, mixed text and whitespace in all modes',
    async () => {
      await go('xml-formatter')
      const source =
        '<?xml version="1.0"?><root id="1"><p>Hello <b>world</b>!</p><x>  keep \n space </x></root>'
      await fill('tool-input', source)
      await click('tool-run')
      await ready()
      assert.match(await output(), /<\?xml version="1.0"\?>/)
      assert.match(await output(), /<p>Hello <b>world<\/b>!<\/p>/)
      const text = await page.getByTestId('tool-output').evaluate((element) => {
        const doc = new DOMParser().parseFromString(
          element.value,
          'application/xml',
        )
        return {
          attr: doc.documentElement.getAttribute('id'),
          text: doc.querySelector('x')?.textContent,
          error: !!doc.querySelector('parsererror'),
        }
      })
      assert.deepEqual(text, {
        attr: '1',
        text: '  keep \n space ',
        error: false,
      })
      await page.getByTestId('formatter-mode').selectOption('minify')
      await click('tool-run')
      await ready()
      assert.equal(await output(), source)
      await page.getByTestId('formatter-mode').selectOption('validate')
      await click('tool-run')
      await ready()
      assert.equal(await output(), 'Valid XML.')
    },
  )
  await check(
    'network: XML rejects malformed markup and unsupported DTDs',
    async () => {
      for (const text of [
        '<root><x></root>',
        '<!DOCTYPE x [<!ENTITY a "b">]><x>&a;</x>',
      ]) {
        await fill('tool-input', text)
        await click('tool-run')
        await error()
      }
    },
  )
  await check(
    'network: subnet computes /0, /31, /32 and address membership',
    async () => {
      await go('subnet-calculator')
      await fill('tool-input', '10.0.0.1/31')
      await fill('subnet-member', '10.0.0.0')
      await click('tool-run')
      await ready()
      assert.match(await output(), /Usable addresses: 2/)
      assert.match(await output(), /Address belongs to subnet: Yes/)
      await fill('tool-input', '10.0.0.1/32')
      await click('tool-run')
      await ready()
      assert.match(await output(), /Usable addresses: 1/)
      assert.match(await output(), /Address belongs to subnet: No/)
      await fill('tool-input', '255.255.255.255/0')
      await click('tool-run')
      await ready()
      assert.match(await output(), /Total addresses: 4294967296/)
      assert.match(await output(), /Subnet mask: 0\.0\.0\.0/)
    },
  )
  await check(
    'network: subnet rejects invalid CIDR and membership addresses',
    async () => {
      await fill('tool-input', '10.0.0.256/24')
      await click('tool-run')
      await error()
      await fill('tool-input', '10.0.0.1/24')
      await fill('subnet-member', 'bad')
      await click('tool-run')
      await error()
    },
  )
  await check(
    'network: number bases preserve large signed integers and switch bases',
    async () => {
      await go('number-base-converter')
      await fill('tool-input', '9007199254740993')
      await click('tool-run')
      await ready()
      assert.match(await output(), /16: 20000000000001/)
      for (const [base, value] of [
        ['16', '-ff'],
        ['2', '-11111111'],
        ['8', '-377'],
      ]) {
        await page.getByTestId('number-base').selectOption(base)
        await fill('tool-input', value)
        await click('tool-run')
        await ready()
        assert.match(await output(), /10: -255/)
      }
    },
  )
  await check(
    'network: number bases reject partial digits and byte units remain exact',
    async () => {
      await fill('tool-input', '378')
      await click('tool-run')
      await error()
      await fill('bytes-input', '1')
      await page.getByTestId('bytes-from').selectOption('MiB')
      await page.getByTestId('bytes-to').selectOption('MB')
      await click('bytes-run')
      const byteOutput = page
        .getByTestId('bytes-result')
        .getByTestId('tool-output')
      await page.waitForFunction(
        () =>
          !!document.querySelector('[data-testid="bytes-result"] textarea')
            ?.value,
      )
      assert.equal(await byteOutput.inputValue(), '1.048576 MB')
      await page.getByTestId('bytes-from').selectOption('B')
      await page.getByTestId('bytes-to').selectOption('KiB')
      await click('bytes-run')
      await page.waitForFunction(
        () =>
          !!document.querySelector('[data-testid="bytes-result"] textarea')
            ?.value,
      )
      assert.equal(await byteOutput.inputValue(), '0.0009765625 KiB')
      await fill('bytes-input', '-1')
      await click('bytes-run')
      await page.getByRole('alert').last().waitFor()
      assert.equal(await byteOutput.inputValue(), '')
    },
  )
  await check(
    'network: certificate example parses identity, dates and SHA-256 fingerprint locally',
    async () => {
      await go('certificate-parser')
      await click('tool-example')
      assert.match(
        await page.getByTestId('tool-input').inputValue(),
        /^-----BEGIN CERTIFICATE-----/,
      )
      await click('tool-run')
      await ready()
      assert.match(await output(), /Subject: .*Entrust/)
      assert.match(await output(), /Issuer: .*Entrust/)
      assert.match(await output(), /Valid until \(UTC\): 2026-11-27/)
      assert.match(
        await output(),
        /SHA-256 fingerprint: (?:[0-9A-F]{2}:){31}[0-9A-F]{2}/,
      )
    },
  )
  await check(
    'network: certificate rejects malformed PEM and clears output',
    async () => {
      await fill(
        'tool-input',
        '-----BEGIN CERTIFICATE-----\nbm90LWRlcg==\n-----END CERTIFICATE-----',
      )
      await click('tool-run')
      await error()
      await click('tool-clear')
      assert.equal(await page.getByTestId('tool-input').inputValue(), '')
    },
  )
  for (const locale of [
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
    await check(
      `network: ${locale} renders translated controls and localized errors`,
      async () => {
        await go('subnet-calculator', locale)
        const heading = await page
          .locator('[data-tool="subnet-calculator"] h1')
          .innerText()
        assert.ok(heading.trim())
        assert.notEqual(heading, 'IPv4 Subnet Calculator')
        await fill('tool-input', 'invalid')
        await click('tool-run')
        await error()
        assert.notEqual(
          await page.getByRole('alert').innerText(),
          'Invalid IPv4 address or CIDR prefix (0–32).',
        )
        if (locale === 'ar')
          assert.equal(await page.locator('html').getAttribute('dir'), 'rtl')
      },
    )
  }
}
