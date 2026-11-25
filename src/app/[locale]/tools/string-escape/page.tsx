import { useState } from 'react'
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
import {
  transformTextEscape,
  TextEscapeError,
  type TextEscapeMode,
} from '@/lib/text-escape'

export default function StringEscapePage() {
  const t = useTranslations('tools.string-escape')
  const w = useTranslations('workbench')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<TextEscapeMode>('json')
  const [depth, setDepth] = useState('5')
  const reset = () => {
    setOutput('')
    setError('')
  }
  const changeInput = (value: string) => {
    setInput(value)
    reset()
  }
  const run = (decode: boolean) => {
    reset()
    try {
      setOutput(transformTextEscape(input, mode, decode, Number(depth)))
    } catch (err) {
      setError(t(err instanceof TextEscapeError ? err.message : 'invalidJson'))
    }
  }
  return (
    <Workbench toolId="string-escape">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={w('input')}>
          <Field label={t('mode')} htmlFor="escape-mode">
            <select
              className="h-10 w-full rounded-md border bg-background px-3"
              id="escape-mode"
              data-testid="escape-mode"
              value={mode}
              onChange={(e) => {
                setMode(e.target.value as TextEscapeMode)
                reset()
              }}
            >
              {(['json', 'unicode', 'html', 'nested'] as const).map((value) => (
                <option key={value} value={value}>
                  {t(value)}
                </option>
              ))}
            </select>
          </Field>
          {mode === 'nested' && (
            <Field label={t('depth')} htmlFor="escape-depth">
              <Input
                id="escape-depth"
                data-testid="escape-depth"
                type="number"
                min={1}
                max={20}
                value={depth}
                onChange={(e) => {
                  setDepth(e.target.value)
                  reset()
                }}
              />
            </Field>
          )}
          <Field label={w('input')} htmlFor="escape-input">
            <Textarea
              id="escape-input"
              data-testid="escape-input"
              dir="ltr"
              className="min-h-72 font-mono"
              value={input}
              onChange={(e) => changeInput(e.target.value)}
              spellCheck={false}
            />
          </Field>
          <p className="text-xs text-muted-foreground">{t(`${mode}Hint`)}</p>
          <div className="flex flex-wrap gap-2">
            {mode !== 'nested' && (
              <Button data-testid="escape-encode" onClick={() => run(false)}>
                {t('encode')}
              </Button>
            )}
            <Button
              data-testid="escape-decode"
              variant={mode === 'nested' ? 'default' : 'outline'}
              onClick={() => run(true)}
            >
              {t('decode')}
            </Button>
            <Button
              data-testid="escape-example"
              variant="outline"
              onClick={() =>
                changeInput(
                  mode === 'nested'
                    ? JSON.stringify(
                        JSON.stringify({ message: 'Hello 🌍', count: 0 }),
                      )
                    : mode === 'html'
                      ? '<b title="hello">你好 & 🌍</b>'
                      : '  Hello "世界" 🌍\n  ',
                )
              }
            >
              {w('example')}
            </Button>
            <Button
              data-testid="escape-clear"
              variant="ghost"
              onClick={() => changeInput('')}
            >
              {w('clear')}
            </Button>
          </div>
          <ErrorMessage>{error}</ErrorMessage>
        </Panel>
        <Panel title={w('result')}>
          <Output value={output} filename="escaped.txt" />
        </Panel>
      </div>
    </Workbench>
  )
}
