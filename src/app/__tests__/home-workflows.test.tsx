import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Home from '../[locale]/page'
import { LocaleProvider } from '@/i18n/compat'
import { FAVORITES_KEY, RECENT_KEY } from '@/lib/tool-preferences'

beforeEach(() => localStorage.clear())
afterEach(cleanup)
const mount = () =>
  render(
    <BrowserRouter>
      <LocaleProvider locale="en">
        <Home />
      </LocaleProvider>
    </BrowserRouter>,
  )

describe('home workflows', () => {
  it('favorites a tool independently of navigation, filters it and persists after remount', () => {
    const first = mount()
    fireEvent.click(screen.getByTestId('favorite-json-formatter'))
    expect(screen.getByTestId('favorite-json-formatter')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(JSON.parse(localStorage.getItem(FAVORITES_KEY)!)).toEqual([
      'json-formatter',
    ])
    expect(
      screen.getByTestId('favorite-json-formatter').closest('a'),
    ).toBeNull()
    fireEvent.click(screen.getByTestId('view-favorites'))
    expect(screen.getAllByTestId(/^tool-card-/)).toHaveLength(1)
    first.unmount()
    mount()
    fireEvent.click(screen.getByTestId('view-favorites'))
    expect(screen.getByTestId('tool-card-json-formatter')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('favorite-json-formatter'))
    expect(screen.getByText(/Save frequently used tools/)).toBeInTheDocument()
  })
  it('searches by tool ID and intersects category selection', () => {
    mount()
    fireEvent.change(screen.getByTestId('tool-search'), {
      target: { value: 'json-to-types' },
    })
    expect(screen.getAllByTestId(/^tool-card-/)).toHaveLength(1)
    fireEvent.click(screen.getByTestId('category-network'))
    expect(screen.queryByTestId('tool-card-json-to-types')).toBeNull()
    expect(screen.getByText('No matching tools found')).toBeInTheDocument()
  })
  it('shows ordered recent tools and clears their stored history', () => {
    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify(['text-diff', 'json-formatter']),
    )
    mount()
    fireEvent.click(screen.getByTestId('view-recent'))
    expect(
      screen.getAllByTestId(/^tool-card-/).map((card) => card.dataset.testid),
    ).toEqual(['tool-card-text-diff', 'tool-card-json-formatter'])
    fireEvent.click(
      screen.getByRole('button', { name: 'Clear recent history' }),
    )
    expect(
      screen.getByText('Tools you open will appear here.'),
    ).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(RECENT_KEY)!)).toEqual([])
  })
})
