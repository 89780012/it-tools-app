import { useRef, useState, type FormEvent } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  aggregateIpv4Cidrs,
  CidrAggregationError,
  MAX_CIDR_ENTRIES,
  MAX_CIDR_INPUT,
  type CidrAggregationResult,
} from '@/lib/ipv4-cidr-aggregator'
import { ErrorMessage, Field, Output, Panel, Workbench } from './workbench'

const example =
  '192.0.2.10/25\n192.0.2.128/25\n192.0.2.64/26\n198.51.100.9\n198.51.100.9/32'

export function Ipv4CidrAggregator() {
  const t = useTranslations('cidrAggregator')
  const w = useTranslations('workbench')
  const [input, setInput] = useState('')
  const [result, setResult] = useState<CidrAggregationResult>()
  const [error, setError] = useState<CidrAggregationError>()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  function update(value: string) {
    setInput(value)
    setResult(undefined)
    setError(undefined)
  }
  function aggregate(event: FormEvent) {
    event.preventDefault()
    try {
      setResult(aggregateIpv4Cidrs(input))
      setError(undefined)
    } catch (caught) {
      if (!(caught instanceof CidrAggregationError)) throw caught
      setResult(undefined)
      setError(caught)
      inputRef.current?.focus()
    }
  }
  return (
    <Workbench toolId="ipv4-cidr-aggregator">
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title={w('input')}>
          <form className="space-y-4" onSubmit={aggregate}>
            <Field label={t('input')} htmlFor="cidr-input">
              <Textarea
                id="cidr-input"
                ref={inputRef}
                dir="ltr"
                spellCheck={false}
                className="field-sizing-fixed min-h-64 font-mono text-sm"
                value={input}
                aria-invalid={!!error}
                aria-describedby={`cidr-hint${error ? ' cidr-error' : ''}`}
                onChange={(event) => update(event.target.value)}
              />
              <p id="cidr-hint" className="text-sm text-muted-foreground">
                {t('hint', {
                  limit: MAX_CIDR_ENTRIES,
                  inputLimit: MAX_CIDR_INPUT,
                })}
              </p>
            </Field>
            <p className="text-sm text-muted-foreground">
              {t('normalization')}
            </p>
            <div id="cidr-error">
              <ErrorMessage>
                {error &&
                  t(error.code, {
                    line: error.line,
                    limit: MAX_CIDR_ENTRIES,
                    inputLimit: MAX_CIDR_INPUT,
                  })}
              </ErrorMessage>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{t('aggregate')}</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => update(example)}
              >
                {w('example')}
              </Button>
              <Button type="button" variant="ghost" onClick={() => update('')}>
                {w('clear')}
              </Button>
            </div>
          </form>
        </Panel>
        <Panel title={w('result')}>
          <div aria-live="polite" className="space-y-4">
            {result ? (
              <>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {(
                    [
                      'inputCount',
                      'outputCount',
                      'addressCount',
                      'normalizedEntries',
                    ] as const
                  ).map((metric) => (
                    <div key={metric} className="min-w-0 rounded-md border p-3">
                      <dt className="text-muted-foreground">{t(metric)}</dt>
                      <dd
                        data-testid={`cidr-${metric}`}
                        className="mt-1 break-words font-mono text-lg"
                        dir="ltr"
                      >
                        {result[metric]}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="[&_textarea]:field-sizing-fixed">
                  <Output
                    key={result.output}
                    value={result.output}
                    label={t('output')}
                    filename="aggregated-ipv4-cidrs.txt"
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
