import { useRef, useState, type FormEvent } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { applyJsonPatch, JsonPatchError } from '@/lib/json-patch'
import { ErrorMessage, Field, Output, Panel, Workbench } from './workbench'

const exampleTarget =
  '{\n  "name": "demo",\n  "tags": ["old", "keep"],\n  "settings": {"enabled": false},\n  "obsolete": true,\n  "id": 9007199254740993\n}'
const examplePatch =
  '[\n  {"op": "test", "path": "/id", "value": 9007199254740993},\n  {"op": "replace", "path": "/settings/enabled", "value": true},\n  {"op": "add", "path": "/tags/-", "value": "new"},\n  {"op": "remove", "path": "/obsolete"},\n  {"op": "copy", "from": "/settings", "path": "/backup"},\n  {"op": "move", "from": "/name", "path": "/title"}\n]'

function pointerHints(text: string) {
  return text.split(/(\/-|~[01])/g).map((part, index) =>
    /^(\/-|~[01])$/.test(part) ? (
      <bdi key={index} dir="ltr">
        {part}
      </bdi>
    ) : (
      part
    ),
  )
}

export function JsonPatch() {
  const t = useTranslations('jsonPatch')
  const w = useTranslations('workbench')
  const [target, setTarget] = useState('')
  const [patch, setPatch] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<JsonPatchError>()
  const targetRef = useRef<HTMLTextAreaElement>(null)
  const patchRef = useRef<HTMLTextAreaElement>(null)
  function reset() {
    setOutput('')
    setError(undefined)
  }
  function apply(event: FormEvent) {
    event.preventDefault()
    try {
      setOutput(applyJsonPatch(target, patch))
      setError(undefined)
    } catch (caught) {
      if (!(caught instanceof JsonPatchError)) throw caught
      setOutput('')
      setError(caught)
      ;(caught.field === 'target' ? targetRef : patchRef).current?.focus()
    }
  }
  return (
    <Workbench toolId="json-patch">
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title={w('input')}>
          <form className="space-y-4" onSubmit={apply}>
            {(['target', 'patch'] as const).map((field) => (
              <Field
                key={field}
                label={t(field)}
                htmlFor={`json-patch-${field}`}
              >
                <Textarea
                  id={`json-patch-${field}`}
                  ref={field === 'target' ? targetRef : patchRef}
                  dir="ltr"
                  spellCheck={false}
                  className="min-h-48 max-h-96 overflow-y-auto font-mono text-sm"
                  value={field === 'target' ? target : patch}
                  placeholder={
                    field === 'target'
                      ? '{"enabled":false}'
                      : '[{"op":"replace","path":"/enabled","value":true}]'
                  }
                  aria-invalid={error?.field === field}
                  aria-describedby={`json-patch-hint${error?.field === field ? ' json-patch-error' : ''}`}
                  onChange={(event) => {
                    const update = field === 'target' ? setTarget : setPatch
                    update(event.target.value)
                    reset()
                  }}
                />
              </Field>
            ))}
            <p id="json-patch-hint" className="text-sm text-muted-foreground">
              {t('hint')}
            </p>
            <div id="json-patch-error">
              <ErrorMessage>
                {error &&
                  `${t(error.field)}${error.operation ? ` · ${t('operation', { number: error.operation })}` : ''}: ${t(error.code)}`}
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
                  reset()
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
                  reset()
                  targetRef.current?.focus()
                }}
              >
                {w('clear')}
              </Button>
            </div>
          </form>
        </Panel>
        <Panel title={w('result')}>
          <div aria-live="polite" className="[&_textarea]:max-h-96">
            {output ? (
              <Output
                key={output}
                value={output}
                label={t('output')}
                filename="patched.json"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('emptyResult')}
              </p>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {pointerHints(t('rules'))}
          </p>
          <p className="text-sm text-muted-foreground">{t('rootRule')}</p>
        </Panel>
      </div>
    </Workbench>
  )
}
