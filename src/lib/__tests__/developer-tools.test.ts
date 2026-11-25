import { describe, expect, it, vi, afterEach } from 'vitest'
import ts from 'typescript'
import { webcrypto, createHmac } from 'node:crypto'
import { matchRegex } from '../developer-regex'
import {
  decodeBase64Url,
  decodeJwt,
  jwtClaims,
  verifyHs256,
} from '../developer-jwt'
import { compareTexts } from '../developer-diff'
import { generateTypes } from '../developer-json-to-types'

const encode = (value: unknown) =>
  Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
const token = (
  payload: unknown,
  header: unknown = { alg: 'none' },
  signature = '',
) => `${encode(header)}.${encode(payload)}.${signature}`
afterEach(() => vi.unstubAllGlobals())

describe('developer regex matcher', () => {
  it('returns indexes, numbered and named captures and replacements', () => {
    const result = matchRegex({
      pattern: '(?<word>\\p{L}+)(\\d)?',
      flags: 'gu',
      text: '世界1 Ada',
      replacement: '$<word>:$2',
    })
    expect(result.matches).toEqual([
      {
        index: 0,
        value: '世界1',
        captures: ['世界', '1'],
        groups: { word: '世界' },
      },
      {
        index: 4,
        value: 'Ada',
        captures: ['Ada', null],
        groups: { word: 'Ada' },
      },
    ])
    expect(result.replacement).toBe('世界:1 Ada:')
  })
  it.each(['gg', 'z', 'uv', 'G'])('rejects invalid flags %s', (flags) => {
    expect(() =>
      matchRegex({ pattern: '.', flags, text: 'abc', replacement: '' }),
    ).toThrow('invalidFlags')
  })
  it('rejects invalid patterns', () =>
    expect(() =>
      matchRegex({ pattern: '(', flags: '', text: 'abc', replacement: '' }),
    ).toThrow('invalidPattern'))
  it('advances zero-length Unicode matches by full code points', () => {
    const result = matchRegex({
      pattern: '(?:)',
      flags: 'gu',
      text: '😀a',
      replacement: '|',
    })
    expect(result.matches.map((match) => match.index)).toEqual([0, 2, 3])
    expect(result.replacement).toBe('|😀|a|')
  })
  it('handles zero-length non-Unicode matches and non-global mode', () => {
    expect(
      matchRegex({
        pattern: '(?:)',
        flags: 'g',
        text: '😀',
        replacement: '',
      }).matches.map((match) => match.index),
    ).toEqual([0, 1, 2])
    expect(
      matchRegex({ pattern: 'a', flags: '', text: 'aa', replacement: 'x' })
        .replacement,
    ).toBe('xa')
    expect(
      matchRegex({ pattern: 'a', flags: 'y', text: 'ba', replacement: 'x' })
        .matches,
    ).toHaveLength(0)
  })
  it.each([
    '$$',
    '$&',
    '$`',
    "$'",
    '$1-$10-$01-$00-$99',
    '$<x>-$<missing>',
    '$$&',
  ])('matches native replacement semantics for %s', (replacement) => {
    const pattern = '(?<x>a)(b)?',
      flags = 'g',
      text = 'zab a!'
    expect(matchRegex({ pattern, flags, text, replacement }).replacement).toBe(
      text.replace(new RegExp(pattern, flags), replacement),
    )
  })
  it('caps displayed matches without losing replacements', () => {
    const result = matchRegex({
      pattern: 'a',
      flags: 'g',
      text: 'a'.repeat(1002),
      replacement: 'b',
    })
    expect(result.matches).toHaveLength(1000)
    expect(result.truncated).toBe(true)
    expect(result.replacement).toBe('b'.repeat(1002))
  })
  it('rejects excessive input and expanding output', () => {
    expect(() =>
      matchRegex({
        pattern: '.',
        flags: 'g',
        text: 'a'.repeat(200001),
        replacement: '',
      }),
    ).toThrow('tooLarge')
    expect(() =>
      matchRegex({
        pattern: 'a',
        flags: 'g',
        text: 'a'.repeat(1001),
        replacement: 'b'.repeat(1000),
      }),
    ).toThrow('outputTooLarge')
    expect(() =>
      matchRegex({
        pattern: 'a',
        flags: '',
        text: 'a'.repeat(10000),
        replacement: "$'".repeat(5000),
      }),
    ).toThrow('outputTooLarge')
  })
})

describe('developer JWT decoding and verification', () => {
  it('decodes UTF-8 payloads without claiming authenticity', () => {
    expect(decodeJwt(token({ name: '你好 😀 مرحبا' })).payload.name).toBe(
      '你好 😀 مرحبا',
    )
    expect(decodeJwt(token({})).signature).toHaveLength(0)
  })
  it.each([
    '',
    'a.b',
    'a.b.c.d',
    'a.b.c',
    `${encode({ alg: 'HS256' })}.${encode({})}.`,
    `${encode([])}.${encode({})}.AA`,
    `${encode({ alg: 'none' })}.${encode('x')}.`,
    `${encode({})}.${encode({})}.`,
  ])('rejects malformed token %s', (value) =>
    expect(() => decodeJwt(value)).toThrow('invalidToken'),
  )
  it.each(['AB', 'a=', '*', 'A', '+w', '_x'])(
    'rejects noncanonical base64url %s',
    (value) => expect(() => decodeBase64Url(value)).toThrow('invalidToken'),
  )
  it('rejects invalid UTF-8 even if the Base64URL is valid', () => {
    expect(() =>
      decodeJwt(
        `${encode({ alg: 'none' })}.${Buffer.from([0xff]).toString('base64url')}.`,
      ),
    ).toThrow('invalidToken')
  })
  it('reports expiration boundaries, future issuance, not-before and invalid dates', () => {
    const now = 1700000000000
    expect(
      jwtClaims(
        { exp: now / 1000, iat: now / 1000 + 1, nbf: now / 1000 - 1 },
        now,
      ).map((claim) => claim.status),
    ).toEqual(['expired', 'future', 'active'])
    expect(
      jwtClaims({ exp: '1700000000', iat: 1e99, nbf: null }, now).every(
        (claim) => claim.status === 'invalidDate',
      ),
    ).toBe(true)
    expect(
      jwtClaims({ exp: now / 1000 + 1, iat: now / 1000 - 1 }, now).map(
        (claim) => claim.status,
      ),
    ).toEqual(['active', 'issued'])
    expect(jwtClaims({})).toEqual([])
  })
  it('verifies genuine HS256 signatures and rejects wrong secrets and unsupported headers', async () => {
    vi.stubGlobal('crypto', webcrypto)
    const signingInput = `${encode({ alg: 'HS256' })}.${encode({ sub: 'Ada' })}`
    const signed = `${signingInput}.${createHmac('sha256', 'secret').update(signingInput).digest('base64url')}`
    await expect(verifyHs256(decodeJwt(signed), 'secret')).resolves.toBe(true)
    await expect(verifyHs256(decodeJwt(signed), 'wrong')).resolves.toBe(false)
    await expect(verifyHs256(decodeJwt(signed), '')).rejects.toThrow(
      'secretRequired',
    )
    await expect(verifyHs256(decodeJwt(token({})), 'secret')).rejects.toThrow(
      'unsupportedAlgorithm',
    )
    await expect(
      verifyHs256(
        decodeJwt(token({}, { alg: 'HS256', crit: ['x'] }, 'AA')),
        'secret',
      ),
    ).rejects.toThrow('unsupportedAlgorithm')
  })
})

describe('developer text diff', () => {
  it('produces an accurate unified patch with preserved context', () => {
    expect(compareTexts('one\ntwo\n', 'one\nthree\n').unified).toBe(
      '--- left\n+++ right\n@@ -1,2 +1,2 @@\n one\n-two\n+three\n',
    )
  })
  it('handles empty files, missing final newlines and CRLF', () => {
    expect(compareTexts('', '').equal).toBe(true)
    expect(compareTexts('', 'x').unified).toContain(
      '@@ -0,0 +1,1 @@\n+x\n\\ No newline at end of file',
    )
    expect(compareTexts('x\n', '').unified).toContain('@@ -1,1 +0,0 @@\n-x\n')
    expect(compareTexts('x\r\n', 'x\n').equal).toBe(true)
    expect(compareTexts('x', 'x\n').equal).toBe(false)
  })
  it('normalizes horizontal whitespace consistently and retains line breaks', () => {
    expect(compareTexts(' a\t b  \n', 'a b\n', true).equal).toBe(true)
    expect(compareTexts('a b', 'a\nb', true).equal).toBe(false)
    expect(compareTexts(' a  b', 'a c', true).unified).toContain('-a b\n')
  })
  it('never returns stale differences after inputs change', () => {
    expect(
      compareTexts('a\n', 'b\n').changes.filter((line) => line.kind === '+'),
    ).toEqual([{ kind: '+', text: 'b\n' }])
    expect(compareTexts('a\n', 'c\n').unified).not.toContain('+b')
    expect(compareTexts('same', 'same').unified).toBe('')
  })
  it('rejects work that exceeds bounded input or matrix size', () => {
    expect(() => compareTexts('a'.repeat(100001), '')).toThrow('tooLarge')
    expect(() => compareTexts('a\n'.repeat(1500), 'b\n'.repeat(1500))).toThrow(
      'tooLarge',
    )
  })
})

function typeErrors(source: string) {
  const filename = '/developer-generated.ts'
  const options: ts.CompilerOptions = {
    strict: true,
    noEmit: true,
    target: ts.ScriptTarget.ES2022,
    skipLibCheck: true,
    types: [],
  }
  const host = ts.createCompilerHost(options)
  const original = host.getSourceFile.bind(host)
  host.getSourceFile = (file, target, ...rest) =>
    file === filename
      ? ts.createSourceFile(file, source, target, true)
      : original(file, target, ...rest)
  return ts
    .getPreEmitDiagnostics(ts.createProgram([filename], options, host))
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
    .map((diagnostic) =>
      ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
    )
}

describe('developer JSON to types', () => {
  it('merges heterogeneous array objects and all optional keys', () => {
    const source = generateTypes(
      '[{"a":1,"nested":{"x":true}},{"b":"x","nested":{"y":null}},{"a":null}]',
    )
    expect(source).toContain('a?: number | null;')
    expect(source).toContain('b?: string;')
    expect(source).toContain('nested?: RootItemNested;')
    expect(source).toContain('x?: boolean;')
    expect(source).toContain('y?: null;')
  })
  it.each([
    'null',
    '42',
    'true',
    '"hello"',
    '[]',
    '[1,"x",null,true,{},[]]',
    '{"a-b":{},"a_b":{},"":1,"1x":null,"__proto__":{"x":1}}',
  ])('generates semantically valid TypeScript for %s', (json) => {
    const source = generateTypes(json)
    expect(typeErrors(`${source}\nconst sample: Root = ${json};`)).toEqual([])
  })
  it('creates unique names for colliding nested objects and built-in root names', () => {
    const source = generateTypes(
      '{"a-b":{"x":1},"a_b":{"y":true}}',
      'typescript',
      'Array',
    )
    expect(source).toContain('interface Array2 ')
    expect(source).toContain('interface Array2AB ')
    expect(source).toContain('interface Array2AB2 ')
    expect(typeErrors(source)).toEqual([])
    expect(generateTypes('{}', 'typescript', '123 bad-name')).toContain(
      'interface Type123BadName',
    )
  })
  it('generates Go JSON tags, unique exported fields and optional pointers', () => {
    const source = generateTypes(
      '[{"a-b":1,"a_b":"x","nullable":null,"tick:key":true},{"nullable":2}]',
      'go',
    )
    expect(source).toContain('type Root []RootItem')
    expect(source).toContain('AB *float64 `json:"a-b,omitempty"`')
    expect(source).toContain('AB2 *string `json:"a_b,omitempty"`')
    expect(source).toContain('Nullable *float64 `json:"nullable"`')
    expect(source).toContain('`json:"tick:key,omitempty"`')
    expect(generateTypes('[1,"x",null]', 'go')).toContain('type Root []any')
    expect(generateTypes('null', 'go')).toContain('type Root any')
  })
  it.each(['', '-', 'a,b', 'a"b', 'a\\b', 'line\nbreak', '😀', 'tick`key'])(
    'rejects unrepresentable Go tag %s without dropping it',
    (key) => {
      expect(() => generateTypes(JSON.stringify({ [key]: 1 }), 'go')).toThrow(
        'goKey',
      )
      expect(
        generateTypes(JSON.stringify({ [key]: 1 }), 'typescript'),
      ).toContain(': number;')
    },
  )
  it('rejects malformed, infinite, oversized and too deeply nested JSON', () => {
    expect(() => generateTypes('{')).toThrow('invalidJson')
    expect(() => generateTypes('1e999')).toThrow('invalidJson')
    expect(() => generateTypes(' '.repeat(200001))).toThrow('tooLarge')
    expect(() => generateTypes('['.repeat(82) + '0' + ']'.repeat(82))).toThrow(
      'tooDeep',
    )
  })
})
