import { useRef, useState, type FormEvent } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  calculateIpv6Subnet,
  Ipv6SubnetError,
  IPV6_MAX_INPUT,
} from '@/lib/ipv6-subnet'
import { ErrorMessage, Field, Output, Panel, Workbench } from './workbench'

export function Ipv6SubnetCalculator() {
  const t = useTranslations('ipv6Subnet')
  const w = useTranslations('workbench')
  const [input, setInput] = useState('')
  const [result, setResult] = useState<ReturnType<typeof calculateIpv6Subnet>>()
  const [error, setError] = useState<Ipv6SubnetError>()
  const inputRef = useRef<HTMLInputElement>(null)
  function reset(value: string) {
    setInput(value)
    setResult(undefined)
    setError(undefined)
  }
  function calculate(event: FormEvent) {
    event.preventDefault()
    try {
      setResult(calculateIpv6Subnet(input))
      setError(undefined)
    } catch (caught) {
      if (!(caught instanceof Ipv6SubnetError)) throw caught
      setResult(undefined)
      setError(caught)
      inputRef.current?.focus()
    }
  }
  const output = result
    ? Object.entries(result)
        .map(([key, value]) => `${t(key)}: ${value}`)
        .join('\n')
    : ''
  return (
    <Workbench toolId="ipv6-subnet-calculator">
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title={w('input')}>
          <form className="space-y-4" onSubmit={calculate} noValidate>
            <Field label={t('cidr')} htmlFor="ipv6-cidr">
              <Input
                id="ipv6-cidr"
                ref={inputRef}
                value={input}
                dir="ltr"
                spellCheck={false}
                autoCapitalize="none"
                autoComplete="off"
                className="font-mono"
                placeholder="2001:db8:1234:5678::abcd/64"
                aria-invalid={!!error}
                aria-describedby={`ipv6-hint${error ? ' ipv6-error' : ''}`}
                onChange={(event) => reset(event.target.value)}
              />
            </Field>
            <p id="ipv6-hint" className="text-sm text-muted-foreground">
              {t('hint', { limit: IPV6_MAX_INPUT })}
            </p>
            <div id="ipv6-error">
              <ErrorMessage>
                {error && t(error.code, { limit: IPV6_MAX_INPUT })}
              </ErrorMessage>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{t('calculate')}</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => reset('2001:db8:1234:5678::abcd/64')}
              >
                {w('example')}
              </Button>
              <Button type="button" variant="ghost" onClick={() => reset('')}>
                {w('clear')}
              </Button>
            </div>
          </form>
        </Panel>
        <Panel title={w('result')}>
          <div aria-live="polite">
            {result ? (
              <Output
                key={output}
                value={output}
                filename="ipv6-subnet.txt"
                label={t('output')}
              />
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
