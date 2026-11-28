import { useMemo, useRef, useState } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  borderRadiusExample,
  BorderRadiusError,
  generateBorderRadius,
  type CornerRadii,
  type RadiusAxis,
  type RadiusUnit,
} from '@/lib/border-radius'
import { ErrorMessage, Field, Output, Panel, Workbench } from './workbench'

const corners = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'] as const
const empty = (): CornerRadii => ['', '', '', '']

export function CssBorderRadiusGenerator() {
  const t = useTranslations('borderRadius')
  const w = useTranslations('workbench')
  const [horizontal, setHorizontal] = useState<CornerRadii>([
    '24',
    '24',
    '24',
    '24',
  ])
  const [vertical, setVertical] = useState<CornerRadii>([
    '24',
    '24',
    '24',
    '24',
  ])
  const [unit, setUnit] = useState<RadiusUnit>('px')
  const [elliptical, setElliptical] = useState(false)
  const [active, setActive] = useState(true)
  const firstInput = useRef<HTMLInputElement>(null)
  const { result, error } = useMemo(() => {
    if (!active) return {}
    try {
      return {
        result: generateBorderRadius(
          horizontal,
          elliptical ? vertical : null,
          unit,
        ),
      }
    } catch (caught) {
      if (!(caught instanceof BorderRadiusError)) throw caught
      return { error: caught }
    }
  }, [horizontal, vertical, unit, elliptical, active])
  function update(axis: RadiusAxis, corner: number, value: string) {
    const setter = axis === 'horizontal' ? setHorizontal : setVertical
    setter(
      (previous) =>
        previous.map((old, index) =>
          index === corner ? value : old,
        ) as CornerRadii,
    )
    setActive(true)
  }
  return (
    <Workbench toolId="css-border-radius-generator">
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title={w('input')}>
          <p id="radius-hint" className="text-sm text-muted-foreground">
            {t('hint')}
          </p>
          <Field label={t('unit')} htmlFor="radius-unit">
            <select
              id="radius-unit"
              className="h-10 w-full rounded-md border bg-background px-3"
              value={unit}
              onChange={(event) => {
                setUnit(event.target.value as RadiusUnit)
                setActive(true)
              }}
            >
              <option value="px">{t('pixels')}</option>
              <option value="%">{t('percent')}</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={elliptical}
              onChange={(event) => {
                setElliptical(event.target.checked)
                if (event.target.checked) setVertical([...horizontal])
                setActive(true)
              }}
            />
            {t('elliptical')}
          </label>
          {(
            ['horizontal', ...(elliptical ? ['vertical'] : [])] as RadiusAxis[]
          ).map((axis) => (
            <fieldset
              key={axis}
              className="min-w-0 space-y-3 rounded-md border p-3"
            >
              <legend className="px-1 text-sm font-medium">{t(axis)}</legend>
              <div className="grid grid-cols-2 gap-3">
                {corners.map((corner, index) => {
                  const invalid = error?.axis === axis && error.corner === index
                  return (
                    <Field
                      key={corner}
                      label={t('fieldLabel', {
                        corner: t(corner),
                        axis: t(axis),
                        unit,
                      })}
                      htmlFor={`radius-${axis}-${index}`}
                    >
                      <Input
                        id={`radius-${axis}-${index}`}
                        ref={
                          axis === 'horizontal' && index === 0
                            ? firstInput
                            : undefined
                        }
                        dir="ltr"
                        inputMode="decimal"
                        maxLength={16}
                        value={
                          (axis === 'horizontal' ? horizontal : vertical)[index]
                        }
                        aria-invalid={invalid}
                        aria-describedby={`radius-hint${invalid ? ' radius-error' : ''}`}
                        onChange={(event) =>
                          update(axis, index, event.target.value)
                        }
                      />
                    </Field>
                  )
                })}
              </div>
            </fieldset>
          ))}
          <div id="radius-error">
            <ErrorMessage>
              {error &&
                t(error.code, {
                  limit: unit === '%' ? 100 : 1000,
                  corner: t(corners[error.corner]),
                  axis: t(error.axis),
                })}
            </ErrorMessage>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const example = borderRadiusExample()
                setHorizontal(example.horizontal)
                setVertical(example.vertical)
                setUnit(example.unit)
                setElliptical(true)
                setActive(true)
              }}
            >
              {w('example')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setHorizontal(['50', '50', '50', '50'])
                setVertical(['50', '50', '50', '50'])
                setUnit('%')
                setElliptical(false)
                setActive(true)
              }}
            >
              {t('ellipse')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setHorizontal(empty())
                setVertical(empty())
                setUnit('px')
                setElliptical(false)
                setActive(false)
                firstInput.current?.focus()
              }}
            >
              {w('clear')}
            </Button>
          </div>
        </Panel>
        <Panel title={w('result')}>
          <p id="radius-preview-label" className="text-sm font-medium">
            {t('preview')}
          </p>
          <div className="flex h-64 items-center justify-center overflow-hidden rounded-md border bg-muted/30 p-4">
            <div
              role="img"
              aria-labelledby="radius-preview-label"
              data-testid="radius-preview"
              className="h-[180px] w-full max-w-[320px] border-2 border-primary bg-primary/25"
              style={{
                borderRadius: result?.value ?? '0px',
                visibility: result ? 'visible' : 'hidden',
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t('previewHint')}</p>
          {result ? (
            <div className="[&_textarea]:field-sizing-fixed [&_textarea]:min-h-36">
              <Output
                key={result.css}
                value={result.css}
                filename="border-radius.css"
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
