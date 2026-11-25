import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Download } from 'lucide-react'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ErrorMessage, Field, Panel } from '@/components/tools/workbench'
import { certificateDomains } from '@/lib/nginx-certificate'

type Availability = 'loading' | 'disabled' | 'staging' | 'production'
type RecordValue = { name: string; value: string }
type Order = { token: string; expires: string; records: RecordValue[]; staging: boolean }
const endpoint = '/api/certificates/'
const errors = ['disabled', 'access', 'origin', 'invalid', 'busy', 'dns', 'expired', 'rejected', 'upstream']

async function request(action: string, signal: AbortSignal, token?: string, domains?: string[]) {
  const response = await fetch(endpoint + action, {
    signal, cache: 'no-store', credentials: 'same-origin', redirect: 'error',
    ...(token && {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, ...(domains && { 'Content-Type': 'application/json' }) },
      body: domains ? JSON.stringify({ domains }) : undefined,
    }),
  })
  if (!response.ok) {
    const { error } = await response.json().catch(() => ({}))
    throw new Error(errors.includes(error) ? error : 'upstream')
  }
  return response
}

export default function OnlineNginxCertificate() {
  const t = useTranslations('tools.nginx-certificate-generator')
  const w = useTranslations('workbench')
  const [availability, setAvailability] = useState<Availability>('loading')
  const [domains, setDomains] = useState('')
  const [access, setAccess] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [downloaded, setDownloaded] = useState(false)
  const [copied, setCopied] = useState('')
  const active = useRef<AbortController | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    const secure = window.location.protocol === 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
    if (!secure) setAvailability('disabled')
    else void request('status', controller.signal)
      .then(response => response.json())
      .then(status => { if (!controller.signal.aborted) setAvailability(status.enabled === true ? status.staging === true ? 'staging' : 'production' : 'disabled') })
      .catch(() => { if (!controller.signal.aborted) setAvailability('disabled') })
    return () => { controller.abort(); active.current?.abort() }
  }, [])

  const reset = () => {
    active.current?.abort()
    active.current = null
    setBusy(false); setOrder(null); setError(''); setDownloaded(false); setCopied(''); setAccess('')
  }
  const run = async (operation: (signal: AbortSignal) => Promise<void>) => {
    if (active.current) return
    const controller = new AbortController()
    active.current = controller
    setError(''); setBusy(true)
    try { await operation(controller.signal) }
    catch (cause) {
      if (!controller.signal.aborted) {
        const code = cause instanceof Error && errors.includes(cause.message) ? cause.message : 'upstream'
        if (code === 'expired' || code === 'rejected') setOrder(null)
        setError(code)
      }
    } finally {
      if (active.current === controller) { active.current = null; setBusy(false) }
    }
  }
  const start = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!access.trim() || !['production', 'staging'].includes(availability)) return
    let names: string[]
    try { names = certificateDomains(domains) }
    catch { setError('invalid'); return }
    void run(async signal => {
      const response = await request('start', signal, access.trim(), names)
      const data: Order = await response.json()
      if (typeof data.token !== 'string' || !Array.isArray(data.records) || !Number.isFinite(Date.parse(data.expires))) throw new Error('upstream')
      if (!signal.aborted) { setOrder(data); setAccess(''); setCopied('') }
    })
  }
  const download = () => {
    if (!order) return
    void run(async signal => {
      const response = await request('download', signal, order.token)
      if (response.headers.get('content-type')?.split(';')[0] !== 'application/zip') throw new Error('upstream')
      const blob = await response.blob()
      if (signal.aborted) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = order.staging ? 'nginx-certificate-staging.zip' : 'nginx-certificate.zip'
      document.body.appendChild(link); link.click(); link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setDownloaded(true)
    })
  }
  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); setCopied(w('copied')) }
    catch { setCopied(w('copyError')) }
  }

  return <div className="space-y-5">
    <p className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm" data-testid="cert-online-notice">{t('online.intro')}</p>
    {(availability === 'loading' || availability === 'disabled') && <p role="status" className="text-sm text-muted-foreground">{t(`online.${availability}`)}</p>}
    {(availability === 'staging' || order?.staging) && <p role="status" className="rounded-md border border-amber-500/40 p-3 text-sm text-amber-700 dark:text-amber-300">{t('online.staging')}</p>}
    {!order ? <Panel title={`1 · ${t('online.create')}`}>
      <form className="space-y-4" onSubmit={start}>
        <fieldset disabled={busy || availability === 'loading' || availability === 'disabled'} className="space-y-4 disabled:opacity-70">
          <Field label={t('domains')} htmlFor="certificate-online-domains" hint={t('online.domainsHint')}>
            <Textarea id="certificate-online-domains" data-testid="cert-online-domains" dir="ltr" spellCheck={false} maxLength={6000} required value={domains} placeholder="example.com" onChange={event => { setDomains(event.target.value); setError('') }} />
          </Field>
          <Field label={t('online.access')} htmlFor="certificate-online-access">
            <Input type="password" id="certificate-online-access" data-testid="cert-online-access" dir="ltr" autoComplete="off" maxLength={256} value={access} required onChange={event => { setAccess(event.target.value); setError('') }} />
          </Field>
          <Button type="submit" data-testid="cert-online-start">{busy ? t('online.working') : t('online.create')}</Button>
        </fieldset>
      </form>
      <ErrorMessage>{error && t(`online.errors.${error}`)}</ErrorMessage>
    </Panel> : <>
      <Panel title={`2 · ${t('online.dns')}`}>
        <p className="text-sm text-muted-foreground">{t('online.dnsHint')}</p>
        <p className="text-sm text-muted-foreground">{t('online.deadline')} <time dateTime={order.expires}>{new Date(order.expires).toLocaleString()}</time></p>
        <ul className="space-y-3" data-testid="cert-online-records">
          {order.records.map(({ name, value }) => <li key={`${name}:${value}`} className="space-y-2 rounded-md border p-3">
            {[name, value].map((text, i) => <div className="flex flex-wrap items-center gap-2" key={i}>
              <code dir="ltr" className="min-w-0 flex-1 break-all text-sm">{text}</code>
              <Button type="button" size="sm" variant="outline" aria-label={`TXT ${i ? t('online.value') : t('domains')} · ${w('copy')}`} onClick={() => void copy(text)}>{w('copy')}</Button>
            </div>)}
          </li>)}
        </ul>
        <p role="status" className="text-sm text-muted-foreground">{copied}</p>
      </Panel>
      <Panel title={`3 · ${t('downloadBundle')}`}>
        <p className="text-sm text-muted-foreground">{t('online.install')}</p>
        <ErrorMessage>{error && t(`online.errors.${error}`)}</ErrorMessage>
        <div className="flex flex-wrap gap-2">
          <Button data-testid="cert-online-download" disabled={busy} onClick={download}><Download className="me-2 size-4" />{busy ? t('online.working') : downloaded ? t('downloadBundle') : t('online.verify')}</Button>
          <Button variant="outline" onClick={reset}>{w('clear')}</Button>
        </div>
        {downloaded && <p role="status" data-testid="cert-online-downloaded" className="text-sm">{t('online.downloaded')}</p>}
      </Panel>
    </>}
  </div>
}
