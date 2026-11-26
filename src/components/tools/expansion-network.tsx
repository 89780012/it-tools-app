import { useEffect, useRef, useState } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Workbench, Panel, Field, Output, ErrorMessage } from './workbench'
import { SSEParser, validateStreamUrl } from '@/lib/stream-events'
const selectClass = 'w-full rounded-md border bg-background p-2 text-sm'

export function DnsTool() {
  const t = useTranslations('expansion')
  const [name, setName] = useState(''),
    [type, setType] = useState('A'),
    [resolver, setResolver] = useState('alidns'),
    [result, setResult] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => controller.current?.abort(), [])
  const reset = () => {
    controller.current?.abort()
    setResult('')
    setError('')
    setBusy(false)
  }
  const run = async () => {
    reset()
    const current = new AbortController()
    controller.current = current
    setBusy(true)
    try {
      const selectedResolvers =
        resolver === 'all' ? ['alidns', 'cloudflare', 'google'] : [resolver]
      const responses = await Promise.allSettled(
        selectedResolvers.map(async (selected) => {
          const response = await fetch('/api/dns', {
            method: 'POST',
            signal: current.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, type, resolver: selected }),
          })
          const data = await response.json()
          if (!response.ok) throw new Error(data.error)
          return data
        }),
      )
      if (!current.signal.aborted) {
        const results = responses.map((response, index) =>
          response.status === 'fulfilled'
            ? response.value
            : { resolver: selectedResolvers[index], error: t('networkFailed') },
        )
        setResult(JSON.stringify(results, null, 2))
        if (responses.some((response) => response.status === 'rejected'))
          setError(t('networkFailed'))
      }
    } catch {
      if (!current.signal.aborted) setError(t('networkFailed'))
    } finally {
      if (controller.current === current) setBusy(false)
    }
  }
  return (
    <Workbench toolId="dns-lookup" local={false}>
      <Panel title={t('query')}>
        <Field label={t('domain')}>
          <Input
            aria-label={t('domain')}
            data-testid="dns-name"
            value={name}
            onChange={(event) => {
              reset()
              setName(event.target.value)
            }}
            placeholder="example.com"
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t('recordType')}>
            <select
              aria-label={t('recordType')}
              className={selectClass}
              value={type}
              onChange={(event) => {
                reset()
                setType(event.target.value)
              }}
            >
              {['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'CAA'].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </Field>
          <Field label={t('resolver')}>
            <select
              aria-label={t('resolver')}
              className={selectClass}
              value={resolver}
              onChange={(event) => {
                reset()
                setResolver(event.target.value)
              }}
            >
              <option value="alidns">AliDNS</option>
              <option value="all">{t('compareResolvers')}</option>
              <option value="cloudflare">Cloudflare</option>
              <option value="google">Google</option>
            </select>
          </Field>
        </div>
        <p className="text-sm text-muted-foreground">{t('dnsHint')}</p>
        <Button disabled={busy || !name.trim()} onClick={run}>
          {t(busy ? 'processing' : 'run')}
        </Button>
        <ErrorMessage>{error}</ErrorMessage>
      </Panel>
      <Panel title={t('result')}>
        <Output value={result} filename="dns.json" />
      </Panel>
    </Workbench>
  )
}
interface TlsResult {
  host: string
  version: string
  cipher: string
  hostnameValid: boolean
  chainValid: boolean
  validNow: boolean
  daysRemaining: number
  chainError?: string
  certificates: unknown[]
  checkedAt: string
}
export function TlsTool() {
  const t = useTranslations('expansion')
  const [host, setHost] = useState(''),
    [result, setResult] = useState<TlsResult | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => controller.current?.abort(), [])
  const run = async () => {
    controller.current?.abort()
    const current = new AbortController()
    controller.current = current
    setResult(null)
    setError('')
    setBusy(true)
    try {
      const response = await fetch('/api/tls', {
        method: 'POST',
        signal: current.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      if (!current.signal.aborted) setResult(data)
    } catch {
      if (!current.signal.aborted) setError(t('networkFailed'))
    } finally {
      if (controller.current === current) setBusy(false)
    }
  }
  return (
    <Workbench toolId="tls-checker" local={false}>
      <Panel title={t('domain')}>
        <Field label={t('domain')}>
          <Input
            aria-label={t('domain')}
            data-testid="tls-host"
            placeholder="example.com"
            value={host}
            onChange={(event) => {
              controller.current?.abort()
              setBusy(false)
              setResult(null)
              setError('')
              setHost(event.target.value)
            }}
          />
        </Field>
        <p className="text-sm text-muted-foreground">{t('tlsHint')}</p>
        <Button disabled={busy || !host.trim()} onClick={run}>
          {t(busy ? 'processing' : 'run')}
        </Button>
        <ErrorMessage>{error}</ErrorMessage>
      </Panel>
      {result && (
        <Panel title={t('result')}>
          <dl className="grid grid-cols-2 gap-3">
            {(['hostnameValid', 'chainValid', 'validNow'] as const).map(
              (key) => (
                <div key={key}>
                  <dt>{t(key)}</dt>
                  <dd>{t(result[key] ? 'pass' : 'fail')}</dd>
                </div>
              ),
            )}
            <div>
              <dt>{t('daysRemaining')}</dt>
              <dd>{result.daysRemaining}</dd>
            </div>
            <div>
              <dt>TLS</dt>
              <dd>{result.version}</dd>
            </div>
          </dl>
          <Output value={JSON.stringify(result, null, 2)} filename="tls.json" />
        </Panel>
      )}
    </Workbench>
  )
}

interface LogEntry {
  time: string
  direction: string
  data: string
}
export function StreamTool() {
  const t = useTranslations('expansion')
  const [protocol, setProtocol] = useState<'websocket' | 'sse'>('websocket'),
    [url, setUrl] = useState(''),
    [message, setMessage] = useState(''),
    [headers, setHeaders] = useState('{}'),
    [body, setBody] = useState(''),
    [method, setMethod] = useState('GET'),
    [heartbeat, setHeartbeat] = useState(0),
    [heartbeatText, setHeartbeatText] = useState('ping'),
    [subprotocol, setSubprotocol] = useState('')
  const [state, setState] = useState('disconnected'),
    [logs, setLogs] = useState<LogEntry[]>([]),
    [error, setError] = useState('')
  const socket = useRef<WebSocket | null>(null),
    controller = useRef<AbortController | null>(null),
    timer = useRef<ReturnType<typeof setInterval> | null>(null),
    revision = useRef(0)
  const add = (direction: string, data: string) =>
    setLogs((previous) =>
      [
        ...previous,
        {
          time: new Date().toISOString(),
          direction,
          data: data.slice(0, 20_000),
        },
      ].slice(-500),
    )
  const close = () => {
    revision.current++
    if (timer.current) clearInterval(timer.current)
    timer.current = null
    socket.current?.close()
    socket.current = null
    controller.current?.abort()
    controller.current = null
  }
  useEffect(() => () => close(), [])
  const disconnect = () => {
    close()
    setState('disconnected')
  }
  const connect = async () => {
    close()
    const token = revision.current
    setError('')
    setState('connecting')
    try {
      const target = validateStreamUrl(url, protocol)
      if (protocol === 'websocket') {
        if (!Number.isFinite(heartbeat) || heartbeat < 0 || heartbeat > 3600)
          throw new Error('invalid')
        const ws = new WebSocket(
          target,
          subprotocol
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
        )
        socket.current = ws
        ws.binaryType = 'arraybuffer'
        ws.onopen = () => {
          if (token !== revision.current) return
          setState('connected')
          add('status', t('connected'))
          if (heartbeat > 0)
            timer.current = setInterval(
              () => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(heartbeatText)
                  add('sent', heartbeatText)
                }
              },
              Math.max(1, heartbeat) * 1000,
            )
        }
        ws.onmessage = (event) => {
          if (token === revision.current)
            add(
              'received',
              typeof event.data === 'string'
                ? event.data
                : Array.from(
                    new Uint8Array(event.data as ArrayBuffer),
                    (byte) => byte.toString(16).padStart(2, '0'),
                  ).join(' '),
            )
        }
        ws.onerror = () => {
          if (token === revision.current) setError(t('networkFailed'))
        }
        ws.onclose = (event) => {
          if (token !== revision.current) return
          if (timer.current) clearInterval(timer.current)
          setState('disconnected')
          add('status', `${event.code} ${event.reason}`)
        }
      } else {
        const parsed: unknown = JSON.parse(headers)
        if (
          !parsed ||
          Array.isArray(parsed) ||
          typeof parsed !== 'object' ||
          Object.values(parsed).some((value) => typeof value !== 'string')
        )
          throw new Error('invalid')
        const current = new AbortController()
        controller.current = current
        const response = await fetch('/api/stream', {
          method: 'POST',
          signal: current.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: target,
            method,
            headers: parsed,
            data: method === 'POST' ? body : undefined,
          }),
        })
        if (!response.ok || !response.body) throw new Error('networkFailed')
        if (token !== revision.current) {
          await response.body.cancel()
          return
        }
        setState('connected')
        const reader = response.body.getReader(),
          decoder = new TextDecoder(),
          parser = new SSEParser()
        try {
          while (true) {
            const { value, done } = await reader.read()
            if (token !== revision.current) return
            const chunk = decoder.decode(value, { stream: !done })
            for (const event of parser.push(chunk))
              add('received', JSON.stringify(event))
            if (done) break
          }
        } finally {
          reader.releaseLock()
        }
        if (token === revision.current) setState('disconnected')
      }
    } catch {
      if (token === revision.current) {
        close()
        setState('disconnected')
        setError(t('networkFailed'))
      }
    }
  }
  return (
    <Workbench toolId="stream-debugger" local={false}>
      <Panel title={t('connection')}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t('protocol')}>
            <select
              aria-label={t('protocol')}
              className={selectClass}
              disabled={state !== 'disconnected'}
              value={protocol}
              onChange={(event) =>
                setProtocol(event.target.value as 'websocket' | 'sse')
              }
            >
              <option value="websocket">WebSocket</option>
              <option value="sse">SSE</option>
            </select>
          </Field>
          <Field label="URL">
            <Input
              aria-label="URL"
              value={url}
              disabled={state !== 'disconnected'}
              onChange={(event) => setUrl(event.target.value)}
            />
          </Field>
        </div>
        {protocol === 'websocket' ? (
          <>
            <Field label={t('subprotocol')}>
              <Input
                aria-label={t('subprotocol')}
                value={subprotocol}
                disabled={state !== 'disconnected'}
                onChange={(event) => setSubprotocol(event.target.value)}
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t('heartbeat')}>
                <Input
                  aria-label={t('heartbeat')}
                  type="number"
                  min={0}
                  max={3600}
                  disabled={state !== 'disconnected'}
                  value={heartbeat}
                  onChange={(event) => setHeartbeat(Number(event.target.value))}
                />
              </Field>
              <Field label={t('heartbeatText')}>
                <Input
                  aria-label={t('heartbeatText')}
                  disabled={state !== 'disconnected'}
                  value={heartbeatText}
                  onChange={(event) => setHeartbeatText(event.target.value)}
                />
              </Field>
            </div>
            <p className="text-sm text-muted-foreground">{t('wsHint')}</p>
          </>
        ) : (
          <>
            <Field label={t('method')}>
              <select
                aria-label={t('method')}
                className={selectClass}
                disabled={state !== 'disconnected'}
                value={method}
                onChange={(event) => setMethod(event.target.value)}
              >
                <option>GET</option>
                <option>POST</option>
              </select>
            </Field>
            <Field label={t('headersJson')}>
              <Textarea
                aria-label={t('headersJson')}
                value={headers}
                disabled={state !== 'disconnected'}
                onChange={(event) => setHeaders(event.target.value)}
              />
            </Field>
            {method === 'POST' && (
              <Field label={t('body')}>
                <Textarea
                  aria-label={t('body')}
                  value={body}
                  disabled={state !== 'disconnected'}
                  onChange={(event) => setBody(event.target.value)}
                />
              </Field>
            )}
            <p className="text-sm text-muted-foreground">{t('sseHint')}</p>
          </>
        )}
        <div className="flex gap-3">
          <Button
            disabled={state !== 'disconnected'}
            onClick={() => void connect()}
          >
            {t('connect')}
          </Button>
          <Button
            variant="outline"
            disabled={state === 'disconnected'}
            onClick={disconnect}
          >
            {t('disconnect')}
          </Button>
        </div>
        <p role="status">{t(state)}</p>
        <ErrorMessage>{error}</ErrorMessage>
      </Panel>
      {protocol === 'websocket' && (
        <Panel title={t('message')}>
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={100000}
          />
          <Button
            disabled={state !== 'connected'}
            onClick={() => {
              try {
                if (socket.current?.readyState !== WebSocket.OPEN)
                  throw new Error()
                socket.current.send(message)
                add('sent', message)
              } catch {
                setError(t('networkFailed'))
              }
            }}
          >
            {t('send')}
          </Button>
        </Panel>
      )}
      <Panel title={t('events')}>
        <Button variant="outline" onClick={() => setLogs([])}>
          {t('clear')}
        </Button>
        <Output
          value={logs
            .map((log) => `[${log.time}] ${t(log.direction)} ${log.data}`)
            .join('\n')}
          filename="events.log"
        />
        <p className="text-xs text-muted-foreground">{t('logHint')}</p>
      </Panel>
    </Workbench>
  )
}
