import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/i18n/compat'
import Page from '../[locale]/tools/iso-week-calculator/page'

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
  screen.getByLabelText('Conversion summary') as HTMLTextAreaElement
afterEach(() => vi.unstubAllGlobals())

describe('ISO week page', () => {
  it('loads the cross-year example, converts both directions and invalidates edits', () => {
    mount()
    click('Load example')
    click('Convert')
    expect(output().value).toContain('ISO week date: 2020-W53-5')
    expect(output().value).toContain('Day of week: 5 (Friday)')
    expect(output().value).toContain('Week end (Sunday): 2021-01-03')
    change('Calendar date', '2024-02-29')
    expect(
      screen.queryByLabelText('Conversion summary'),
    ).not.toBeInTheDocument()
    click('Convert')
    expect(output().value).toContain('2024-W09-4')
    change('Conversion direction', 'week')
    expect(screen.getByLabelText('ISO week date')).toHaveValue('')
    expect(
      screen.queryByLabelText('Conversion summary'),
    ).not.toBeInTheDocument()
    click('Load example')
    click('Convert')
    expect(output().value).toContain('Calendar date: 2021-01-01')
    click('Clear')
    expect(screen.getByLabelText('ISO week date')).toHaveValue('')
    expect(screen.getByLabelText('ISO week date')).toHaveFocus()
    expect(
      screen.queryByLabelText('Conversion summary'),
    ).not.toBeInTheDocument()
  })
  it('focuses the input, associates errors, rejects missing weeks and recovers', () => {
    mount()
    change('Calendar date', '2026-02-29')
    click('Convert')
    const field = screen.getByLabelText('Calendar date')
    expect(field).toHaveFocus()
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field).toHaveAttribute(
      'aria-describedby',
      'iso-week-hint iso-week-error',
    )
    expect(screen.getByRole('alert')).toHaveTextContent('real calendar date')
    change('Conversion direction', 'week')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    change('ISO week date', '2021-W53-1')
    click('Convert')
    expect(screen.getByRole('alert')).toHaveTextContent('only 52 weeks')
    change('ISO week date', '9999-W52-7')
    click('Convert')
    expect(screen.getByRole('alert')).toHaveTextContent('outside the supported')
    change('ISO week date', '0001-W01-1')
    click('Convert')
    expect(output().value).toContain('Calendar date: 0001-01-01')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('copies the localized summary and handles clipboard denial with selectable output', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    mount()
    click('Load example')
    click('Convert')
    click('Copy')
    expect(writeText).toHaveBeenCalledWith(output().value)
    expect(await screen.findByRole('status')).toHaveTextContent('Copied')
    change('Calendar date', '2026-11-28')
    click('Convert')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    writeText.mockRejectedValueOnce(new Error('denied'))
    click('Copy')
    expect(await screen.findByText(/Copy failed/)).toBeVisible()
    expect(output()).toHaveAttribute('readonly')
  })
})
