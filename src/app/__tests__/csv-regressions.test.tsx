import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { LocaleProvider } from '@/i18n/compat'
import CsvToJsonPage from '../[locale]/tools/csv-to-json/page'
import en from '@/i18n/messages/en.json'

afterEach(cleanup)
function mount() {
  render(
    <BrowserRouter>
      <LocaleProvider locale="en">
        <CsvToJsonPage />
      </LocaleProvider>
    </BrowserRouter>,
  )
  return screen.getAllByRole('textbox') as HTMLTextAreaElement[]
}

describe('CSV regression cases found by browser acceptance', () => {
  it.each([
    'name,age\n"unterminated,37',
    'name,name\nAda,Lin',
    'name,age\nAda,37,extra',
    '__proto__.polluted\ntrue',
    'constructor.prototype.polluted\ntrue',
  ])(
    'rejects malformed or lossy input and clears a previous result: %s',
    (csv) => {
      const [input, output] = mount()
      fireEvent.click(screen.getByRole('button', { name: 'Convert' }))
      expect(JSON.parse(output.value)).toHaveLength(2)
      fireEvent.change(input, { target: { value: csv } })
      fireEvent.click(screen.getByRole('button', { name: 'Convert' }))
      expect(output).toHaveValue('')
      expect(
        screen.getByText(en.tools['csv-to-json'].invalid_csv),
      ).toBeInTheDocument()
      expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    },
  )
  it('preserves quoted commas, escaped quotes, multiline cells and typed nested values', () => {
    const [input, output] = mount()
    fireEvent.change(input, {
      target: {
        value:
          'user.name,note,age,active\r\n"Ada, L","a ""quoted""\nline",0,false',
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }))
    expect(JSON.parse(output.value)).toEqual([
      {
        user: { name: 'Ada, L' },
        note: 'a "quoted"\nline',
        age: 0,
        active: false,
      },
    ])
  })
})
