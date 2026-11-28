import { useRef, useState, type FormEvent } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  JsonPointerError,
  resolveJsonPointer,
  POINTER_MAX_INPUT,
  POINTER_MAX_LENGTH,
  POINTER_MAX_DEPTH,
  POINTER_MAX_OUTPUT,
  type JsonPointerResult,
} from '@/lib/json-pointer'
import { ErrorMessage, Field, Output, Panel, Workbench } from './workbench'

const example =
  '{\n  "orders": [\n    {"id": 9007199254740993, "a/b": {"~status": "ready"}}\n  ],\n  "": "empty key",\n  "a b": true\n}'

export function JsonPointer() {
  const t = useTranslations('jsonPointer')
  const w = useTranslations('workbench')
  const [source, setSource] = useState('')
  const [pointer, setPointer] = useState('')
  const [result, setResult] = useState<JsonPointerResult>()
  const [error, setError] = useState<JsonPointerError>()
  const sourceRef = useRef<HTMLTextAreaElement>(null)
  const pointerRef = useRef<HTMLInputElement>(null)
  function resetResult() {
    setResult(undefined)
    setError(undefined)
  }
  function load(json: string, path: string) {
    setSource(json)
    setPointer(path)
    resetResult()
  }
  function resolve(event: FormEvent) {
    event.preventDefault()
    try {
      setResult(resolveJsonPointer(source, pointer))
      setError(undefined)
    } catch (caught) {
      if (!(caught instanceof JsonPointerError)) throw caught
      setResult(undefined)
      setError(caught)
      if (caught.field === 'json') sourceRef.current?.focus()
      else pointerRef.current?.focus()
    }
  }
  return (
    <Workbench toolId="json-pointer">
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title={w('input')}>
          <form className="space-y-4" onSubmit={resolve}>
            <Field label={t('source')} htmlFor="pointer-json">
              <Textarea
                id="pointer-json"
                ref={sourceRef}
                dir="ltr"
                spellCheck={false}
                className="field-sizing-fixed min-h-64 font-mono text-sm"
                value={source}
                onChange={(e) => {
                  setSource(e.target.value)
                  resetResult()
                }}
                aria-invalid={error?.field === 'json'}
                aria-describedby={`pointer-limits${error?.field === 'json' ? ' pointer-error' : ''}`}
              />
            </Field>
            <Field label={t('pointer')} htmlFor="pointer-path">
              <Input
                id="pointer-path"
                ref={pointerRef}
                dir="ltr"
                spellCheck={false}
                className="font-mono text-sm"
                placeholder="/orders/0/a~1b/~0status"
                value={pointer}
                onChange={(e) => {
                  setPointer(e.target.value)
                  resetResult()
                }}
                aria-invalid={error?.field === 'pointer'}
                aria-describedby={`pointer-hint${error?.field === 'pointer' ? ' pointer-error' : ''}`}
              />
              <p id="pointer-hint" className="text-sm text-muted-foreground">
                {t('hint')}
              </p>
            </Field>
            <p id="pointer-limits" className="text-sm text-muted-foreground">
              {t('limits', {
                input: POINTER_MAX_INPUT,
                pointer: POINTER_MAX_LENGTH,
                depth: POINTER_MAX_DEPTH,
              })}
            </p>
            <div id="pointer-error">
              <ErrorMessage>
                {error &&
                  t(error.code, {
                    step: error.step,
                    input: POINTER_MAX_INPUT,
                    pointer: POINTER_MAX_LENGTH,
                    depth: POINTER_MAX_DEPTH,
                    output: POINTER_MAX_OUTPUT,
                  })}
              </ErrorMessage>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{t('resolve')}</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => load(example, '/orders/0/a~1b/~0status')}
              >
                {w('example')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => load('', '')}
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
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">{t('type')}</dt>
                    <dd data-testid="pointer-type">
                      {t(`types.${result.type}`)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">
                      {t('resolvedPointer')}
                    </dt>
                    <dd
                      dir="ltr"
                      className="whitespace-pre-wrap break-all font-mono"
                      data-testid="resolved-pointer"
                    >
                      {result.pointer || t('root')}
                    </dd>
                  </div>
                </dl>
                <div className="[&_textarea]:field-sizing-fixed">
                  <Output
                    key={result.output}
                    value={result.output}
                    label={t('output')}
                    filename="json-pointer-result.json"
                  />
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
