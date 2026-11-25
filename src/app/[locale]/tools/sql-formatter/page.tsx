import { useState } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Workbench,
  Field,
  Panel,
  ErrorMessage,
  Output,
} from '@/components/tools/workbench'
import {
  transformTextSql,
  type TextSqlDialect,
  type TextSqlCase,
} from '@/lib/text-sql'

export default function SqlFormatterPage() {
  const t = useTranslations('tools.sql-formatter')
  const w = useTranslations('workbench')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [dialect, setDialect] = useState<TextSqlDialect>('sql')
  const [indent, setIndent] = useState(2)
  const [keywordCase, setKeywordCase] = useState<TextSqlCase>('upper')
  const reset = () => {
    setOutput('')
    setError('')
  }
  const changeInput = (value: string) => {
    setInput(value)
    reset()
  }
  const run = (minify: boolean) => {
    reset()
    try {
      setOutput(
        transformTextSql(input, { dialect, indent, keywordCase }, minify),
      )
    } catch (err) {
      setError(`${t('invalid')} ${err instanceof Error ? err.message : ''}`)
    }
  }
  return (
    <Workbench toolId="sql-formatter">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={w('input')}>
          <Field label={t('dialect')} htmlFor="sql-dialect">
            <select
              className="h-10 w-full rounded-md border bg-background px-3"
              id="sql-dialect"
              data-testid="sql-dialect"
              value={dialect}
              onChange={(e) => {
                setDialect(e.target.value as TextSqlDialect)
                reset()
              }}
            >
              <option value="sql">SQL</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="sqlite">SQLite</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('indent')} htmlFor="sql-indent">
              <select
                className="h-10 w-full rounded-md border bg-background px-3"
                id="sql-indent"
                data-testid="sql-indent"
                value={indent}
                onChange={(e) => {
                  setIndent(Number(e.target.value))
                  reset()
                }}
              >
                <option value="2">2</option>
                <option value="4">4</option>
              </select>
            </Field>
            <Field label={t('casing')} htmlFor="sql-casing">
              <select
                className="h-10 w-full rounded-md border bg-background px-3"
                id="sql-casing"
                data-testid="sql-casing"
                value={keywordCase}
                onChange={(e) => {
                  setKeywordCase(e.target.value as TextSqlCase)
                  reset()
                }}
              >
                {(['upper', 'lower', 'preserve'] as const).map((value) => (
                  <option key={value} value={value}>
                    {t(value)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label={w('input')} htmlFor="sql-input">
            <Textarea
              id="sql-input"
              data-testid="sql-input"
              dir="ltr"
              className="min-h-72 font-mono"
              value={input}
              onChange={(e) => changeInput(e.target.value)}
              spellCheck={false}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button data-testid="sql-format" onClick={() => run(false)}>
              {w('format')}
            </Button>
            <Button
              data-testid="sql-minify"
              variant="outline"
              onClick={() => run(true)}
            >
              {w('minify')}
            </Button>
            <Button
              data-testid="sql-example"
              variant="outline"
              onClick={() =>
                changeInput(
                  "select id, name from users where name = 'Ada  Lovelace' and active = true order by id;",
                )
              }
            >
              {w('example')}
            </Button>
            <Button
              data-testid="sql-clear"
              variant="ghost"
              onClick={() => changeInput('')}
            >
              {w('clear')}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t('hint')}</p>
          <ErrorMessage>{error}</ErrorMessage>
        </Panel>
        <Panel title={w('result')}>
          <Output value={output} filename="formatted.sql" />
        </Panel>
      </div>
    </Workbench>
  )
}
