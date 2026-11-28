import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { LocaleProvider } from '@/i18n/compat'
import Page from '../[locale]/tools/json-merge-patch/page'

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
    target: screen.getByLabelText('Target JSON'),
    patch: screen.getByLabelText('Merge patch JSON'),
    apply: () =>
      fireEvent.click(screen.getByRole('button', { name: 'Apply patch' })),
  }
}
describe('JSON merge patch interactions', () => {
  it('loads example, merges, invalidates stale results on either edit and clears', () => {
    const { target, patch, apply } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Load example' }))
    apply()
    expect(
      (screen.getByLabelText('Merged JSON') as HTMLTextAreaElement).value,
    ).toContain('9007199254740993')
    expect(
      JSON.parse(
        (screen.getByLabelText('Merged JSON') as HTMLTextAreaElement).value,
      ).server,
    ).toEqual({ host: 'localhost', port: 443, tls: true })
    fireEvent.change(patch, { target: { value: 'null' } })
    expect(screen.queryByLabelText('Merged JSON')).not.toBeInTheDocument()
    apply()
    expect(screen.getByLabelText('Merged JSON')).toHaveValue('null')
    fireEvent.change(target, { target: { value: 'false' } })
    expect(screen.queryByLabelText('Merged JSON')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(target).toHaveValue('')
    expect(patch).toHaveValue('')
  })
  it('identifies and focuses the invalid field and clears errors when edited', () => {
    const { target, patch, apply } = setup()
    apply()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Target JSON: Enter a JSON value.',
    )
    expect(target).toHaveFocus()
    fireEvent.change(target, { target: { value: '{}' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    fireEvent.change(patch, { target: { value: '{' } })
    apply()
    expect(patch).toHaveFocus()
    expect(patch).toHaveAttribute('aria-invalid', 'true')
    expect(patch).toHaveAttribute('aria-describedby', 'merge-hint merge-error')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Merge patch JSON: Invalid JSON',
    )
    fireEvent.change(patch, { target: { value: '{}' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    apply()
    expect(screen.getByLabelText('Merged JSON')).toHaveValue('{}')
  })
})
