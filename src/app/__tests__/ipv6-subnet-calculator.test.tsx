import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { LocaleProvider } from '@/i18n/compat'
import Page from '../[locale]/tools/ipv6-subnet-calculator/page'

afterEach(cleanup)
function setup() {
  render(
    <BrowserRouter>
      <LocaleProvider locale="en">
        <Page />
      </LocaleProvider>
    </BrowserRouter>,
  )
  return {
    input: screen.getByLabelText('IPv6 address / prefix'),
    calculate: () =>
      fireEvent.click(screen.getByRole('button', { name: 'Calculate subnet' })),
  }
}
describe('IPv6 subnet page', () => {
  it('loads an example, calculates exact values, invalidates on edit and clears', () => {
    const { input, calculate } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Load example' }))
    calculate()
    const output = screen.getByLabelText(
      'Subnet summary',
    ) as HTMLTextAreaElement
    expect(output.value).toContain('Total addresses: 18446744073709551616')
    expect(output.value).toContain('Network CIDR: 2001:db8:1234:5678::/64')
    fireEvent.change(input, { target: { value: '::1/128' } })
    expect(screen.queryByLabelText('Subnet summary')).not.toBeInTheDocument()
    calculate()
    expect(
      (screen.getByLabelText('Subnet summary') as HTMLTextAreaElement).value,
    ).toContain('Total addresses: 1')
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(screen.queryByLabelText('Subnet summary')).not.toBeInTheDocument()
  })
  it('shows accessible errors, focuses input and recovers on edit', () => {
    const { input, calculate } = setup()
    calculate()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter an IPv6 address and prefix.',
    )
    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', 'ipv6-hint ipv6-error')
    fireEvent.change(input, { target: { value: '::/129' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    calculate()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Prefix must be an integer from 0 to 128',
    )
    fireEvent.change(input, { target: { value: '::/0' } })
    calculate()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(input).toHaveAttribute('aria-invalid', 'false')
  })
})
