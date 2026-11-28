import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { generateTotp, TotpError, TOTP_MAX_SECRET_LENGTH } from '@/lib/totp'
import { ErrorMessage, Field, Output, Panel, Workbench } from './workbench'

const defaults = {
  secret: '',
  algorithm: 'SHA1',
  digits: '6',
  period: '30',
  timestamp: '',
}
const selectClass =
  'h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm'

export function TotpGenerator() {
  const t = useTranslations('totp')
  const w = useTranslations('workbench')
  const [form, setForm] = useState(defaults)
  const [active, setActive] = useState<typeof defaults>()
  const [result, setResult] = useState<ReturnType<typeof generateTotp>>()
  const [error, setError] = useState<TotpError>()
  const formRef = useRef<HTMLFormElement>(null)
  const calculate = (settings: typeof defaults) => {
    if (!/^\d+$/.test(settings.period.trim()))
      throw new TotpError('invalidPeriod', 'period')
    if (
      settings.timestamp.trim() !== '' &&
      !/^\d+$/.test(settings.timestamp.trim())
    )
      throw new TotpError('invalidTimestamp', 'timestamp')
    return generateTotp({
      secret: settings.secret,
      algorithm: settings.algorithm,
      digits: Number(settings.digits),
      period: Number(settings.period),
      timestamp:
        settings.timestamp.trim() === ''
          ? Math.floor(Date.now() / 1000)
          : Number(settings.timestamp),
    })
  }
  useEffect(() => {
    if (!active || active.timestamp.trim() !== '') return
    const timer = window.setInterval(() => setResult(calculate(active)), 1000)
    return () => window.clearInterval(timer)
  }, [active])
  function reset(next: typeof defaults) {
    setForm(next)
    setActive(undefined)
    setResult(undefined)
    setError(undefined)
  }
  function submit(event: FormEvent) {
    event.preventDefault()
    try {
      setResult(calculate(form))
      setActive({ ...form })
      setError(undefined)
    } catch (caught) {
      if (!(caught instanceof TotpError)) throw caught
      setActive(undefined)
      setResult(undefined)
      setError(caught)
      formRef.current
        ?.querySelector<HTMLElement>(`#totp-${caught.field}`)
        ?.focus()
    }
  }
  const errorProps = (field: string) => ({
    'aria-invalid': error?.field === field,
    'aria-describedby': `totp-hint${error?.field === field ? ' totp-error' : ''}`,
  })
  return (
    <Workbench toolId="totp-generator">
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title={w('input')}>
          <form
            ref={formRef}
            onSubmit={submit}
            className="space-y-4"
            noValidate
          >
            <Field label={t('secret')} htmlFor="totp-secret">
              <Input
                id="totp-secret"
                type="password"
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="none"
                dir="ltr"
                value={form.secret}
                {...errorProps('secret')}
                onChange={(e) => reset({ ...form, secret: e.target.value })}
              />
            </Field>
            <p id="totp-hint" className="text-sm text-muted-foreground">
              {t('hint', { limit: TOTP_MAX_SECRET_LENGTH })}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('algorithm')} htmlFor="totp-algorithm">
                <select
                  id="totp-algorithm"
                  className={selectClass}
                  value={form.algorithm}
                  {...errorProps('algorithm')}
                  onChange={(e) =>
                    reset({ ...form, algorithm: e.target.value })
                  }
                >
                  {['SHA1', 'SHA256', 'SHA512'].map((value) => (
                    <option key={value} value={value}>
                      {value.replace('SHA', 'SHA-')}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('digits')} htmlFor="totp-digits">
                <select
                  id="totp-digits"
                  className={selectClass}
                  value={form.digits}
                  {...errorProps('digits')}
                  onChange={(e) => reset({ ...form, digits: e.target.value })}
                >
                  {[6, 8].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label={t('period')} htmlFor="totp-period">
              <Input
                id="totp-period"
                inputMode="numeric"
                dir="ltr"
                value={form.period}
                {...errorProps('period')}
                onChange={(e) => reset({ ...form, period: e.target.value })}
              />
            </Field>
            <Field
              label={t('timestamp')}
              htmlFor="totp-timestamp"
              hint={t('timeHint')}
            >
              <Input
                id="totp-timestamp"
                inputMode="numeric"
                dir="ltr"
                value={form.timestamp}
                {...errorProps('timestamp')}
                onChange={(e) => reset({ ...form, timestamp: e.target.value })}
              />
            </Field>
            <div id="totp-error">
              <ErrorMessage>{error && t(error.code)}</ErrorMessage>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{t('generate')}</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  reset({
                    ...defaults,
                    secret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
                    digits: '8',
                    timestamp: '59',
                  })
                }
              >
                {w('example')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => reset(defaults)}
              >
                {w('clear')}
              </Button>
            </div>
          </form>
        </Panel>
        <Panel title={w('result')}>
          {result ? (
            <>
              <div className="[&_textarea]:min-h-24 [&_textarea]:text-3xl [&_textarea]:tracking-widest">
                <Output
                  key={result.code}
                  value={result.code}
                  label={t('code')}
                  filename="totp-code.txt"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {active?.timestamp.trim() === '' ? t('live') : t('fixed')}
              </p>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t('remaining')}</dt>
                  <dd data-testid="totp-remaining">
                    {t('seconds', { count: result.remaining })}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('counter')}</dt>
                  <dd dir="ltr">{result.counter}</dd>
                </div>
                {(['validFrom', 'validUntil'] as const).map((key) => (
                  <div key={key}>
                    <dt className="text-muted-foreground">{t(key)}</dt>
                    <dd dir="ltr" className="break-all">
                      {new Date(result[key] * 1000).toISOString()} (
                      {result[key]})
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t('emptyResult')}</p>
          )}
          <p className="text-sm text-muted-foreground">{t('rules')}</p>
        </Panel>
      </div>
    </Workbench>
  )
}
