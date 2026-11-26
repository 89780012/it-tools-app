import { useState } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Field, Panel, Output } from './workbench'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  convertTextCase,
  textStatistics,
  type TextCase,
} from '@/lib/text-operations'
import { buildCron, nextCronRuns, type CronSchedule } from '@/lib/cron-builder'
import { Button } from '@/components/ui/button'
import { ErrorMessage } from './workbench'
const selectClass = 'w-full rounded-md border bg-background p-2 text-sm'
export function TextExtras() {
  const t = useTranslations('expansion')
  const [text, setText] = useState(''),
    [mode, setMode] = useState<TextCase>('keep'),
    [newline, setNewline] = useState('lf')
  const converted = convertTextCase(text, mode).replace(
    /\r\n?|\n/g,
    newline === 'crlf' ? '\r\n' : '\n',
  )
  const stats = textStatistics(converted)
  return (
    <Panel title={t('textExtras')}>
      <Field label={t('input')}>
        <Textarea
          aria-label={t('input')}
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={1_000_000}
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t('caseMode')}>
          <select
            aria-label={t('caseMode')}
            className={selectClass}
            value={mode}
            onChange={(event) => setMode(event.target.value as TextCase)}
          >
            {[
              'keep',
              'upper',
              'lower',
              'camel',
              'pascal',
              'snake',
              'kebab',
            ].map((value) => (
              <option value={value} key={value}>
                {t(value)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('newline')}>
          <select
            aria-label={t('newline')}
            className={selectClass}
            value={newline}
            onChange={(event) => setNewline(event.target.value)}
          >
            <option value="lf">LF</option>
            <option value="crlf">CRLF</option>
          </select>
        </Field>
      </div>
      <p role="status">{t('textStats', stats)}</p>
      <Output value={converted} filename="text.txt" />
    </Panel>
  )
}
export function CronBuilder({
  onApply,
}: {
  onApply: (expression: string, zone: string) => void
}) {
  const t = useTranslations('expansion')
  const [schedule, setSchedule] = useState<CronSchedule>('daily'),
    [minute, setMinute] = useState(0),
    [hour, setHour] = useState(9),
    [day, setDay] = useState(1),
    [interval, setIntervalValue] = useState(5),
    [zone, setZone] = useState('UTC')
  let expression = '',
    error = '',
    runs: string[] = []
  try {
    expression = buildCron(schedule, minute, hour, day, interval)
    runs = nextCronRuns(expression, zone).map((date) =>
      new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'long',
        timeZone: zone,
      }).format(date),
    )
  } catch {
    error = t('invalidCron')
  }
  return (
    <Panel title={t('cronBuilder')}>
      <p className="text-sm text-muted-foreground">{t('cronHint')}</p>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label={t('schedule')}>
          <select
            aria-label={t('schedule')}
            className={selectClass}
            value={schedule}
            onChange={(event) =>
              setSchedule(event.target.value as CronSchedule)
            }
          >
            {['minutes', 'hourly', 'daily', 'weekly', 'monthly'].map(
              (value) => (
                <option value={value} key={value}>
                  {t(value)}
                </option>
              ),
            )}
          </select>
        </Field>
        <Field label={t('timezone')}>
          <Input
            aria-label={t('timezone')}
            value={zone}
            onChange={(event) => setZone(event.target.value)}
            placeholder="Asia/Shanghai"
          />
        </Field>
        {schedule === 'minutes' ? (
          <Field label={t('interval')}>
            <Input
              aria-label={t('interval')}
              type="number"
              min={1}
              max={59}
              value={interval}
              onChange={(event) => setIntervalValue(Number(event.target.value))}
            />
          </Field>
        ) : (
          <Field label={t('minute')}>
            <Input
              aria-label={t('minute')}
              type="number"
              min={0}
              max={59}
              value={minute}
              onChange={(event) => setMinute(Number(event.target.value))}
            />
          </Field>
        )}
        {['daily', 'weekly', 'monthly'].includes(schedule) && (
          <Field label={t('hour')}>
            <Input
              aria-label={t('hour')}
              type="number"
              min={0}
              max={23}
              value={hour}
              onChange={(event) => setHour(Number(event.target.value))}
            />
          </Field>
        )}
        {schedule === 'weekly' && (
          <Field label={t('weekday')}>
            <select
              aria-label={t('weekday')}
              className={selectClass}
              value={day}
              onChange={(event) => setDay(Number(event.target.value))}
            >
              {[
                'sunday',
                'monday',
                'tuesday',
                'wednesday',
                'thursday',
                'friday',
                'saturday',
              ].map((value, index) => (
                <option value={index} key={value}>
                  {t(value)}
                </option>
              ))}
            </select>
          </Field>
        )}
        {schedule === 'monthly' && (
          <Field label={t('monthDay')}>
            <Input
              aria-label={t('monthDay')}
              type="number"
              min={1}
              max={31}
              value={day}
              onChange={(event) => setDay(Number(event.target.value))}
            />
          </Field>
        )}
      </div>
      <ErrorMessage>{error}</ErrorMessage>
      <Output value={error ? '' : expression} filename="cron.txt" />
      <Button disabled={!!error} onClick={() => onApply(expression, zone)}>
        {t('apply')}
      </Button>
      <ol className="list-inside list-decimal text-sm">
        {runs.map((run) => (
          <li key={run}>{run}</li>
        ))}
      </ol>
    </Panel>
  )
}
