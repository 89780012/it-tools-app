import { useRef, useState, type FormEvent } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  applyJsonMergePatch,
  MergePatchError,
  MERGE_PATCH_MAX_INPUT,
  MERGE_PATCH_MAX_DEPTH,
  MERGE_PATCH_MAX_OUTPUT,
} from '@/lib/json-merge-patch'
import { ErrorMessage, Field, Output, Panel, Workbench } from './workbench'

const exampleTarget =
  '{\n  "name": "demo",\n  "server": { "host": "localhost", "port": 8080 },\n  "tags": ["old", "test"],\n  "obsolete": true,\n  "id": 9007199254740993\n}'
const examplePatch =
  '{\n  "server": { "port": 443, "tls": true },\n  "tags": ["production"],\n  "obsolete": null\n}'

export function JsonMergePatch() {
  const t = useTranslations('jsonMergePatch')
  const w = useTranslations('workbench')
  const [target, setTarget] = useState('')
  const [patch, setPatch] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<MergePatchError>()
  const targetRef = useRef<HTMLTextAreaElement>(null)
  const patchRef = useRef<HTMLTextAreaElement>(null)

  function invalidate() {
    setOutput('')
    setError(undefined)
  }
  function apply(event: FormEvent) {
    event.preventDefault()
    try {
      setOutput(applyJsonMergePatch(target, patch))
      setError(undefined)
    } catch (caught) {
      if (!(caught instanceof MergePatchError)) throw caught
      setOutput('')
      setError(caught)
      if (caught.field !== 'output')
        (caught.field === 'target' ? targetRef : patchRef).current?.focus()
    }
  }

  return (
    <Workbench toolId="json-merge-patch">
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title={w('input')}>
          <form className="space-y-4" onSubmit={apply}>
            {(['target', 'patch'] as const).map((field) => (
              <Field key={field} label={t(field)} htmlFor={`merge-${field}`}>
                <Textarea
                  id={`merge-${field}`}
                  ref={field === 'target' ? targetRef : patchRef}
                  value={field === 'target' ? target : patch}
                  dir="ltr"
                  spellCheck={false}
                  className="min-h-48 font-mono text-sm"
                  placeholder={
                    field === 'target'
                      ? '{"enabled": false}'
                      : '{"enabled": true}'
                  }
                  aria-invalid={error?.field === field}
                  aria-describedby={`merge-hint${error?.field === field ? ' merge-error' : ''}`}
                  onChange={(event) => {
                    ;(field === 'target' ? setTarget : setPatch)(
                      event.target.value,
                    )
                    invalidate()
                  }}
                />
              </Field>
            ))}
            <p id="merge-hint" className="text-sm text-muted-foreground">
              {t('hint', {
                characters: MERGE_PATCH_MAX_INPUT,
                depth: MERGE_PATCH_MAX_DEPTH,
              })}
            </p>
            <div id="merge-error">
              <ErrorMessage>
                {error &&
                  `${t(error.field)}: ${t(error.code, { characters: MERGE_PATCH_MAX_INPUT, depth: MERGE_PATCH_MAX_DEPTH, limit: MERGE_PATCH_MAX_OUTPUT })}`}
              </ErrorMessage>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{t('apply')}</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTarget(exampleTarget)
                  setPatch(examplePatch)
                  invalidate()
                }}
              >
                {w('example')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setTarget('')
                  setPatch('')
                  invalidate()
                }}
              >
                {w('clear')}
              </Button>
            </div>
          </form>
        </Panel>
        <Panel title={w('result')}>
          <div aria-live="polite">
            {output ? (
              <Output
                key={output}
                value={output}
                label={t('output')}
                filename="merged.json"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('emptyResult')}
              </p>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{t('rules')}</p>
          <p className="text-sm text-muted-foreground">{t('nullRule')}</p>
        </Panel>
      </div>
    </Workbench>
  )
}
