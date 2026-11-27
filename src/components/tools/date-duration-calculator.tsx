import { useState, type FormEvent } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  calculateDateDuration,
  DateDurationError,
  MAX_HOLIDAY_LINES,
  type DateDurationInput,
  type DateDurationResult,
} from '@/lib/date-duration'
import { ErrorMessage, Field, Output, Panel, Workbench } from './workbench'

const empty: DateDurationInput = {
  start: '',
  end: '',
  includeEnd: false,
  holidays: '',
}
const example: DateDurationInput = {
  start: '2026-11-23',
  end: '2026-11-30',
  includeEnd: false,
  holidays: '2026-11-26',
}

export function DateDurationCalculator() {
  const t = useTranslations('dateDuration')
  const w = useTranslations('workbench')
  const [input, setInput] = useState(empty)
  const [result, setResult] = useState<DateDurationResult>()
  const [error, setError] = useState<DateDurationError>()

  function update(next: DateDurationInput) {
    setInput(next)
    setResult(undefined)
    setError(undefined)
  }

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      setResult(calculateDateDuration(input))
      setError(undefined)
    } catch (caught) {
      if (!(caught instanceof DateDurationError)) throw caught
      setResult(undefined)
      setError(caught)
      const field = event.currentTarget.elements.namedItem(caught.field)
      if (field instanceof HTMLElement) field.focus()
    }
  }

  const summary = result
    ? [
        `${t('start')}: ${input.start}`,
        `${t('end')}: ${input.end}`,
        t(input.includeEnd ? 'inclusive' : 'exclusive'),
        ...(
          [
            'calendarDays',
            'businessDays',
            'weekdays',
            'weekendDays',
            'excludedHolidays',
          ] as const
        ).map((key) => `${t(key)}: ${result[key]}`),
        t('weeks', { weeks: result.weeks, days: result.remainingDays }),
      ].join('\n')
    : ''

  return (
    <Workbench toolId="date-duration-calculator">
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title={w('input')}>
          <form className="space-y-4" onSubmit={calculate} noValidate>
            <p id="date-hint" className="text-sm text-muted-foreground">
              {t('hint')}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(['start', 'end'] as const).map((field) => (
                <Field key={field} label={t(field)} htmlFor={`date-${field}`}>
                  <Input
                    id={`date-${field}`}
                    name={field}
                    type="date"
                    min="0001-01-01"
                    max="9999-12-31"
                    dir="ltr"
                    className="min-w-0"
                    value={input[field]}
                    aria-invalid={error?.field === field || undefined}
                    aria-describedby={
                      error?.field === field
                        ? 'date-hint date-error'
                        : 'date-hint'
                    }
                    onChange={(event) =>
                      update({ ...input, [field]: event.target.value })
                    }
                  />
                </Field>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={input.includeEnd}
                onChange={(event) =>
                  update({ ...input, includeEnd: event.target.checked })
                }
              />
              {t('includeEnd')}
            </label>
            <p className="text-sm text-muted-foreground">
              {t(input.includeEnd ? 'inclusive' : 'exclusive')}
            </p>
            <Field label={t('holidays')} htmlFor="date-holidays">
              <Textarea
                id="date-holidays"
                name="holidays"
                dir="ltr"
                className="min-h-32 font-mono"
                placeholder="2026-11-26"
                value={input.holidays}
                aria-invalid={error?.field === 'holidays' || undefined}
                aria-describedby={
                  error?.field === 'holidays'
                    ? 'holiday-hint date-error'
                    : 'holiday-hint'
                }
                onChange={(event) =>
                  update({ ...input, holidays: event.target.value })
                }
              />
              <p id="holiday-hint" className="text-sm text-muted-foreground">
                {t('holidayHint', { limit: MAX_HOLIDAY_LINES })}
              </p>
            </Field>
            <div id="date-error">
              <ErrorMessage>
                {error &&
                  t(error.code, {
                    field: t(error.field),
                    line: error.line,
                    limit: MAX_HOLIDAY_LINES,
                  })}
              </ErrorMessage>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{t('calculate')}</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => update(example)}
              >
                {w('example')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => update(empty)}
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
                <dl className="grid grid-cols-2 gap-4 rounded-md border bg-muted/40 p-4">
                  {(['calendarDays', 'businessDays'] as const).map((key) => (
                    <div key={key} className="min-w-0">
                      <dt className="text-sm text-muted-foreground">
                        {t(key)}
                      </dt>
                      <dd
                        className="break-words text-2xl font-semibold"
                        data-testid={key}
                      >
                        {result[key]}
                      </dd>
                    </div>
                  ))}
                </dl>
                <Output
                  key={summary}
                  value={summary}
                  label={t('summary')}
                  filename="date-duration.txt"
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('emptyResult')}
              </p>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{t('businessHint')}</p>
        </Panel>
      </div>
    </Workbench>
  )
}
