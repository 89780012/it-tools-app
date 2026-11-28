import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/i18n/compat'
import UnicodePage from '../[locale]/tools/unicode-normalizer/page'

function mount() {
  render(
    <MemoryRouter>
      <LocaleProvider locale="en">
        <UnicodePage />
      </LocaleProvider>
    </MemoryRouter>,
  )
}
const click = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }))
const input = () => screen.getByLabelText('Text to normalize')
const select = () => screen.getByLabelText('Normalization form')
const output = () => screen.getByLabelText('Normalized text')
afterEach(() => vi.unstubAllGlobals())

describe('Unicode normalizer page', () => {
  it('normalizes the example, changes forms, invalidates stale output and resets', () => {
    mount()
    click('Load example')
    click('Normalize text')
    expect(output()).toHaveValue('Café / Café\nＡＢＣ ﬃ ①\n가 / 가\n👩‍💻')
    expect(screen.getByTestId('unicode-change')).toHaveTextContent(
      'The text changed.',
    )
    expect(screen.getByTestId('unicode-before')).toHaveTextContent(
      'U+0065 U+0301',
    )
    expect(screen.getByTestId('unicode-after')).toHaveTextContent('U+00E9')
    fireEvent.change(select(), { target: { value: 'NFKC' } })
    expect(screen.queryByLabelText('Normalized text')).not.toBeInTheDocument()
    click('Normalize text')
    expect(output()).toHaveValue('Café / Café\nABC ffi 1\n가 / 가\n👩‍💻')
    fireEvent.change(input(), { target: { value: 'already normalized' } })
    expect(screen.queryByLabelText('Normalized text')).not.toBeInTheDocument()
    click('Normalize text')
    expect(screen.getByTestId('unicode-change')).toHaveTextContent(
      'already in the selected form',
    )
    click('Clear')
    expect(input()).toHaveValue('')
    expect(select()).toHaveValue('NFC')
    expect(screen.queryByLabelText('Normalized text')).not.toBeInTheDocument()
  })

  it('focuses invalid input with an associated error and clears errors on editing', () => {
    mount()
    click('Normalize text')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter text to normalize.',
    )
    expect(input()).toHaveFocus()
    expect(input()).toHaveAttribute('aria-invalid', 'true')
    expect(input()).toHaveAttribute(
      'aria-describedby',
      'unicode-hint unicode-error',
    )
    fireEvent.change(input(), { target: { value: 'x\ud800' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    click('Normalize text')
    expect(screen.getByRole('alert')).toHaveTextContent('position 2')
    click('Load example')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    click('Normalize text')
    expect(output()).toBeVisible()
  })

  it('copies only normalized text and keeps the output selectable if copying fails', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    mount()
    fireEvent.change(input(), { target: { value: ' e\u0301\n' } })
    click('Normalize text')
    click('Copy')
    expect(writeText).toHaveBeenCalledWith(' é\n')
    expect(await screen.findByRole('status')).toHaveTextContent('Copied')
    writeText.mockRejectedValueOnce(new Error('denied'))
    click('Copy')
    expect(await screen.findByText(/Copy failed/)).toBeVisible()
    expect(output()).toHaveValue(' é\n')
    fireEvent.change(select(), { target: { value: 'NFD' } })
    click('Normalize text')
    expect(output()).toHaveValue(' e\u0301\n')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})
