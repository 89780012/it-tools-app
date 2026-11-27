import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/i18n/compat'
import AspectRatioPage from '../[locale]/tools/aspect-ratio-calculator/page'

function mount() {
  render(
    <MemoryRouter>
      <LocaleProvider locale="en">
        <AspectRatioPage />
      </LocaleProvider>
    </MemoryRouter>,
  )
}

function click(name: string) {
  fireEvent.click(screen.getByRole('button', { name }))
}

function change(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

afterEach(() => vi.unstubAllGlobals())

describe('Aspect Ratio Calculator page', () => {
  it('shows the example, removes stale results on mode changes, and clears inputs', () => {
    mount()
    expect(screen.queryByLabelText('Target width (px)')).not.toBeInTheDocument()
    click('Load example')
    expect(screen.getByLabelText('Calculation mode')).toHaveValue('fit')
    click('Calculate')
    expect(screen.getByText('16:9')).toBeVisible()
    expect(screen.getByText('1000 × 563')).toBeVisible()
    expect(screen.getByText(/rounded to the nearest/)).toBeVisible()
    change('Calculation mode', 'height')
    expect(screen.queryByText('1000 × 563')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Target width (px)')).not.toBeInTheDocument()
    change('Target height (px)', '720')
    click('Calculate')
    expect(screen.getByText('1280 × 720')).toBeVisible()
    expect(screen.queryByText(/rounded to the nearest/)).not.toBeInTheDocument()
    click('Clear')
    expect(screen.getByLabelText('Calculation mode')).toHaveValue('ratio')
    expect(screen.getByLabelText('Original width (px)')).toHaveValue('')
    expect(screen.queryByRole('button', { name: /^Copy$/ })).not.toBeInTheDocument()
  })

  it('focuses the invalid input and removes the error when corrected', () => {
    mount()
    change('Original width (px)', '1920')
    change('Original height (px)', '0')
    click('Calculate')
    const height = screen.getByLabelText('Original height (px)')
    expect(height).toHaveFocus()
    expect(height).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('Original height (px) must be a whole number')
    change('Original height (px)', '1080')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(height).not.toHaveAttribute('aria-invalid')
    click('Calculate')
    expect(screen.getByText('16:9')).toBeVisible()
    expect(screen.queryByText('Scaled dimensions (px)')).not.toBeInTheDocument()
  })

  it('reports a clipboard failure and keeps the calculated text selectable', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Permission denied'))
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    mount()
    click('Load example')
    click('Calculate')
    click('Copy')
    expect(await screen.findByText(/Copy failed/)).toBeVisible()
    expect(writeText).toHaveBeenCalledWith('16:9\n1000 × 563')
    expect(screen.getByText('1000 × 563')).toBeVisible()
  })
})
