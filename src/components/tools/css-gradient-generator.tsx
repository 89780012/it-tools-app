import { useMemo, useRef, useState } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  generateLinearGradient,
  gradientExample,
  GradientError,
  MAX_GRADIENT_STOPS,
  type GradientField,
  type GradientStop,
} from '@/lib/css-gradient'
import { ErrorMessage, Field, Output, Panel, Workbench } from './workbench'

export function CssGradientGenerator() {
  const t = useTranslations('cssGradient')
  const w = useTranslations('workbench')
  const [angle, setAngle] = useState('90')
  const [stops, setStops] = useState<GradientStop[]>([
    { color: '#2563eb', position: '0', opacity: '100' },
    { color: '#ec4899', position: '100', opacity: '100' },
  ])
  const [active, setActive] = useState(true)
  const angleRef = useRef<HTMLInputElement>(null)
  const { result, error } = useMemo(() => {
    if (!active) return {}
    try {
      return { result: generateLinearGradient(angle, stops) }
    } catch (caught) {
      if (!(caught instanceof GradientError)) throw caught
      return { error: caught }
    }
  }, [angle, stops, active])
  function update(index: number, patch: Partial<GradientStop>) {
    setStops(
      stops.map((stop, current) =>
        current === index ? { ...stop, ...patch } : stop,
      ),
    )
    setActive(true)
  }
  function accessibility(field: GradientField, stop = 0) {
    const invalid = error?.field === field && error.stop === stop
    return {
      'aria-invalid': invalid,
      'aria-describedby': `gradient-hint${invalid ? ' gradient-error' : ''}`,
    }
  }
  return (
    <Workbench toolId="css-gradient-generator">
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title={w('input')}>
          <p id="gradient-hint" className="text-sm text-muted-foreground">
            {t('hint')}
          </p>
          <Field label={t('angle')} htmlFor="gradient-angle">
            <Input
              id="gradient-angle"
              ref={angleRef}
              dir="ltr"
              inputMode="text"
              maxLength={16}
              value={angle}
              {...accessibility('angle')}
              onChange={(event) => {
                setAngle(event.target.value)
                setActive(true)
              }}
            />
          </Field>
          {stops.map((stop, index) => (
            <fieldset
              key={index}
              className="min-w-0 space-y-3 rounded-md border p-3"
              data-testid={`gradient-stop-${index}`}
            >
              <legend className="px-1 text-sm font-medium">
                {t('stop', { number: index + 1 })}
              </legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {(['color', 'position', 'opacity'] as const).map((field) => (
                  <Field
                    key={field}
                    label={t('fieldLabel', {
                      field: t(field),
                      number: index + 1,
                    })}
                    htmlFor={`gradient-${index}-${field}`}
                  >
                    <div className="flex items-center gap-2">
                      {field === 'color' && (
                        <input
                          type="color"
                          className="h-10 w-10 shrink-0 cursor-pointer rounded border bg-background p-1"
                          aria-label={t('picker', { number: index + 1 })}
                          value={
                            /^#[\da-f]{6}$/i.test(stop.color)
                              ? stop.color
                              : '#000000'
                          }
                          onChange={(event) =>
                            update(index, { color: event.target.value })
                          }
                        />
                      )}
                      <Input
                        id={`gradient-${index}-${field}`}
                        dir="ltr"
                        className="min-w-0"
                        inputMode={field === 'color' ? 'text' : 'numeric'}
                        maxLength={field === 'color' ? 32 : 16}
                        value={stop[field]}
                        {...accessibility(field, index)}
                        onChange={(event) =>
                          update(index, { [field]: event.target.value })
                        }
                      />
                    </div>
                  </Field>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={stops.length <= 2}
                aria-label={t('removeStop', { number: index + 1 })}
                onClick={() => {
                  setStops(stops.filter((_, current) => current !== index))
                  setActive(true)
                }}
              >
                {t('remove')}
              </Button>
            </fieldset>
          ))}
          <div id="gradient-error">
            <ErrorMessage>
              {error && t(error.code, { number: error.stop + 1 })}
            </ErrorMessage>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={stops.length >= MAX_GRADIENT_STOPS}
              onClick={() => {
                setStops([...stops, { ...stops[stops.length - 1] }])
                setActive(true)
              }}
            >
              {t('add')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const example = gradientExample()
                setAngle(example.angle)
                setStops(example.stops)
                setActive(true)
              }}
            >
              {w('example')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setAngle('')
                setStops(
                  Array.from({ length: 2 }, () => ({
                    color: '',
                    position: '',
                    opacity: '',
                  })),
                )
                setActive(false)
                angleRef.current?.focus()
              }}
            >
              {w('clear')}
            </Button>
          </div>
        </Panel>
        <Panel title={w('result')}>
          <p id="gradient-preview-label" className="text-sm font-medium">
            {t('preview')}
          </p>
          <div
            className="overflow-hidden rounded-md border"
            style={{
              backgroundColor: '#fff',
              backgroundImage:
                'conic-gradient(#ddd 25%, transparent 0 50%, #ddd 0 75%, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          >
            <div
              role="img"
              aria-labelledby="gradient-preview-label"
              data-testid="gradient-preview"
              className="h-64"
              style={{ backgroundImage: result?.value ?? 'none' }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t('previewHint')}</p>
          {result ? (
            <div className="[&_textarea]:field-sizing-fixed [&_textarea]:min-h-36">
              <Output
                key={result.css}
                value={result.css}
                filename="gradient.css"
                label={t('output')}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('emptyResult')}</p>
          )}
          <p className="text-sm text-muted-foreground">{t('rules')}</p>
        </Panel>
      </div>
    </Workbench>
  )
}
