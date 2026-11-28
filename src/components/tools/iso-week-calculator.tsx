import { useRef, useState, type FormEvent } from 'react'
import { useLocale, useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  convertIsoWeek,
  IsoWeekError,
  type IsoWeekMode,
  type IsoWeekResult,
} from '@/lib/iso-week'
import { ErrorMessage, Field, Output, Panel, Workbench } from './workbench'

const weekdays = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export function IsoWeekCalculator() {
  const locale = useLocale()
  const t = useTranslations('isoWeek')
  const w = useTranslations('workbench')
  const [mode, setMode] = useState<IsoWeekMode>('date')
  const [input, setInput] = useState('')
  const [result, setResult] = useState<IsoWeekResult>()
  const [error, setError] = useState<IsoWeekError>()
  const inputRef = useRef<HTMLInputElement>(null)
  function reset() {
    setResult(undefined)
    setError(undefined)
  }
  function convert(event: FormEvent) {
    event.preventDefault()
    try {
      setResult(convertIsoWeek(input, mode))
      setError(undefined)
    } catch (caught) {
      if (!(caught instanceof IsoWeekError)) throw caught
      setResult(undefined)
      setError(caught)
      inputRef.current?.focus()
    }
  }
  const rows = result
    ? [
        [t('date'), result.date],
        [t('weekDate'), result.weekDate],
        [t('weekYear'), result.weekYear],
        [t('week'), result.week],
        [
          t('weekday'),
          `${result.weekday} (${t(weekdays[result.weekday - 1])})`,
        ],
        [t('weekStart'), result.monday],
        [t('weekEnd'), result.sunday],
        [t('weeksInYear'), result.weeksInYear],
      ]
    : []
  // Isolate values in the human-readable Arabic summary so hyphenated dates
  // retain their order on screen and in copied/downloaded plain text.
  const summary = rows
    .map(
      ([label, value]) =>
        `${label}: ${locale === 'ar' ? `\u2066${value}\u2069` : value}`,
    )
    .join('\n')
  return (
    <Workbench toolId="iso-week-calculator">
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title={w('input')}>
          <form onSubmit={convert} className="space-y-4" noValidate>
            <Field label={t('mode')} htmlFor="iso-week-mode">
              <select
                id="iso-week-mode"
                value={mode}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                onChange={(event) => {
                  setMode(event.target.value as IsoWeekMode)
                  setInput('')
                  reset()
                }}
              >
                <option value="date">{t('fromDate')}</option>
                <option value="week">{t('fromWeek')}</option>
              </select>
            </Field>
            <Field
              label={t(mode === 'date' ? 'date' : 'weekDate')}
              htmlFor="iso-week-input"
            >
              <Input
                id="iso-week-input"
                ref={inputRef}
                dir="ltr"
                value={input}
                autoComplete="off"
                spellCheck={false}
                placeholder={mode === 'date' ? '2021-01-01' : '2020-W53-5'}
                onChange={(event) => {
                  setInput(event.target.value)
                  reset()
                }}
                aria-invalid={!!error}
                aria-describedby={`iso-week-hint${error ? ' iso-week-error' : ''}`}
              />
            </Field>
            <p id="iso-week-hint" className="text-sm text-muted-foreground">
              {t(mode === 'date' ? 'dateHint' : 'weekHint')}
            </p>
            <div id="iso-week-error">
              <ErrorMessage>{error && t(error.code)}</ErrorMessage>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{t('convert')}</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setInput(mode === 'date' ? '2021-01-01' : '2020-W53-5')
                  reset()
                }}
              >
                {w('example')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setInput('')
                  reset()
                  inputRef.current?.focus()
                }}
              >
                {w('clear')}
              </Button>
            </div>
          </form>
          <p className="text-sm text-muted-foreground">{t('rules')}</p>
          <p className="text-xs text-muted-foreground">{t('rangeHint')}</p>
        </Panel>
        <Panel title={w('result')}>
          <div aria-live="polite">
            {result ? (
              <Output
                key={summary}
                value={summary}
                label={t('summary')}
                filename="iso-week.txt"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('emptyResult')}
              </p>
            )}
          </div>
        </Panel>
      </div>
    </Workbench>
  )
}
