import type { ComponentType } from 'react'
import { renderToString } from 'react-dom/server'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createHmac, webcrypto } from 'node:crypto'
import { LocaleProvider } from '@/i18n/compat'
import base from '@/i18n/messages/en.json'
import additions from '@/i18n/messages/developer-additions/en.json'
import RegexPage from '../[locale]/tools/regex-tester/page'
import JwtPage from '../[locale]/tools/jwt-decoder/page'
import DiffPage from '../[locale]/tools/text-diff/page'
import TypesPage from '../[locale]/tools/json-to-types/page'
import { matchRegex, type RegexRequest } from '@/lib/developer-regex'

const messages = {
  ...base,
  tools: { ...base.tools, ...additions.tools },
  workbench: {
    input: 'Input',
    output: 'Output',
    run: 'Run',
    clear: 'Clear',
    example: 'Example',
    copy: 'Copy',
    copied: 'Copied',
    download: 'Download',
    local: 'Local processing',
    options: 'Options',
  },
}
function tool(Page: ComponentType) {
  return render(
    <LocaleProvider locale="en" initialMessages={messages}>
      <Page />
    </LocaleProvider>,
  )
}
function change(id: string, value: string) {
  fireEvent.change(screen.getByTestId(id), { target: { value } })
}
const encode = (value: unknown) =>
  Buffer.from(JSON.stringify(value)).toString('base64url')
class RegexWorkerMock {
  static instances: RegexWorkerMock[] = []
  static hang = false
  onmessage: ((event: { data: unknown }) => void) | null = null
  onerror: (() => void) | null = null
  terminate = vi.fn()
  constructor() {
    RegexWorkerMock.instances.push(this)
  }
  postMessage(request: RegexRequest) {
    if (RegexWorkerMock.hang) return
    queueMicrotask(() => {
      try {
        this.onmessage?.({ data: { result: matchRegex(request) } })
      } catch (error) {
        this.onmessage?.({ data: { error: (error as Error).message } })
      }
    })
  }
}
beforeEach(() => {
  RegexWorkerMock.instances = []
  RegexWorkerMock.hang = false
  vi.stubGlobal('Worker', RegexWorkerMock)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('developer tool interactions', () => {
  it('runs regex in a worker, renders highlights and captures, and clears stale output on edit', async () => {
    tool(RegexPage)
    change('regex-pattern', '(a)')
    change('regex-text', 'aba')
    change('regex-replacement', '[$1]')
    fireEvent.click(screen.getByTestId('regex-run'))
    await waitFor(() =>
      expect(screen.getByTestId('tool-output')).toHaveValue('[a]b[a]'),
    )
    expect(
      screen.getByTestId('regex-highlight').querySelectorAll('mark'),
    ).toHaveLength(2)
    expect(screen.getAllByRole('row')).toHaveLength(3)
    expect(RegexWorkerMock.instances[0].terminate).toHaveBeenCalled()
    change('regex-pattern', '(')
    expect(screen.queryByTestId('tool-output')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('regex-run'))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'regular expression is invalid',
      ),
    )
  })
  it('validates flags and loads a working Unicode example', async () => {
    tool(RegexPage)
    fireEvent.click(screen.getByTestId('regex-unicodeExample'))
    change('regex-flags', 'gg')
    fireEvent.click(screen.getByTestId('regex-run'))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'unique JavaScript flags',
      ),
    )
    change('regex-flags', 'gu')
    fireEvent.click(screen.getByTestId('regex-run'))
    await waitFor(() =>
      expect(screen.getByTestId('tool-output')).toHaveValue(
        '[Hello] [世界] [مرحبا]',
      ),
    )
  })
  it('terminates a stalled worker and permits another run', () => {
    vi.useFakeTimers()
    RegexWorkerMock.hang = true
    tool(RegexPage)
    fireEvent.click(screen.getByTestId('regex-run'))
    expect(screen.getByTestId('regex-run')).toBeDisabled()
    act(() => vi.advanceTimersByTime(1501))
    expect(RegexWorkerMock.instances[0].terminate).toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('exceeded 1.5 seconds')
    expect(screen.getByTestId('regex-run')).toBeEnabled()
    fireEvent.click(screen.getByTestId('regex-run'))
    cleanup()
    expect(RegexWorkerMock.instances[1].terminate).toHaveBeenCalled()
  })
  it('discards late regex results after a newer edit', () => {
    RegexWorkerMock.hang = true
    tool(RegexPage)
    fireEvent.click(screen.getByTestId('regex-run'))
    const previous = RegexWorkerMock.instances[0]
    change('regex-text', 'new')
    act(() =>
      previous.onmessage?.({
        data: { result: { matches: [], replacement: 'old', truncated: false } },
      }),
    )
    expect(screen.queryByTestId('tool-output')).not.toBeInTheDocument()
  })
  it('decodes Unicode claims, shows unverified status, and removes old payload on invalid input', () => {
    tool(JwtPage)
    change(
      'jwt-token',
      `${encode({ alg: 'none' })}.${encode({ sub: '你好 😀', exp: 0, iat: 0, nbf: 0 })}.`,
    )
    fireEvent.click(screen.getByTestId('jwt-decode'))
    expect(
      (screen.getByLabelText('Payload') as HTMLTextAreaElement).value,
    ).toContain('你好 😀')
    expect(screen.getByTestId('jwt-claims')).toHaveTextContent('Expired')
    expect(screen.getByTestId('jwt-verification')).toHaveTextContent(
      'Signature not verified',
    )
    change('jwt-token', 'invalid')
    fireEvent.click(screen.getByTestId('jwt-decode'))
    expect(screen.queryByLabelText('Payload')).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'exactly three segments',
    )
  })
  it('verifies HS256 with the supplied secret and resets the status on secret changes', async () => {
    vi.stubGlobal('crypto', webcrypto)
    tool(JwtPage)
    const input = `${encode({ alg: 'HS256' })}.${encode({ sub: 'Ada' })}`
    const signed = `${input}.${createHmac('sha256', 'secret').update(input).digest('base64url')}`
    change('jwt-token', signed)
    fireEvent.click(screen.getByTestId('jwt-decode'))
    change('jwt-secret', 'secret')
    fireEvent.click(screen.getByTestId('jwt-verify'))
    await waitFor(() =>
      expect(screen.getByTestId('jwt-verification')).toHaveTextContent(
        'signature matches',
      ),
    )
    change('jwt-secret', 'wrong')
    expect(screen.getByTestId('jwt-verification')).toHaveTextContent(
      'not verified',
    )
    fireEvent.click(screen.getByTestId('jwt-verify'))
    await waitFor(() =>
      expect(screen.getByTestId('jwt-verification')).toHaveTextContent(
        'does not match',
      ),
    )
  })
  it('updates visual and downloadable diffs for edits, whitespace and display options', async () => {
    tool(DiffPage)
    await act(async () => {
      change('diff-left', 'one\nold\n')
      change('diff-right', 'one\nnew\n')
    })
    expect(screen.getByTestId('diff-patch')).toHaveTextContent('-old')
    expect(screen.getByTestId('diff-patch')).toHaveTextContent('+new')
    await act(async () => {
      fireEvent.click(screen.getByTestId('diff-split'))
      fireEvent.click(screen.getByTestId('diff-words'))
    })
    expect(screen.getByTestId('diff-split')).not.toBeChecked()
    expect(screen.getByTestId('diff-words')).not.toBeChecked()
    await act(async () => change('diff-right', 'one\nlatest\n'))
    expect(screen.getByTestId('diff-patch')).toHaveTextContent('+latest')
    expect(screen.getByTestId('diff-patch')).not.toHaveTextContent('+new')
    await waitFor(() =>
      expect(screen.getByTestId('diff-view')).toHaveTextContent('latest'),
    )
    await act(async () => {
      change('diff-left', ' a  b ')
      change('diff-right', 'a b')
      fireEvent.click(screen.getByTestId('diff-ignore'))
    })
    expect(screen.getByTestId('diff-status')).toHaveTextContent('identical')
    expect(screen.getByTestId('diff-download')).toBeDisabled()
  })
  it('imports both files and does not overwrite edits with late file reads', async () => {
    tool(DiffPage)
    const file = new File(['from file'], 'left.txt', { type: 'text/plain' })
    Object.defineProperty(file, 'text', { value: async () => 'from file' })
    fireEvent.change(screen.getByTestId('diff-file-left'), {
      target: { files: [file] },
    })
    await waitFor(() =>
      expect(screen.getByTestId('diff-left')).toHaveValue('from file'),
    )
    let finish!: (value: string) => void
    const delayed = new File(['old'], 'right.txt')
    Object.defineProperty(delayed, 'text', {
      value: () =>
        new Promise<string>((resolve) => {
          finish = resolve
        }),
    })
    fireEvent.change(screen.getByTestId('diff-file-right'), {
      target: { files: [delayed] },
    })
    change('diff-right', 'manual edit')
    await act(async () => finish('old'))
    expect(screen.getByTestId('diff-right')).toHaveValue('manual edit')
  })
  it('changes JSON output when language or root name changes and clears errors on correction', () => {
    tool(TypesPage)
    change('types-input', '[{"a":1},{"b":null}]')
    expect(
      (screen.getByTestId('tool-output') as HTMLTextAreaElement).value,
    ).toContain('a?: number;')
    change('types-root', 'Sample')
    expect(
      (screen.getByTestId('tool-output') as HTMLTextAreaElement).value,
    ).toContain('export type Sample')
    change('types-language', 'go')
    expect(
      (screen.getByTestId('tool-output') as HTMLTextAreaElement).value,
    ).toContain('type Sample []SampleItem')
    change('types-input', '{"a,b":1}')
    expect(screen.getByTestId('tool-output')).toHaveValue('')
    expect(screen.getByRole('alert')).toHaveTextContent('Go JSON struct tag')
    change('types-language', 'typescript')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(
      (screen.getByTestId('tool-output') as HTMLTextAreaElement).value,
    ).toContain('"a,b": number;')
    change('types-input', '{bad')
    expect(screen.getByTestId('tool-output')).toHaveValue('')
    expect(screen.getByRole('alert')).toHaveTextContent('valid JSON')
  })
  it.each([RegexPage, JwtPage, DiffPage, TypesPage])(
    'renders safely without browser workers on the server',
    (Page) => {
      vi.stubGlobal('Worker', undefined)
      expect(
        renderToString(
          <LocaleProvider locale="en" initialMessages={messages}>
            <Page />
          </LocaleProvider>,
        ),
      ).toContain('<section')
    },
  )
})

const dictionaries = import.meta.glob(
  '../../i18n/messages/developer-additions/*.json',
  { eager: true, import: 'default' },
) as Record<string, typeof additions>
function leaves(value: unknown, prefix = ''): Record<string, string> {
  if (typeof value === 'string') return { [prefix]: value }
  return Object.assign(
    {},
    ...Object.entries(value as Record<string, unknown>).map(([key, item]) =>
      leaves(item, `${prefix}.${key}`),
    ),
  )
}
describe('developer translations', () => {
  it('provides all keys, nonempty translated text and identical placeholders in all 12 locales', () => {
    expect(Object.keys(dictionaries)).toHaveLength(12)
    const english = leaves(additions)
    for (const [path, dictionary] of Object.entries(dictionaries)) {
      const translated = leaves(dictionary)
      expect(Object.keys(translated).sort(), path).toEqual(
        Object.keys(english).sort(),
      )
      for (const [key, value] of Object.entries(translated)) {
        expect(value.trim().length, `${path}:${key}`).toBeGreaterThan(0)
        expect(value.match(/\{\w+\}/g) ?? [], `${path}:${key}`).toEqual(
          english[key].match(/\{\w+\}/g) ?? [],
        )
      }
      if (!path.endsWith('/en.json'))
        for (const id of Object.keys(
          additions.tools,
        ) as (keyof typeof additions.tools)[])
          expect(dictionary.tools[id].description, path).not.toBe(
            additions.tools[id].description,
          )
    }
  })
})
