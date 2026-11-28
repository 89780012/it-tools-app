import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  applyJsonPatch,
  JsonPatchError,
  JSON_PATCH_MAX_INPUT,
  JSON_PATCH_MAX_DEPTH,
  JSON_PATCH_MAX_OPERATIONS,
} from '../json-patch'

function apply(target: unknown, patch: unknown) {
  return JSON.parse(
    applyJsonPatch(JSON.stringify(target), JSON.stringify(patch)),
  )
}
function fails(
  target: string,
  patch: string,
  code: string,
  operation = 0,
  field = 'patch',
) {
  try {
    applyJsonPatch(target, patch)
    expect.unreachable('expected patch failure')
  } catch (error) {
    expect(error).toBeInstanceOf(JsonPatchError)
    expect(error).toMatchObject({ code, operation, field })
  }
}
const op = (op: string, path: string, value?: unknown) => ({
  op,
  path,
  ...(value === undefined ? {} : { value }),
})

describe('RFC 6902 operations and sequential evaluation', () => {
  it.each([
    [{ foo: 'bar' }, [op('add', '/baz', 'qux')], { foo: 'bar', baz: 'qux' }],
    [
      { foo: ['bar', 'baz'] },
      [op('add', '/foo/1', 'qux')],
      { foo: ['bar', 'qux', 'baz'] },
    ],
    [{ foo: 'bar', baz: 'qux' }, [op('remove', '/baz')], { foo: 'bar' }],
    [
      { foo: ['bar', 'qux', 'baz'] },
      [op('remove', '/foo/1')],
      { foo: ['bar', 'baz'] },
    ],
    [
      { baz: 'qux', foo: 'bar' },
      [op('replace', '/baz', 'boo')],
      { baz: 'boo', foo: 'bar' },
    ],
    [
      { foo: { bar: 'baz', waldo: 'fred' }, qux: { corge: 'grault' } },
      [{ op: 'move', from: '/foo/waldo', path: '/qux/thud' }],
      { foo: { bar: 'baz' }, qux: { corge: 'grault', thud: 'fred' } },
    ],
    [
      { foo: ['all', 'grass', 'cows', 'eat'] },
      [{ op: 'move', from: '/foo/1', path: '/foo/3' }],
      { foo: ['all', 'cows', 'eat', 'grass'] },
    ],
    [
      { foo: ['bar'] },
      [op('add', '/foo/-', ['abc', 'def'])],
      { foo: ['bar', ['abc', 'def']] },
    ],
    [{ foo: 'bar' }, [op('test', '/foo', 'bar')], { foo: 'bar' }],
  ])('applies RFC example %#', (target, patch, result) => {
    expect(apply(target, patch)).toEqual(result)
  })
  it('runs all six operations together and keeps copies independent', () => {
    const target = {
      name: 'demo',
      settings: { enabled: false },
      tags: ['old', 'keep'],
      obsolete: true,
    }
    const result = apply(target, [
      op('test', '/name', 'demo'),
      op('replace', '/settings/enabled', true),
      op('add', '/tags/-', 'new'),
      op('remove', '/obsolete'),
      { op: 'copy', from: '/settings', path: '/backup' },
      op('replace', '/settings/enabled', false),
      { op: 'move', from: '/name', path: '/title' },
    ])
    expect(result).toEqual({
      title: 'demo',
      settings: { enabled: false },
      backup: { enabled: true },
      tags: ['old', 'keep', 'new'],
    })
    expect(target.settings.enabled).toBe(false)
    expect(target.obsolete).toBe(true)
  })
  it('inserts at start, end and empty arrays; overwrites object members and preserves null', () => {
    expect(
      apply(
        [],
        [
          op('add', '/0', null),
          op('add', '/0', false),
          op('add', '/2', 0),
          op('add', '/-', ''),
        ],
      ),
    ).toEqual([false, null, 0, ''])
    expect(apply({ a: 1 }, [op('add', '/a', null)])).toEqual({ a: null })
    expect(apply({ a: 1 }, [op('replace', '/a', null)])).toEqual({ a: null })
  })
  it('moves within arrays using indices after removal; supports identical paths', () => {
    expect(
      apply(['a', 'b', 'c'], [{ op: 'move', from: '/0', path: '/2' }]),
    ).toEqual(['b', 'c', 'a'])
    expect(
      apply(['a', 'b', 'c'], [{ op: 'move', from: '/2', path: '/0' }]),
    ).toEqual(['c', 'a', 'b'])
    expect(apply([1, 2], [{ op: 'move', from: '/0', path: '/-' }])).toEqual([
      2, 1,
    ])
    expect(apply([1, 2], [{ op: 'move', from: '/1', path: '/1' }])).toEqual([
      1, 2,
    ])
    fails('[1,2]', '[{"op":"move","from":"/0","path":"/2"}]', 'invalidIndex', 1)
  })
  it('supports root values, replacement, copy-to-root and remove-then-add', () => {
    for (const value of [null, false, 0, '', [], {}]) {
      expect(apply(value, [])).toEqual(value)
      expect(apply(value, [op('test', '', value)])).toEqual(value)
      expect(apply(value, [op('add', '', 123)])).toBe(123)
      expect(apply(value, [op('replace', '', [])])).toEqual([])
      expect(apply(value, [{ op: 'move', from: '', path: '' }])).toEqual(value)
    }
    expect(
      apply({ a: [1, 2] }, [{ op: 'copy', from: '/a', path: '' }]),
    ).toEqual([1, 2])
    expect(apply({ a: 1 }, [{ op: 'move', from: '/a', path: '' }])).toBe(1)
    expect(apply({}, [op('remove', ''), op('add', '', null)])).toBeNull()
    fails('{}', '[{"op":"remove","path":""}]', 'noDocument', 1)
    fails(
      '{}',
      '[{"op":"remove","path":""},{"op":"replace","path":"","value":1}]',
      'missingPath',
      2,
    )
  })
  it('copies the root to a child without creating cycles or aliases', () => {
    expect(
      apply({ a: [1] }, [
        { op: 'copy', from: '', path: '/snapshot' },
        op('add', '/a/-', 2),
      ]),
    ).toEqual({ a: [1, 2], snapshot: { a: [1] } })
  })
  it('handles escaped, empty, percent, Unicode and prototype-looking keys as data', () => {
    const target = '{"a/b":{"~1":1},"":2,"%20":3,"é":4,"-":5}'
    const patch =
      '[{"op":"replace","path":"/a~1b/~01","value":9},{"op":"add","path":"/__proto__","value":{"polluted":true}},{"op":"copy","from":"/","path":"/constructor"},{"op":"test","path":"/%20","value":3},{"op":"replace","path":"/-","value":6}]'
    const result = JSON.parse(applyJsonPatch(target, patch))
    expect(result['a/b']['~1']).toBe(9)
    expect(result.constructor).toBe(2)
    expect(result.__proto__).toEqual({ polluted: true })
    expect(result['é']).toBe(4)
    expect(result['-']).toBe(6)
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    fails('{}', '[{"op":"remove","path":"/toString"}]', 'missingPath', 1)
    expect(applyJsonPatch('{"__proto__":1}', '[]')).toContain('"__proto__": 1')
  })
  it('ignores unrecognized members as required by RFC 6902', () => {
    expect(
      apply({}, [{ op: 'add', path: '/a', value: 1, unknown: true, from: 42 }]),
    ).toEqual({ a: 1 })
  })
})

describe('precise test equality and number preservation', () => {
  it.each([
    ['1', '1.00'],
    ['100', '1e2'],
    ['0', '-0.00e999'],
    ['1e400', '10e399'],
    ['0.12345678901234567890', '1234567890123456789e-19'],
    ['1e9007199254740993', '10e9007199254740992'],
    ['1e-9007199254740993', '10e-9007199254740994'],
  ])('compares %s and %s exactly', (target, value) => {
    expect(
      applyJsonPatch(target, `[{"op":"test","path":"","value":${value}}]`),
    ).toBe(target)
  })
  it.each([
    ['9007199254740993', '9007199254740992'],
    ['1e9007199254740993', '1e9007199254740992'],
    ['0.12345678901234567890', '0.12345678901234567891'],
    ['1e400', '2e400'],
    ['1', '"1"'],
    ['false', '0'],
    ['[1,2]', '[2,1]'],
    ['{}', '[]'],
    ['{"a":1}', '{"b":1}'],
    ['{"a":null}', '{}'],
  ])('rejects unequal %s and %s', (target, value) => {
    fails(target, `[{"op":"test","path":"","value":${value}}]`, 'testFailed', 1)
  })
  it('compares objects without key order but arrays in order; no Unicode normalization', () => {
    expect(
      apply({ a: 1, b: [null, true] }, [
        op('test', '', { b: [null, true], a: 1 }),
      ]),
    ).toEqual({ a: 1, b: [null, true] })
    fails('"é"', '[{"op":"test","path":"","value":"é"}]', 'testFailed', 1)
  })
  it('retains numeric lexemes when moving, copying and adding', () => {
    const result = applyJsonPatch(
      '{"a":9007199254740993,"b":0.12345678901234567890}',
      '[{"op":"copy","from":"/a","path":"/c"},{"op":"move","from":"/b","path":"/d"},{"op":"add","path":"/e","value":1e400},{"op":"add","path":"/f","value":-0}]',
    )
    expect(result.match(/9007199254740993/g)).toHaveLength(2)
    expect(result).toContain('0.12345678901234567890')
    expect(result).toContain('1e400')
    expect(result).toContain('"f": -0')
  })
})

describe('validation, failure isolation and resource limits', () => {
  it.each(['', ' ', '{', '[1,]', 'NaN', '01', 'true false'])(
    'rejects target input %j',
    (target) => {
      fails(target, '[]', target.trim() ? 'invalidJson' : 'empty', 0, 'target')
    },
  )
  it.each(['', '[', '[1,]'])('rejects malformed patch %j', (patch) =>
    fails('{}', patch, patch ? 'invalidJson' : 'empty'),
  )
  it.each(['{}', 'null', '1', '"[]"'])('requires array %s', (patch) =>
    fails('{}', patch, 'invalidPatch'),
  )
  it.each([
    'null',
    '1',
    '{}',
    '{"op":"ADD","path":"/a","value":1}',
    '{"op":"add","path":"/a"}',
    '{"op":"test","path":""}',
    '{"op":1,"path":""}',
  ])('rejects invalid operation %s', (operation) =>
    fails('{}', `[${operation}]`, 'invalidOperation', 1),
  )
  it.each(['#/a', 'a', ' /a', '/~', '/~2', '/~01~'])(
    'rejects pointer %j',
    (path) => {
      fails('{}', JSON.stringify([op('add', path, 1)]), 'invalidPointer', 1)
    },
  )
  it.each([
    { op: 'copy', path: '/x' },
    { op: 'move', from: null, path: '/x' },
    { op: 'remove' },
    { op: 'add', path: 1, value: 1 },
  ])('requires path/from strings %#', (operation) =>
    fails('{}', JSON.stringify([operation]), 'invalidPointer', 1),
  )
  it.each([
    '01',
    '-1',
    '+1',
    '1.0',
    '1e0',
    'length',
    '2',
    '9999999999999999999999',
    '-',
  ])('rejects invalid existing array index %s', (index) =>
    fails(
      '[0,1]',
      JSON.stringify([op('remove', '/' + index)]),
      'invalidIndex',
      1,
    ),
  )
  it.each([
    [op('add', '/missing/a', 1)],
    [op('remove', '/a')],
    [op('replace', '/a', 1)],
    [{ op: 'copy', from: '/missing', path: '/a' }],
    [op('test', '/a', null)],
    [op('add', '/a/b', 1)],
  ])('requires existing paths %#', (operation) =>
    fails('{}', JSON.stringify([operation]), 'missingPath', 1),
  )
  it('does not traverse null or number wrapper internals', () => {
    fails(
      '{"a":null}',
      JSON.stringify([op('add', '/a/b', 1)]),
      'missingPath',
      1,
    )
    fails('42', JSON.stringify([op('test', '/value', '42')]), 'missingPath', 1)
  })
  it('rejects missing remove and replace destinations', () => {
    fails('{}', '[{"op":"remove","path":"/a"}]', 'missingPath', 1)
    fails('{}', '[{"op":"replace","path":"/a","value":1}]', 'missingPath', 1)
  })
  it.each([
    ['{"a":{}}', '/a', '/a/b'],
    ['{}', '', '/a'],
    ['{"a/b":{}}', '/a~1b', '/a~1b/c'],
  ])('rejects moving ancestors into descendants %#', (target, from, path) =>
    fails(target, JSON.stringify([{ op: 'move', from, path }]), 'moveChild', 1),
  )
  it('does not confuse key prefixes with descendant paths', () => {
    expect(
      apply({ a: 1, ab: {} }, [{ op: 'move', from: '/a', path: '/ab/c' }]),
    ).toEqual({ ab: { c: 1 } })
  })
  it('rejects identical and escaped duplicate keys in both inputs', () => {
    fails('{"a":1,"a":1}', '[]', 'duplicateKey', 0, 'target')
    fails('{"a":1,"\\u0061":2}', '[]', 'duplicateKey', 0, 'target')
    fails(
      '{}',
      '[{"op":"add","op":"add","path":"/a","value":1}]',
      'duplicateKey',
    )
    fails(
      '{}',
      '[{"op":"add","path":"/a","value":{"x":1,"x":1}}]',
      'duplicateKey',
    )
  })
  it('returns no partial result and retains original source after failures', () => {
    const target = '{"a":1}'
    fails(
      target,
      '[{"op":"replace","path":"/a","value":2},{"op":"test","path":"/a","value":1},{"op":"add","path":"/b","value":3}]',
      'testFailed',
      2,
    )
    expect(applyJsonPatch(target, '[]')).toBe('{\n  "a": 1\n}')
  })
  it('enforces inclusive input, pointer and operation limits', () => {
    const target = '"' + 'x'.repeat(JSON_PATCH_MAX_INPUT - 2) + '"'
    expect(applyJsonPatch(target, '[]')).toBe(target)
    fails(target + ' ', '[]', 'inputLimit', 0, 'target')
    fails('{}', ' '.repeat(JSON_PATCH_MAX_INPUT) + '[]', 'inputLimit')
    const key = 'x'.repeat(4095)
    expect(apply({}, [op('add', '/' + key, 1)])[key]).toBe(1)
    fails(
      '{}',
      JSON.stringify([op('add', '/' + key + 'x', 1)]),
      'invalidPointer',
      1,
    )
    expect(
      apply(
        {},
        Array.from({ length: JSON_PATCH_MAX_OPERATIONS }, () =>
          op('test', '', {}),
        ),
      ),
    ).toEqual({})
    fails(
      '{}',
      JSON.stringify(
        Array.from({ length: JSON_PATCH_MAX_OPERATIONS + 1 }, () =>
          op('test', '', {}),
        ),
      ),
      'operationLimit',
    )
  })
  it('bounds input and resulting nesting, ignoring brackets inside strings', () => {
    const deep =
      '['.repeat(JSON_PATCH_MAX_DEPTH) + '0' + ']'.repeat(JSON_PATCH_MAX_DEPTH)
    expect(JSON.parse(applyJsonPatch(deep, '[]'))).toBeInstanceOf(Array)
    fails('[' + deep + ']', '[]', 'depthLimit', 0, 'target')
    fails('{}', '[' + deep + ']', 'depthLimit')
    // Each input is valid, but copying a deep tree into a child exceeds the result depth.
    const nested = '{"a":' + '['.repeat(63) + '0' + ']'.repeat(63) + '}'
    fails(
      nested,
      '[{"op":"copy","from":"","path":"/snapshot"}]',
      'depthLimit',
      1,
    )
    expect(apply('[['.repeat(100), [])).toBe('[['.repeat(100))
  })
  it('bounds output amplification before allocating the serialized result', () => {
    const target = '{"a":"' + 'x'.repeat(450000) + '"}'
    fails(
      target,
      JSON.stringify(
        Array.from({ length: 5 }, (_, i) => ({
          op: 'copy',
          from: '/a',
          path: '/b' + i,
        })),
      ),
      'outputLimit',
      4,
    )
  })
  it('accepts the exact formatted output limit and rejects one unit more', () => {
    const target = JSON.stringify({ a: 'x'.repeat(399980) })
    const copies = ['b', 'c', 'd', 'e'].map((path) => ({
      op: 'copy',
      from: '/a',
      path: '/' + path,
    }))
    const result = applyJsonPatch(
      target,
      JSON.stringify([...copies, op('add', '/pad', 'x'.repeat(30))]),
    )
    expect(result.length).toBe(2_000_000)
    fails(
      target,
      JSON.stringify([...copies, op('add', '/pad', 'x'.repeat(31))]),
      'outputLimit',
      5,
    )
  })
  it('bounds total processing across otherwise valid operations', () => {
    const target = '"' + 'x'.repeat(450000) + '"'
    fails(
      target,
      JSON.stringify(
        Array.from({ length: 100 }, () => op('test', '/missing', null)),
      ),
      'missingPath',
      1,
    )
    fails(
      target,
      JSON.stringify(
        Array.from({ length: 100 }, () => ({ op: 'copy', from: '', path: '' })),
      ),
      'workLimit',
      44,
    )
  })
  it('applies generated valid array operations against an independent splice model', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { maxLength: 20 }),
        fc.array(fc.tuple(fc.nat(100), fc.integer()), { maxLength: 30 }),
        (initial, steps) => {
          const expected = [...initial]
          const operations = []
          for (const [choice, value] of steps) {
            const at = choice % (expected.length + 1)
            expected.splice(at, 0, value)
            operations.push(op('add', '/' + at, value))
            if (choice % 2 && expected.length) {
              const remove = choice % expected.length
              expected.splice(remove, 1)
              operations.push(op('remove', '/' + remove))
            }
          }
          expect(apply(initial, operations)).toEqual(expected)
        },
      ),
      { seed: 6902, numRuns: 200 },
    )
  })
})
