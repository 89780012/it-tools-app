import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/i18n/compat'
import Page from '../[locale]/tools/css-box-shadow-generator/page'

const mount = () =>
  render(
    <MemoryRouter>
      <LocaleProvider locale="en">
        <Page />
      </LocaleProvider>
    </MemoryRouter>,
  )
const click = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }))
const change = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
const output = () => screen.getByLabelText('CSS declaration')
afterEach(() => vi.unstubAllGlobals())

describe('box shadow page', () => {
  it('edits and previews multiple layers, removes stale output, limits layers and resets', () => {
    mount()
    click('Load example')
    click('Generate CSS')
    expect(output()).toHaveValue(
      'box-shadow: 0px 8px 24px 0px rgba(0, 0, 0, 0.2),\n  inset 0px 2px 4px -1px rgba(37, 99, 235, 0.35);',
    )
    expect(screen.getByTestId('shadow-preview').style.boxShadow).toContain(
      'inset',
    )
    change('Layer', '1')
    expect(screen.getByLabelText('Inset shadow')).toBeChecked()
    expect(output()).toBeInTheDocument()
    change('Spread radius (px)', '-5')
    expect(screen.queryByLabelText('CSS declaration')).not.toBeInTheDocument()
    expect(screen.getByTestId('shadow-preview').style.boxShadow).toBe('none')
    click('Generate CSS')
    expect(output()).toHaveValue(
      'box-shadow: 0px 8px 24px 0px rgba(0, 0, 0, 0.2),\n  inset 0px 2px 4px -5px rgba(37, 99, 235, 0.35);',
    )
    click('Remove layer')
    expect(screen.getByLabelText('Layer')).toHaveValue('0')
    expect(screen.getByRole('button', { name: 'Remove layer' })).toBeDisabled()
    for (let index = 1; index < 8; index++) click('Add layer')
    expect(screen.getByRole('button', { name: 'Add layer' })).toBeDisabled()
    expect(
      screen.getByLabelText('Layer').querySelectorAll('option'),
    ).toHaveLength(8)
    click('Clear')
    expect(screen.getByLabelText('Horizontal offset (px)')).toHaveValue('')
    expect(screen.getByLabelText('Horizontal offset (px)')).toHaveFocus()
    expect(
      screen.getByLabelText('Layer').querySelectorAll('option'),
    ).toHaveLength(1)
  })
  it('selects and focuses the invalid layer, associates errors, and recovers on edit', async () => {
    mount()
    change('Blur radius (px)', '-1')
    click('Add layer')
    click('Generate CSS')
    expect(screen.getByLabelText('Layer')).toHaveValue('0')
    await waitFor(() =>
      expect(screen.getByLabelText('Blur radius (px)')).toHaveFocus(),
    )
    expect(screen.getByLabelText('Blur radius (px)')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.getByLabelText('Blur radius (px)')).toHaveAttribute(
      'aria-describedby',
      'shadow-hint shadow-error',
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Layer 1: blur radius')
    change('Blur radius (px)', '0')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    click('Generate CSS')
    expect(output()).toBeInTheDocument()
  })
  it('copies the exact declaration and handles clipboard failure', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    mount()
    click('Generate CSS')
    click('Copy')
    expect(writeText).toHaveBeenCalledWith(
      'box-shadow: 0px 8px 24px 0px rgba(0, 0, 0, 0.2);',
    )
    expect(await screen.findByRole('status')).toHaveTextContent('Copied')
    writeText.mockRejectedValueOnce(new Error('denied'))
    click('Copy')
    expect(await screen.findByRole('status')).toHaveTextContent('Copy failed')
    change('Opacity (%)', '50')
    click('Generate CSS')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})
