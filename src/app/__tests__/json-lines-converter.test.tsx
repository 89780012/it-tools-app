import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/i18n/compat'
import JsonLinesPage from '../[locale]/tools/json-lines-converter/page'
import { JSON_LINES_MAX_BYTES } from '@/lib/json-lines'

function mount() {
  return render(
    <MemoryRouter>
      <LocaleProvider locale="en">
        <JsonLinesPage />
      </LocaleProvider>
    </MemoryRouter>,
  )
}
const input = () => screen.getByTestId('json-lines-input')
const output = () => screen.getByTestId('tool-output')
const convert = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Convert' }))
const change = (value: string) =>
  fireEvent.change(input(), { target: { value } })
const choose = (file: Partial<File>) =>
  fireEvent.change(screen.getByLabelText('Import file'), {
    target: { files: [file] },
  })
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('JSON Lines page', () => {
  it('loads examples, converts, clears obsolete output on edits and resets', () => {
    mount()
    expect(screen.getByRole('button', { name: 'Copy' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Load example' }))
    convert()
    expect((output() as HTMLTextAreaElement).value).toContain(
      '9007199254740993',
    )
    expect(
      screen.getByText('2 records converted; 0 blank lines skipped.'),
    ).toBeVisible()
    change('{')
    expect(output()).toHaveValue('')
    convert()
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid JSON.')
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input()).toHaveValue('')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled()
  })

  it('switches direction and enforces blank-line options with line diagnostics', () => {
    mount()
    fireEvent.change(screen.getByLabelText('Conversion direction'), {
      target: { value: 'toJson' },
    })
    change('null\n\nfalse\n')
    convert()
    expect(output()).toHaveValue('[\n  null,\n  false\n]')
    fireEvent.click(screen.getByLabelText('Skip blank lines'))
    expect(output()).toHaveValue('')
    convert()
    expect(screen.getByRole('alert')).toHaveTextContent('Blank line at line 2.')
    change('null\n{bad}')
    convert()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Invalid JSON record at line 2.',
    )
    fireEvent.change(screen.getByLabelText('Conversion direction'), {
      target: { value: 'toLines' },
    })
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('supports copying and downloading the empty-array result', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const createObjectURL = vi.fn(() => 'blob:result')
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() })
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})
    mount()
    change('[]')
    convert()
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(''))
    fireEvent.click(screen.getByRole('button', { name: 'Download' }))
    expect(createObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({
        size: 0,
        type: 'application/x-ndjson;charset=utf-8',
      }),
    )
    expect(click).toHaveBeenCalledOnce()
  })

  it('reports denied clipboard access', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    })
    mount()
    change('[1]')
    convert()
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    await waitFor(() =>
      expect(
        screen.getByText(
          'Copy failed. Select the output and copy it manually.',
        ),
      ).toBeVisible(),
    )
  })

  it('imports UTF-8 NDJSON, selects its direction and rejects encoding/read/size errors', async () => {
    mount()
    choose({
      name: 'logs.ndjson',
      size: 5,
      arrayBuffer: async () => new TextEncoder().encode('true\n').buffer,
    })
    await waitFor(() => expect(input()).toHaveValue('true\n'))
    expect(screen.getByLabelText('Conversion direction')).toHaveValue('toJson')
    convert()
    expect(output()).toHaveValue('[\n  true\n]')
    choose({
      name: 'bad.txt',
      size: 1,
      arrayBuffer: async () => new Uint8Array([0xff]).buffer,
    })
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('not valid UTF-8'),
    )
    expect(output()).toHaveValue('')
    choose({
      name: 'missing.txt',
      size: 1,
      arrayBuffer: async () => {
        throw new Error('read failed')
      },
    })
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to read'),
    )
    const read = vi.fn()
    choose({
      name: 'large.json',
      size: JSON_LINES_MAX_BYTES + 1,
      arrayBuffer: read,
    })
    expect(read).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('5 MiB')
  })

  it('does not restore stale imports after clearing or editing', async () => {
    mount()
    let finish!: (value: ArrayBuffer) => void
    const pending = new Promise<ArrayBuffer>((resolve) => {
      finish = resolve
    })
    choose({ name: 'old.jsonl', size: 5, arrayBuffer: () => pending })
    expect(screen.getByRole('button', { name: 'Convert' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    change('[2]')
    await act(async () => finish(new TextEncoder().encode('true\n').buffer))
    expect(input()).toHaveValue('[2]')
    expect(screen.getByLabelText('Conversion direction')).toHaveValue('toLines')
    convert()
    expect(output()).toHaveValue('2\n')
  })
})
