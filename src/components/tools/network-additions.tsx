import { useEffect, useRef, useState, type ReactNode } from 'react'
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
  NetworkToolError,
  parseNetworkUrl,
  rebuildNetworkUrl,
  formatNetworkYaml,
  formatNetworkXml,
  calculateSubnet,
  convertInteger,
  convertByteUnits,
  byteUnits,
  parseCertificate,
  type UrlParts,
} from '@/lib/network-additions'
import { NETWORK_CERTIFICATE_EXAMPLE } from '@/lib/network-certificate-example'
import {
  startSchemaValidation,
  type SchemaValidationJob,
} from '@/lib/network-schema-client'

function useNetwork(toolId: string) {
  const t = useTranslations(`tools.${toolId}`),
    w = useTranslations('workbench')
  const [output, setOutput] = useState(''),
    [error, setError] = useState('')
  const sequence = useRef(0)
  useEffect(
    () => () => {
      sequence.current++
    },
    [],
  )
  const reset = () => {
    sequence.current++
    setOutput('')
    setError('')
  }
  const run = async (job: () => string | Promise<string>) => {
    const ticket = ++sequence.current
    setOutput('')
    setError('')
    try {
      const result = await job()
      if (ticket === sequence.current) setOutput(result)
    } catch (e) {
      if (ticket === sequence.current)
        setError(t(e instanceof NetworkToolError ? e.code : 'error'))
    }
  }
  return { t, w, output, error, run, reset }
}
const selectClass = 'h-10 rounded-md border bg-background px-3 text-sm'
function Actions({
  run,
  example,
  clear,
  label,
}: {
  run: () => void
  example: () => void
  clear: () => void
  label?: string
}) {
  const w = useTranslations('workbench')
  return (
    <div className="flex flex-wrap gap-2">
      <Button data-testid="tool-run" onClick={run}>
        {label ?? w('run')}
      </Button>
      <Button variant="outline" data-testid="tool-example" onClick={example}>
        {w('example')}
      </Button>
      <Button variant="outline" data-testid="tool-clear" onClick={clear}>
        {w('clear')}
      </Button>
    </div>
  )
}
function Result({
  output,
  error,
  filename,
  children,
}: {
  output: string
  error: string
  filename?: string
  children?: ReactNode
}) {
  const w = useTranslations('workbench')
  return (
    <Panel title={w('result')}>
      <ErrorMessage>{error}</ErrorMessage>
      {children}
      <Output value={output} filename={filename} />
    </Panel>
  )
}
const SCHEMA = JSON.stringify(
  {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      age: { type: 'integer', minimum: 0 },
    },
    required: ['email'],
    additionalProperties: false,
  },
  null,
  2,
)
export function JsonSchemaValidator() {
  const n = useNetwork('json-schema-validator')
  const [schema, setSchema] = useState(SCHEMA)
  const [data, setData] = useState('{"email":"alice@example.com","age":30}')
  const [busy, setBusy] = useState(false)
  const task = useRef<SchemaValidationJob | null>(null)
  useEffect(
    () => () => {
      task.current?.cancel()
    },
    [],
  )
  const reset = () => {
    n.reset()
    task.current?.cancel()
    task.current = null
    setBusy(false)
  }
  const run = () => {
    reset()
    const current = startSchemaValidation(schema, data)
    task.current = current
    setBusy(true)
    void n.run(async () => {
      try {
        const result = await current.promise
        return `${n.t(result.valid ? 'valid' : 'invalid')}\n${result.errors.map((error) => `${error.path} — ${error.keyword}: ${JSON.stringify(error.details)}`).join('\n')}`
      } finally {
        if (task.current === current) {
          task.current = null
          setBusy(false)
        }
      }
    })
  }
  return (
    <Workbench toolId="json-schema-validator">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={n.w('input')}>
          <p className="text-sm text-muted-foreground">{n.t('draft')}</p>
          <Field label={n.t('schema')} htmlFor="schema-input">
            <Textarea
              id="schema-input"
              data-testid="schema-input"
              maxLength={200000}
              value={schema}
              onChange={(event) => {
                reset()
                setSchema(event.target.value)
              }}
              className="min-h-64 font-mono"
              dir="ltr"
            />
          </Field>
          <Field label={n.t('data')} htmlFor="tool-input">
            <Textarea
              id="tool-input"
              data-testid="tool-input"
              maxLength={200000}
              value={data}
              onChange={(event) => {
                reset()
                setData(event.target.value)
              }}
              className="min-h-40 font-mono"
              dir="ltr"
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button data-testid="tool-run" onClick={run} disabled={busy}>
              {n.w('validate')}
            </Button>
            <Button
              variant="outline"
              data-testid="tool-example"
              onClick={() => {
                reset()
                setSchema(SCHEMA)
                setData('{"email":"alice@example.com","age":30}')
              }}
            >
              {n.w('example')}
            </Button>
            <Button
              variant="outline"
              data-testid="tool-clear"
              onClick={() => {
                reset()
                setSchema('')
                setData('')
              }}
            >
              {n.w('clear')}
            </Button>
          </div>
        </Panel>
        <Result {...n} filename="validation.txt" />
      </div>
    </Workbench>
  )
}
const URL_EXAMPLE =
  'https://example.com:8443/docs?q=hello+world&q=two&empty=#section'
const emptyParts: UrlParts = {
  protocol: 'https',
  host: '',
  port: '',
  path: '/',
  fragment: '',
  params: [],
}
export function UrlParser() {
  const n = useNetwork('url-parser'),
    [input, setInput] = useState(URL_EXAMPLE),
    [parts, setParts] = useState<UrlParts>(emptyParts)
  const update = (key: Exclude<keyof UrlParts, 'params'>, value: string) => {
    setParts((p) => ({ ...p, [key]: value }))
    n.reset()
  }
  return (
    <Workbench toolId="url-parser">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={n.w('input')}>
          <Field label={n.t('url')} htmlFor="tool-input" hint={n.t('hint')}>
            <Input
              id="tool-input"
              data-testid="tool-input"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                n.reset()
              }}
              dir="ltr"
            />
          </Field>
          <Actions
            run={() =>
              void n.run(() => {
                const parsed = parseNetworkUrl(input)
                setParts(parsed)
                return rebuildNetworkUrl(parsed)
              })
            }
            example={() => {
              setInput(URL_EXAMPLE)
              setParts(parseNetworkUrl(URL_EXAMPLE))
              n.reset()
            }}
            clear={() => {
              setInput('')
              setParts(emptyParts)
              n.reset()
            }}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {(['protocol', 'host', 'port', 'path', 'fragment'] as const).map(
              (key) => (
                <Field key={key} label={n.t(key)} htmlFor={`url-${key}`}>
                  <Input
                    id={`url-${key}`}
                    data-testid={`url-${key}`}
                    value={parts[key]}
                    onChange={(e) => update(key, e.target.value)}
                    dir="ltr"
                  />
                </Field>
              ),
            )}
          </div>
          <Field label={n.t('params')}>
            <div className="space-y-2">
              {parts.params.map(([key, value], index) => (
                <div className="flex gap-2" key={index}>
                  <Input
                    aria-label={`${n.t('key')} ${index + 1}`}
                    data-testid={`param-key-${index}`}
                    value={key}
                    onChange={(e) => {
                      setParts((p) => ({
                        ...p,
                        params: p.params.map((pair, i) =>
                          i === index ? [e.target.value, pair[1]] : pair,
                        ),
                      }))
                      n.reset()
                    }}
                    dir="ltr"
                  />
                  <Input
                    aria-label={`${n.t('value')} ${index + 1}`}
                    data-testid={`param-value-${index}`}
                    value={value}
                    onChange={(e) => {
                      setParts((p) => ({
                        ...p,
                        params: p.params.map((pair, i) =>
                          i === index ? [pair[0], e.target.value] : pair,
                        ),
                      }))
                      n.reset()
                    }}
                    dir="ltr"
                  />
                  <Button
                    variant="outline"
                    aria-label={`${n.t('remove')} ${index + 1}`}
                    data-testid={`param-remove-${index}`}
                    onClick={() => {
                      setParts((p) => ({
                        ...p,
                        params: p.params.filter((_, i) => i !== index),
                      }))
                      n.reset()
                    }}
                  >
                    {n.t('remove')}
                  </Button>
                </div>
              ))}
            </div>
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              data-testid="param-add"
              onClick={() => {
                setParts((p) => ({ ...p, params: [...p.params, ['', '']] }))
                n.reset()
              }}
            >
              {n.t('add')}
            </Button>
            <Button
              data-testid="url-rebuild"
              onClick={() => void n.run(() => rebuildNetworkUrl(parts))}
            >
              {n.t('rebuild')}
            </Button>
          </div>
        </Panel>
        <Result {...n} filename="url.txt" />
      </div>
    </Workbench>
  )
}
export function NetworkFormatter({ kind }: { kind: 'yaml' | 'xml' }) {
  const n = useNetwork(`${kind}-formatter`),
    example =
      kind === 'yaml'
        ? 'name: Alice\nitems: [one, two]\nactive: true\n'
        : '<?xml version="1.0" encoding="UTF-8"?><root id="1"><message>Hello <b>world</b>!</message><item>two</item></root>'
  const [input, setInput] = useState(example),
    [mode, setMode] = useState('format')
  const process = () => {
    const result =
      kind === 'yaml'
        ? formatNetworkYaml(input)
        : formatNetworkXml(input, mode !== 'minify')
    return mode === 'validate' ? n.t('valid') : result
  }
  return (
    <Workbench toolId={`${kind}-formatter`}>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={n.w('input')}>
          <Field
            label={n.w('options')}
            htmlFor="formatter-mode"
            hint={n.t('hint')}
          >
            <select
              id="formatter-mode"
              data-testid="formatter-mode"
              className={selectClass}
              value={mode}
              onChange={(e) => {
                setMode(e.target.value)
                n.reset()
              }}
            >
              {[
                'format',
                ...(kind === 'xml' ? ['minify'] : []),
                'validate',
              ].map((v) => (
                <option key={v} value={v}>
                  {n.w(v)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={n.w('input')} htmlFor="tool-input">
            <Textarea
              id="tool-input"
              data-testid="tool-input"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                n.reset()
              }}
              className="min-h-96 font-mono"
              dir="ltr"
            />
          </Field>
          <Actions
            run={() => void n.run(process)}
            example={() => {
              setInput(example)
              n.reset()
            }}
            clear={() => {
              setInput('')
              n.reset()
            }}
          />
        </Panel>
        <Result {...n} filename={`result.${kind}`} />
      </div>
    </Workbench>
  )
}
export function SubnetCalculator() {
  const n = useNetwork('subnet-calculator'),
    [input, setInput] = useState('192.168.1.42/24'),
    [member, setMember] = useState('192.168.1.100')
  return (
    <Workbench toolId="subnet-calculator">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={n.w('input')}>
          <Field label={n.t('cidr')} htmlFor="tool-input" hint={n.t('hint')}>
            <Input
              id="tool-input"
              data-testid="tool-input"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                n.reset()
              }}
              dir="ltr"
            />
          </Field>
          <Field label={n.t('member')} htmlFor="subnet-member">
            <Input
              id="subnet-member"
              data-testid="subnet-member"
              value={member}
              onChange={(e) => {
                setMember(e.target.value)
                n.reset()
              }}
              dir="ltr"
            />
          </Field>
          <Actions
            run={() =>
              void n.run(() => {
                const result = calculateSubnet(input, member)
                return Object.entries(result)
                  .map(
                    ([key, value]) =>
                      `${n.t(key)}: ${value === null ? '—' : typeof value === 'boolean' ? n.t(value ? 'yes' : 'no') : value}`,
                  )
                  .join('\n')
              })
            }
            example={() => {
              setInput('192.168.1.42/24')
              setMember('192.168.1.100')
              n.reset()
            }}
            clear={() => {
              setInput('')
              setMember('')
              n.reset()
            }}
          />
        </Panel>
        <Result {...n} filename="subnet.txt" />
      </div>
    </Workbench>
  )
}
export function NumberBaseConverter() {
  const n = useNetwork('number-base-converter'),
    [input, setInput] = useState('9007199254740993'),
    [base, setBase] = useState(10)
  const [amount, setAmount] = useState('1'),
    [from, setFrom] = useState('MiB'),
    [to, setTo] = useState('MB')
  const units = useNetwork('number-base-converter')
  return (
    <Workbench toolId="number-base-converter">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={n.t('integers')}>
          <Field label={n.t('base')} htmlFor="number-base">
            <select
              id="number-base"
              data-testid="number-base"
              className={selectClass}
              value={base}
              onChange={(e) => {
                setBase(+e.target.value)
                n.reset()
              }}
            >
              {[2, 8, 10, 16].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={n.w('input')}
            htmlFor="tool-input"
            hint={n.t('integerHint')}
          >
            <Input
              id="tool-input"
              data-testid="tool-input"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                n.reset()
              }}
              dir="ltr"
            />
          </Field>
          <Actions
            run={() =>
              void n.run(() =>
                Object.entries(convertInteger(input, base))
                  .map(([radix, value]) => `${radix}: ${value}`)
                  .join('\n'),
              )
            }
            example={() => {
              setInput('9007199254740993')
              setBase(10)
              n.reset()
            }}
            clear={() => {
              setInput('')
              n.reset()
            }}
          />
          <ErrorMessage>{n.error}</ErrorMessage>
          <Output value={n.output} filename="bases.txt" />
        </Panel>
        <Panel title={n.t('bytes')}>
          <Field
            label={n.w('input')}
            htmlFor="bytes-input"
            hint={n.t('bytesHint')}
          >
            <Input
              id="bytes-input"
              data-testid="bytes-input"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                units.reset()
              }}
              dir="ltr"
            />
          </Field>
          {(
            [
              ['from', from, setFrom],
              ['to', to, setTo],
            ] as const
          ).map(([key, value, setter]) => (
            <Field key={key} label={n.t(key)} htmlFor={`bytes-${key}`}>
              <select
                id={`bytes-${key}`}
                data-testid={`bytes-${key}`}
                value={value}
                className={selectClass}
                onChange={(e) => {
                  setter(e.target.value)
                  units.reset()
                }}
              >
                {byteUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </Field>
          ))}
          <Button
            data-testid="bytes-run"
            onClick={() =>
              void units.run(
                () => `${convertByteUnits(amount, from, to)} ${to}`,
              )
            }
          >
            {n.w('run')}
          </Button>
          <ErrorMessage>{units.error}</ErrorMessage>
          <div data-testid="bytes-result">
            <Output value={units.output} filename="bytes.txt" />
          </div>
        </Panel>
      </div>
    </Workbench>
  )
}
export function CertificateParser() {
  const n = useNetwork('certificate-parser'),
    [input, setInput] = useState(NETWORK_CERTIFICATE_EXAMPLE)
  return (
    <Workbench toolId="certificate-parser">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={n.w('input')}>
          <Field label={n.t('pem')} htmlFor="tool-input" hint={n.t('hint')}>
            <Textarea
              id="tool-input"
              data-testid="tool-input"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                n.reset()
              }}
              className="min-h-96 font-mono"
              dir="ltr"
            />
          </Field>
          <Actions
            run={() =>
              void n.run(async () => {
                const cert = await parseCertificate(input)
                return Object.entries(cert)
                  .map(
                    ([key, value]) =>
                      `${n.t(key)}: ${key === 'state' ? n.t(value) : value || '—'}`,
                  )
                  .join('\n')
              })
            }
            example={() => {
              setInput(NETWORK_CERTIFICATE_EXAMPLE)
              n.reset()
            }}
            clear={() => {
              setInput('')
              n.reset()
            }}
          />
        </Panel>
        <Result {...n} filename="certificate.txt" />
      </div>
    </Workbench>
  )
}
