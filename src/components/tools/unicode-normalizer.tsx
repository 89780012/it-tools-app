import { useRef, useState, type FormEvent } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  CODE_POINT_PREVIEW_LIMIT,
  MAX_UNICODE_INPUT,
  MAX_UNICODE_OUTPUT,
  NORMALIZATION_FORMS,
  normalizeUnicode,
  UnicodeNormalizationError,
  type NormalizationForm,
  type UnicodeNormalizationResult,
} from '@/lib/unicode-normalizer'
import { ErrorMessage, Field, Output, Panel, Workbench } from './workbench'

const example =
  'Cafe\u0301 / Caf\u00e9\n\uff21\uff22\uff23 \ufb03 \u2460\n\u1100\u1161 / \uac00\n\ud83d\udc69\u200d\ud83d\udcbb'

export function UnicodeNormalizer() {
  const t = useTranslations('unicodeNormalizer')
  const w = useTranslations('workbench')
  const [input, setInput] = useState('')
  const [form, setForm] = useState<NormalizationForm>('NFC')
  const [result, setResult] = useState<UnicodeNormalizationResult>()
  const [error, setError] = useState<UnicodeNormalizationError>()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  function invalidate() {
    setResult(undefined)
    setError(undefined)
  }

  function normalize(event: FormEvent) {
    event.preventDefault()
    try {
      setResult(normalizeUnicode(input, form))
      setError(undefined)
    } catch (caught) {
      if (!(caught instanceof UnicodeNormalizationError)) throw caught
      setResult(undefined)
      setError(caught)
      inputRef.current?.focus()
    }
  }

  return (
    <Workbench toolId="unicode-normalizer">
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title={w('input')}>
          <form className="space-y-4" onSubmit={normalize}>
            <Field label={t('text')} htmlFor="unicode-input">
              <Textarea
                id="unicode-input"
                ref={inputRef}
                dir="auto"
                spellCheck={false}
                className="min-h-64 font-mono text-sm"
                value={input}
                aria-invalid={!!error}
                aria-describedby={`unicode-hint${error ? ' unicode-error' : ''}`}
                onChange={(event) => {
                  setInput(event.target.value)
                  invalidate()
                }}
              />
              <p id="unicode-hint" className="text-sm text-muted-foreground">
                {t('hint', {
                  limit: MAX_UNICODE_INPUT,
                  outputLimit: MAX_UNICODE_OUTPUT,
                })}
              </p>
            </Field>
            <Field label={t('form')} htmlFor="unicode-form">
              <select
                id="unicode-form"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={form}
                onChange={(event) => {
                  setForm(event.target.value as NormalizationForm)
                  invalidate()
                }}
              >
                {NORMALIZATION_FORMS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground">{t(form)}</p>
            </Field>
            <p className="text-sm text-muted-foreground">
              {t('compatibility')}
            </p>
            <div id="unicode-error">
              <ErrorMessage>
                {error &&
                  t(error.code, {
                    limit: MAX_UNICODE_INPUT,
                    outputLimit: MAX_UNICODE_OUTPUT,
                    position: error.position,
                  })}
              </ErrorMessage>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{t('normalize')}</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setInput(example)
                  setForm('NFC')
                  invalidate()
                }}
              >
                {w('example')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setInput('')
                  setForm('NFC')
                  invalidate()
                }}
              >
                {w('clear')}
              </Button>
            </div>
          </form>
        </Panel>
        <Panel title={w('result')}>
          <div aria-live="polite" className="space-y-4">
            {result ? (
              <>
                <p data-testid="unicode-change" className="text-sm font-medium">
                  {t(result.changed ? 'changed' : 'unchanged')}
                </p>
                <Output
                  key={result.output}
                  value={result.output}
                  label={t('output')}
                  filename={`normalized-${form.toLowerCase()}.txt`}
                />
                <div className="overflow-x-auto">
                  <table className="w-full text-start text-sm">
                    <caption className="mb-2 text-start text-muted-foreground">
                      {t('statistics')}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col" className="p-2 text-start">
                          {t('metric')}
                        </th>
                        <th scope="col" className="p-2 text-start">
                          {t('before')}
                        </th>
                        <th scope="col" className="p-2 text-start">
                          {t('after')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['codePoints', 'codeUnits', 'utf8Bytes'] as const).map(
                        (metric) => (
                          <tr key={metric} className="border-t">
                            <th
                              scope="row"
                              className="p-2 text-start font-normal"
                            >
                              {t(metric)}
                            </th>
                            <td className="p-2 tabular-nums">
                              {result.before[metric]}
                            </td>
                            <td className="p-2 tabular-nums">
                              {result.after[metric]}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('countHint')}
                </p>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t('previewHint', { limit: CODE_POINT_PREVIEW_LIMIT })}
                  </p>
                  {(['before', 'after'] as const).map((side) => (
                    <div key={side}>
                      <h2 className="mb-1 text-sm font-medium">{t(side)}</h2>
                      <p
                        data-testid={`unicode-${side}`}
                        dir="ltr"
                        className="break-words rounded-md border bg-muted/40 p-3 font-mono text-xs"
                      >
                        {result[side].preview}
                        {result[side].truncated ? ' …' : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('emptyResult')}
              </p>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{t('rules')}</p>
        </Panel>
      </div>
    </Workbench>
  )
}
