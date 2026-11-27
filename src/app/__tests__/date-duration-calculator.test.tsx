import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/i18n/compat'
import DateDurationPage from '../[locale]/tools/date-duration-calculator/page'

function mount() {
  render(
    <MemoryRouter>
      <LocaleProvider locale="en">
        <DateDurationPage />
      </LocaleProvider>
    </MemoryRouter>,
  )
}
const click = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }))
const change = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
afterEach(() => vi.unstubAllGlobals())

describe('date duration page', () => {
  it('loads the example, calculates, clears stale results after changes and resets all controls', () => {
    mount()
    click('Load example')
    click('Calculate')
    expect(screen.getByTestId('calendarDays')).toHaveTextContent('7')
    expect(screen.getByTestId('businessDays')).toHaveTextContent('4')
    expect(
      (screen.getByLabelText('Result summary') as HTMLTextAreaElement).value,
    ).toContain('Weekday holidays deducted: 1')
    fireEvent.click(screen.getByLabelText('Include end date'))
    expect(screen.queryByTestId('businessDays')).not.toBeInTheDocument()
    click('Calculate')
    expect(screen.getByTestId('businessDays')).toHaveTextContent('5')
    expect(screen.getByTestId('calendarDays')).toHaveTextContent('8')
    click('Clear')
    expect(screen.getByLabelText('Start date')).toHaveValue('')
    expect(screen.getByLabelText('End date')).toHaveValue('')
    expect(screen.getByLabelText('Holidays (optional)')).toHaveValue('')
    expect(screen.getByLabelText('Include end date')).not.toBeChecked()
    expect(screen.queryByLabelText('Result summary')).not.toBeInTheDocument()
  })

  it('focuses missing dates, reversed ranges and malformed holiday lines, then removes errors on edit', () => {
    mount()
    click('Calculate')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Start date must be a valid',
    )
    expect(screen.getByLabelText('Start date')).toHaveFocus()
    expect(screen.getByLabelText('Start date')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    click('Load example')
    change('End date', '2026-11-20')
    click('Calculate')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'End date must be on or after',
    )
    expect(screen.getByLabelText('End date')).toHaveFocus()
    change('End date', '2026-11-30')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    change('Holidays (optional)', '\n2026-02-29')
    click('Calculate')
    expect(screen.getByRole('alert')).toHaveTextContent('line 2')
    expect(screen.getByLabelText('Holidays (optional)')).toHaveFocus()
    change('Holidays (optional)', '')
    click('Calculate')
    expect(screen.getByTestId('businessDays')).toHaveTextContent('5')
  })

  it('copies the result and reports clipboard failures while preserving selectable output', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    mount()
    click('Load example')
    click('Calculate')
    click('Copy')
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('Business days: 4'),
    )
    expect(await screen.findByRole('status')).toHaveTextContent('Copied')
    writeText.mockRejectedValueOnce(new Error('denied'))
    click('Copy')
    expect(await screen.findByText(/Copy failed/)).toBeVisible()
    expect(
      (screen.getByLabelText('Result summary') as HTMLTextAreaElement).value,
    ).toContain('Calendar days: 7')
  })
})
