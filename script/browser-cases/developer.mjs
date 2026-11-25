import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'

const encode = (value) =>
  Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
async function downloadedText(download) {
  const stream = await download.createReadStream()
  assert.ok(stream)
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}
/** @param {import('@playwright/test').Page} page */
export async function run(page, check) {
  await check(
    'Developer regex: worker matches, captures, Unicode, replacement and invalid input',
    async () => {
      await page.goto('/tools/regex-tester')
      await page.getByTestId('regex-pattern').fill('(?<word>\\p{L}+)(\\d)?')
      await page.getByTestId('regex-flags').fill('gu')
      await page.getByTestId('regex-text').fill('世界1 Ada')
      await page.getByTestId('regex-replacement').fill('$<word>:$2')
      await page.getByTestId('regex-run').click()
      await page.getByTestId('tool-output').waitFor()
      assert.equal(
        await page.getByTestId('tool-output').inputValue(),
        '世界:1 Ada:',
      )
      assert.equal(
        await page.getByTestId('regex-highlight').locator('mark').count(),
        2,
      )
      assert.match(
        await page.locator('[data-tool="regex-tester"] tbody').textContent(),
        /世界1/,
      )
      assert.match(
        await page.locator('[data-tool="regex-tester"] tbody').textContent(),
        /word/,
      )
      await page.getByTestId('regex-flags').fill('gg')
      assert.equal(await page.getByTestId('tool-output').count(), 0)
      await page.getByTestId('regex-run').click()
      await page.locator('[data-tool="regex-tester"] [role="alert"]').waitFor()
      assert.match(
        await page.getByRole('alert').textContent(),
        /unique JavaScript flags/,
      )
      await page.getByTestId('regex-flags').fill('g')
      await page.getByTestId('regex-pattern').fill('(')
      await page.getByTestId('regex-run').click()
      await page.getByRole('alert').waitFor()
      assert.match(
        await page.getByRole('alert').textContent(),
        /regular expression is invalid/,
      )
      await page.getByTestId('regex-pattern').fill('(?:)')
      await page.getByTestId('regex-flags').fill('gu')
      await page.getByTestId('regex-text').fill('😀a')
      await page.getByTestId('regex-replacement').fill('|')
      await page.getByTestId('regex-run').click()
      await page.getByTestId('tool-output').waitFor()
      assert.equal(await page.getByTestId('tool-output').inputValue(), '|😀|a|')
      assert.deepEqual(
        await page
          .locator('[data-tool="regex-tester"] tbody tr td:first-child')
          .allTextContents(),
        ['0', '2', '3'],
      )
    },
  )
  await check(
    'Developer regex: catastrophic backtracking times out without blocking the page and recovers',
    async () => {
      await page.goto('/tools/regex-tester')
      await page.getByTestId('regex-pattern').fill('(a+)+$')
      await page.getByTestId('regex-text').fill('a'.repeat(30000) + '!')
      await page.getByTestId('regex-run').click()
      assert.equal(await page.evaluate(() => 6 * 7), 42)
      await page.getByRole('alert').waitFor({ timeout: 6000 })
      assert.match(
        await page.getByRole('alert').textContent(),
        /exceeded 1.5 seconds/,
      )
      assert.equal(await page.getByTestId('regex-run').isEnabled(), true)
      await page.getByTestId('regex-numberExample').click()
      await page.getByTestId('regex-run').click()
      await page.getByTestId('tool-output').waitFor()
      assert.equal(
        await page.getByTestId('tool-output').inputValue(),
        '[10] apples, [-2] pears, [3.5] kg',
      )
    },
  )
  await check(
    'Developer JWT: Unicode decoding, expired claim, HS256 verification, reset and malformed token',
    async () => {
      await page.goto('/tools/jwt-decoder')
      const signingInput = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: '你好 😀', exp: 0, iat: 0, nbf: 0 })}`
      const token = `${signingInput}.${createHmac('sha256', 'local-test-secret').update(signingInput).digest('base64url')}`
      await page.getByTestId('jwt-token').fill(token)
      await page.getByTestId('jwt-decode').click()
      assert.equal(
        JSON.parse(
          await page.getByLabel('Payload', { exact: true }).inputValue(),
        ).sub,
        '你好 😀',
      )
      assert.match(
        await page.getByTestId('jwt-claims').textContent(),
        /Expired/,
      )
      assert.match(
        await page.getByTestId('jwt-verification').textContent(),
        /Signature not verified/,
      )
      await page.getByTestId('jwt-secret').fill('local-test-secret')
      await page.getByTestId('jwt-verify').click()
      await page.waitForFunction(() =>
        document
          .querySelector('[data-testid="jwt-verification"]')
          ?.textContent.includes('signature matches'),
      )
      await page.getByTestId('jwt-secret').fill('wrong-secret')
      assert.match(
        await page.getByTestId('jwt-verification').textContent(),
        /not verified/,
      )
      await page.getByTestId('jwt-verify').click()
      await page.waitForFunction(() =>
        document
          .querySelector('[data-testid="jwt-verification"]')
          ?.textContent.includes('does not match'),
      )
      await page.getByTestId('jwt-token').fill('invalid.token')
      await page.getByTestId('jwt-decode').click()
      await page.getByRole('alert').waitFor()
      assert.match(
        await page.getByRole('alert').textContent(),
        /exactly three segments/,
      )
      assert.equal(await page.getByLabel('Payload', { exact: true }).count(), 0)
      await page.getByTestId('jwt-example').click()
      await page.getByTestId('jwt-decode').click()
      await page.getByTestId('jwt-verify').click()
      await page.getByRole('alert').waitFor()
      assert.match(
        await page.getByRole('alert').textContent(),
        /supports only HS256/,
      )
    },
  )
  await check(
    'Developer diff: imports, visual modes, word changes, current patch download and whitespace',
    async () => {
      await page.goto('/tools/text-diff')
      await page
        .getByTestId('diff-file-left')
        .setInputFiles({
          name: 'left.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('one\nold word\n'),
        })
      await page
        .getByTestId('diff-file-right')
        .setInputFiles({
          name: 'right.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('one\nnew word\n'),
        })
      await page.waitForFunction(
        () =>
          document.querySelector('[data-testid="diff-right"]')?.value ===
          'one\nnew word\n',
      )
      assert.match(
        await page.getByTestId('diff-patch').textContent(),
        /-old word\n\+new word/,
      )
      await page.getByTestId('diff-split').uncheck()
      await page.getByTestId('diff-words').uncheck()
      assert.equal(await page.getByTestId('diff-split').isChecked(), false)
      assert.equal(await page.getByTestId('diff-words').isChecked(), false)
      await page.getByTestId('diff-right').fill('one\nlatest word\n')
      await page.waitForFunction(() =>
        document
          .querySelector('[data-testid="diff-view"]')
          ?.textContent.includes('latest'),
      )
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByTestId('diff-download').click(),
      ])
      assert.equal(download.suggestedFilename(), 'changes.diff')
      const patch = await downloadedText(download)
      assert.match(patch, /\+latest word/)
      assert.doesNotMatch(patch, /\+new word/)
      assert.match(patch, /@@ -1,2 \+1,2 @@/)
      await page.getByTestId('diff-left').fill(' a\t b  \n')
      await page.getByTestId('diff-right').fill('a b\n')
      await page.getByTestId('diff-ignore').check()
      assert.match(
        await page.getByTestId('diff-status').textContent(),
        /identical/,
      )
      assert.equal(await page.getByTestId('diff-download').isDisabled(), true)
      await page.getByTestId('diff-ignore').uncheck()
      assert.match(
        await page.getByTestId('diff-status').textContent(),
        /differ/,
      )
      await page.getByTestId('diff-right').fill('x'.repeat(100001))
      await page.getByRole('alert').waitFor()
      assert.match(await page.getByRole('alert').textContent(), /100,000/)
    },
  )
  await check(
    'Developer types: merged optional keys, root naming, Go switch, JSON tags and invalid input',
    async () => {
      await page.goto('/tools/json-to-types')
      await page
        .getByTestId('types-input')
        .fill(
          '[{"a-b":1,"nested":{"x":true}},{"a_b":"text","nested":{"y":null}}]',
        )
      let output = await page.getByTestId('tool-output').inputValue()
      assert.match(output, /"a-b"\?: number;/)
      assert.match(output, /a_b\?: string;/)
      assert.match(output, /x\?: boolean;/)
      assert.match(output, /y\?: null;/)
      await page.getByTestId('types-root').fill('Result')
      await page.getByTestId('types-language').selectOption('go')
      output = await page.getByTestId('tool-output').inputValue()
      assert.match(output, /type Result \[\]ResultItem/)
      assert.match(output, /AB \*float64 `json:"a-b,omitempty"`/)
      assert.match(output, /AB2 \*string `json:"a_b,omitempty"`/)
      await page.getByTestId('types-input').fill('{"a,b":1}')
      await page.getByRole('alert').waitFor()
      assert.match(
        await page.getByRole('alert').textContent(),
        /Go JSON struct tag/,
      )
      assert.equal(await page.getByTestId('tool-output').inputValue(), '')
      await page.getByTestId('types-language').selectOption('typescript')
      assert.match(
        await page.getByTestId('tool-output').inputValue(),
        /"a,b": number;/,
      )
      await page.getByTestId('types-input').fill('{broken')
      await page.getByRole('alert').waitFor()
      assert.match(await page.getByRole('alert').textContent(), /valid JSON/)
      assert.equal(await page.getByTestId('tool-output').inputValue(), '')
      await page.getByTestId('types-input').fill('[1,"text",null]')
      assert.match(
        await page.getByTestId('tool-output').inputValue(),
        /number \| string \| null/,
      )
    },
  )
}
