import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { LocaleProvider } from '@/i18n/compat'
import { formatNetworkYaml, validateJsonSchema } from '@/lib/network-additions'
import { parseEnhancedCurl } from '@/lib/curl-enhanced'
import { startSchemaValidation } from '@/lib/network-schema-client'
import JwtDecoder from '../[locale]/tools/jwt-decoder/page'
import CurlConverter from '../[locale]/tools/curl-converter/page'
import BinaryConverter from '../[locale]/tools/binary-encoder-decoder/page'
import XmlConverter from '../[locale]/tools/xml-to-json/page'

function mount(Component: React.ComponentType) {
  return render(
    <BrowserRouter>
      <LocaleProvider locale="en">
        <Component />
      </LocaleProvider>
    </BrowserRouter>,
  )
}
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

class ControlledWorker {
  static instances: ControlledWorker[] = []
  onmessage: ((event: { data: unknown }) => void) | null = null
  onerror: (() => void) | null = null
  postMessage = vi.fn()
  terminate = vi.fn()
  constructor() {
    ControlledWorker.instances.push(this)
  }
}

describe('final review regression cases', () => {
  it.each([
    'id: 9007199254740993',
    'nested: {id: -9007199254740993}',
    'items: [9007199254740993]',
  ])('rejects numbers that would silently lose precision: %s', (input) => {
    expect(() => formatNetworkYaml(input)).toThrow('precisionError')
  })
  it('preserves quoted large IDs, ordinary numbers, and safe aliases', () => {
    const output = formatNetworkYaml(
      'id: "9007199254740993"\ncount: 42\nvalue: 1.25\nlist: &values [1, 2]\ncopy: *values',
    )
    expect(output).toContain('9007199254740993')
    expect(output).toContain('count: 42')
    expect(output).toContain('value: 1.25')
  })
  it('rejects async validators before invoking their rejecting Promise', () => {
    expect(() =>
      validateJsonSchema('{"$async":true,"type":"number"}', '"abc"'),
    ).toThrow('schemaError')
    expect(validateJsonSchema('{"type":"number"}', '123')).toEqual({
      valid: true,
      errors: [],
    })
  })
  it.each(['-d', '--data', '--data-raw', '--data-binary'])(
    'retains curl form content type for %s',
    (option) => {
      expect(
        parseEnhancedCurl(`curl https://example.com/login ${option} 'name=Ada'`)
          .headers,
      ).toEqual({ 'Content-Type': 'application/x-www-form-urlencoded' })
    },
  )
  it('respects explicit and suppressed content types, JSON headers and GET query mode', () => {
    expect(
      parseEnhancedCurl(
        `curl https://example.com -H 'content-type: text/plain' --json '{}'`,
      ).headers,
    ).toEqual({ 'content-type': 'text/plain', Accept: 'application/json' })
    expect(
      parseEnhancedCurl(`curl https://example.com -H 'Content-Type:' -d a=1`)
        .headers,
    ).toEqual({ 'Content-Type': '' })
    expect(
      parseEnhancedCurl(`curl https://example.com --json '{}'`).headers,
    ).toEqual({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    })
    expect(
      parseEnhancedCurl(`curl https://example.com -G -d a=1`).headers,
    ).toEqual({})
  })
  it('terminates schema validation at its deadline and ignores late messages', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('Worker', ControlledWorker)
    const job = startSchemaValidation('{}', '{}')
    const worker = ControlledWorker.instances.at(-1)!
    const rejected = expect(job.promise).rejects.toMatchObject({
      code: 'timeout',
    })
    await vi.advanceTimersByTimeAsync(2000)
    await rejected
    expect(worker.terminate).toHaveBeenCalledOnce()
    worker.onmessage?.({ data: { result: { valid: true, errors: [] } } })
    expect(worker.terminate).toHaveBeenCalledOnce()
  })
  it('cancels schema workers and clears deadlines after a normal response', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('Worker', ControlledWorker)
    const first = startSchemaValidation('{}', '{}')
    const rejected = expect(first.promise).rejects.toMatchObject({
      code: 'workerError',
    })
    first.cancel()
    await rejected
    const second = startSchemaValidation('{}', '{}')
    const worker = ControlledWorker.instances.at(-1)!
    worker.onmessage?.({ data: { result: { valid: false, errors: [] } } })
    await expect(second.promise).resolves.toEqual({ valid: false, errors: [] })
    expect(vi.getTimerCount()).toBe(0)
  })
  it('renders object-valued JWT time claims without invoking their coercion hooks', () => {
    mount(JwtDecoder)
    const encode = (value: unknown) =>
      Buffer.from(JSON.stringify(value)).toString('base64url')
    const token = `${encode({ alg: 'none' })}.${encode({ exp: { toString: null }, iat: [1, 2], nbf: null })}.`
    fireEvent.change(screen.getByTestId('jwt-token'), {
      target: { value: token },
    })
    fireEvent.click(screen.getByTestId('jwt-decode'))
    expect(screen.getByTestId('jwt-claims')).toHaveTextContent(
      '{"toString":null}',
    )
    expect(screen.getByTestId('jwt-claims')).toHaveTextContent('[1,2]')
    expect(screen.getByTestId('jwt-verification')).toHaveTextContent(
      'Signature not verified',
    )
  })
  it.each(['edit', 'clear'])(
    'discards a delayed HTTP response after request %s',
    async (action) => {
      let resolve!: (response: unknown) => void
      const fetchMock = vi.fn(
        () =>
          new Promise((done) => {
            resolve = done
          }),
      )
      vi.stubGlobal('fetch', fetchMock)
      mount(CurlConverter)
      fireEvent.change(screen.getByTestId('curl-url'), {
        target: { value: 'https://example.com/a' },
      })
      fireEvent.click(screen.getByTestId('curl-send'))
      const signal = (
        fetchMock.mock.calls[0] as unknown as [string, RequestInit]
      )[1].signal
      if (action === 'edit')
        fireEvent.change(screen.getByTestId('curl-url'), {
          target: { value: 'https://example.com/b' },
        })
      else fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
      expect(signal?.aborted).toBe(true)
      await act(async () => {
        resolve({
          ok: true,
          json: async () => ({
            status: 200,
            statusText: 'OK',
            headers: {},
            body: 'stale response A',
          }),
        })
        await Promise.resolve()
      })
      expect(screen.queryByTestId('curl-status')).toBeNull()
      expect(screen.queryByText('stale response A')).toBeNull()
      expect(screen.getByTestId('curl-send')).not.toHaveTextContent('Sending')
    },
  )
  it('round-trips Unicode and rejects invalid UTF-8 binary data', () => {
    mount(BinaryConverter)
    const [input, output] = screen.getAllByRole(
      'textbox',
    ) as HTMLTextAreaElement[]
    const source = '\uFEFFHello 世界 🌍 café'
    fireEvent.change(input, { target: { value: source } })
    fireEvent.click(screen.getByRole('button', { name: /Encode/ }))
    const encoded = output.value
    expect(encoded.split(' ').every((byte) => byte.length === 8)).toBe(true)
    fireEvent.change(input, { target: { value: encoded } })
    fireEvent.click(screen.getByRole('button', { name: /Decode/ }))
    expect(output).toHaveValue(source)
    fireEvent.change(input, { target: { value: '11111111' } })
    fireEvent.click(screen.getByRole('button', { name: /Decode/ }))
    expect(output).toHaveValue('')
  })
  it('rejects mismatched XML tags and clears a previously valid conversion', async () => {
    mount(XmlConverter)
    const [input, output] = screen.getAllByRole(
      'textbox',
    ) as HTMLTextAreaElement[]
    fireEvent.change(input, {
      target: { value: '<root><name>Ada</name></root>' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }))
    expect(JSON.parse(output.value)).toEqual({ root: { name: 'Ada' } })
    fireEvent.change(input, { target: { value: '<root><name>Ada</root>' } })
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }))
    await waitFor(() => expect(output).toHaveValue(''))
  })
})
