import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/i18n/compat'
import SemverPage from '../[locale]/tools/semver-sorter/page'

function mount() {
  render(
    <MemoryRouter>
      <LocaleProvider locale="en">
        <SemverPage />
      </LocaleProvider>
    </MemoryRouter>,
  )
}
const click = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }))
const input = () => screen.getByLabelText('Versions (one per line)')
afterEach(() => vi.unstubAllGlobals())

describe('semantic version sorter page', () => {
  it('sorts the example, changes direction, invalidates stale results and fully resets', () => {
    mount()
    click('Load example')
    click('Sort versions')
    expect(screen.getByTestId('semver-highest')).toHaveTextContent(
      '2.1.0-beta.1',
    )
    expect(screen.getByTestId('semver-stable')).toHaveTextContent('2.0.0')
    expect(
      (
        screen.getByLabelText('Sorted versions') as HTMLTextAreaElement
      ).value.split('\n')[0],
    ).toBe('2.1.0-beta.1')
    fireEvent.change(screen.getByLabelText('Sort order'), {
      target: { value: 'ascending' },
    })
    expect(screen.queryByLabelText('Sorted versions')).not.toBeInTheDocument()
    click('Sort versions')
    expect(
      (
        screen.getByLabelText('Sorted versions') as HTMLTextAreaElement
      ).value.split('\n')[0],
    ).toBe('1.9.0')
    click('Clear')
    expect(input()).toHaveValue('')
    expect(screen.getByLabelText('Sort order')).toHaveValue('descending')
    expect(screen.getByLabelText('Allow a lowercase v prefix')).toBeChecked()
    expect(screen.queryByLabelText('Sorted versions')).not.toBeInTheDocument()
  })

  it('focuses invalid input, reports original line numbers and validates prefix settings', () => {
    mount()
    click('Sort versions')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter at least one version',
    )
    expect(input()).toHaveFocus()
    fireEvent.change(input(), { target: { value: '\n1.2.3\n1.02.0' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    click('Sort versions')
    expect(screen.getByRole('alert')).toHaveTextContent('Line 3')
    expect(input()).toHaveAttribute('aria-invalid', 'true')
    fireEvent.change(input(), { target: { value: 'v1.0.0-alpha' } })
    click('Sort versions')
    expect(screen.getByTestId('semver-stable')).toHaveTextContent(
      'No stable version',
    )
    fireEvent.click(screen.getByLabelText('Allow a lowercase v prefix'))
    expect(screen.queryByLabelText('Sorted versions')).not.toBeInTheDocument()
    click('Sort versions')
    expect(screen.getByRole('alert')).toHaveTextContent('Line 1')
  })

  it('copies sorted tags and preserves selectable output on clipboard denial', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    mount()
    fireEvent.change(input(), { target: { value: '1.9.0\n1.10.0' } })
    click('Sort versions')
    click('Copy')
    expect(writeText).toHaveBeenCalledWith('1.10.0\n1.9.0')
    expect(await screen.findByRole('status')).toHaveTextContent('Copied')
    writeText.mockRejectedValueOnce(new Error('denied'))
    click('Copy')
    expect(await screen.findByText(/Copy failed/)).toBeVisible()
    expect(screen.getByLabelText('Sorted versions')).toHaveValue(
      '1.10.0\n1.9.0',
    )
  })
})
