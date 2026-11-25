import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { LocaleProvider } from '@/i18n/compat'
import type { Locale } from '@/i18n/config'
import {
  JsonSchemaValidator,
  UrlParser,
  NetworkFormatter,
  SubnetCalculator,
  NumberBaseConverter,
  CertificateParser,
} from '../network-additions'
import en from '@/i18n/messages/network-additions/en.json'
import { NetworkToolError, validateJsonSchema } from '@/lib/network-additions'

class SchemaWorkerStub {
  onmessage: ((event: { data: unknown }) => void) | null = null
  stopped = false
  postMessage({ schema, data }: { schema: string; data: string }) {
    queueMicrotask(() => {
      if (this.stopped) return
      try {
        this.onmessage?.({ data: { result: validateJsonSchema(schema, data) } })
      } catch (error) {
        this.onmessage?.({
          data: {
            error:
              error instanceof NetworkToolError ? error.code : 'schemaError',
          },
        })
      }
    })
  }
  terminate() {
    this.stopped = true
  }
}
beforeEach(() => vi.stubGlobal('Worker', SchemaWorkerStub))

const dictionaries = import.meta.glob(
  '../../../i18n/messages/network-additions/*.json',
  { eager: true, import: 'default' },
) as Record<string, typeof en>
const workbench = {
  input: 'Input',
  output: 'Output',
  run: 'Run',
  clear: 'Clear',
  example: 'Example',
  copy: 'Copy',
  copied: 'Copied',
  download: 'Download',
  copyError: 'Copy failed',
  local: 'Runs locally',
  error: 'Error',
  format: 'Format',
  minify: 'Minify',
  validate: 'Validate',
  options: 'Options',
  result: 'Result',
}
function mount(node: React.ReactNode) {
  return render(
    <LocaleProvider
      locale="en"
      initialMessages={{ tools: en.tools, workbench }}
    >
      {node}
    </LocaleProvider>,
  )
}
function fill(id: string, value: string) {
  fireEvent.change(screen.getByTestId(id), { target: { value } })
}
function run() {
  fireEvent.click(screen.getByTestId('tool-run'))
}
const output = () =>
  screen.getAllByTestId('tool-output')[0] as HTMLTextAreaElement

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
describe('network tool interactions', () => {
  it('validates edited data, exposes paths, and distinguishes invalid schemas', async () => {
    mount(<JsonSchemaValidator />)
    run()
    await waitFor(() => expect(output().value).toContain('Valid:'))
    fill('tool-input', '{"email":"broken","age":-2}')
    run()
    await waitFor(() => expect(output().value).toContain('/email'))
    expect(output().value).toContain('/age')
    fill('schema-input', '{"type":"bad"}')
    run()
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        en.tools['json-schema-validator'].schemaError,
      ),
    )
    expect(output()).toHaveValue('')
    fireEvent.click(screen.getByTestId('tool-example'))
    run()
    await waitFor(() => expect(output().value).toContain('Valid:'))
    fireEvent.click(screen.getByTestId('tool-clear'))
    expect(screen.getByTestId('schema-input')).toHaveValue('')
    expect(output()).toHaveValue('')
  })
  it('edits URL components, repeated parameters and empty values', async () => {
    mount(<UrlParser />)
    fill('tool-input', 'https://example.com/?a=1&a=2&empty=')
    run()
    await waitFor(() =>
      expect(screen.getByTestId('param-value-1')).toHaveValue('2'),
    )
    fill('url-port', '8080')
    fill('url-path', '/changed')
    fill('param-value-0', 'hello & 世界')
    fireEvent.click(screen.getByTestId('param-remove-1'))
    fireEvent.click(screen.getByTestId('param-add'))
    fill('param-key-2', 'new')
    fireEvent.click(screen.getByTestId('url-rebuild'))
    await waitFor(() => expect(output().value).toContain(':8080/changed'))
    const url = new URL(output().value)
    expect(url.searchParams.getAll('a')).toEqual(['hello & 世界'])
    expect(url.searchParams.get('empty')).toBe('')
    expect(url.searchParams.get('new')).toBe('')
    fill('tool-input', 'https://example.com/%ZZ')
    run()
    expect(screen.getByRole('alert')).toHaveTextContent(
      en.tools['url-parser'].encodingError,
    )
    expect(output()).toHaveValue('')
  })
  it('formats YAML, switches to validation and rejects executable tags', async () => {
    mount(<NetworkFormatter kind="yaml" />)
    fill('tool-input', 'items: [true, null, "001"]')
    run()
    await waitFor(() => expect(output().value).toContain('- true'))
    fill('formatter-mode', 'validate')
    run()
    await waitFor(() =>
      expect(output()).toHaveValue(en.tools['yaml-formatter'].valid),
    )
    fill('tool-input', 'value: !!js/function "function(){}"')
    run()
    expect(screen.getByRole('alert')).toHaveTextContent(
      en.tools['yaml-formatter'].yamlError,
    )
  })
  it('formats and compacts XML without changing mixed text content', async () => {
    mount(<NetworkFormatter kind="xml" />)
    const source =
      '<?xml version="1.0"?><root a="1"><p>Hello <b>world</b>!</p><x>  keep \n space </x></root>'
    fill('tool-input', source)
    run()
    await waitFor(() =>
      expect(output().value).toContain('<p>Hello <b>world</b>!</p>'),
    )
    const document = new DOMParser().parseFromString(
      output().value,
      'application/xml',
    )
    expect(document.querySelector('root')?.getAttribute('a')).toBe('1')
    expect(document.querySelector('x')?.textContent).toBe('  keep \n space ')
    fill('formatter-mode', 'minify')
    run()
    await waitFor(() => expect(output()).toHaveValue(source))
    fill('formatter-mode', 'validate')
    run()
    await waitFor(() =>
      expect(output()).toHaveValue(en.tools['xml-formatter'].valid),
    )
    fill('tool-input', '<a><b></a>')
    run()
    expect(screen.getByRole('alert')).toHaveTextContent(
      en.tools['xml-formatter'].xmlError,
    )
  })
  it('recalculates /31, /32, membership and invalid CIDR input', async () => {
    mount(<SubnetCalculator />)
    fill('tool-input', '10.0.0.1/31')
    fill('subnet-member', '10.0.0.0')
    run()
    await waitFor(() => expect(output().value).toContain('Usable addresses: 2'))
    expect(output().value).toContain('Address belongs to subnet: Yes')
    fill('tool-input', '10.0.0.1/32')
    run()
    await waitFor(() => expect(output().value).toContain('Usable addresses: 1'))
    expect(output().value).toContain('Address belongs to subnet: No')
    fill('tool-input', '10.0.0.256/32')
    run()
    expect(screen.getByRole('alert')).toHaveTextContent(
      en.tools['subnet-calculator'].cidrError,
    )
  })
  it('converts large signed integers, switches bases and handles exact byte units', async () => {
    mount(<NumberBaseConverter />)
    run()
    await waitFor(() => expect(output().value).toContain('16: 20000000000001'))
    fill('number-base', '16')
    fill('tool-input', '-ff')
    run()
    await waitFor(() => expect(output().value).toContain('10: -255'))
    fill('tool-input', 'ffz')
    run()
    expect(screen.getByRole('alert')).toHaveTextContent(
      en.tools['number-base-converter'].numberError,
    )
    fireEvent.click(screen.getByTestId('bytes-run'))
    await waitFor(() =>
      expect(screen.getAllByTestId('tool-output')[1]).toHaveValue(
        '1.048576 MB',
      ),
    )
    fill('bytes-from', 'B')
    fill('bytes-to', 'KiB')
    fireEvent.click(screen.getByTestId('bytes-run'))
    await waitFor(() =>
      expect(screen.getAllByTestId('tool-output')[1]).toHaveValue(
        '0.0009765625 KiB',
      ),
    )
    fill('bytes-input', '-1')
    fireEvent.click(screen.getByTestId('bytes-run'))
    expect(screen.getAllByRole('alert').at(-1)).toHaveTextContent(
      en.tools['number-base-converter'].bytesError,
    )
  })
  it('rejects invalid certificates and restores the public PEM example', async () => {
    mount(<CertificateParser />)
    fill('tool-input', 'broken certificate')
    run()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      en.tools['certificate-parser'].certificateError,
    )
    fireEvent.click(screen.getByTestId('tool-example'))
    expect(
      (screen.getByTestId('tool-input') as HTMLTextAreaElement).value,
    ).toContain('-----BEGIN CERTIFICATE-----')
  })
  it('renders every tool on the server without browser APIs', () => {
    for (const node of [
      <JsonSchemaValidator />,
      <UrlParser />,
      <NetworkFormatter kind="yaml" />,
      <NetworkFormatter kind="xml" />,
      <SubnetCalculator />,
      <NumberBaseConverter />,
      <CertificateParser />,
    ]) {
      expect(
        renderToString(
          <LocaleProvider
            locale="en"
            initialMessages={{ tools: en.tools, workbench }}
          >
            {node}
          </LocaleProvider>,
        ),
      ).toContain('data-tool=')
    }
  })
})
function shape(value: unknown, prefix = ''): string[] {
  return value && typeof value === 'object'
    ? Object.entries(value)
        .flatMap(([key, child]) => shape(child, `${prefix}.${key}`))
        .sort()
    : [prefix]
}
describe('network translations', () => {
  it('contains all twelve language dictionaries', () =>
    expect(Object.keys(dictionaries)).toHaveLength(12))
  it.each(Object.entries(dictionaries))(
    'has complete translated keys and renders %s',
    (path, dictionary) => {
      expect(shape(dictionary)).toEqual(shape(en))
      const locale = path.split('/').at(-1)!.replace('.json', '') as Locale
      for (const [id, tool] of Object.entries(dictionary.tools)) {
        expect(tool.meta.title.trim()).not.toBe('')
        expect(tool.meta.description.trim()).not.toBe('')
        expect(tool.meta.keywords.trim()).not.toBe('')
        if (locale !== 'en')
          expect(tool.description).not.toBe(
            en.tools[id as keyof typeof en.tools].description,
          )
      }
      render(
        <LocaleProvider
          locale={locale}
          initialMessages={{ tools: dictionary.tools, workbench }}
        >
          <SubnetCalculator />
        </LocaleProvider>,
      )
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        dictionary.tools['subnet-calculator'].name,
      )
    },
  )
})
