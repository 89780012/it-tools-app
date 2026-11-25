import { useEffect, useRef, useState } from 'react'
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
import { formatFrontendCss } from '@/lib/frontend-css'

export default function CssFormatter() {
  const t = useTranslations('tools.css-formatter'),
    w = useTranslations('workbench')
  const [source, setSource] = useState(''),
    [output, setOutput] = useState(''),
    [error, setError] = useState(false)
  const [indent, setIndent] = useState<'2' | '4' | 'tab'>('2'),
    [busy, setBusy] = useState(false)
  const revision = useRef(0)
  useEffect(
    () => () => {
      revision.current++
    },
    [],
  )
  const invalidate = () => {
    revision.current++
    setOutput('')
    setError(false)
    setBusy(false)
  }
  const run = async () => {
    const token = ++revision.current
    setBusy(true)
    setError(false)
    setOutput('')
    try {
      const result = await formatFrontendCss(source, indent)
      if (token === revision.current) setOutput(result)
    } catch {
      if (token === revision.current) setError(true)
    } finally {
      if (token === revision.current) setBusy(false)
    }
  }
  return (
    <Workbench toolId="css-formatter">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={w('input')}>
          <Field label={t('source')} htmlFor="css-source">
            <Textarea
              id="css-source"
              data-testid="css-input"
              dir="ltr"
              className="min-h-80 font-mono"
              value={source}
              onChange={(event) => {
                invalidate()
                setSource(event.target.value)
              }}
            />
          </Field>
          <Field label={t('indent')} htmlFor="css-indent">
            <select
              id="css-indent"
              data-testid="css-indent"
              className="rounded border bg-background p-2"
              value={indent}
              onChange={(event) => {
                invalidate()
                setIndent(event.target.value as typeof indent)
              }}
            >
              <option value="2">{t('spaces2')}</option>
              <option value="4">{t('spaces4')}</option>
              <option value="tab">{t('tabs')}</option>
            </select>
          </Field>
          <div className="flex gap-2">
            <Button
              data-testid="css-format"
              disabled={busy || !source.trim()}
              onClick={run}
            >
              {w('format')}
            </Button>
            <Button
              data-testid="css-clear"
              variant="outline"
              onClick={() => {
                invalidate()
                setSource('')
              }}
            >
              {w('clear')}
            </Button>
          </div>
          <ErrorMessage>{error ? t('syntaxError') : null}</ErrorMessage>
        </Panel>
        <Panel title={w('output')}>
          <Output value={output} filename="formatted.css" />
        </Panel>
      </div>
    </Workbench>
  )
}
