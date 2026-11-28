import { useRef, useState, type FormEvent } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  MAX_VERSION_INPUT,
  MAX_VERSIONS,
  SemverError,
  sortSemanticVersions,
  type SemverSortResult,
} from '@/lib/semver'
import { ErrorMessage, Field, Output, Panel, Workbench } from './workbench'

const example =
  'v2.0.0-rc.2\n1.9.0\nv2.0.0-rc.10\n2.0.0\n1.10.0+build.7\n2.1.0-beta.1\n1.10.0+build.3'

export function SemverSorter() {
  const t = useTranslations('semverSorter')
  const w = useTranslations('workbench')
  const [input, setInput] = useState('')
  const [order, setOrder] = useState<'ascending' | 'descending'>('descending')
  const [allowV, setAllowV] = useState(true)
  const [result, setResult] = useState<SemverSortResult>()
  const [error, setError] = useState<SemverError>()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  function invalidate() {
    setResult(undefined)
    setError(undefined)
  }

  function sort(event: FormEvent) {
    event.preventDefault()
    try {
      setResult(sortSemanticVersions(input, order, allowV))
      setError(undefined)
    } catch (caught) {
      if (!(caught instanceof SemverError)) throw caught
      setResult(undefined)
      setError(caught)
      inputRef.current?.focus()
    }
  }

  return (
    <Workbench toolId="semver-sorter">
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title={w('input')}>
          <form className="space-y-4" onSubmit={sort}>
            <Field label={t('versions')} htmlFor="semver-input">
              <Textarea
                ref={inputRef}
                id="semver-input"
                dir="ltr"
                spellCheck={false}
                className="min-h-64 font-mono text-sm"
                placeholder={'1.9.0\n1.10.0\n2.0.0-rc.1'}
                value={input}
                aria-invalid={!!error}
                aria-describedby={`semver-hint${error ? ' semver-error' : ''}`}
                onChange={(event) => {
                  setInput(event.target.value)
                  invalidate()
                }}
              />
              <p id="semver-hint" className="text-sm text-muted-foreground">
                {t('hint', {
                  limit: MAX_VERSIONS,
                  characters: MAX_VERSION_INPUT,
                })}
              </p>
            </Field>
            <Field label={t('order')} htmlFor="semver-order">
              <select
                id="semver-order"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={order}
                onChange={(event) => {
                  setOrder(event.target.value as typeof order)
                  invalidate()
                }}
              >
                <option value="descending">{t('descending')}</option>
                <option value="ascending">{t('ascending')}</option>
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allowV}
                onChange={(event) => {
                  setAllowV(event.target.checked)
                  invalidate()
                }}
              />
              {t('allowV')}
            </label>
            <div id="semver-error">
              <ErrorMessage>
                {error &&
                  t(error.code, {
                    line: error.line,
                    limit: MAX_VERSIONS,
                    characters: MAX_VERSION_INPUT,
                  })}
              </ErrorMessage>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{t('sort')}</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setInput(example)
                  setAllowV(true)
                  invalidate()
                }}
              >
                {w('example')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setInput('')
                  setOrder('descending')
                  setAllowV(true)
                  invalidate()
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
                <p className="text-sm">{t('count', { count: result.count })}</p>
                <dl className="space-y-3 rounded-md border bg-muted/40 p-4">
                  {(['highest', 'lowest', 'stable'] as const).map((key) => (
                    <div key={key} className="min-w-0">
                      <dt className="text-sm text-muted-foreground">
                        {t(key)}
                      </dt>
                      <dd
                        data-testid={`semver-${key}`}
                        className="break-all font-mono text-sm"
                        dir="ltr"
                      >
                        {result[key] ?? t('noStable')}
                      </dd>
                    </div>
                  ))}
                </dl>
                <Output
                  key={result.output}
                  value={result.output}
                  label={t('output')}
                  filename="sorted-versions.txt"
                />
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
