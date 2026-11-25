import { useMemo, useState } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Workbench,
  Field,
  Panel,
  ErrorMessage,
  Output,
} from '@/components/tools/workbench'
import { generateTypes, type TypeLanguage } from '@/lib/developer-json-to-types'

export default function JsonToTypesPage() {
  const t = useTranslations('tools.json-to-types')
  const w = useTranslations('workbench')
  const [input, setInput] = useState('')
  const [root, setRoot] = useState('Root')
  const [language, setLanguage] = useState<TypeLanguage>('typescript')
  const result = useMemo(() => {
    if (!input.trim()) return { value: '', error: '' }
    try {
      return { value: generateTypes(input, language, root), error: '' }
    } catch (error) {
      return {
        value: '',
        error:
          error instanceof Error &&
          ['invalidJson', 'tooDeep', 'tooLarge', 'goKey'].includes(
            error.message,
          )
            ? error.message
            : 'invalidJson',
      }
    }
  }, [input, root, language])
  return (
    <Workbench toolId="json-to-types">
      <Panel title={w('input')}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t('language')} htmlFor="types-language">
            <select
              id="types-language"
              data-testid="types-language"
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value as TypeLanguage)
              }
            >
              <option value="typescript">{t('typescript')}</option>
              <option value="go">{t('go')}</option>
            </select>
          </Field>
          <Field
            label={t('rootName')}
            htmlFor="types-root"
            hint={t('rootHint')}
          >
            <Input
              id="types-root"
              data-testid="types-root"
              value={root}
              onChange={(event) => setRoot(event.target.value)}
              dir="ltr"
              maxLength={100}
            />
          </Field>
        </div>
        <Field label={t('json')} htmlFor="types-input">
          <Textarea
            id="types-input"
            data-testid="types-input"
            className="min-h-64 font-mono"
            dir="ltr"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            spellCheck={false}
          />
        </Field>
        <div className="flex gap-2">
          <Button
            variant="outline"
            data-testid="types-example"
            onClick={() =>
              setInput(
                '[{"id":1,"name":"Ada","profile":{"active":true}},{"id":2,"name":null,"tags":["admin",3]}]',
              )
            }
          >
            {w('example')}
          </Button>
          <Button variant="outline" onClick={() => setInput('')}>
            {w('clear')}
          </Button>
        </div>
        <ErrorMessage>{result.error && t(result.error)}</ErrorMessage>
        <p className="text-sm text-muted-foreground">
          {t(language === 'go' ? 'goHint' : 'inferenceHint')}
        </p>
      </Panel>
      <Panel title={w('output')}>
        <Output
          value={result.value}
          filename={language === 'go' ? 'types.go' : 'types.ts'}
          label={t('generated')}
        />
      </Panel>
    </Workbench>
  )
}
