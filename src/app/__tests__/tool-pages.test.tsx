import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/i18n/compat'

const pageModules = import.meta.glob('../[locale]/tools/*/page.tsx', {
  eager: true,
}) as Record<string, { default: React.ComponentType }>

const pages = Object.entries(pageModules).sort(([left], [right]) => left.localeCompare(right))

beforeAll(() => {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
})

afterEach(() => cleanup())

function renderTool(toolId: string) {
  const Page = pageModules[`../[locale]/tools/${toolId}/page.tsx`]?.default
  if (!Page) throw new Error(`Missing page module for ${toolId}`)
  return render(
    <BrowserRouter>
      <LocaleProvider locale="en">
        <Page />
      </LocaleProvider>
    </BrowserRouter>,
  )
}

describe('tool page smoke rendering', () => {
  it('discovers every tool page module', () => {
    expect(pages.length).toBeGreaterThan(0)
    expect(pages.every(([, module]) => typeof module.default === 'function')).toBe(true)
  })

  it.each(pages)('renders %s without throwing', (_path, module) => {
    const { container } = render(
      <BrowserRouter>
        <LocaleProvider locale="en">
          <module.default />
        </LocaleProvider>
      </BrowserRouter>,
    )
    expect(container.firstElementChild).not.toBeNull()
  })
})

describe('tool interactions', () => {
  it('formats and minifies valid JSON from the input field', () => {
    renderTool('json-formatter')
    const [input, output] = screen.getAllByRole('textbox') as HTMLTextAreaElement[]
    fireEvent.change(input, { target: { value: '{"ok":true,"count":0}' } })
    fireEvent.click(screen.getByRole('button', { name: 'Format' }))
    expect(output).toHaveValue(`{
  "ok": true,
  "count": 0
}`)
    fireEvent.click(screen.getByRole('button', { name: 'Minify' }))
    expect(output).toHaveValue('{"ok":true,"count":0}')
  })

  it('converts nested JSON to escaped CSV while preserving false and zero values', () => {
    renderTool('json-to-csv')
    const [input, output] = screen.getAllByRole('textbox') as HTMLTextAreaElement[]
    fireEvent.change(input, {
      target: { value: '[{"name":"Alice, A","nested":{"age":0},"active":false}]' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }))
    expect(output).toHaveValue('active,name,nested.age\nfalse,"Alice, A",0')
  })

  it('encodes and decodes non-ASCII Base64 text', () => {
    renderTool('base64-encoder-decoder')
    const [input, output] = screen.getAllByRole('textbox') as HTMLTextAreaElement[]
    const text = '你好 🌍'
    fireEvent.change(input, { target: { value: text } })
    fireEvent.click(screen.getByRole('button', { name: 'Encode' }))
    const encoded = btoa(unescape(encodeURIComponent(text)))
    expect(output).toHaveValue(encoded)
    fireEvent.change(input, { target: { value: encoded } })
    fireEvent.click(screen.getByRole('button', { name: 'Decode' }))
    expect(output).toHaveValue(text)
  })

  it('converts JSON to YAML and clears invalid output after malformed JSON', () => {
    renderTool('json-to-yaml')
    const [input, output] = screen.getAllByRole('textbox') as HTMLTextAreaElement[]
    fireEvent.change(input, { target: { value: '{"name":"Ada","active":false}' } })
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }))
    expect(output).toHaveValue('name: Ada\nactive: false\n')
    fireEvent.change(input, { target: { value: '{bad json' } })
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }))
    expect(output).toHaveValue('')
    expect(screen.getByText(/invalid json/i)).toBeInTheDocument()
  })
})

  it('converts CSV to typed JSON and restores dotted keys as nested objects', () => {
    renderTool('csv-to-json')
    const [input, output] = screen.getAllByRole('textbox') as HTMLTextAreaElement[]
    fireEvent.change(input, { target: { value: 'user.name,age,active\nAda,0,false' } })
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }))
    expect(JSON.parse(output.value)).toEqual([{ user: { name: 'Ada' }, age: 0, active: false }])
  })

  it('converts JSON to XML while escaping markup in values', () => {
    renderTool('json-to-xml')
    const input = screen.getAllByRole('textbox').find((element) => element.tagName === 'TEXTAREA') as HTMLTextAreaElement
    const output = screen.getAllByRole('textbox').filter((element) => element.tagName === 'TEXTAREA')[1] as HTMLTextAreaElement
    fireEvent.change(input, { target: { value: '{"message":"<tag>&"}' } })
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }))
    expect(output.value).toContain('<message>&lt;tag&gt;&amp;</message>')
  })

  it('converts XML into JSON structures', () => {
    renderTool('xml-to-json')
    const [input, output] = screen.getAllByRole('textbox') as HTMLTextAreaElement[]
    fireEvent.change(input, { target: { value: '<user><name>Ada</name><age>30</age></user>' } })
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }))
    expect(JSON.parse(output.value)).toEqual({ user: { name: 'Ada', age: 30 } })
  })

  it('converts JSON and TOML both ways', () => {
    renderTool('json-to-toml')
    const [input, output] = screen.getAllByRole('textbox') as HTMLTextAreaElement[]
    fireEvent.change(input, { target: { value: '{"title":"Demo","enabled":false}' } })
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }))
    expect(output.value).toContain('title = "Demo"')
    cleanup()

    renderTool('toml-to-json')
    const [tomlInput, jsonOutput] = screen.getAllByRole('textbox') as HTMLTextAreaElement[]
    fireEvent.change(tomlInput, { target: { value: 'title = "Demo"\nenabled = false' } })
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }))
    expect(JSON.parse(jsonOutput.value)).toEqual({ title: 'Demo', enabled: false })
  })

  it('encrypts and decrypts text with AES using a supplied key and IV', () => {
    renderTool('aes-encrypt-decrypt')
    const [input, output] = screen.getAllByRole('textbox').filter((element) => element.tagName === 'TEXTAREA') as HTMLTextAreaElement[]
    fireEvent.change(input, { target: { value: 'round-trip secret' } })
    fireEvent.change(screen.getByLabelText(/key/i), { target: { value: '1234567890123456' } })
    fireEvent.change(screen.getByLabelText(/initialization vector/i), { target: { value: 'abcdefghijklmnop' } })
    fireEvent.click(screen.getByRole('button', { name: 'Encrypt' }))
    const ciphertext = output.value
    expect(ciphertext).not.toBe('')
    fireEvent.change(input, { target: { value: ciphertext } })
    fireEvent.click(screen.getByRole('button', { name: 'Decrypt' }))
    expect(output).toHaveValue('round-trip secret')
  })

  it('generates the standard MD5 digest for known input', async () => {
    renderTool('md5-hash')
    const [input, output] = screen.getAllByRole('textbox') as HTMLTextAreaElement[]
    fireEvent.change(input, { target: { value: 'The quick brown fox jumps over the lazy dog' } })
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }))
    await waitFor(() => expect(output).toHaveValue('9e107d9d372bb6826bd81d3542a419d6'))
  })

  it('generates the standard SHA-1 and SHA-256 digests for known input', async () => {
    const knownInput = 'The quick brown fox jumps over the lazy dog'
    renderTool('sha1-hash')
    let [input, output] = screen.getAllByRole('textbox') as HTMLTextAreaElement[]
    fireEvent.change(input, { target: { value: knownInput } })
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }))
    await waitFor(() => expect(output).toHaveValue('2fd4e1c67a2d28fced849ee1bb76e7391b93eb12'))
    cleanup()

    renderTool('sha256-hash')
    ;[input, output] = screen.getAllByRole('textbox') as HTMLTextAreaElement[]
    fireEvent.change(input, { target: { value: knownInput } })
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }))
    await waitFor(() => expect(output).toHaveValue('d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592'))
  })
