import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslations } from '@/i18n/compat'
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
import type { RegexError, RegexResult } from '@/lib/developer-regex'

const examples = [
  {
    key: 'emailExample',
    pattern: '([\\w.+-]+)@([\\w.-]+\\.[A-Za-z]{2,})',
    flags: 'g',
    text: 'ada@example.com, lin@example.org',
    replacement: '$1 [at] $2',
  },
  {
    key: 'numberExample',
    pattern: '-?\\d+(?:\\.\\d+)?',
    flags: 'g',
    text: '10 apples, -2 pears, 3.5 kg',
    replacement: '[$&]',
  },
  {
    key: 'unicodeExample',
    pattern: '\\p{L}+',
    flags: 'gu',
    text: 'Hello 世界 مرحبا',
    replacement: '[$&]',
  },
]

export default function RegexTesterPage() {
  const t = useTranslations('tools.regex-tester')
  const w = useTranslations('workbench')
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('g')
  const [text, setText] = useState('')
  const [replacement, setReplacement] = useState('')
  const [result, setResult] = useState<RegexResult | null>(null)
  const [error, setError] = useState<RegexError | ''>('')
  const [busy, setBusy] = useState(false)
  const worker = useRef<Worker | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const stop = () => {
    worker.current?.terminate()
    worker.current = null
    clearTimeout(timer.current)
  }
  useEffect(
    () => () => {
      worker.current?.terminate()
      clearTimeout(timer.current)
    },
    [],
  )
  const reset = () => {
    stop()
    setBusy(false)
    setResult(null)
    setError('')
  }
  const run = () => {
    reset()
    setBusy(true)
    try {
      const current = new Worker(
        new URL('../../../../lib/developer-regex.worker.ts', import.meta.url),
        { type: 'module' },
      )
      worker.current = current
      const finish = () => {
        if (worker.current !== current) return false
        stop()
        setBusy(false)
        return true
      }
      current.onmessage = (
        event: MessageEvent<{ result?: RegexResult; error?: RegexError }>,
      ) => {
        if (!finish()) return
        if (event.data.result) setResult(event.data.result)
        else setError(event.data.error ?? 'workerError')
      }
      current.onerror = () => {
        if (finish()) setError('workerError')
      }
      timer.current = setTimeout(() => {
        if (finish()) setError('timeout')
      }, 1500)
      current.postMessage({ pattern, flags, text, replacement })
    } catch {
      stop()
      setBusy(false)
      setError('workerError')
    }
  }
  const highlights: ReactNode[] = []
  if (result) {
    let end = 0
    result.matches.forEach((match, index) => {
      highlights.push(text.slice(end, match.index))
      highlights.push(
        <mark key={index} className="rounded bg-amber-200 text-black">
          {match.value || '\u200b'}
        </mark>,
      )
      end = match.index + match.value.length
    })
    highlights.push(text.slice(end))
  }
  return (
    <Workbench toolId="regex-tester">
      <Panel title={w('input')}>
        <div className="grid gap-4 md:grid-cols-[1fr_8rem]">
          <Field
            label={t('pattern')}
            htmlFor="regex-pattern"
            hint={t('patternHint')}
          >
            <Input
              id="regex-pattern"
              data-testid="regex-pattern"
              value={pattern}
              dir="ltr"
              onChange={(event) => {
                reset()
                setPattern(event.target.value)
              }}
            />
          </Field>
          <Field label={t('flags')} htmlFor="regex-flags">
            <Input
              id="regex-flags"
              data-testid="regex-flags"
              value={flags}
              dir="ltr"
              onChange={(event) => {
                reset()
                setFlags(event.target.value)
              }}
            />
          </Field>
        </div>
        <Field label={t('text')} htmlFor="regex-text">
          <Textarea
            id="regex-text"
            data-testid="regex-text"
            className="min-h-40 font-mono"
            dir="ltr"
            value={text}
            onChange={(event) => {
              reset()
              setText(event.target.value)
            }}
          />
        </Field>
        <Field label={t('replacement')} htmlFor="regex-replacement">
          <Input
            id="regex-replacement"
            data-testid="regex-replacement"
            dir="ltr"
            value={replacement}
            onChange={(event) => {
              reset()
              setReplacement(event.target.value)
            }}
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button data-testid="regex-run" onClick={run} disabled={busy}>
            {busy ? t('running') : w('run')}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              reset()
              setPattern('')
              setText('')
              setReplacement('')
              setFlags('g')
            }}
          >
            {w('clear')}
          </Button>
          {examples.map((example) => (
            <Button
              key={example.key}
              variant="outline"
              data-testid={`regex-${example.key}`}
              onClick={() => {
                reset()
                setPattern(example.pattern)
                setFlags(example.flags)
                setText(example.text)
                setReplacement(example.replacement)
              }}
            >
              {t(example.key)}
            </Button>
          ))}
        </div>
        <ErrorMessage>{error && t(error)}</ErrorMessage>
      </Panel>
      {result && (
        <Panel title={t('matches', { count: result.matches.length })}>
          {result.truncated && <p role="status">{t('truncated')}</p>}
          <pre
            data-testid="regex-highlight"
            className="whitespace-pre-wrap break-words rounded border p-3 font-mono"
            dir="ltr"
          >
            {highlights}
          </pre>
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead>
                <tr>
                  <th>{t('index')}</th>
                  <th>{t('match')}</th>
                  <th>{t('captures')}</th>
                </tr>
              </thead>
              <tbody>
                {result.matches.map((match, index) => (
                  <tr key={index}>
                    <td className="p-2">{match.index}</td>
                    <td className="p-2 font-mono">
                      {match.value || t('emptyMatch')}
                    </td>
                    <td className="p-2 font-mono">
                      {JSON.stringify({
                        captures: match.captures,
                        groups: match.groups,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Output
            value={result.replacement}
            label={t('replacementPreview')}
            filename="replacement.txt"
          />
        </Panel>
      )}
    </Workbench>
  )
}
