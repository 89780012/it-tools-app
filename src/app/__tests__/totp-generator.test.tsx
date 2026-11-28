import { cleanup, fireEvent, render, screen, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/i18n/compat'
import Page from '../[locale]/tools/totp-generator/page'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})
function setup() {
  render(
    <BrowserRouter>
      <LocaleProvider locale="en">
        <Page />
      </LocaleProvider>
    </BrowserRouter>,
  )
  return {
    secret: screen.getByLabelText('Base32 secret'),
    timestamp: screen.getByLabelText('Unix timestamp (seconds, optional)'),
    period: screen.getByLabelText('Period (seconds)'),
    generate: () =>
      fireEvent.click(screen.getByRole('button', { name: 'Generate code' })),
    example: () =>
      fireEvent.click(screen.getByRole('button', { name: 'Load example' })),
    output: () => screen.getByLabelText('One-time code'),
  }
}
describe('TOTP page', () => {
  it('loads the RFC example, resets stale output on edits and clears all fields', () => {
    const { secret, timestamp, period, generate, example, output } = setup()
    example()
    generate()
    expect(output()).toHaveValue('94287082')
    expect(
      screen.getByText('Fixed timestamp · automatic refresh off'),
    ).toBeInTheDocument()
    fireEvent.change(timestamp, { target: { value: '1111111109' } })
    expect(screen.queryByLabelText('One-time code')).not.toBeInTheDocument()
    generate()
    expect(output()).toHaveValue('07081804')
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(secret).toHaveValue('')
    expect(timestamp).toHaveValue('')
    expect(period).toHaveValue('30')
    expect(screen.getByLabelText('Code digits')).toHaveValue('6')
    expect(screen.queryByLabelText('One-time code')).not.toBeInTheDocument()
  })
  it('links errors to the affected field, focuses it and recovers', () => {
    const { secret, timestamp, period, generate, example, output } = setup()
    generate()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter a Base32 secret.',
    )
    expect(secret).toHaveFocus()
    expect(secret).toHaveAttribute('aria-describedby', 'totp-hint totp-error')
    expect(secret).toHaveAttribute('aria-invalid', 'true')
    example()
    fireEvent.change(period, { target: { value: '' } })
    generate()
    expect(period).toHaveFocus()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Period must be an integer',
    )
    fireEvent.change(period, { target: { value: '30' } })
    fireEvent.change(timestamp, { target: { value: '0x10' } })
    generate()
    expect(timestamp).toHaveFocus()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Timestamp must be an integer',
    )
    fireEvent.change(timestamp, { target: { value: '59' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    generate()
    expect(output()).toHaveValue('94287082')
  })
  it('refreshes live time across a boundary and stops on edit, fixed time or unmount', () => {
    vi.useFakeTimers()
    vi.setSystemTime(59000)
    const { timestamp, generate, example, output } = setup()
    example()
    fireEvent.change(timestamp, { target: { value: '' } })
    generate()
    expect(output()).toHaveValue('94287082')
    expect(screen.getByTestId('totp-remaining')).toHaveTextContent('1 s')
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(output()).toHaveValue('37359152')
    expect(screen.getByTestId('totp-remaining')).toHaveTextContent('30 s')
    fireEvent.change(timestamp, { target: { value: '59' } })
    expect(screen.queryByLabelText('One-time code')).not.toBeInTheDocument()
    generate()
    act(() => {
      vi.advanceTimersByTime(60000)
    })
    expect(output()).toHaveValue('94287082')
    fireEvent.change(timestamp, { target: { value: '' } })
    generate()
    cleanup()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('masks the secret and never includes it in output', () => {
    const { secret, generate, example, output } = setup()
    expect(secret).toHaveAttribute('type', 'password')
    example()
    generate()
    expect(output()).toHaveValue('94287082')
  })
})
