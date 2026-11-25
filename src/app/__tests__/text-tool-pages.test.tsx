import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { LocaleProvider } from '@/i18n/compat'
import base from '@/i18n/messages/en.json'
import additions from '@/i18n/messages/text-additions/en.json'
import SqlFormatter from '../[locale]/tools/sql-formatter/page'
import TextBatch from '../[locale]/tools/text-batch-processor/page'
import StringEscape from '../[locale]/tools/string-escape/page'
import JsonPath from '../[locale]/tools/jsonpath-query/page'

const messages = { ...base, tools: { ...base.tools, ...additions.tools } }
const input = (id: string, value: string) =>
  fireEvent.change(screen.getByTestId(id), { target: { value } })
const click = (id: string) => fireEvent.click(screen.getByTestId(id))
const output = () =>
  (screen.getByTestId('tool-output') as HTMLTextAreaElement).value
const show = (Page: React.ComponentType) =>
  render(
    <LocaleProvider locale="en" initialMessages={messages}>
      <Page />
    </LocaleProvider>,
  )
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('text tool UI state transitions', () => {
  it('formats, changes SQL mode and casing, clears stale output and shows a local parser error', () => {
    show(SqlFormatter)
    input('sql-input', "select 'a  b' from users;")
    click('sql-format')
    expect(output()).toContain("SELECT\n  'a  b'")
    input('sql-casing', 'lower')
    expect(output()).toBe('')
    click('sql-minify')
    expect(output()).toContain("select 'a  b' from users;")
    input('sql-input', "select 'unclosed")
    click('sql-format')
    expect(output()).toBe('')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unable to format this SQL',
    )
    click('sql-example')
    expect(screen.queryByRole('alert')).toBeNull()
    click('sql-clear')
    expect(screen.getByTestId('sql-input')).toHaveValue('')
  })
  it('combines batch operations, changes delimiters and switches to safely quoted SQL', () => {
    show(TextBatch)
    input('batch-input', " O'Reilly\nAda\nAda\n\n🌍")
    click('batch-dedupe')
    input('batch-sort', 'asc')
    input('batch-prefix', '[')
    input('batch-suffix', ']')
    input('batch-delimiter', ', ')
    click('batch-run')
    expect(output()).toContain('[Ada]')
    expect(output()).not.toContain('[Ada], [Ada]')
    expect(screen.getByTestId('batch-counts')).toHaveTextContent(
      'Output: 3 lines',
    )
    click('batch-sqlIn')
    expect(output()).toBe('')
    expect(screen.getByTestId('batch-delimiter')).toBeDisabled()
    click('batch-run')
    expect(output()).toContain("'[O''Reilly]'")
    input('batch-input', 'a\\b')
    click('batch-run')
    expect(output()).toBe('')
    expect(screen.getByRole('alert')).toHaveTextContent('backslashes')
    expect(screen.getByTestId('batch-counts')).toBeEmptyDOMElement()
  })
  it('preserves JSON input whitespace, supports unicode and resets after bad decode', () => {
    show(StringEscape)
    const text = '  你好 🌍\n  '
    input('escape-input', text)
    click('escape-encode')
    expect(JSON.parse(output())).toBe(text)
    input('escape-input', output())
    click('escape-decode')
    expect(output()).toBe(text)
    input('escape-mode', 'unicode')
    expect(output()).toBe('')
    input('escape-input', '🌍')
    click('escape-encode')
    expect(output()).toBe('\\ud83c\\udf0d')
    input('escape-input', '\\uxxxx')
    click('escape-decode')
    expect(output()).toBe('')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Invalid Unicode escape',
    )
  })
  it('renders decoded markup as plain text and bounds nested JSON decoding', () => {
    const { container } = show(StringEscape)
    input('escape-mode', 'html')
    input('escape-input', '&lt;img src=x onerror=alert(1)&gt;')
    click('escape-decode')
    expect(output()).toBe('<img src=x onerror=alert(1)>')
    expect(container.querySelector('img')).toBeNull()
    input('escape-mode', 'nested')
    expect(screen.queryByTestId('escape-encode')).toBeNull()
    input(
      'escape-input',
      JSON.stringify(JSON.stringify({ ok: false, count: 0 })),
    )
    input('escape-depth', '1')
    click('escape-decode')
    expect(screen.getByRole('alert')).toHaveTextContent('depth')
    input('escape-depth', '5')
    click('escape-decode')
    expect(JSON.parse(output())).toEqual({ ok: false, count: 0 })
    expect(screen.queryByRole('alert')).toBeNull()
  })
  it('runs nested JSONPath filters, includes paths and rejects unsafe or malformed input', () => {
    show(JsonPath)
    click('jsonpath-filter-example')
    click('jsonpath-run')
    expect(JSON.parse(output())).toEqual(['诗集'])
    click('jsonpath-paths')
    expect(output()).toBe('')
    click('jsonpath-run')
    expect(JSON.parse(output())[0]).toEqual({
      path: "$['store']['books'][1]['title']",
      value: '诗集',
    })
    input('jsonpath-expression', '$[?(@.constructor)]')
    click('jsonpath-run')
    expect(output()).toBe('')
    expect(screen.getByRole('alert')).toHaveTextContent('Unsafe expression')
    expect(screen.getByTestId('jsonpath-count')).toBeEmptyDOMElement()
    input('jsonpath-input', '{bad')
    click('jsonpath-run')
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid JSON input')
    click('jsonpath-clear')
    expect(screen.queryByRole('alert')).toBeNull()
  })
  it('copies the computed result through the shared output control', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    show(StringEscape)
    input('escape-input', '🌍')
    click('escape-encode')
    fireEvent.click(screen.getByRole('button', { name: /^copy$/i }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('"🌍"'))
  })
})

function leaves(value: unknown, prefix = ''): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).flatMap(([key, item]) =>
      typeof item === 'string'
        ? [[`${prefix}${key}`, item]]
        : Object.entries(leaves(item, `${prefix}${key}.`)),
    ),
  )
}
const locales = import.meta.glob('../../i18n/messages/text-additions/*.json', {
  eager: true,
  import: 'default',
})
describe('text additions translations', () => {
  it('provides all twelve languages with identical keys and interpolation parameters', () => {
    expect(Object.keys(locales)).toHaveLength(12)
    const english = leaves(additions)
    for (const dictionary of Object.values(locales)) {
      const translated = leaves(dictionary)
      expect(Object.keys(translated).sort()).toEqual(
        Object.keys(english).sort(),
      )
      for (const [key, value] of Object.entries(translated)) {
        expect(value.trim(), key).not.toBe('')
        expect(value.match(/\{\w+\}/g)?.sort(), key).toEqual(
          english[key].match(/\{\w+\}/g)?.sort(),
        )
      }
    }
  })
})
