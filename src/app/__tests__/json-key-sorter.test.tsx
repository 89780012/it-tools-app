import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/i18n/compat'
import Page from '../[locale]/tools/json-key-sorter/page'
const mount = () =>
  render(
    <MemoryRouter>
      <LocaleProvider locale="en">
        <Page />
      </LocaleProvider>
    </MemoryRouter>,
  )
const click = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }))
const change = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
afterEach(() => vi.unstubAllGlobals())
describe('JSON key sorter page', () => {
  it('sorts the example, invalidates stale output on option changes and resets all controls', () => {
    mount()
    click('Load example')
    click('Sort keys')
    expect(screen.getByLabelText('Sorted JSON')).toBeVisible()
    expect(
      (screen.getByLabelText('Sorted JSON') as HTMLTextAreaElement).value,
    ).toContain('9007199254740993')
    expect(screen.getByText('Objects: 3 · Keys: 9')).toBeVisible()
    change('Output format', 'compact')
    expect(screen.queryByLabelText('Sorted JSON')).not.toBeInTheDocument()
    change('Sort order', 'desc')
    click('Sort keys')
    expect(
      (
        screen.getByLabelText('Sorted JSON') as HTMLTextAreaElement
      ).value.startsWith('{"z":9007199254740993,'),
    ).toBe(true)
    click('Clear')
    expect(screen.getByLabelText('Input JSON')).toHaveValue('')
    expect(screen.getByLabelText('Input JSON')).toHaveFocus()
    expect(screen.getByLabelText('Sort order')).toHaveValue('asc')
    expect(screen.getByLabelText('Output format')).toHaveValue('2')
    expect(screen.queryByLabelText('Sorted JSON')).not.toBeInTheDocument()
  })
  it('focuses invalid input, associates localized errors and recovers on edits', () => {
    mount()
    click('Sort keys')
    expect(screen.getByRole('alert')).toHaveTextContent('Enter JSON to sort.')
    expect(screen.getByLabelText('Input JSON')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.getByLabelText('Input JSON')).toHaveAttribute(
      'aria-describedby',
      'sort-hint sort-error',
    )
    expect(screen.getByLabelText('Input JSON')).toHaveFocus()
    change('Input JSON', '{"x":1,"x":1}')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    click('Sort keys')
    expect(screen.getByRole('alert')).toHaveTextContent('Duplicate object keys')
    change('Input JSON', '[false,null]')
    click('Sort keys')
    expect(screen.getByLabelText('Sorted JSON')).toHaveValue(
      '[\n  false,\n  null\n]',
    )
    change('Input JSON', '{')
    expect(screen.queryByLabelText('Sorted JSON')).not.toBeInTheDocument()
    click('Sort keys')
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid JSON')
    click('Load example')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('copies exact output, handles clipboard failure and resets copy feedback on edits', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    mount()
    change('Input JSON', '{"b":1,"a":2}')
    change('Output format', 'compact')
    click('Sort keys')
    click('Copy')
    expect(writeText).toHaveBeenCalledWith('{"a":2,"b":1}')
    expect(await screen.findByRole('status')).toHaveTextContent('Copied')
    writeText.mockRejectedValueOnce(new Error('denied'))
    click('Copy')
    expect(await screen.findByText(/Copy failed/)).toBeVisible()
    expect(screen.getByLabelText('Sorted JSON')).toHaveValue('{"a":2,"b":1}')
    click('Load example')
    click('Sort keys')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})
