import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/i18n/compat'
import Page from '../[locale]/tools/css-border-radius-generator/page'

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
const output = () => screen.getByLabelText('Generated CSS')
afterEach(() => vi.unstubAllGlobals())

describe('CSS border-radius page', () => {
  it('updates each axis, toggles separate radii, loads presets and clears with focus', () => {
    mount()
    expect(output()).toHaveValue('border-radius: 24px;')
    change('Top left · Horizontal (px)', '12.5')
    expect(output()).toHaveValue('border-radius: 12.5px 24px 24px;')
    fireEvent.click(screen.getByLabelText('Set vertical radii separately'))
    expect(screen.getByLabelText('Top left · Vertical (px)')).toHaveValue(
      '12.5',
    )
    change('Top left · Vertical (px)', '30')
    expect(output()).toHaveValue(
      'border-radius: 12.5px 24px 24px / 30px 24px 24px;',
    )
    fireEvent.click(screen.getByLabelText('Set vertical radii separately'))
    expect(output()).toHaveValue('border-radius: 12.5px 24px 24px;')
    click('Load example')
    expect(output()).toHaveValue(
      'border-radius: 30% 70% 60% 40% / 40% 30% 70% 60%;',
    )
    expect(screen.getByTestId('radius-preview')).toHaveStyle({
      borderRadius: '30% 70% 60% 40% / 40% 30% 70% 60%',
    })
    click('Ellipse preset')
    expect(output()).toHaveValue('border-radius: 50%;')
    expect(
      screen.getByLabelText('Set vertical radii separately'),
    ).not.toBeChecked()
    click('Clear')
    expect(screen.getByLabelText('Top left · Horizontal (px)')).toHaveValue('')
    expect(screen.getByLabelText('Top left · Horizontal (px)')).toHaveFocus()
    expect(screen.getByLabelText('Unit')).toHaveValue('px')
    expect(screen.queryByLabelText('Generated CSS')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByTestId('radius-preview')).not.toBeVisible()
  })
  it('associates errors with the correct corner, removes stale output and recovers without clamping', () => {
    mount()
    change('Top right · Horizontal (px)', '150')
    change('Unit', '%')
    const field = screen.getByLabelText('Top right · Horizontal (%)')
    expect(field).toHaveValue('150')
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field).toHaveAttribute(
      'aria-describedby',
      'radius-hint radius-error',
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Top right · Horizontal: enter a number from 0 to 100',
    )
    expect(screen.queryByLabelText('Generated CSS')).not.toBeInTheDocument()
    expect(screen.getByTestId('radius-preview')).not.toBeVisible()
    change('Top right · Horizontal (%)', '100')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(output()).toHaveValue('border-radius: 24% 100% 24% 24%;')
    fireEvent.click(screen.getByLabelText('Set vertical radii separately'))
    change('Bottom left · Vertical (%)', '-1')
    expect(screen.getByLabelText('Bottom left · Vertical (%)')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    fireEvent.click(screen.getByLabelText('Set vertical radii separately'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(output()).toHaveValue('border-radius: 24% 100% 24% 24%;')
  })
  it('copies exact CSS, reports clipboard failures and clears feedback on changed results', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    mount()
    click('Copy')
    expect(writeText).toHaveBeenCalledWith('border-radius: 24px;')
    expect(await screen.findByRole('status')).toHaveTextContent('Copied')
    change('Top left · Horizontal (px)', '0')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    writeText.mockRejectedValueOnce(new Error('denied'))
    click('Copy')
    expect(await screen.findByText(/Copy failed/)).toBeVisible()
    expect(output()).toHaveValue('border-radius: 0px 24px 24px;')
  })
})
