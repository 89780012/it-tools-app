import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/i18n/compat'
import Page from '../[locale]/tools/ipv4-cidr-aggregator/page'

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
const input = () => screen.getByLabelText('IPv4 addresses or CIDRs')
const output = () => screen.getByLabelText('Aggregated CIDRs')
afterEach(() => vi.unstubAllGlobals())

describe('CIDR aggregator page', () => {
  it('aggregates the example, reports statistics, invalidates edits and clears', () => {
    mount()
    click('Load example')
    click('Aggregate networks')
    expect(output()).toHaveValue('192.0.2.0/24\n198.51.100.9/32')
    for (const [key, value] of Object.entries({
      inputCount: '5',
      outputCount: '2',
      addressCount: '257',
      normalizedEntries: '1',
    }))
      expect(screen.getByTestId(`cidr-${key}`)).toHaveTextContent(value)
    fireEvent.change(input(), { target: { value: '0.0.0.0/0' } })
    expect(screen.queryByLabelText('Aggregated CIDRs')).not.toBeInTheDocument()
    click('Aggregate networks')
    expect(output()).toHaveValue('0.0.0.0/0')
    expect(screen.getByTestId('cidr-addressCount')).toHaveTextContent(
      '4294967296',
    )
    click('Clear')
    expect(input()).toHaveValue('')
    expect(screen.queryByLabelText('Aggregated CIDRs')).not.toBeInTheDocument()
  })
  it('associates errors with the input, focuses it and recovers after editing', () => {
    mount()
    click('Aggregate networks')
    expect(screen.getByRole('alert')).toHaveTextContent('Enter at least one')
    expect(input()).toHaveFocus()
    expect(input()).toHaveAttribute('aria-invalid', 'true')
    expect(input()).toHaveAttribute('aria-describedby', 'cidr-hint cidr-error')
    fireEvent.change(input(), { target: { value: '\n1.2.3.4/33' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    click('Aggregate networks')
    expect(screen.getByRole('alert')).toHaveTextContent('Line 2')
    click('Load example')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    click('Aggregate networks')
    expect(output()).toBeVisible()
  })
  it('copies plain CIDRs, resets feedback on edits and preserves selectable output after clipboard failure', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    mount()
    click('Load example')
    click('Aggregate networks')
    click('Copy')
    expect(writeText).toHaveBeenCalledWith('192.0.2.0/24\n198.51.100.9/32')
    expect(await screen.findByRole('status')).toHaveTextContent('Copied')
    fireEvent.change(input(), { target: { value: '1.2.3.4' } })
    click('Aggregate networks')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    writeText.mockRejectedValueOnce(new Error('denied'))
    click('Copy')
    expect(await screen.findByText(/Copy failed/)).toBeVisible()
    expect(output()).toHaveValue('1.2.3.4/32')
  })
})
