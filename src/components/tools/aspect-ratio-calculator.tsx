import { useState, type FormEvent } from 'react'
import { Copy } from 'lucide-react'
import { useLocale, useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  calculateAspectRatio,
  MAX_ASPECT_DIMENSION,
  type AspectDimension,
  type AspectDimensions,
  type AspectRatioCalculation,
  type AspectRatioMode,
  type AspectRatioResult,
} from '@/lib/aspect-ratio'
import { ErrorMessage, Field, Panel, Workbench } from './workbench'

const empty: AspectDimensions = { sourceWidth: '', sourceHeight: '', targetWidth: '', targetHeight: '' }
const example: AspectDimensions = { sourceWidth: '1920', sourceHeight: '1080', targetWidth: '1000', targetHeight: '1000' }
const modes: AspectRatioMode[] = ['ratio', 'width', 'height', 'fit']

function AspectResult({ result }: { result: AspectRatioCalculation }) {
  const t = useTranslations('aspectRatio')
  const workbench = useTranslations('workbench')
  const [notice, setNotice] = useState<'copied' | 'copyError'>()
  const ratio = `${result.ratioWidth}:${result.ratioHeight}`
  const size = result.scaled && `${result.scaled.width} × ${result.scaled.height}`

  return (
    <>
      <div className="space-y-3">
        <dl className="grid gap-4 rounded-md border bg-muted/40 p-4 sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-sm text-muted-foreground">{t('reducedRatio')}</dt>
            <dd className="break-words font-mono font-semibold"><bdi dir="ltr">{ratio}</bdi></dd>
          </div>
          {size && (
            <div className="min-w-0">
              <dt className="text-sm text-muted-foreground">{t('scaledSize')}</dt>
              <dd className="break-words font-mono font-semibold"><bdi dir="ltr">{size}</bdi></dd>
            </div>
          )}
        </dl>
        {result.scaled?.rounded && <p className="text-sm text-muted-foreground">{t('rounded')}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(size ? `${ratio}\n${size}` : ratio)
              setNotice('copied')
            } catch {
              setNotice('copyError')
            }
          }}
        >
          <Copy aria-hidden="true" />
          {workbench('copy')}
        </Button>
        <span role="status" className="text-sm text-muted-foreground">{notice && workbench(notice)}</span>
      </div>
    </>
  )
}

export function AspectRatioCalculator() {
  const t = useTranslations('aspectRatio')
  const workbench = useTranslations('workbench')
  const locale = useLocale()
  const [input, setInput] = useState(empty)
  const [mode, setMode] = useState<AspectRatioMode>('ratio')
  const [result, setResult] = useState<AspectRatioResult>()
  const invalidField = result && 'invalidField' in result ? result.invalidField : undefined
  const limit = new Intl.NumberFormat(locale).format(MAX_ASPECT_DIMENSION)

  function reset(values: AspectDimensions, nextMode: AspectRatioMode) {
    setInput(values)
    setMode(nextMode)
    setResult(undefined)
  }

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = calculateAspectRatio(input, mode)
    setResult(next)
    if ('invalidField' in next) {
      const field = event.currentTarget.elements.namedItem(next.invalidField)
      if (field instanceof HTMLInputElement) field.focus()
    }
  }

  function dimension(field: AspectDimension) {
    const id = `aspect-${field}`
    return (
      <Field label={t(field)} htmlFor={id}>
        <Input
          id={id}
          name={field}
          dir="ltr"
          inputMode="numeric"
          aria-invalid={invalidField === field || undefined}
          aria-describedby="aspect-input-hint"
          value={input[field]}
          onChange={(event) => {
            setInput({ ...input, [field]: event.target.value })
            setResult(undefined)
          }}
        />
      </Field>
    )
  }

  return (
    <Workbench toolId="aspect-ratio-calculator">
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title={workbench('input')}>
          <form className="space-y-4" onSubmit={calculate}>
            <p id="aspect-input-hint" className="text-sm text-muted-foreground">{t('hint', { limit })}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {dimension('sourceWidth')}
              {dimension('sourceHeight')}
            </div>
            <Field label={t('mode')} htmlFor="aspect-mode">
              <select
                id="aspect-mode"
                className="min-h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-base md:text-sm"
                value={mode}
                onChange={(event) => {
                  setMode(event.target.value as AspectRatioMode)
                  setResult(undefined)
                }}
              >
                {modes.map((option) => <option key={option} value={option}>{t(option)}</option>)}
              </select>
            </Field>
            {mode !== 'ratio' && (
              <div className="grid gap-3 sm:grid-cols-2">
                {mode !== 'height' && dimension('targetWidth')}
                {mode !== 'width' && dimension('targetHeight')}
              </div>
            )}
            <ErrorMessage>{invalidField && t('invalidDimension', { field: t(invalidField), limit })}</ErrorMessage>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{t('calculate')}</Button>
              <Button type="button" variant="outline" onClick={() => reset(example, 'fit')}>{workbench('example')}</Button>
              <Button type="button" variant="ghost" onClick={() => reset(empty, 'ratio')}>{workbench('clear')}</Button>
            </div>
          </form>
        </Panel>
        <Panel title={workbench('result')}>
          <div aria-live="polite" className="space-y-4">
            {result && !('invalidField' in result)
              ? <AspectResult result={result} />
              : <p className="text-sm text-muted-foreground">{t('emptyResult')}</p>}
          </div>
        </Panel>
      </div>
    </Workbench>
  )
}
