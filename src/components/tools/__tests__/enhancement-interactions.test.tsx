import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/i18n/compat'
import en from '@/i18n/messages/en.json'
import additions from '@/i18n/messages/enhancement-additions/en.json'
import TimeTool from '@/components/tools/time-converter/time-converter-tool'
import CurlTool from '@/app/[locale]/tools/curl-converter/page'
import JsonTool from '@/app/[locale]/tools/json-generator/page'
import { ENHANCED_TEMPLATE_KEY } from '@/lib/curl-enhanced'

const messages = {
  ...en,
  tools: {
    ...en.tools,
    ...Object.fromEntries(
      Object.entries(additions.tools).map(([key, values]) => [
        key,
        { ...en.tools[key as keyof typeof en.tools], ...values },
      ]),
    ),
  },
}
function mount(Component: React.ComponentType) {
  return render(
    <BrowserRouter>
      <LocaleProvider locale="en" initialMessages={messages}>
        <Component />
      </LocaleProvider>
    </BrowserRouter>,
  )
}
function change(id: string, value: string) {
  fireEvent.change(screen.getByTestId(id), { target: { value } })
}
function value(id: string) {
  return (screen.getByTestId(id) as HTMLInputElement).value
}
beforeEach(() => localStorage.clear())
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('enhanced time UI', () => {
  it('changes units and zone, accepts ISO and computes an exact difference', () => {
    mount(TimeTool)
    change('time-zone', 'UTC')
    change('time-unit', 'seconds')
    change('time-timestamp', '0')
    expect(screen.getByTestId('time-iso')).toHaveTextContent(
      '1970-01-01T00:00:00.000Z',
    )
    change('time-date', '2025-01-01T00:00:00+08:00')
    expect(screen.getByTestId('time-result')).toHaveTextContent('1735660800')
    change('time-end', '2025-01-02T00:00:00+08:00')
    expect(screen.getByTestId('time-difference')).toHaveTextContent('86400000')
    change('time-unit', 'milliseconds')
    expect(screen.getByTestId('time-result')).toHaveTextContent('1735660800000')
    change('time-zone', 'Invalid/Zone')
    expect(screen.queryByTestId('time-result')).not.toBeInTheDocument()
    expect(screen.queryByTestId('time-iso')).not.toBeInTheDocument()
  })
  it('rejects impossible dates and DST gaps without stale results', () => {
    mount(TimeTool)
    change('time-zone', 'America/New_York')
    change('time-date', '2024-11-03 01:30:00')
    expect(screen.getByTestId('time-result')).toHaveTextContent(
      String(Date.parse('2024-11-03T05:30:00Z')),
    )
    change('time-date', '2024-03-10 02:30:00')
    expect(screen.queryByTestId('time-result')).not.toBeInTheDocument()
    change('time-date', '2025-02-29 00:00:00')
    expect(screen.queryByTestId('time-result')).not.toBeInTheDocument()
  })
})
describe('enhanced curl UI', () => {
  it('edits query and headers, sends only through proxy and shows upstream metadata', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 201,
          statusText: 'Created',
          headers: { 'X-Fixture': 'local' },
          body: '{"ok":true}',
        }),
      })
    vi.stubGlobal('fetch', fetchMock)
    mount(CurlTool)
    change(
      'curl-input',
      `curl 'https://example.com/items?q=old' -X POST -H 'X-Test: old' --data-raw '{"n":0}'`,
    )
    fireEvent.click(screen.getByTestId('curl-convert'))
    change('curl-query-value-0', 'two words')
    change('curl-headers-value-0', "O'Reilly")
    fireEvent.click(screen.getByTestId('curl-send'))
    await waitFor(() =>
      expect(screen.getByTestId('curl-status')).toHaveTextContent(
        '201 Created',
      ),
    )
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/proxy')
    expect(JSON.parse(init.body)).toEqual({
      url: 'https://example.com/items?q=two+words',
      method: 'POST',
      headers: {
        'X-Test': "O'Reilly",
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: '{"n":0}',
    })
    expect(screen.getByTestId('curl-response-headers')).toHaveTextContent(
      'X-Fixture',
    )
    expect(screen.getByTestId('curl-timing')).toHaveTextContent(/\d+ ms/)
    expect(JSON.parse(value('curl-response'))).toEqual({ ok: true })
    change('curl-body-mode', 'json')
    change('curl-body', '{bad')
    expect(value('curl-output')).toBe('')
    expect(screen.getByTestId('curl-send')).toBeDisabled()
    expect(screen.queryByTestId('curl-status')).not.toBeInTheDocument()
  })
  it('shows proxy rejection and clears output after malformed commands', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({
          ok: false,
          json: async () => ({ error: 'url host is not publicly reachable' }),
        }),
    )
    mount(CurlTool)
    change('curl-url', 'http://127.0.0.1')
    fireEvent.click(screen.getByTestId('curl-send'))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'not publicly reachable',
      ),
    )
    change('curl-input', 'curl "broken')
    fireEvent.click(screen.getByTestId('curl-convert'))
    expect(value('curl-output')).toBe('')
    expect(screen.getByTestId('curl-send')).toBeDisabled()
  })
  it('persists only on save and restores sanitized templates after remount', () => {
    const first = mount(CurlTool)
    change(
      'curl-input',
      `curl 'https://example.com/secret-path?token=secret-query' -H 'Authorization: secret-header' -d 'password=secret-body'`,
    )
    fireEvent.click(screen.getByTestId('curl-convert'))
    expect(localStorage.getItem(ENHANCED_TEMPLATE_KEY)).toBeNull()
    fireEvent.click(screen.getByTestId('curl-save'))
    const saved = localStorage.getItem(ENHANCED_TEMPLATE_KEY)!
    expect(saved).not.toContain('secret')
    expect(JSON.parse(saved)).toHaveLength(1)
    first.unmount()
    mount(CurlTool)
    fireEvent.click(screen.getByTestId('curl-template-0'))
    expect(value('curl-url')).toBe('https://example.com/')
    expect(value('curl-body')).toBe('')
  })
})
describe('enhanced generator UI', () => {
  it('repeats seeds, changes seeds, generates Chinese data, boundaries and exact row counts', () => {
    mount(JsonTool)
    change('json-seed', 'seed-a')
    change('json-rows', '3')
    fireEvent.click(screen.getByTestId('json-generate'))
    const first = value('json-output')
    fireEvent.click(screen.getByTestId('json-generate'))
    expect(value('json-output')).toBe(first)
    change('json-seed', 'seed-b')
    fireEvent.click(screen.getByTestId('json-generate'))
    expect(value('json-output')).not.toBe(first)
    change('json-min-0', '-5')
    change('json-max-0', '0')
    change('json-data-locale', 'zh')
    fireEvent.click(screen.getByTestId('json-boundary'))
    fireEvent.click(screen.getByTestId('json-generate'))
    const data = JSON.parse(value('json-output'))
    expect(data).toHaveLength(3)
    expect(data.map((row: { id: number }) => row.id)).toEqual([-5, 0, -5])
    expect(data[0].name).toMatch(/[\u4e00-\u9fff]/)
    change('json-null', '1')
    fireEvent.click(screen.getByTestId('json-generate'))
    expect(
      JSON.parse(value('json-output')).every((row: Record<string, unknown>) =>
        Object.values(row).every((v) => v === null),
      ),
    ).toBe(true)
  })
  it('accepts string length constraints, object format and rejects excessive rows without stale output', () => {
    mount(JsonTool)
    change('json-type-1', 'string')
    change('json-length-1', '0')
    change('json-format', 'object')
    fireEvent.click(screen.getByTestId('json-generate'))
    const data = JSON.parse(value('json-output'))
    expect(data.count).toBe(5)
    expect(data.data[0].name).toBe('')
    change('json-rows', '1001')
    fireEvent.click(screen.getByTestId('json-generate'))
    expect(value('json-output')).toBe('')
    expect(screen.getByRole('alert')).toHaveTextContent('Check unique')
    change('json-rows', '1')
    change('json-null', '2')
    fireEvent.click(screen.getByTestId('json-generate'))
    expect(value('json-output')).toBe('')
  })
})
