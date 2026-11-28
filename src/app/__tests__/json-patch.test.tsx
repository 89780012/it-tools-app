import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/i18n/compat'
import Page from '../[locale]/tools/json-patch/page'

function mount() {
  render(
    <MemoryRouter>
      <LocaleProvider locale="en">
        <Page />
      </LocaleProvider>
    </MemoryRouter>,
  )
}
const click = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }))
const change = (name: string, value: string) =>
  fireEvent.change(screen.getByLabelText(name, { exact: true }), {
    target: { value },
  })
const output = () =>
  screen.getByLabelText('Patched JSON') as HTMLTextAreaElement
afterEach(() => vi.unstubAllGlobals())

describe('JSON Patch page', () => {
  it('applies the six-operation example, invalidates edits and clears inputs with focus', () => {
    mount()
    click('Load example')
    click('Apply patch')
    expect(output().value).toContain('9007199254740993')
    expect(JSON.parse(output().value)).toMatchObject({
      title: 'demo',
      backup: { enabled: true },
      settings: { enabled: true },
      tags: ['old', 'keep', 'new'],
    })
    expect(JSON.parse(output().value)).not.toHaveProperty('obsolete')
    change('Patch operations (JSON array)', '[]')
    expect(screen.queryByLabelText('Patched JSON')).not.toBeInTheDocument()
    click('Apply patch')
    expect(JSON.parse(output().value)).toHaveProperty('obsolete', true)
    change('Target JSON', 'null')
    expect(screen.queryByLabelText('Patched JSON')).not.toBeInTheDocument()
    click('Apply patch')
    expect(output()).toHaveValue('null')
    click('Clear')
    expect(screen.getByLabelText('Target JSON')).toHaveValue('')
    expect(screen.getByLabelText('Target JSON')).toHaveFocus()
    expect(screen.getByLabelText('Patch operations (JSON array)')).toHaveValue(
      '',
    )
    expect(screen.queryByLabelText('Patched JSON')).not.toBeInTheDocument()
  })
  it('associates and focuses field errors, reports operation numbers and recovers without partial output', () => {
    mount()
    click('Apply patch')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Target JSON: Enter JSON',
    )
    expect(screen.getByLabelText('Target JSON')).toHaveFocus()
    expect(screen.getByLabelText('Target JSON')).toHaveAttribute(
      'aria-describedby',
      'json-patch-hint json-patch-error',
    )
    change('Target JSON', '{"x":1}')
    change(
      'Patch operations (JSON array)',
      '[{"op":"add","path":"/y","value":2},{"op":"test","path":"/x","value":0}]',
    )
    click('Apply patch')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Operation 2: The test value does not match',
    )
    expect(screen.getByLabelText('Patch operations (JSON array)')).toHaveFocus()
    expect(
      screen.getByLabelText('Patch operations (JSON array)'),
    ).toHaveAttribute('aria-invalid', 'true')
    expect(screen.queryByLabelText('Patched JSON')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Target JSON')).toHaveValue('{"x":1}')
    change('Patch operations (JSON array)', '[]')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    click('Apply patch')
    expect(output()).toHaveValue('{\n  "x": 1\n}')
  })
  it('copies precise JSON, resets copy feedback and handles clipboard denial', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    mount()
    click('Load example')
    click('Apply patch')
    click('Copy')
    expect(writeText).toHaveBeenCalledWith(output().value)
    expect(await screen.findByRole('status')).toHaveTextContent('Copied')
    change('Patch operations (JSON array)', '[]')
    click('Apply patch')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    writeText.mockRejectedValueOnce(new Error('denied'))
    click('Copy')
    expect(await screen.findByText(/Copy failed/)).toBeVisible()
    expect(output()).toHaveAttribute('readonly')
  })
})
