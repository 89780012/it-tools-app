import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  BoxShadowError,
  createShadowLayer,
  generateBoxShadow,
  MAX_SHADOW_LAYERS,
  SHADOW_FIELDS,
  type ShadowLayer,
  type ShadowResult,
} from '@/lib/box-shadow'
import { ErrorMessage, Field, Output, Panel, Workbench } from './workbench'

export function CssBoxShadowGenerator() {
  const t = useTranslations('boxShadow')
  const w = useTranslations('workbench')
  const [layers, setLayers] = useState<ShadowLayer[]>([createShadowLayer()])
  const [active, setActive] = useState(0)
  const [result, setResult] = useState<ShadowResult>()
  const [error, setError] = useState<BoxShadowError>()
  const formRef = useRef<HTMLFormElement>(null)
  const layer = layers[active]
  useEffect(() => {
    if (error?.layer === active) {
      formRef.current
        ?.querySelector<HTMLInputElement>(`#shadow-${error.field}`)
        ?.focus()
    }
  }, [error, active])
  function invalidate() {
    setResult(undefined)
    setError(undefined)
  }
  function update(patch: Partial<ShadowLayer>) {
    setLayers(
      layers.map((item, index) =>
        index === active ? { ...item, ...patch } : item,
      ),
    )
    invalidate()
  }
  function generate(event: FormEvent) {
    event.preventDefault()
    try {
      setResult(generateBoxShadow(layers))
      setError(undefined)
    } catch (caught) {
      if (!(caught instanceof BoxShadowError)) throw caught
      setResult(undefined)
      setActive(caught.layer)
      setError(caught)
    }
  }
  return (
    <Workbench toolId="css-box-shadow-generator">
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title={w('input')}>
          <form
            ref={formRef}
            onSubmit={generate}
            noValidate
            className="space-y-4"
          >
            <p id="shadow-hint" className="text-sm text-muted-foreground">
              {t('hint')}
            </p>
            <Field label={t('layer')} htmlFor="shadow-layer">
              <select
                id="shadow-layer"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={active}
                onChange={(event) => setActive(Number(event.target.value))}
              >
                {layers.map((_, index) => (
                  <option key={index} value={index}>
                    {t('layerNumber', { number: index + 1 })}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={layers.length >= MAX_SHADOW_LAYERS}
                onClick={() => {
                  setLayers([...layers, createShadowLayer()])
                  setActive(layers.length)
                  invalidate()
                }}
              >
                {t('add')}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={layers.length <= 1}
                onClick={() => {
                  setLayers(layers.filter((_, index) => index !== active))
                  setActive(Math.max(0, active - 1))
                  invalidate()
                }}
              >
                {t('remove')}
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {SHADOW_FIELDS.map((field) => (
                <Field key={field} label={t(field)} htmlFor={`shadow-${field}`}>
                  <Input
                    id={`shadow-${field}`}
                    value={layer[field]}
                    dir="ltr"
                    inputMode={
                      field === 'color' ||
                      field === 'x' ||
                      field === 'y' ||
                      field === 'spread'
                        ? 'text'
                        : 'numeric'
                    }
                    maxLength={field === 'color' ? 32 : 16}
                    onChange={(event) =>
                      update({ [field]: event.target.value })
                    }
                    aria-invalid={
                      error?.layer === active && error?.field === field
                    }
                    aria-describedby={`shadow-hint${error?.layer === active && error?.field === field ? ' shadow-error' : ''}`}
                  />
                </Field>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={layer.inset}
                onChange={(event) => update({ inset: event.target.checked })}
              />
              {t('inset')}
            </label>
            <div id="shadow-error">
              <ErrorMessage>
                {error && t(error.code, { number: error.layer + 1 })}
              </ErrorMessage>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{t('generate')}</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLayers([
                    createShadowLayer(),
                    {
                      x: '0',
                      y: '2',
                      blur: '4',
                      spread: '-1',
                      color: '#2563eb',
                      opacity: '35',
                      inset: true,
                    },
                  ])
                  setActive(0)
                  invalidate()
                }}
              >
                {w('example')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setLayers([
                    {
                      x: '',
                      y: '',
                      blur: '',
                      spread: '',
                      color: '',
                      opacity: '',
                      inset: false,
                    },
                  ])
                  setActive(0)
                  invalidate()
                  formRef.current
                    ?.querySelector<HTMLInputElement>('#shadow-x')
                    ?.focus()
                }}
              >
                {w('clear')}
              </Button>
            </div>
          </form>
        </Panel>
        <Panel title={w('result')}>
          <p className="text-sm font-medium">{t('preview')}</p>
          <div
            className="flex h-72 items-center justify-center overflow-hidden rounded-md border bg-muted p-8"
            data-testid="shadow-stage"
          >
            <div
              data-testid="shadow-preview"
              className="flex h-28 w-36 shrink-0 items-center justify-center rounded-xl bg-background p-3 text-center text-sm text-foreground"
              style={{ boxShadow: result?.value ?? 'none' }}
            >
              {t('sample')}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t('previewHint')}</p>
          <div aria-live="polite" className="space-y-4">
            {result ? (
              <div className="[&_textarea]:field-sizing-fixed [&_textarea]:min-h-36">
                <Output
                  key={result.css}
                  value={result.css}
                  filename="box-shadow.css"
                  label={t('output')}
                />
              </div>
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
