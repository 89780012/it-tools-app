import { useRef, useState, type FormEvent } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Base32Error,
  convertBase32,
  MAX_BASE32_INPUT,
  type Base32Options,
  type Base32Result,
} from '@/lib/base32'
import { ErrorMessage, Field, Output, Panel, Workbench } from './workbench'

const defaults: Base32Options = {
  operation: 'encode',
  representation: 'text',
  variant: 'standard',
  padding: true,
}
const selectClass = 'h-10 w-full rounded-md border bg-background px-3 text-sm'

export function Base32EncoderDecoder() {
  const t = useTranslations('base32')
  const w = useTranslations('workbench')
  const [input, setInput] = useState('')
  const [options, setOptions] = useState(defaults)
  const [result, setResult] = useState<Base32Result>()
  const [error, setError] = useState<Base32Error>()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  function invalidate() {
    setResult(undefined)
    setError(undefined)
  }
  function update(patch: Partial<Base32Options>) {
    setOptions({ ...options, ...patch })
    invalidate()
  }
  function convert(event: FormEvent) {
    event.preventDefault()
    try {
      setResult(convertBase32(input, options))
      setError(undefined)
    } catch (caught) {
      if (!(caught instanceof Base32Error)) throw caught
      setResult(undefined)
      setError(caught)
      inputRef.current?.focus()
    }
  }
  return (
    <Workbench toolId="base32-encoder-decoder">
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title={w('input')}>
          <form className="space-y-4" onSubmit={convert}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('operation')} htmlFor="base32-operation">
                <select
                  id="base32-operation"
                  className={selectClass}
                  value={options.operation}
                  onChange={(e) =>
                    update({
                      operation: e.target.value as Base32Options['operation'],
                    })
                  }
                >
                  <option value="encode">{t('encode')}</option>
                  <option value="decode">{t('decode')}</option>
                </select>
              </Field>
              <Field label={t('variant')} htmlFor="base32-variant">
                <select
                  id="base32-variant"
                  className={selectClass}
                  value={options.variant}
                  onChange={(e) =>
                    update({
                      variant: e.target.value as Base32Options['variant'],
                    })
                  }
                >
                  <option value="standard">Base32 (A–Z, 2–7)</option>
                  <option value="hex">Base32hex (0–9, A–V)</option>
                </select>
              </Field>
            </div>
            <Field label={t('representation')} htmlFor="base32-representation">
              <select
                id="base32-representation"
                className={selectClass}
                value={options.representation}
                onChange={(e) =>
                  update({
                    representation: e.target
                      .value as Base32Options['representation'],
                  })
                }
              >
                <option value="text">{t('text')}</option>
                <option value="hex">{t('hex')}</option>
              </select>
              <p className="text-sm text-muted-foreground">
                {t('representationHint')}
              </p>
            </Field>
            {options.operation === 'encode' && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={options.padding}
                  onChange={(e) => update({ padding: e.target.checked })}
                />
                {t('padding')}
              </label>
            )}
            <Field label={t('data')} htmlFor="base32-input">
              <Textarea
                id="base32-input"
                ref={inputRef}
                dir="auto"
                spellCheck={false}
                className="min-h-64 font-mono text-sm"
                value={input}
                aria-invalid={!!error}
                aria-describedby={`base32-hint${error ? ' base32-error' : ''}`}
                onChange={(e) => {
                  setInput(e.target.value)
                  invalidate()
                }}
              />
              <p id="base32-hint" className="text-sm text-muted-foreground">
                {t('hint', { limit: MAX_BASE32_INPUT })}
              </p>
            </Field>
            <div id="base32-error">
              <ErrorMessage>
                {error && t(error.code, { limit: MAX_BASE32_INPUT })}
              </ErrorMessage>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{t('convert')}</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setInput(
                    options.operation === 'decode'
                      ? options.variant === 'standard'
                        ? 'MZXW6YTBOI======'
                        : 'CPNMUOJ1E8======'
                      : options.representation === 'text'
                        ? 'foobar'
                        : '66 6f 6f 62 61 72',
                  )
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
                <p className="text-sm" data-testid="base32-bytes">
                  {t('byteCount', { count: result.bytes })}
                </p>
                <Output
                  key={`${options.operation}-${options.representation}-${options.variant}-${result.output}`}
                  value={result.output}
                  label={t('output')}
                  filename={
                    options.operation === 'encode'
                      ? 'base32.txt'
                      : options.representation === 'hex'
                        ? 'decoded.hex.txt'
                        : 'decoded.txt'
                  }
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
