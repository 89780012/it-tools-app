import { useRef, useState, type FormEvent } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  JsonKeySortError,
  sortJsonKeys,
  SORT_MAX_INPUT,
  SORT_MAX_DEPTH,
  SORT_MAX_OUTPUT,
  type SortOptions,
} from '@/lib/json-key-sorter'
import { ErrorMessage, Field, Output, Panel, Workbench } from './workbench'

const defaults: SortOptions = { order: 'asc', indent: '2' }
const example =
  '{"z":9007199254740993,"items":[{"z":2,"a":1},3],"10":"ten","2":"two","a":{"z":null,"a":true}}'
const selectClass = 'h-10 w-full rounded-md border bg-background px-3 text-sm'

export function JsonKeySorter() {
  const t = useTranslations('jsonKeySorter')
  const w = useTranslations('workbench')
  const [input, setInput] = useState('')
  const [options, setOptions] = useState(defaults)
  const [result, setResult] = useState<ReturnType<typeof sortJsonKeys>>()
  const [error, setError] = useState<JsonKeySortError>()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  function invalidate() {
    setResult(undefined)
    setError(undefined)
  }
  function update(patch: Partial<SortOptions>) {
    setOptions({ ...options, ...patch })
    invalidate()
  }
  function sort(event: FormEvent) {
    event.preventDefault()
    try {
      setResult(sortJsonKeys(input, options))
      setError(undefined)
    } catch (caught) {
      if (!(caught instanceof JsonKeySortError)) throw caught
      setResult(undefined)
      setError(caught)
      inputRef.current?.focus()
    }
  }
  return (
    <Workbench toolId="json-key-sorter">
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title={w('input')}>
          <form className="space-y-4" onSubmit={sort}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('order')} htmlFor="sort-order">
                <select
                  id="sort-order"
                  className={selectClass}
                  value={options.order}
                  onChange={(e) =>
                    update({ order: e.target.value as SortOptions['order'] })
                  }
                >
                  <option value="asc">{t('asc')}</option>
                  <option value="desc">{t('desc')}</option>
                </select>
              </Field>
              <Field label={t('indent')} htmlFor="sort-indent">
                <select
                  id="sort-indent"
                  className={selectClass}
                  value={options.indent}
                  onChange={(e) =>
                    update({ indent: e.target.value as SortOptions['indent'] })
                  }
                >
                  <option value="2">{t('two')}</option>
                  <option value="4">{t('four')}</option>
                  <option value="compact">{t('compact')}</option>
                </select>
              </Field>
            </div>
            <Field label={t('data')} htmlFor="sort-input">
              <Textarea
                id="sort-input"
                ref={inputRef}
                dir="ltr"
                spellCheck={false}
                className="min-h-72 font-mono text-sm"
                value={input}
                aria-invalid={!!error}
                aria-describedby={`sort-hint${error ? ' sort-error' : ''}`}
                onChange={(e) => {
                  setInput(e.target.value)
                  invalidate()
                }}
              />
              <p id="sort-hint" className="text-sm text-muted-foreground">
                {t('hint', { limit: SORT_MAX_INPUT, depth: SORT_MAX_DEPTH })}
              </p>
            </Field>
            <div id="sort-error">
              <ErrorMessage>
                {error &&
                  t(error.code, {
                    limit: SORT_MAX_INPUT,
                    depth: SORT_MAX_DEPTH,
                    output: SORT_MAX_OUTPUT,
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
                  setOptions(defaults)
                  invalidate()
                  inputRef.current?.focus()
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
                <p className="text-sm">
                  {t('summary', { objects: result.objects, keys: result.keys })}
                </p>
                <Output
                  key={`${options.order}-${options.indent}-${result.output}`}
                  value={result.output}
                  label={t('output')}
                  filename="sorted.json"
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
