import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Workbench,
  Field,
  Panel,
  ErrorMessage,
  Output,
} from '@/components/tools/workbench'
import {
  decodeJwt,
  jwtClaims,
  verifyHs256,
  type DecodedJwt,
} from '@/lib/developer-jwt'

const example =
  'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJBZGEiLCJleHAiOjE4OTM0NTYwMDAsImlhdCI6MTcwNDA2NzIwMH0.'

export default function JwtDecoderPage() {
  const t = useTranslations('tools.jwt-decoder')
  const w = useTranslations('workbench')
  const locale = useLocale()
  const [token, setToken] = useState('')
  const [secret, setSecret] = useState('')
  const [decoded, setDecoded] = useState<DecodedJwt | null>(null)
  const [error, setError] = useState('')
  const [verification, setVerification] = useState('unverified')
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(Date.now)
  const generation = useRef(0)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => {
      clearInterval(timer)
      generation.current++
    }
  }, [])
  const reset = () => {
    generation.current++
    setDecoded(null)
    setError('')
    setVerification('unverified')
    setBusy(false)
  }
  const decode = () => {
    reset()
    try {
      setDecoded(decodeJwt(token))
      setNow(Date.now())
    } catch {
      setError('invalidToken')
    }
  }
  const verify = async () => {
    if (!decoded) return
    const version = ++generation.current
    setBusy(true)
    setError('')
    setVerification('unverified')
    try {
      const valid = await verifyHs256(decoded, secret)
      if (version === generation.current)
        setVerification(valid ? 'verified' : 'invalidSignature')
    } catch (cause) {
      if (version === generation.current)
        setError(
          cause instanceof Error &&
            [
              'unsupportedAlgorithm',
              'secretRequired',
              'cryptoUnavailable',
            ].includes(cause.message)
            ? cause.message
            : 'verificationError',
        )
    } finally {
      if (version === generation.current) setBusy(false)
    }
  }
  return (
    <Workbench toolId="jwt-decoder">
      <Panel title={w('input')}>
        <Field label={t('token')} htmlFor="jwt-token">
          <Textarea
            id="jwt-token"
            data-testid="jwt-token"
            className="min-h-36 font-mono"
            dir="ltr"
            value={token}
            spellCheck={false}
            autoComplete="off"
            onChange={(event) => {
              reset()
              setToken(event.target.value)
            }}
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button data-testid="jwt-decode" onClick={decode}>
            {t('decode')}
          </Button>
          <Button
            variant="outline"
            data-testid="jwt-example"
            onClick={() => {
              reset()
              setToken(example)
            }}
          >
            {w('example')}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              reset()
              setToken('')
              setSecret('')
            }}
          >
            {w('clear')}
          </Button>
        </div>
        <ErrorMessage>{error && t(error)}</ErrorMessage>
        <p
          role="status"
          data-testid="jwt-verification"
          className="rounded border p-3 text-sm"
        >
          {t(verification)}
        </p>
        <p className="text-sm text-muted-foreground">{t('trustHint')}</p>
      </Panel>
      {decoded && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title={t('header')}>
              <Output
                value={JSON.stringify(decoded.header, null, 2)}
                filename="header.json"
                label={t('header')}
              />
            </Panel>
            <Panel title={t('payload')}>
              <Output
                value={JSON.stringify(decoded.payload, null, 2)}
                filename="payload.json"
                label={t('payload')}
              />
            </Panel>
          </div>
          <Panel title={t('claims')}>
            {jwtClaims(decoded.payload, now).length === 0 ? (
              <p>{t('noClaims')}</p>
            ) : (
              <ul data-testid="jwt-claims" className="space-y-2">
                {jwtClaims(decoded.payload, now).map((claim) => (
                  <li key={claim.key} className="flex flex-wrap gap-2">
                    <strong>{t(claim.key)}</strong>
                    <span>
                      {claim.date
                        ? new Intl.DateTimeFormat(locale, {
                            dateStyle: 'medium',
                            timeStyle: 'long',
                            timeZone: 'UTC',
                          }).format(new Date(claim.date))
                        : claim.value !== null &&
                            typeof claim.value === 'object'
                          ? JSON.stringify(claim.value)
                          : String(claim.value)}
                    </span>
                    <span>{t(claim.status)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title={t('verifyTitle')}>
            <Field
              label={t('secret')}
              htmlFor="jwt-secret"
              hint={t('secretHint')}
            >
              <Input
                id="jwt-secret"
                data-testid="jwt-secret"
                type="password"
                value={secret}
                autoComplete="off"
                onChange={(event) => {
                  generation.current++
                  setBusy(false)
                  setError('')
                  setVerification('unverified')
                  setSecret(event.target.value)
                }}
              />
            </Field>
            <Button data-testid="jwt-verify" disabled={busy} onClick={verify}>
              {busy ? t('verifying') : t('verify')}
            </Button>
          </Panel>
        </>
      )}
    </Workbench>
  )
}
