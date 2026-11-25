import { describe, expect, it } from 'vitest'
import {
  compactTextSql,
  transformTextSql,
  type TextSqlDialect,
} from '@/lib/text-sql'
import { processTextBatch, textBatchDefaults } from '@/lib/text-batch'
import { transformTextEscape } from '@/lib/text-escape'
import { queryTextJsonPath, validateTextJsonPath } from '@/lib/text-jsonpath'

const sqlOptions = {
  dialect: 'sql' as TextSqlDialect,
  indent: 2,
  keywordCase: 'upper' as const,
}

describe('SQL formatting and safe whitespace compaction', () => {
  it.each(['sql', 'postgresql', 'mysql', 'sqlite'] as const)(
    'formats %s without changing quoted whitespace or apostrophes',
    (dialect) => {
      const input =
        "select 'a  b', 'O''Reilly', \"space  name\" from users where id=0;"
      const formatted = transformTextSql(input, { ...sqlOptions, dialect })
      const compact = transformTextSql(input, { ...sqlOptions, dialect }, true)
      expect(formatted).toContain('SELECT\n')
      for (const result of [formatted, compact]) {
        expect(result).toContain("'a  b'")
        expect(result).toContain("'O''Reilly'")
        expect(result).toContain('"space  name"')
      }
      expect(compact.length).toBeLessThan(formatted.length)
    },
  )
  it('honors casing and indentation', () => {
    expect(
      transformTextSql('SELECT a FROM b', {
        ...sqlOptions,
        indent: 4,
        keywordCase: 'lower',
      }),
    ).toBe('select\n    a\nfrom\n    b')
    expect(
      transformTextSql('select a FROM b', {
        ...sqlOptions,
        keywordCase: 'preserve',
      }),
    ).toContain('select')
  })
  it('retains line-comment boundaries and block-comment contents', () => {
    const result = transformTextSql(
      "select 1 -- a  comment\n, 'x  y' /* b  c */;",
      sqlOptions,
      true,
    )
    expect(result).toContain('-- a  comment\n')
    expect(result).toContain('/* b  c */')
    expect(result).toContain("'x  y'")
  })
  it.each([false, true])(
    'preserves significant newlines between adjacent literals (minify=%s)',
    (minify) => {
      for (const input of [
        "select 'a'\n'b';",
        "select 'a' /* comment */\n'b';",
        "select 'a' -- comment\n'b';",
      ]) {
        const result = transformTextSql(
          input,
          { ...sqlOptions, dialect: 'postgresql' },
          minify,
        )
        expect(result).toMatch(/'a'[^]*\n[^]*'b'/)
        expect(result).not.toContain('__toolkit_literal_newline__')
      }
    },
  )
  it('keeps PostgreSQL dollar strings, escape strings and nested comments opaque', () => {
    const sql =
      " select $body$a  b\n-- text$body$, E'a\\\'  b' /* a /* b */ c */  ; "
    expect(compactTextSql(sql, 'postgresql')).toBe(
      "select $body$a  b\n-- text$body$, E'a\\\'  b' /* a /* b */ c */ ;",
    )
    expect(
      transformTextSql(
        'select $$a  b$$;',
        { ...sqlOptions, dialect: 'postgresql' },
        true,
      ),
    ).toContain('$$a  b$$')
  })
  it('preserves MySQL backslash quotes, hash comments and SQLite identifiers', () => {
    expect(
      compactTextSql("select 'a\\\'  b' # keep  this\n, `x  y`", 'mysql'),
    ).toBe("select 'a\\\'  b' # keep  this\n, `x  y`")
    expect(
      transformTextSql(
        'select [a  b] from [table];',
        { ...sqlOptions, dialect: 'sqlite' },
        true,
      ),
    ).toContain('[a  b]')
  })
  it('reports malformed SQL instead of returning partial text', () => {
    expect(() => transformTextSql("select 'unterminated", sqlOptions)).toThrow()
    expect(() => compactTextSql('/* unclosed', 'sql')).toThrow()
    expect(() => compactTextSql('select $tag$unclosed', 'postgresql')).toThrow()
  })
})

describe('composable text batch operations', () => {
  it('normalizes CRLF/CR, deduplicates after trimming, sorts numbers and adds wrappers', () => {
    const result = processTextBatch(' item10\r\nitem2\r \r\nitem2\r\n林 ', {
      ...textBatchDefaults,
      dedupe: true,
      sort: 'asc',
      prefix: '[',
      suffix: ']',
      delimiter: ', ',
    })
    expect(result).toEqual({
      output: '[item2], [item10], [林]',
      inputCount: 5,
      outputCount: 3,
      characters: 22,
    })
  })
  it('can preserve blank rows and whitespace; counts Unicode code points', () => {
    expect(
      processTextBatch(' 🌍 \r\n\r\nx', {
        ...textBatchDefaults,
        trim: false,
        dropBlank: false,
      }).output,
    ).toBe(' 🌍 \n\nx')
    expect(processTextBatch('🌍', textBatchDefaults).characters).toBe(1)
    expect(processTextBatch('', textBatchDefaults)).toEqual({
      output: '',
      inputCount: 0,
      outputCount: 0,
      characters: 0,
    })
  })
  it('uses the selected locale and reverses consistently', () => {
    expect(
      processTextBatch('ä\nz', { ...textBatchDefaults, sort: 'asc' }, 'sv')
        .output,
    ).toBe('z\nä')
    expect(
      processTextBatch('ä\nz', { ...textBatchDefaults, sort: 'asc' }, 'de')
        .output,
    ).toBe('ä\nz')
    expect(
      processTextBatch('item2\nitem10', { ...textBatchDefaults, sort: 'desc' })
        .output,
    ).toBe('item10\nitem2')
  })
  it('escapes SQL apostrophes and rejects dialect-dependent backslashes/nulls', () => {
    expect(
      processTextBatch("O'Reilly\nx'); DROP TABLE users; --", {
        ...textBatchDefaults,
        sqlIn: true,
      }).output,
    ).toBe("IN ('O''Reilly', 'x''); DROP TABLE users; --')")
    expect(
      processTextBatch('', { ...textBatchDefaults, sqlIn: true }).output,
    ).toBe('')
    for (const input of ['a\\b', 'a\0b'])
      expect(() =>
        processTextBatch(input, { ...textBatchDefaults, sqlIn: true }),
      ).toThrow('sqlUnsafe')
  })
})

describe('SSR-safe string escaping', () => {
  const original = '  你好 🌍 "quote"\r\n\t\\\0  '
  it('round-trips JSON strings without trimming any input', () => {
    const encoded = transformTextEscape(original, 'json', false)
    expect(JSON.parse(encoded)).toBe(original)
    expect(transformTextEscape(encoded, 'json', true)).toBe(original)
    expect(() => transformTextEscape('not json', 'json', true)).toThrow(
      'invalidJson',
    )
    expect(() => transformTextEscape('false', 'json', true)).toThrow(
      'stringRequired',
    )
  })
  it('round-trips supplementary and lone surrogate UTF-16 units', () => {
    const text = original + '\ud800'
    const encoded = transformTextEscape(text, 'unicode', false)
    expect(encoded).toContain('\\ud83c\\udf0d')
    expect(transformTextEscape(encoded, 'unicode', true)).toBe(text)
    expect(transformTextEscape(' x \\u0041 ', 'unicode', true)).toBe(' x A ')
    expect(() => transformTextEscape('\\u12xz', 'unicode', true)).toThrow(
      'invalidUnicode',
    )
  })
  it('supports the HTML entity set and never interprets markup', () => {
    const markup = ' <img src=x onerror="alert(1)"> & \' 🌍 '
    const encoded = transformTextEscape(markup, 'html', false)
    expect(encoded).toContain('&lt;img')
    expect(transformTextEscape(encoded, 'html', true)).toBe(markup)
    expect(
      transformTextEscape(
        '&copy; &NotEqualTilde; &#x1F30D; &#65;',
        'html',
        true,
      ),
    ).toBe('© ≂̸ 🌍 A')
    expect(transformTextEscape('&amp;lt;', 'html', true)).toBe('&lt;')
  })
  it.each([false, 0, null, { ok: false, n: 0 }, ['🌍']])(
    'unwraps nested strings containing %j',
    (value) => {
      expect(
        JSON.parse(
          transformTextEscape(
            JSON.stringify(JSON.stringify(value)),
            'nested',
            true,
          ),
        ),
      ).toEqual(value)
    },
  )
  it('preserves final text and bounds nested decode depth', () => {
    expect(
      transformTextEscape(JSON.stringify('  final text\n '), 'nested', true, 1),
    ).toBe('  final text\n ')
    const input = JSON.stringify(JSON.stringify(JSON.stringify({ ok: true })))
    expect(() => transformTextEscape(input, 'nested', true, 1)).toThrow(
      'depthError',
    )
    expect(() => transformTextEscape('oops', 'nested', true)).toThrow(
      'invalidJson',
    )
    expect(() => transformTextEscape(input, 'nested', true, 21)).toThrow(
      'depthError',
    )
  })
})

describe('bounded safe JSONPath queries', () => {
  const input = JSON.stringify({
    store: {
      books: [
        { title: 'A', price: 12, active: true },
        { title: '林', price: 0, active: false },
      ],
      note: null,
    },
    values: [null, false, 0],
    'odd.key': 42,
  })
  const query = (path: string) =>
    JSON.parse(queryTextJsonPath(input, path).output)
  it('supports nested lookups, wildcards, recursive descent, quoted keys, slices and unions', () => {
    expect(query('$.store.books[*].title')).toEqual(['A', '林'])
    expect(query('$..title')).toEqual(['A', '林'])
    expect(query("$['odd.key']")).toEqual([42])
    expect(query('$.values[0:2]')).toEqual([null, false])
    expect(query('$.values[0,2]')).toEqual([null, 0])
  })
  it('supports safe comparison and boolean filters including nested member access', () => {
    expect(
      query('$.store.books[?(@.price < 10 && @.active === false)].title'),
    ).toEqual(['林'])
    expect(
      query('$.store.books[?(!@.active || (@.price >= 12))].title'),
    ).toEqual(['A', '林'])
    expect(query("$.store.books[?(@['price'] === 0)].title")).toEqual(['林'])
    expect(
      JSON.parse(
        queryTextJsonPath(
          '[{"name":"constructor"}]',
          '$[?(@.name === "constructor")].name',
        ).output,
      ),
    ).toEqual(['constructor'])
  })
  it('preserves false/zero/null and returns matching paths or an empty list', () => {
    expect(query('$.values[*]')).toEqual([null, false, 0])
    expect(query('$.missing')).toEqual([])
    expect(
      JSON.parse(queryTextJsonPath(input, '$.values[1]', true).output),
    ).toEqual([{ path: "$['values'][1]", value: false }])
    for (const value of [null, false, 0])
      expect(
        JSON.parse(queryTextJsonPath(JSON.stringify(value), '$').output),
      ).toEqual([value])
  })
  it.each([
    '$[?(@.constructor.constructor("return globalThis")())]',
    '$[?(@.__proto__)]',
    '$[?(@["constr\\u0075ctor"])]',
    '$[?(@.x = 2)]',
    '$[?(@.x.toString())]',
    '$[?((globalThis.alert(1)))]',
    '$[(1+1)]',
    '$[?(@["con" + "structor"])]',
    '$[?(/x/.test(@.x))]',
    '$[?(@.x; true)]',
    '$.__proto__',
    '$[?(@.x => true)]',
  ])('rejects unsafe or executable expression %s', (path) => {
    expect(() => queryTextJsonPath(input, path)).toThrow()
  })
  it('validates paths even when input has no matching nodes', () => {
    expect(() => queryTextJsonPath('[]', '$[?(alert(1))]')).toThrow('unsafe')
    for (const path of [
      'foo',
      '$.',
      '$[',
      '$[]',
      '$.values[::0]',
      '$[?(@.x <)]',
    ])
      expect(() => validateTextJsonPath(path)).toThrow()
    expect(() => queryTextJsonPath('{bad', '$')).toThrow('invalidJson')
  })
  it('bounds document size, nesting and path length', () => {
    expect(() => queryTextJsonPath(' '.repeat(1_000_001), '$')).toThrow('limit')
    expect(() =>
      queryTextJsonPath('['.repeat(66) + '0' + ']'.repeat(66), '$..*'),
    ).toThrow('limit')
    expect(() => validateTextJsonPath('$' + '.x'.repeat(1001))).toThrow('limit')
  })
})
