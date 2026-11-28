import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/i18n/compat'
import Page from '../[locale]/tools/css-cubic-bezier/page'

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
const change = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label, { exact: true }), {
    target: { value },
  })
afterEach(() => vi.unstubAllGlobals())

describe('cubic Bézier page', () => {
  it('generates a curve, simulates endpoints, loads an overshoot example and invalidates edited results', () => {
    mount()
    click('Generate CSS')
    expect(screen.getByLabelText('CSS declarations')).toHaveValue(
      'transition-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);\nanimation-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);',
    )
    expect(screen.getByTestId('bezier-sample')).toHaveTextContent(
      'Time 50.0% → progress 80.24%',
    )
    change('Elapsed time', '1')
    expect(screen.getByTestId('bezier-sample')).toHaveTextContent(
      'progress 100.00%',
    )
    change('Elapsed time', '0')
    expect(screen.getByTestId('bezier-sample')).toHaveTextContent(
      'progress 0.00%',
    )
    click('Load example')
    expect(screen.queryByLabelText('CSS declarations')).not.toBeInTheDocument()
    click('Generate CSS')
    expect(screen.getByLabelText('CSS declarations')).toHaveValue(
      'transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);\nanimation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);',
    )
    expect(screen.getByTestId('bezier-sample')).toHaveTextContent('Time 50.0%')
    change('Control point 1: Y', '-1')
    expect(screen.queryByTestId('bezier-path')).not.toBeInTheDocument()
    click('Linear')
    click('Generate CSS')
    expect(screen.getByTestId('bezier-sample')).toHaveTextContent(
      'progress 50.00%',
    )
  })
  it('focuses and associates errors, recovers and clears all state', () => {
    mount()
    click('Generate CSS')
    change('Control point 2: X', '1.1')
    click('Generate CSS')
    const field = screen.getByLabelText('Control point 2: X')
    expect(field).toHaveFocus()
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field).toHaveAttribute(
      'aria-describedby',
      'bezier-hint bezier-error',
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Enter an X coordinate')
    expect(screen.queryByLabelText('CSS declarations')).not.toBeInTheDocument()
    change('Control point 2: X', '1')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    change('Control point 1: Y', '-5.0001')
    click('Generate CSS')
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a Y coordinate')
    click('Load example')
    click('Generate CSS')
    click('Clear')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('CSS declarations')).not.toBeInTheDocument()
    for (const label of [
      'Control point 1: X',
      'Control point 1: Y',
      'Control point 2: X',
      'Control point 2: Y',
    ]) {
      expect(screen.getByLabelText(label)).toHaveValue('')
    }
    expect(screen.getByLabelText('Control point 1: X')).toHaveFocus()
  })
  it('copies CSS, clears feedback when presets change and handles clipboard rejection', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    mount()
    click('Generate CSS')
    click('Copy')
    expect(writeText).toHaveBeenCalledWith(
      (screen.getByLabelText('CSS declarations') as HTMLTextAreaElement).value,
    )
    expect(await screen.findByRole('status')).toHaveTextContent('Copied')
    click('Ease in')
    click('Generate CSS')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    writeText.mockRejectedValueOnce(new Error('denied'))
    click('Copy')
    expect(await screen.findByText(/Copy failed/)).toBeVisible()
  })
})
