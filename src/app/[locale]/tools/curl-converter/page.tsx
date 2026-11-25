'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Field,
  Panel,
  ErrorMessage,
  downloadText,
} from '@/components/tools/workbench'
import { ToolSEOSection } from '@/components/seo/tool-seo-section'
import {
  ENHANCED_TEMPLATE_KEY,
  generateEnhancedCode,
  parseEnhancedCurl,
  sanitizeEnhancedTemplate,
  validateEnhancedRequest,
  type EnhancedRequest,
} from '@/lib/curl-enhanced'

type Pair = [string, string]
interface ProxyResult {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  elapsed: number
}
const empty: EnhancedRequest = { url: '', method: 'GET', headers: {} }
export default function CurlConverterPage() {
  const t = useTranslations('tools.curl-converter')
  const common = useTranslations('common')
  const [input, setInput] = useState('')
  const [request, setRequest] = useState<EnhancedRequest>(empty)
  const [query, setQuery] = useState<Pair[]>([])
  const [headers, setHeaders] = useState<Pair[]>([])
  const [language, setLanguage] = useState('javascript')
  const [bodyMode, setBodyMode] = useState('text')
  const [parseError, setParseError] = useState('')
  const [result, setResult] = useState<ProxyResult | null>(null)
  const [requestError, setRequestError] = useState('')
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<EnhancedRequest[]>([])
  const [notice, setNotice] = useState('')
  const requestRevision = useRef(0)
  const activeRequest = useRef<AbortController | null>(null)
  useEffect(() => {
    requestRevision.current++
    activeRequest.current?.abort()
    setResult(null)
    setRequestError('')
    setLoading(false)
    return () => {
      requestRevision.current++
      activeRequest.current?.abort()
    }
  }, [request, query, headers, bodyMode, input])
  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(
        localStorage.getItem(ENHANCED_TEMPLATE_KEY) ?? '[]',
      )
      if (Array.isArray(stored))
        setTemplates(
          stored.slice(0, 10).map((item) => sanitizeEnhancedTemplate(item)),
        )
    } catch {
      /* Storage is optional and may be unavailable. */
    }
  }, [])
  const loadRequest = (value: EnhancedRequest) => {
    const url = new URL(value.url)
    setQuery(Array.from(url.searchParams.entries()))
    url.search = ''
    setRequest({ ...value, url: url.toString() })
    setHeaders(Object.entries(value.headers))
    setParseError('')
    setResult(null)
    setRequestError('')
  }
  const compiled = useMemo(() => {
    if (parseError) return { error: parseError, output: '', value: null }
    if (!request.url) return { error: '', output: '', value: null }
    try {
      const url = new URL(request.url)
      for (const [key, value] of query) {
        if (!key && value) throw new Error('query')
        if (key) url.searchParams.append(key, value)
      }
      const activeHeaders = headers.filter(([key, value]) => key || value)
      if (activeHeaders.some(([key]) => !key)) throw new Error('headers')
      if (bodyMode === 'json' && request.data?.trim()) JSON.parse(request.data)
      const value = validateEnhancedRequest({
        ...request,
        url: url.toString(),
        headers: Object.fromEntries(activeHeaders),
      })
      return { value, error: '', output: generateEnhancedCode(value, language) }
    } catch {
      return { value: null, output: '', error: t('extraInvalidEditor') }
    }
  }, [request, query, headers, bodyMode, language, parseError, t])
  const parse = () => {
    setResult(null)
    setRequestError('')
    try {
      loadRequest(parseEnhancedCurl(input))
    } catch {
      setParseError(t('invalid_command'))
      setRequest(empty)
    }
  }
  const edit = (next: EnhancedRequest) => {
    setRequest(next)
    setParseError('')
    setResult(null)
  }
  const send = async () => {
    if (!compiled.value || loading) return
    setLoading(true)
    setResult(null)
    setRequestError('')
    const revision = ++requestRevision.current
    const controller = new AbortController()
    activeRequest.current?.abort()
    activeRequest.current = controller
    const start = performance.now()
    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...compiled.value,
          data: ['GET', 'HEAD'].includes(compiled.value.method)
            ? undefined
            : compiled.value.data,
        }),
      })
      const data = await response.json()
      if (revision !== requestRevision.current) return
      if (!response.ok)
        throw new Error(data.message || data.error || String(response.status))
      if (
        typeof data.status !== 'number' ||
        typeof data.body !== 'string' ||
        !data.headers ||
        typeof data.headers !== 'object'
      )
        throw new Error(t('test_failed'))
      let body = data.body
      try {
        body = JSON.stringify(JSON.parse(body), null, 2)
      } catch {
        /* Keep text responses verbatim. */
      }
      setResult({
        ...data,
        body,
        elapsed: Math.round(performance.now() - start),
      })
    } catch (error) {
      if (revision === requestRevision.current && !controller.signal.aborted)
        setRequestError(
          `${t('test_failed')}: ${error instanceof Error ? error.message : String(error)}`,
        )
    } finally {
      if (revision === requestRevision.current) {
        activeRequest.current = null
        setLoading(false)
      }
    }
  }
  const save = () => {
    if (!compiled.value) return
    try {
      const next = [
        ...templates,
        sanitizeEnhancedTemplate(compiled.value),
      ].slice(-10)
      localStorage.setItem(ENHANCED_TEMPLATE_KEY, JSON.stringify(next))
      setTemplates(next)
      setNotice(t('extraSaved'))
    } catch {
      setNotice(t('extraStorageError'))
    }
  }
  const rows = (
    kind: 'query' | 'headers',
    pairs: Pair[],
    update: (value: Pair[]) => void,
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium">
          {t(kind === 'query' ? 'extraQuery' : 'extraHeaders')}
        </span>
        <Button
          data-testid={`curl-add-${kind}`}
          variant="outline"
          disabled={pairs.length >= 100}
          onClick={() => update([...pairs, ['', '']])}
        >
          {t('extraAdd')}
        </Button>
      </div>
      <div className="overflow-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-start">{t('extraKey')}</th>
              <th className="text-start">{t('extraValue')}</th>
              <th>
                <span className="sr-only">{t('extraRemove')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {pairs.map(([key, value], index) => (
              <tr key={index}>
                <td>
                  <Input
                    maxLength={1000}
                    aria-label={t('extraKey')}
                    data-testid={`curl-${kind}-key-${index}`}
                    value={key}
                    onChange={(e) => {
                      update(
                        pairs.map((p, i) =>
                          i === index ? [e.target.value, p[1]] : p,
                        ),
                      )
                      setResult(null)
                    }}
                  />
                </td>
                <td>
                  <Input
                    maxLength={10000}
                    aria-label={t('extraValue')}
                    data-testid={`curl-${kind}-value-${index}`}
                    value={value}
                    onChange={(e) => {
                      update(
                        pairs.map((p, i) =>
                          i === index ? [p[0], e.target.value] : p,
                        ),
                      )
                      setResult(null)
                    }}
                  />
                </td>
                <td>
                  <Button
                    variant="ghost"
                    aria-label={t('extraRemove')}
                    onClick={() => update(pairs.filter((_, i) => i !== index))}
                  >
                    ×
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
  return (
    <section className="container mx-auto space-y-6 p-6">
      <header>
        <h1 className="text-3xl font-bold">{t('name')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t('extraRemote')}</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={t('input_title')}>
          <Field label={t('input_title')}>
            <Textarea
              data-testid="curl-input"
              aria-label={t('input_title')}
              maxLength={100000}
              className="min-h-36 font-mono"
              value={input}
              placeholder={t('input_placeholder')}
              onChange={(e) => {
                setInput(e.target.value)
                setRequest(empty)
                setParseError('')
                setResult(null)
              }}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button data-testid="curl-convert" onClick={parse}>
              {t('convert_button')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setInput('')
                setRequest(empty)
                setQuery([])
                setHeaders([])
                setParseError('')
                setResult(null)
                setRequestError('')
                setNotice('')
              }}
            >
              {common('clear')}
            </Button>
          </div>
          <Field label={t('extraUrl')}>
            <Input
              data-testid="curl-url"
              aria-label={t('extraUrl')}
              maxLength={10000}
              value={request.url}
              onChange={(e) => edit({ ...request, url: e.target.value })}
            />
          </Field>
          <Field label={t('extraMethod')}>
            <select
              data-testid="curl-method"
              aria-label={t('extraMethod')}
              className="w-full rounded border bg-background p-2"
              value={request.method}
              onChange={(e) => edit({ ...request, method: e.target.value })}
            >
              {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map(
                (method) => (
                  <option key={method}>{method}</option>
                ),
              )}
            </select>
          </Field>
          {rows('query', query, setQuery)}
          {rows('headers', headers, setHeaders)}
          <Field label={t('extraBody')}>
            <select
              data-testid="curl-body-mode"
              aria-label={t('extraBody')}
              className="rounded border bg-background p-2"
              value={bodyMode}
              onChange={(e) => setBodyMode(e.target.value)}
            >
              <option value="text">{t('extraText')}</option>
              <option value="json">JSON</option>
            </select>
            <Textarea
              data-testid="curl-body"
              aria-label={t('extraBody')}
              maxLength={100000}
              className="font-mono"
              value={request.data ?? ''}
              onChange={(e) => edit({ ...request, data: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              {t('extraBodyHint')}
            </p>
          </Field>
          <ErrorMessage>{compiled.error}</ErrorMessage>
          <Button
            data-testid="curl-send"
            disabled={!compiled.value || loading}
            onClick={send}
          >
            {loading ? t('extraSending') : t('test_button')}
          </Button>
        </Panel>
        <div className="space-y-6">
          <Panel title={t('output_title')}>
            <Field label={t('language_label')}>
              <select
                data-testid="curl-language"
                aria-label={t('language_label')}
                className="w-full rounded border bg-background p-2"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {[
                  ['javascript', 'JavaScript (Fetch)'],
                  ['python', 'Python (Requests)'],
                  ['nodejs', 'Node.js (Axios)'],
                  ['php', 'PHP (cURL)'],
                  ['go', 'Go (net/http)'],
                ].map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Textarea
              data-testid="curl-output"
              aria-label={t('output_title')}
              className="min-h-80 font-mono"
              readOnly
              value={compiled.output}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={!compiled.output}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(compiled.output)
                    setNotice(common('copied'))
                  } catch {
                    setNotice(common('copy_failed'))
                  }
                }}
              >
                {common('copy')}
              </Button>
              <Button
                variant="outline"
                disabled={!compiled.output}
                onClick={() =>
                  downloadText(
                    compiled.output,
                    `request.${({ python: 'py', php: 'php', go: 'go' } as Record<string, string>)[language] ?? 'js'}`,
                  )
                }
              >
                {common('download')}
              </Button>
            </div>
          </Panel>
          <Panel title={t('extraTemplates')}>
            <p className="text-sm text-muted-foreground">
              {t('extraSanitized')}
            </p>
            <Button
              data-testid="curl-save"
              disabled={!compiled.value}
              onClick={save}
            >
              {t('extraSave')}
            </Button>
            {templates.map((template, index) => (
              <div key={index} className="flex gap-2">
                <Button
                  data-testid={`curl-template-${index}`}
                  variant="outline"
                  onClick={() => {
                    loadRequest(template)
                    setInput('')
                    setBodyMode('text')
                  }}
                >
                  {template.method} {template.url}
                </Button>
                <Button
                  aria-label={t('extraRemove')}
                  variant="ghost"
                  onClick={() => {
                    try {
                      const next = templates.filter((_, i) => i !== index)
                      localStorage.setItem(
                        ENHANCED_TEMPLATE_KEY,
                        JSON.stringify(next),
                      )
                      setTemplates(next)
                    } catch {
                      setNotice(t('extraStorageError'))
                    }
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
            <p role="status">{notice}</p>
          </Panel>
        </div>
      </div>
      <ErrorMessage>{requestError}</ErrorMessage>
      {result && (
        <Panel title={t('test_result_title')}>
          <p data-testid="curl-status">
            {t('extraStatus')}: {result.status} {result.statusText}
          </p>
          <p data-testid="curl-timing">
            {t('extraTiming')}: {result.elapsed} ms
          </p>
          <pre
            data-testid="curl-response-headers"
            className="overflow-auto text-sm"
          >
            {JSON.stringify(result.headers, null, 2)}
          </pre>
          <Textarea
            data-testid="curl-response"
            aria-label={t('test_result_title')}
            readOnly
            className="min-h-48 font-mono"
            value={result.body}
          />
        </Panel>
      )}
      <ToolSEOSection toolId="curl-converter" />
    </section>
  )
}
