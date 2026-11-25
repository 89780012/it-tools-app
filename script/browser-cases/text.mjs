import assert from 'node:assert/strict'

async function result(page) {
  await page.waitForFunction(() => {
    const field = document.querySelector('[data-testid="tool-output"]')
    return field && field.value !== ''
  })
  return page.getByTestId('tool-output').inputValue()
}
async function downloadResult(page, filename, expected) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /^download$/i }).click(),
  ])
  assert.equal(download.suggestedFilename(), filename)
  const stream = await download.createReadStream()
  assert.ok(stream)
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  assert.equal(Buffer.concat(chunks).toString('utf8'), expected)
}
async function error(page, pattern) {
  await page.locator('[data-tool] [role="alert"]').waitFor()
  assert.match(
    await page.locator('[data-tool] [role="alert"]').innerText(),
    pattern,
  )
  assert.equal(await page.getByTestId('tool-output').inputValue(), '')
}

/** @param {import('@playwright/test').Page} page */
export async function run(page, check) {
  await check(
    'SQL dialects, format/minify, preserved literals/comments, download and parse error',
    async () => {
      await page.goto('/tools/sql-formatter')
      for (const dialect of ['sql', 'postgresql', 'mysql', 'sqlite']) {
        await page.getByTestId('sql-dialect').selectOption(dialect)
        await page
          .getByTestId('sql-input')
          .fill(
            "select 'a  b', 'O''Reilly' from users -- keep  comment\nwhere id=0;",
          )
        await page.getByTestId('sql-indent').selectOption('4')
        await page.getByTestId('sql-casing').selectOption('upper')
        await page.getByTestId('sql-format').click()
        const formatted = await result(page)
        assert.match(formatted, /SELECT\n {4}'a  b'/)
        await page.getByTestId('sql-minify').click()
        const compact = await result(page)
        assert.ok(compact.length < formatted.length)
        assert.match(compact, /'O''Reilly'/)
        assert.match(compact, /-- keep  comment\n/)
      }
      await page.getByTestId('sql-dialect').selectOption('postgresql')
      await page.getByTestId('sql-casing').selectOption('lower')
      await page
        .getByTestId('sql-input')
        .fill("select $$hello  🌍$$, 'a'\n'b';")
      await page.getByTestId('sql-minify').click()
      const compact = await result(page)
      assert.match(compact, /\$\$hello  🌍\$\$/)
      assert.match(compact, /'a'[^]*\n[^]*'b'/)
      await downloadResult(page, 'formatted.sql', compact)
      await page.getByTestId('sql-input').fill("select 'unclosed")
      await page.getByTestId('sql-format').click()
      await error(page, /Unable to format/)
      await page.getByTestId('sql-clear').click()
      assert.equal(await page.getByTestId('sql-input').inputValue(), '')
    },
  )

  await check(
    'Batch composition, Unicode/CRLF, counts, SQL escaping, copy/download and errors',
    async () => {
      await page.goto('/tools/text-batch-processor')
      await page
        .getByTestId('batch-input')
        .fill(' item10\r\nitem2\r\n\r\nitem2\r\n林 ')
      await page.getByTestId('batch-dedupe').check()
      await page.getByTestId('batch-sort').selectOption('asc')
      await page.getByTestId('batch-prefix').fill('[')
      await page.getByTestId('batch-suffix').fill(']')
      await page.getByTestId('batch-delimiter').selectOption(', ')
      await page.getByTestId('batch-run').click()
      const text = await result(page)
      assert.equal(text, '[item2], [item10], [林]')
      assert.match(
        await page.getByTestId('batch-counts').innerText(),
        /Output: 3 lines/,
      )
      await page
        .context()
        .grantPermissions(['clipboard-read', 'clipboard-write'], {
          origin: new URL(page.url()).origin,
        })
      await page.getByRole('button', { name: /^copy$/i }).click()
      await page.waitForFunction(
        (expected) =>
          navigator.clipboard.readText().then((value) => value === expected),
        text,
      )
      await downloadResult(page, 'batch.txt', text)
      await page.getByTestId('batch-sqlIn').check()
      await page.getByTestId('batch-prefix').fill('')
      await page.getByTestId('batch-suffix').fill('')
      await page.getByTestId('batch-input').fill("O'Reilly\nAda")
      await page.getByTestId('batch-run').click()
      const sql = await result(page)
      assert.equal(sql, "IN ('Ada', 'O''Reilly')")
      assert.equal(await page.getByTestId('batch-delimiter').isDisabled(), true)
      await downloadResult(page, 'values.sql', sql)
      await page.getByTestId('batch-input').fill('unsafe\\path')
      await page.getByTestId('batch-run').click()
      await error(page, /backslashes/)
      await page.getByTestId('batch-clear').click()
      assert.equal(await page.getByTestId('batch-counts').innerText(), '')
    },
  )

  await check(
    'String JSON, Unicode, HTML and nested modes with preservation and clear errors',
    async () => {
      await page.goto('/tools/string-escape')
      const text = '  你好 🌍 "quote"\n  '
      await page.getByTestId('escape-input').fill(text)
      await page.getByTestId('escape-encode').click()
      const json = await result(page)
      assert.equal(JSON.parse(json), text)
      await page.getByTestId('escape-input').fill(json)
      await page.getByTestId('escape-decode').click()
      assert.equal(await result(page), text)
      await page.getByTestId('escape-mode').selectOption('unicode')
      await page.getByTestId('escape-input').fill('🌍')
      await page.getByTestId('escape-encode').click()
      assert.equal(await result(page), '\\ud83c\\udf0d')
      await page.getByTestId('escape-input').fill('\\ud83c\\udf0d')
      await page.getByTestId('escape-decode').click()
      assert.equal(await result(page), '🌍')
      await page.getByTestId('escape-input').fill('\\uxxxx')
      await page.getByTestId('escape-decode').click()
      await error(page, /Unicode/)
      await page.getByTestId('escape-mode').selectOption('html')
      const markup = '<img src=x onerror="window.__textXss=1"> & 🌍'
      await page.getByTestId('escape-input').fill(markup)
      await page.getByTestId('escape-encode').click()
      const html = await result(page)
      assert.match(html, /&lt;img/)
      await page.getByTestId('escape-input').fill(html)
      await page.getByTestId('escape-decode').click()
      assert.equal(await result(page), markup)
      assert.equal(
        await page.locator('[data-tool="string-escape"] img').count(),
        0,
      )
      assert.equal(await page.evaluate(() => window.__textXss), undefined)
      await page.getByTestId('escape-mode').selectOption('nested')
      await page
        .getByTestId('escape-input')
        .fill(
          JSON.stringify(JSON.stringify({ text: '🌍', ok: false, count: 0 })),
        )
      await page.getByTestId('escape-depth').fill('1')
      await page.getByTestId('escape-decode').click()
      await error(page, /depth/)
      await page.getByTestId('escape-depth').fill('5')
      await page.getByTestId('escape-decode').click()
      const nested = await result(page)
      assert.deepEqual(JSON.parse(nested), { text: '🌍', ok: false, count: 0 })
      await downloadResult(page, 'escaped.txt', nested)
      await page.getByTestId('escape-mode').selectOption('json')
      await page.getByTestId('escape-input').fill('false')
      await page.getByTestId('escape-decode').click()
      await error(page, /must be a string/)
    },
  )

  await check(
    'JSONPath wildcards, safe filters, paths, false/null/zero, download and rejection',
    async () => {
      await page.goto('/tools/jsonpath-query')
      await page.getByTestId('jsonpath-example').click()
      await page.getByTestId('jsonpath-run').click()
      assert.deepEqual(JSON.parse(await result(page)), ['Algorithms', '诗集'])
      await page.getByTestId('jsonpath-filter-example').click()
      await page.getByTestId('jsonpath-run').click()
      assert.deepEqual(JSON.parse(await result(page)), ['诗集'])
      await page.getByTestId('jsonpath-paths').check()
      await page.getByTestId('jsonpath-run').click()
      assert.deepEqual(JSON.parse(await result(page)), [
        { path: "$['store']['books'][1]['title']", value: '诗集' },
      ])
      await page.getByTestId('jsonpath-paths').uncheck()
      await page.getByTestId('jsonpath-input').fill('{"values":[null,false,0]}')
      await page.getByTestId('jsonpath-expression').fill('$.values[*]')
      await page.getByTestId('jsonpath-run').click()
      const values = await result(page)
      assert.deepEqual(JSON.parse(values), [null, false, 0])
      await downloadResult(page, 'matches.json', values)
      await page.getByTestId('jsonpath-expression').fill('$.missing')
      await page.getByTestId('jsonpath-run').click()
      assert.deepEqual(JSON.parse(await result(page)), [])
      await page
        .getByTestId('jsonpath-expression')
        .fill('$[?(@.constructor.constructor("return globalThis")())]')
      await page.getByTestId('jsonpath-run').click()
      await error(page, /Unsafe/)
      await page.getByTestId('jsonpath-input').fill('{bad')
      await page.getByTestId('jsonpath-run').click()
      await error(page, /Invalid JSON/)
      await page.getByTestId('jsonpath-clear').click()
      assert.equal(await page.getByTestId('jsonpath-count').innerText(), '')
    },
  )
}
