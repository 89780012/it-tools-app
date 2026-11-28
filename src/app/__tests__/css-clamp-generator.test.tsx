import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/i18n/compat'
import Page from '../[locale]/tools/css-clamp-generator/page'
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
const output = () => screen.getByLabelText('CSS declaration')
afterEach(() => vi.unstubAllGlobals())
describe('CSS clamp page', () => {
  it('generates, simulates the midpoint, invalidates edited results and clears every field', () => {
    mount()
    click('Load example')
    click('Generate CSS')
    expect(output()).toHaveValue(
      'font-size: clamp(1rem, calc(0.5rem + 2.5vw), 2.5rem);',
    )
    expect(screen.getByTestId('clamp-preview')).toHaveStyle({
      fontSize: '16px',
    })
    change('Simulated viewport width', '800')
    expect(screen.getByTestId('clamp-preview-value')).toHaveTextContent(
      '800.0 px → 28.000 px',
    )
    expect(screen.getByTestId('clamp-preview')).toHaveStyle({
      fontSize: '28px',
    })
    change('Font size at start (px)', '40')
    expect(screen.queryByLabelText('CSS declaration')).not.toBeInTheDocument()
    change('Font size at end (px)', '16')
    change('Output unit', 'px')
    click('Generate CSS')
    expect(output()).toHaveValue(
      'font-size: clamp(16px, calc(48px - 2.5vw), 40px);',
    )
    click('Clear')
    for (const field of [
      'Start viewport (px)',
      'End viewport (px)',
      'Font size at start (px)',
      'Font size at end (px)',
      'Root font size (px)',
    ])
      expect(screen.getByLabelText(field)).toHaveValue('')
    expect(screen.queryByLabelText('CSS declaration')).not.toBeInTheDocument()
  })
  it('focuses and associates errors and recovers with decimal input', () => {
    mount()
    change('End viewport (px)', '320')
    click('Generate CSS')
    const field = screen.getByLabelText('End viewport (px)')
    expect(field).toHaveFocus()
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field).toHaveAttribute('aria-describedby', 'clamp-hint clamp-error')
    expect(screen.getByRole('alert')).toHaveTextContent('must be greater')
    change('End viewport (px)', '1280')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    change('Font size at start (px)', '-1')
    click('Generate CSS')
    expect(screen.getByLabelText('Font size at start (px)')).toHaveFocus()
    change('Font size at start (px)', '16.125')
    click('Generate CSS')
    expect(output()).toHaveValue(
      'font-size: clamp(1.0078125rem, calc(0.5104166667rem + 2.4869791667vw), 2.5rem);',
    )
  })
  it('copies the declaration, resets feedback on unit edits and handles denied clipboard access', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    mount()
    click('Generate CSS')
    click('Copy')
    expect(writeText).toHaveBeenCalledWith(
      'font-size: clamp(1rem, calc(0.5rem + 2.5vw), 2.5rem);',
    )
    expect(await screen.findByRole('status')).toHaveTextContent('Copied')
    change('Output unit', 'px')
    click('Generate CSS')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    writeText.mockRejectedValueOnce(new Error('denied'))
    click('Copy')
    expect(await screen.findByText(/Copy failed/)).toBeVisible()
    expect(output()).toHaveAttribute('readonly')
  })
})
