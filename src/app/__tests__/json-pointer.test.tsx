import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/i18n/compat'
import Page from '../[locale]/tools/json-pointer/page'

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
const source = () => screen.getByLabelText('JSON document')
const pointer = () => screen.getByLabelText('JSON Pointer or URI fragment')
const output = () => screen.getByLabelText('Selected JSON value')
const change = (field: HTMLElement, value: string) =>
  fireEvent.change(field, { target: { value } })
afterEach(() => vi.unstubAllGlobals())

describe('JSON Pointer page', () => {
  it('resolves an example, invalidates edited results, preserves large numbers and clears both fields', () => {
    mount()
    click('Load example')
    click('Resolve pointer')
    expect(output()).toHaveValue('"ready"')
    expect(screen.getByTestId('pointer-type')).toHaveTextContent('String')
    change(pointer(), '/orders/0/id')
    expect(
      screen.queryByLabelText('Selected JSON value'),
    ).not.toBeInTheDocument()
    click('Resolve pointer')
    expect(output()).toHaveValue('9007199254740993')
    change(source(), '{"a":null}')
    change(pointer(), '/a')
    click('Resolve pointer')
    expect(output()).toHaveValue('null')
    click('Clear')
    expect(source()).toHaveValue('')
    expect(pointer()).toHaveValue('')
    expect(
      screen.queryByLabelText('Selected JSON value'),
    ).not.toBeInTheDocument()
  })
  it('associates and focuses each error field, then recovers', () => {
    mount()
    click('Resolve pointer')
    expect(source()).toHaveFocus()
    expect(source()).toHaveAttribute('aria-invalid', 'true')
    expect(source()).toHaveAttribute(
      'aria-describedby',
      'pointer-limits pointer-error',
    )
    change(source(), '{"a":[1]}')
    change(pointer(), '/a/01')
    click('Resolve pointer')
    expect(screen.getByRole('alert')).toHaveTextContent('Step 2')
    expect(pointer()).toHaveFocus()
    expect(pointer()).toHaveAttribute(
      'aria-describedby',
      'pointer-hint pointer-error',
    )
    change(pointer(), '#/a/0')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    click('Resolve pointer')
    expect(output()).toHaveValue('1')
    expect(screen.getByTestId('resolved-pointer')).toHaveTextContent('/a/0')
  })
  it('copies valid JSON and clears feedback after edits, with selectable output if copying fails', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    mount()
    click('Load example')
    click('Resolve pointer')
    click('Copy')
    expect(writeText).toHaveBeenCalledWith('"ready"')
    expect(await screen.findByRole('status')).toHaveTextContent('Copied')
    change(pointer(), '/orders/0/id')
    click('Resolve pointer')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    writeText.mockRejectedValueOnce(new Error('denied'))
    click('Copy')
    expect(await screen.findByText(/Copy failed/)).toBeVisible()
    expect(output()).toHaveValue('9007199254740993')
  })
})
