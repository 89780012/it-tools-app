import { useRef, useState, type FormEvent } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  CLAMP_FIELDS,
  CssClampError,
  generateCssClamp,
  sizeAtViewport,
  type ClampInput,
  type ClampUnit,
  type CssClampResult,
} from '@/lib/css-clamp'
import { ErrorMessage, Field, Output, Panel, Workbench } from './workbench'

const example: ClampInput = {
  startWidth: '320',
  endWidth: '1280',
  startSize: '16',
  endSize: '40',
  rootSize: '16',
}
const empty: ClampInput = {
  startWidth: '',
  endWidth: '',
  startSize: '',
  endSize: '',
  rootSize: '',
}
export function CssClampGenerator() {
  const t = useTranslations('cssClamp')
  const w = useTranslations('workbench')
  const [input, setInput] = useState<ClampInput>(example)
  const [unit, setUnit] = useState<ClampUnit>('rem')
  const [result, setResult] = useState<CssClampResult>()
  const [error, setError] = useState<CssClampError>()
  const [viewport, setViewport] = useState(320)
  const formRef = useRef<HTMLFormElement>(null)
  function reset() {
    setResult(undefined)
    setError(undefined)
  }
  function generate(event: FormEvent) {
    event.preventDefault()
    try {
      const next = generateCssClamp(input, unit)
      setResult(next)
      setViewport(next.startWidth)
      setError(undefined)
    } catch (caught) {
      if (!(caught instanceof CssClampError)) throw caught
      setResult(undefined)
      setError(caught)
      formRef.current
        ?.querySelector<HTMLInputElement>(`#clamp-${caught.field}`)
        ?.focus()
    }
  }
  return (
    <Workbench toolId="css-clamp-generator">
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title={w('input')}>
          <form
            ref={formRef}
            onSubmit={generate}
            className="space-y-4"
            noValidate
          >
            <p id="clamp-hint" className="text-sm text-muted-foreground">
              {t('hint')}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {CLAMP_FIELDS.map((field) => (
                <Field key={field} label={t(field)} htmlFor={`clamp-${field}`}>
                  <Input
                    id={`clamp-${field}`}
                    value={input[field]}
                    dir="ltr"
                    inputMode={field.endsWith('Width') ? 'numeric' : 'decimal'}
                    onChange={(event) => {
                      setInput({ ...input, [field]: event.target.value })
                      reset()
                    }}
                    aria-invalid={error?.field === field}
                    aria-describedby={`clamp-hint${error?.field === field ? ' clamp-error' : ''}`}
                  />
                </Field>
              ))}
              <Field label={t('unit')} htmlFor="clamp-unit">
                <select
                  id="clamp-unit"
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={unit}
                  onChange={(event) => {
                    setUnit(event.target.value as ClampUnit)
                    reset()
                  }}
                >
                  <option value="rem">rem</option>
                  <option value="px">px</option>
                </select>
              </Field>
            </div>
            <div id="clamp-error">
              <ErrorMessage>{error && t(error.code)}</ErrorMessage>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{t('generate')}</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setInput(example)
                  setUnit('rem')
                  reset()
                }}
              >
                {w('example')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setInput(empty)
                  setUnit('rem')
                  reset()
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
                <div className="[&_textarea]:field-sizing-fixed [&_textarea]:min-h-32">
                  <Output
                    key={result.css}
                    value={result.css}
                    filename="fluid-font-size.css"
                    label={t('output')}
                  />
                </div>
                <Field label={t('viewport')} htmlFor="clamp-viewport">
                  <input
                    id="clamp-viewport"
                    type="range"
                    className="w-full accent-primary"
                    min={result.startWidth}
                    max={result.endWidth}
                    step="any"
                    value={viewport}
                    onChange={(event) =>
                      setViewport(Number(event.target.value))
                    }
                    aria-valuetext={`${viewport} px`}
                  />
                </Field>
                <p
                  data-testid="clamp-preview-value"
                  dir="ltr"
                  className="text-sm tabular-nums"
                >
                  {viewport.toFixed(1)} px →{' '}
                  {sizeAtViewport(result, viewport).toFixed(3)} px
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('emptyResult')}
              </p>
            )}
          </div>
          {result && (
            <>
              <div
                data-testid="clamp-preview"
                className="flex h-40 items-center overflow-hidden rounded-md border p-3"
                style={{
                  fontSize: `${sizeAtViewport(result, viewport)}px`,
                  lineHeight: 1.2,
                }}
              >
                <span className="shrink-0 whitespace-nowrap">
                  {t('sample')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('previewHint')}
              </p>
            </>
          )}
          <p className="text-sm text-muted-foreground">{t('rules')}</p>
        </Panel>
      </div>
    </Workbench>
  )
}
