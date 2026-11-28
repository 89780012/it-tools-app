import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/i18n/compat'
import Page from '../[locale]/tools/css-gradient-generator/page'
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
describe('CSS gradient page', () => {
  it('updates CSS and preview immediately, manages stops and resets with focus', () => {
    mount()
    expect(output()).toHaveValue(
      'background-image: linear-gradient(90deg, #2563eb 0%, #ec4899 100%);',
    )
    expect(
      screen.getByRole('button', { name: 'Remove color stop 1' }),
    ).toBeDisabled()
    change('Angle (degrees)', '-45')
    change('Pick color · 1', '#ff0000')
    change('Opacity (%) · 1', '50')
    expect(output()).toHaveValue(
      'background-image: linear-gradient(-45deg, rgba(255, 0, 0, 0.5) 0%, #ec4899 100%);',
    )
    expect(
      screen.getByTestId('gradient-preview').style.backgroundImage,
    ).toContain('linear-gradient(-45deg')
    for (let i = 0; i < 6; i++) click('Add color stop')
    expect(screen.getAllByRole('group')).toHaveLength(8)
    expect(
      screen.getByRole('button', { name: 'Add color stop' }),
    ).toBeDisabled()
    click('Remove color stop 2')
    expect(screen.getAllByRole('group')).toHaveLength(7)
    click('Load example')
    expect(screen.getAllByRole('group')).toHaveLength(3)
    expect(output()).toHaveValue(
      'background-image: linear-gradient(135deg, #2563eb 0%, rgba(168, 85, 247, 0.8) 50%, rgba(236, 72, 153, 0.4) 100%);',
    )
    click('Clear')
    expect(screen.getByLabelText('Angle (degrees)')).toHaveValue('')
    expect(screen.getByLabelText('Angle (degrees)')).toHaveFocus()
    expect(screen.getAllByRole('group')).toHaveLength(2)
    expect(screen.getByLabelText('Hex color · 1')).toHaveValue('')
    expect(screen.queryByLabelText('Generated CSS')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByTestId('gradient-preview').style.backgroundImage).toBe(
      'none',
    )
  })
  it('associates errors with the exact field, removes stale output and recovers on edit', () => {
    mount()
    change('Position (%) · 1', '90')
    change('Position (%) · 2', '10')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Stop 2: position must be at least the previous stop’s position.',
    )
    expect(screen.getByLabelText('Position (%) · 2')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.getByLabelText('Position (%) · 2')).toHaveAttribute(
      'aria-describedby',
      'gradient-hint gradient-error',
    )
    expect(screen.queryByLabelText('Generated CSS')).not.toBeInTheDocument()
    expect(screen.getByTestId('gradient-preview').style.backgroundImage).toBe(
      'none',
    )
    change('Position (%) · 2', '90')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(output()).toHaveValue(
      'background-image: linear-gradient(90deg, #2563eb 90%, #ec4899 90%);',
    )
    change('Hex color · 1', 'red; background:url(https://example.com)')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Stop 1: enter a six-digit hex color',
    )
    expect(screen.getByLabelText('Hex color · 1')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    click('Load example')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(output()).toBeVisible()
  })
  it('copies exact CSS, handles clipboard failure and clears stale feedback after editing', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    mount()
    click('Copy')
    expect(writeText).toHaveBeenCalledWith(
      'background-image: linear-gradient(90deg, #2563eb 0%, #ec4899 100%);',
    )
    expect(await screen.findByRole('status')).toHaveTextContent('Copied')
    change('Angle (degrees)', '180')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    writeText.mockRejectedValueOnce(new Error('denied'))
    click('Copy')
    expect(await screen.findByText(/Copy failed/)).toBeVisible()
    expect(output()).toHaveValue(
      'background-image: linear-gradient(180deg, #2563eb 0%, #ec4899 100%);',
    )
  })
})
