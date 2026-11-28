import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  resolveJsonPointer,
  JsonPointerError,
  POINTER_MAX_DEPTH,
  POINTER_MAX_INPUT,
  POINTER_MAX_LENGTH,
} from '../json-pointer'

const rfcDocument = JSON.stringify({
  foo: ['bar', 'baz'],
  '': 0,
  'a/b': 1,
  'c%d': 2,
  'e^f': 3,
  'g|h': 4,
  'i\\j': 5,
  'k"l': 6,
  ' ': 7,
  'm~n': 8,
})
describe('RFC 6901 examples', () => {
  it.each([
    ['/foo', '[\n  "bar",\n  "baz"\n]'],
    ['/foo/0', '"bar"'],
    ['/', '0'],
    ['/a~1b', '1'],
    ['/c%d', '2'],
    ['/e^f', '3'],
    ['/g|h', '4'],
    ['/i\\j', '5'],
    ['/k"l', '6'],
    ['/ ', '7'],
    ['/m~0n', '8'],
    ['#/foo/0', '"bar"'],
    ['#/', '0'],
    ['#/a~1b', '1'],
    ['#/c%25d', '2'],
    ['#/e%5Ef', '3'],
    ['#/g%7Ch', '4'],
    ['#/i%5Cj', '5'],
    ['#/k%22l', '6'],
    ['#/%20', '7'],
    ['#/m~0n', '8'],
  ])('resolves %s', (pointer, output) => {
    expect(resolveJsonPointer(rfcDocument, pointer).output).toBe(output)
  })
  it.each(['', '#'])('selects the whole document with %s', (pointer) => {
    expect(JSON.parse(resolveJsonPointer(rfcDocument, pointer).output)).toEqual(
      JSON.parse(rfcDocument),
    )
  })
})

function fails(
  source: string,
  pointer: string,
  code: string,
  field = 'pointer',
  step = 0,
) {
  expect(() => resolveJsonPointer(source, pointer)).toThrow(JsonPointerError)
  try {
    resolveJsonPointer(source, pointer)
  } catch (error) {
    expect(error).toMatchObject({ code, field, step })
  }
}
describe('exact values and traversal', () => {
  it.each([
    ['null', 'null'],
    ['false', 'boolean'],
    ['0', 'number'],
    ['""', 'string'],
    ['[]', 'array'],
    ['{}', 'object'],
    ['9007199254740993', 'number'],
    ['0.12345678901234567890', 'number'],
    ['1e400', 'number'],
    ['-0', 'number'],
  ])('retains scalar or empty root %s', (source, type) => {
    expect(resolveJsonPointer(source, '')).toMatchObject({
      output: source,
      type,
    })
  })
  it('does not decode ~01 twice, trim whitespace, normalize Unicode or interpret plus as space', () => {
    const source =
      '{"~1":1,"/":2,"a ":3,"é":4,"é":5,"a+b":6,"a%20b":7,"": {"":8}}'
    for (const [pointer, output] of [
      ['/~01', '1'],
      ['/a ', '3'],
      ['/é', '4'],
      ['/é', '5'],
      ['#/a+b', '6'],
      ['/a%20b', '7'],
      ['//', '8'],
    ])
      expect(resolveJsonPointer(source, pointer).output).toBe(output)
  })
  it('decodes UTF-8 and percent encoding once before splitting and unescaping tokens', () => {
    expect(
      resolveJsonPointer('{"中":{"/":true}}', '#%2F%E4%B8%AD%2F%7E1'),
    ).toMatchObject({ output: 'true', pointer: '/中/~1' })
    expect(resolveJsonPointer('{"%20":1," ":2}', '#/%2520').output).toBe('1')
  })
  it('treats prototype-looking keys as data and excludes inherited and number-wrapper fields', () => {
    const source =
      '{"__proto__":{"constructor":{"prototype":42}},"isLosslessNumber":true,"value":"42","01":5,"-":6}'
    expect(
      resolveJsonPointer(source, '/__proto__/constructor/prototype').output,
    ).toBe('42')
    expect(resolveJsonPointer(source, '/isLosslessNumber').output).toBe('true')
    expect(resolveJsonPointer(source, '/01').output).toBe('5')
    expect(resolveJsonPointer(source, '/-').output).toBe('6')
    fails('{}', '/toString', 'missingKey', 'pointer', 1)
    fails('42', '/value', 'scalarTraversal', 'pointer', 1)
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
  it('resolves generated keys through both plain and URI fragment representations', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 1, maxLength: 8 }),
        (keys) => {
          let doc: unknown = 'selected'
          for (const key of [...keys].reverse()) doc = { [key]: doc }
          const pointer =
            '/' +
            keys
              .map((key) => key.replace(/~/g, '~0').replace(/\//g, '~1'))
              .join('/')
          expect(resolveJsonPointer(JSON.stringify(doc), pointer).output).toBe(
            '"selected"',
          )
          expect(
            resolveJsonPointer(
              JSON.stringify(doc),
              '#' + encodeURIComponent(pointer),
            ).output,
          ).toBe('"selected"')
        },
      ),
      { seed: 6901, numRuns: 250 },
    )
  })
})

describe('validation and resource boundaries', () => {
  it.each(['', ' ', '\n\t'])('rejects empty JSON %j', (source) =>
    fails(source, '', 'emptyJson', 'json'),
  )
  it.each(['{', '{"a":1,}', '[1,]', 'NaN', '01', 'true false', '{a:1}'])(
    'rejects malformed JSON %s',
    (source) => fails(source, '', 'invalidJson', 'json'),
  )
  it.each(['{"a":1,"a":1}', '{"a":1,"\\u0061":2}', '{"x":{"b":1,"b":2}}'])(
    'rejects all duplicate keys %s',
    (source) => fails(source, '', 'duplicateKey', 'json'),
  )
  it.each(['foo', ' /foo', '$.foo', 'https://example.com/#/foo'])(
    'rejects non-pointer syntax %s',
    (pointer) => fails('{}', pointer, 'invalidPointer'),
  )
  it.each(['#/%', '#/%GG', '#/%C0%AF', '#/%FF', '#/%E4%B8'])(
    'rejects malformed URI %s',
    (pointer) => fails('{}', pointer, 'invalidFragment'),
  )
  it.each(['/~', '/~2', '/a/~01~'])(
    'rejects invalid tilde escape %s',
    (pointer) =>
      fails(
        '{}',
        pointer,
        'invalidEscape',
        'pointer',
        pointer.split('/').length - 1,
      ),
  )
  it.each(['01', '-1', '+1', '-', '1.0', '1e0', ' ', 'length', '١'])(
    'rejects array index %s',
    (token) => fails('[0,1]', '/' + token, 'invalidIndex', 'pointer', 1),
  )
  it.each(['2', '9007199254740993', '9'.repeat(100)])(
    'rejects out-of-range index %s',
    (token) => fails('[0,1]', '/' + token, 'indexRange', 'pointer', 1),
  )
  it('distinguishes null, missing keys, empty arrays and scalars', () => {
    expect(resolveJsonPointer('{"x":null}', '/x').output).toBe('null')
    fails('{"x":null}', '/x/y', 'scalarTraversal', 'pointer', 2)
    fails('{"x":true}', '/X', 'missingKey', 'pointer', 1)
    fails('[]', '/0', 'indexRange', 'pointer', 1)
    fails('{"a":[0]}', '/a/0/next', 'scalarTraversal', 'pointer', 3)
  })
  it('enforces inclusive JSON, pointer and nesting limits', () => {
    const source = '"' + 'x'.repeat(POINTER_MAX_INPUT - 2) + '"'
    expect(resolveJsonPointer(source, '').output).toBe(source)
    fails(source + ' ', '', 'inputLimit', 'json')
    const key = 'a'.repeat(POINTER_MAX_LENGTH - 1)
    expect(
      resolveJsonPointer(JSON.stringify({ [key]: 1 }), '/' + key).output,
    ).toBe('1')
    fails('{}', '/' + key + 'a', 'pointerLimit')
    const deep =
      '['.repeat(POINTER_MAX_DEPTH) + '0' + ']'.repeat(POINTER_MAX_DEPTH)
    expect(
      resolveJsonPointer(deep, '/0'.repeat(POINTER_MAX_DEPTH)).output,
    ).toBe('0')
    fails('[' + deep + ']', '', 'depthLimit', 'json')
    // Brackets and escaped quotes in strings must not increase nesting depth.
    expect(
      resolveJsonPointer(JSON.stringify('"' + '['.repeat(100)), '').type,
    ).toBe('string')
  })
  it('bounds pretty-printed output expansion', () => {
    const source =
      '['.repeat(63) + '[' + '0,'.repeat(45000) + '0]' + ']'.repeat(63)
    fails(source, '', 'outputLimit', 'json')
    expect(resolveJsonPointer(source, '/0'.repeat(64)).output).toBe('0')
  })
})
