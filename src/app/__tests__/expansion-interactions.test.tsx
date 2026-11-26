import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/i18n/compat'
import { TextSetTool, ChmodTool, TableTool, SqlInsertTool } from '@/components/tools/expansion-local'
import { DnsTool, TlsTool } from '@/components/tools/expansion-network'
import { ToolSearch } from '@/components/tool-search'
import JsonFormatter from '../[locale]/tools/json-formatter/page'
import CurlTool from '../[locale]/tools/curl-converter/page'
import TypesPage from '../[locale]/tools/json-to-types/page'
import { CronBuilder } from '@/components/tools/text-extras'
function mount(Component: React.ComponentType) {
  return render(<MemoryRouter><LocaleProvider locale="en"><Component /></LocaleProvider></MemoryRouter>)
}
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
describe('expanded workflows', () => {
  it('computes list differences and updates case sensitivity', () => {
    mount(TextSetTool)
    fireEvent.change(screen.getByTestId('set-left'), { target: { value: 'Ada\nLin\nAda' } })
    fireEvent.change(screen.getByTestId('set-right'), { target: { value: 'ADA\nBob' } })
    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByTestId('tool-output')).toHaveValue('Ada')
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'leftOnly' } })
    expect(screen.getByTestId('tool-output')).toHaveValue('Lin')
  })
  it('converts permissions and clears invalid results', () => {
    mount(ChmodTool)
    fireEvent.change(screen.getByTestId('chmod-input'), { target: { value: '4755' } })
    expect((screen.getByTestId('tool-output') as HTMLTextAreaElement).value).toContain('rwsr-xr-x')
    fireEvent.change(screen.getByTestId('chmod-input'), { target: { value: '999' } })
    expect(screen.getByRole('alert')).toBeVisible()
    expect(screen.getByTestId('tool-output')).toHaveValue('')
  })
  it('previews parsed tables, filters and clears stale output when edited', () => {
    mount(TableTool)
    fireEvent.change(screen.getByTestId('table-input'), { target: { value: 'id,name\n001,Ada\n002,Lin' } })
    fireEvent.click(screen.getByTestId('table-run'))
    expect(screen.getByTestId('tool-output')).toHaveValue('id,name\n001,Ada\n002,Lin')
    fireEvent.change(screen.getByLabelText('Filter rows'), { target: { value: 'Lin' } })
    expect(screen.getByTestId('tool-output')).toHaveValue('id,name\n002,Lin')
    fireEvent.change(screen.getByTestId('table-input'), { target: { value: 'bad' } })
    expect(screen.queryByTestId('tool-output')).toBeNull()
  })
  it('generates SQL and reports malformed inputs', () => {
    mount(SqlInsertTool)
    fireEvent.change(screen.getByTestId('sql-insert-input'), { target: { value: '[{"id":1,"name":"Ada"}]' } })
    fireEvent.click(screen.getByTestId('sql-insert-run'))
    expect((screen.getByTestId('tool-output') as HTMLTextAreaElement).value).toContain("(1, 'Ada')")
    fireEvent.change(screen.getByTestId('sql-insert-input'), { target: { value: '{' } })
    fireEvent.click(screen.getByTestId('sql-insert-run'))
    expect(screen.getByTestId('tool-output')).toHaveValue('')
    expect(screen.getByRole('alert')).toBeVisible()
  })
  it('repairs JSON and generates Python and schema through normal controls', () => {
    const first = mount(JsonFormatter)
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: "{name:'Ada',}" } })
    fireEvent.click(screen.getByTestId('json-repair'))
    expect(screen.getAllByRole('textbox')[1]).toHaveValue('{\n  "name": "Ada"\n}')
    first.unmount()
    mount(TypesPage)
    fireEvent.change(screen.getByTestId('types-input'), { target: { value: '{"name":"Ada"}' } })
    fireEvent.change(screen.getByTestId('types-language'), { target: { value: 'python' } })
    expect((screen.getByTestId('tool-output') as HTMLTextAreaElement).value).toContain('TypedDict')
    fireEvent.change(screen.getByTestId('types-language'), { target: { value: 'schema' } })
    expect((screen.getByTestId('tool-output') as HTMLTextAreaElement).value).toContain('"required"')
  })
  it('applies generated cron and rejects invalid time zones', () => {
    const apply = vi.fn()
    mount(() => <CronBuilder onApply={apply} />)
    fireEvent.click(screen.getByRole('button', { name: 'Apply expression' }))
    expect(apply).toHaveBeenCalledWith('0 9 * * *', 'UTC')
    fireEvent.change(screen.getByLabelText('Time zone'), { target: { value: 'Invalid/Zone' } })
    expect(screen.getByRole('button', { name: 'Apply expression' })).toBeDisabled()
  })
  it('queries both DNS resolvers and clears old results on edits', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_url, options) => ({ ok: true, json: async () => ({ resolver: JSON.parse(options.body).resolver, answers: [{ data: '1.2.3.4', TTL: 300 }] }) })))
    mount(DnsTool)
    fireEvent.change(screen.getByTestId('dns-name'), { target: { value: 'example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))
    await waitFor(() => expect((screen.getByTestId('tool-output') as HTMLTextAreaElement).value).toContain('1.2.3.4'))
    expect(fetch).toHaveBeenCalledTimes(2)
    fireEvent.change(screen.getByTestId('dns-name'), { target: { value: 'other.example' } })
    expect(screen.getByTestId('tool-output')).toHaveValue('')
  })
  it('shows independent TLS trust and hostname results', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ host: 'example.com', version: 'TLS 1.3', hostnameValid: true, chainValid: false, validNow: true, daysRemaining: 20, certificates: [] }) })))
    mount(TlsTool)
    fireEvent.change(screen.getByTestId('tls-host'), { target: { value: 'example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))
    await waitFor(() => expect(screen.getByText('Fail')).toBeVisible())
    expect(screen.getByText('20')).toBeVisible()
  })
  it('discards a pending HTTP response when authentication changes', async () => {
    let finish!: (value: unknown) => void
    const fetchMock = vi.fn(() => new Promise(resolve => { finish = resolve }))
    vi.stubGlobal('fetch', fetchMock)
    mount(CurlTool)
    fireEvent.change(screen.getByTestId('curl-url'), { target: { value: 'https://example.com' } })
    fireEvent.change(screen.getByLabelText('Authentication'), { target: { value: 'bearer' } })
    fireEvent.change(screen.getByLabelText('Token'), { target: { value: 'first' } })
    fireEvent.click(screen.getByTestId('curl-send'))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    fireEvent.change(screen.getByLabelText('Token'), { target: { value: 'second' } })
    await act(async () => finish({ ok: true, json: async () => ({ status: 200, statusText: 'OK', headers: {}, body: 'stale' }) }))
    expect(screen.queryByTestId('curl-response')).toBeNull()
    expect(screen.getByTestId('curl-send')).toBeEnabled()
  })
  it('opens global search with keyboard and resolves task aliases', () => {
    mount(ToolSearch)
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    fireEvent.change(screen.getByRole('textbox', { name: 'Search tools' }), { target: { value: 'epoch' } })
    expect(screen.getByRole('link')).toHaveAttribute('href', '/tools/time-converter')
    fireEvent.click(screen.getByRole('link'))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
