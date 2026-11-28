import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/i18n/compat'
import Page from '../[locale]/tools/base32-encoder-decoder/page'
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
const input = () => screen.getByLabelText('Input data')
const output = () => screen.getByLabelText('Conversion result')
const change = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
afterEach(() => vi.unstubAllGlobals())
describe('Base32 page', () => {
  it('converts examples, changes alphabets and padding, invalidates stale results and resets', () => {
    mount()
    click('Load example')
    click('Convert')
    expect(output()).toHaveValue('MZXW6YTBOI======')
    expect(screen.getByTestId('base32-bytes')).toHaveTextContent(
      'Byte count: 6',
    )
    fireEvent.click(screen.getByLabelText('Include = padding'))
    expect(screen.queryByLabelText('Conversion result')).not.toBeInTheDocument()
    click('Convert')
    expect(output()).toHaveValue('MZXW6YTBOI')
    change('Alphabet', 'hex')
    click('Convert')
    expect(output()).toHaveValue('CPNMUOJ1E8')
    change('Operation', 'decode')
    click('Load example')
    click('Convert')
    expect(output()).toHaveValue('foobar')
    change('Byte representation', 'hex')
    click('Convert')
    expect(output()).toHaveValue('666f6f626172')
    click('Clear')
    expect(input()).toHaveValue('')
    expect(input()).toHaveFocus()
    expect(screen.getByLabelText('Operation')).toHaveValue('encode')
    expect(screen.getByLabelText('Alphabet')).toHaveValue('standard')
    expect(screen.getByLabelText('Byte representation')).toHaveValue('text')
    expect(screen.getByLabelText('Include = padding')).toBeChecked()
    expect(screen.queryByLabelText('Conversion result')).not.toBeInTheDocument()
  })
  it('associates errors with the input, focuses it, recovers on edit and supports binary output', () => {
    mount()
    click('Convert')
    expect(input()).toHaveFocus()
    expect(input()).toHaveAttribute('aria-invalid', 'true')
    expect(input()).toHaveAttribute(
      'aria-describedby',
      'base32-hint base32-error',
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter data to convert.',
    )
    change('Operation', 'decode')
    change('Input data', '74======')
    click('Convert')
    expect(screen.getByRole('alert')).toHaveTextContent('not valid UTF-8')
    change('Byte representation', 'hex')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    click('Convert')
    expect(output()).toHaveValue('ff')
    change('Input data', 'MZ')
    expect(screen.queryByLabelText('Conversion result')).not.toBeInTheDocument()
    click('Convert')
    expect(screen.getByRole('alert')).toHaveTextContent('Unused trailing bits')
    click('Load example')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('copies the exact result and displays a useful failure message without losing output', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    mount()
    click('Load example')
    click('Convert')
    click('Copy')
    expect(writeText).toHaveBeenCalledWith('MZXW6YTBOI======')
    expect(await screen.findByRole('status')).toHaveTextContent('Copied')
    writeText.mockRejectedValueOnce(new Error('denied'))
    click('Copy')
    expect(await screen.findByText(/Copy failed/)).toBeVisible()
    expect(output()).toHaveValue('MZXW6YTBOI======')
    click('Load example')
    click('Convert')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})
