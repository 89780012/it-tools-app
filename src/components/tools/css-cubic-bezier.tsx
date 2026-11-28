import { useRef, useState, type FormEvent } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  BEZIER_FIELDS,
  BEZIER_PRESETS,
  BezierError,
  generateBezier,
  presetInput,
  sampleBezier,
  type BezierInput,
  type BezierPreset,
  type BezierResult,
} from '@/lib/cubic-bezier'
import { ErrorMessage, Field, Output, Panel, Workbench } from './workbench'

const empty: BezierInput = { x1: '', y1: '', x2: '', y2: '' }

function CurveGraph({ curve, time }: { curve: BezierResult; time: number }) {
  const t = useTranslations('cubicBezier')
  const minimum = Math.min(0, curve.y1, curve.y2) - 0.15
  const maximum = Math.max(1, curve.y1, curve.y2) + 0.15
  const x = (value: number) => 36 + value * 288
  const y = (value: number) =>
    24 + ((maximum - value) / (maximum - minimum)) * 240
  const point = (a: number, b: number) => `${x(a)},${y(b)}`
  const { progress } = sampleBezier(curve, time)
  return (
    <figure className="space-y-2">
      <svg
        viewBox="0 0 360 300"
        role="img"
        aria-label={t('graphLabel')}
        aria-describedby="bezier-graph-hint"
        style={{ direction: 'ltr' }}
        className="mx-auto w-full max-w-md rounded-md border bg-background text-foreground"
      >
        <path
          d={`M ${point(0, 1)} H ${x(1)} M ${point(0, 0)} H ${x(1)} M ${point(0, minimum)} V ${y(maximum)}`}
          fill="none"
          stroke="currentColor"
          opacity="0.3"
        />
        <path
          d={`M ${point(0, 0)} L ${point(1, 1)}`}
          fill="none"
          stroke="currentColor"
          strokeDasharray="4 4"
          opacity="0.3"
        />
        <path
          d={`M ${point(0, 0)} L ${point(curve.x1, curve.y1)} M ${point(1, 1)} L ${point(curve.x2, curve.y2)}`}
          fill="none"
          stroke="currentColor"
          opacity="0.5"
        />
        <path
          data-testid="bezier-path"
          d={`M ${point(0, 0)} C ${point(curve.x1, curve.y1)} ${point(curve.x2, curve.y2)} ${point(1, 1)}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-primary"
        />
        {(
          [
            [curve.x1, curve.y1],
            [curve.x2, curve.y2],
          ] as const
        ).map(([a, b], index) => (
          <g key={index}>
            <circle cx={x(a)} cy={y(b)} r="4" fill="currentColor" />
            <text
              x={x(a)}
              y={y(b) - 10}
              textAnchor="middle"
              fontSize="11"
              fill="currentColor"
            >
              P{index + 1}
            </text>
          </g>
        ))}
        <circle
          data-testid="bezier-marker"
          cx={x(time)}
          cy={y(progress)}
          r="6"
          fill="currentColor"
          className="text-primary"
        />
        <text x="20" y={y(0) + 4} fontSize="11" fill="currentColor">
          0
        </text>
        <text x="20" y={y(1) + 4} fontSize="11" fill="currentColor">
          1
        </text>
        <text x={x(0)} y="286" fontSize="11" fill="currentColor">
          0%
        </text>
        <text
          x={x(1)}
          y="286"
          textAnchor="end"
          fontSize="11"
          fill="currentColor"
        >
          100%
        </text>
      </svg>
      <figcaption
        id="bezier-graph-hint"
        className="text-xs text-muted-foreground"
      >
        {t('graphHint')}
      </figcaption>
    </figure>
  )
}

export function CssCubicBezier() {
  const t = useTranslations('cubicBezier')
  const w = useTranslations('workbench')
  const [input, setInput] = useState<BezierInput>(() => presetInput('ease'))
  const [result, setResult] = useState<BezierResult>()
  const [error, setError] = useState<BezierError>()
  const [time, setTime] = useState(0.5)
  const form = useRef<HTMLFormElement>(null)
  function reset() {
    setResult(undefined)
    setError(undefined)
    setTime(0.5)
  }
  function generate(event: FormEvent) {
    event.preventDefault()
    try {
      setResult(generateBezier(input))
      setError(undefined)
    } catch (caught) {
      if (!(caught instanceof BezierError)) throw caught
      setResult(undefined)
      setError(caught)
      form.current
        ?.querySelector<HTMLInputElement>(`#bezier-${caught.field}`)
        ?.focus()
    }
  }
  return (
    <Workbench toolId="css-cubic-bezier">
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title={w('input')}>
          <form ref={form} onSubmit={generate} noValidate className="space-y-4">
            <p id="bezier-hint" className="text-sm text-muted-foreground">
              {t('hint')}
            </p>
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium">
                {t('presets')}
              </legend>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(BEZIER_PRESETS) as BezierPreset[]).map(
                  (preset) => (
                    <Button
                      type="button"
                      key={preset}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInput(presetInput(preset))
                        reset()
                      }}
                    >
                      {t(preset)}
                    </Button>
                  ),
                )}
              </div>
            </fieldset>
            <div className="grid grid-cols-2 gap-4">
              {BEZIER_FIELDS.map((field) => (
                <Field key={field} label={t(field)} htmlFor={`bezier-${field}`}>
                  <Input
                    id={`bezier-${field}`}
                    value={input[field]}
                    inputMode="decimal"
                    dir="ltr"
                    maxLength={32}
                    aria-invalid={error?.field === field}
                    aria-describedby={`bezier-hint${error?.field === field ? ' bezier-error' : ''}`}
                    onChange={(event) => {
                      setInput({ ...input, [field]: event.target.value })
                      reset()
                    }}
                  />
                </Field>
              ))}
            </div>
            <div id="bezier-error">
              <ErrorMessage>{error && t(error.code)}</ErrorMessage>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{t('generate')}</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setInput(presetInput('overshoot'))
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
                  reset()
                  form.current
                    ?.querySelector<HTMLInputElement>('#bezier-x1')
                    ?.focus()
                }}
              >
                {w('clear')}
              </Button>
            </div>
          </form>
          <p className="text-sm text-muted-foreground">{t('rules')}</p>
        </Panel>
        <Panel title={w('result')}>
          {result ? (
            <>
              <CurveGraph curve={result} time={time} />
              <Field label={t('time')} htmlFor="bezier-time">
                <input
                  id="bezier-time"
                  type="range"
                  min="0"
                  max="1"
                  step="0.001"
                  dir="ltr"
                  className="w-full accent-primary"
                  value={time}
                  aria-valuetext={`${(time * 100).toFixed(1)}%`}
                  onChange={(event) => setTime(Number(event.target.value))}
                />
              </Field>
              <p
                data-testid="bezier-sample"
                dir="auto"
                className="text-sm tabular-nums"
                aria-live="polite"
              >
                {t('sampleTime')}{' '}
                <bdi dir="ltr">{(time * 100).toFixed(1)}%</bdi>{' '}
                <span
                  aria-hidden="true"
                  className="inline-block rtl:rotate-180"
                >
                  →
                </span>{' '}
                {t('sampleProgress')}{' '}
                <bdi dir="ltr">
                  {(sampleBezier(result, time).progress * 100).toFixed(2)}%
                </bdi>
              </p>
              <div className="[&_textarea]:field-sizing-fixed [&_textarea]:min-h-32 [&_textarea]:max-h-64">
                <Output
                  key={result.css}
                  value={result.css}
                  filename="cubic-bezier.css"
                  label={t('output')}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {t('emptyResult')}
            </p>
          )}
        </Panel>
      </div>
    </Workbench>
  )
}
