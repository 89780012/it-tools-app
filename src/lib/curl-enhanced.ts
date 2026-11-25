export interface EnhancedRequest {
  url: string
  method: string
  headers: Record<string, string>
  data?: string
}
export function curlTokens(command: string): string[] {
  if (command.length > 100000) throw new Error('invalid')
  const tokens: string[] = []
  let token = '',
    quote = '',
    started = false
  for (let i = 0; i < command.length; i++) {
    const c = command[i]
    if (c === '\\' && quote !== "'") {
      const next = command[++i]
      if (next === undefined) throw new Error('invalid')
      if (next === '\n') continue
      if (next === '\r' && command[i + 1] === '\n') {
        i++
        continue
      }
      token +=
        quote === '"' && !['"', '\\', '$', '`'].includes(next)
          ? `\\${next}`
          : next
      started = true
    } else if (quote) {
      if (c === quote) quote = ''
      else token += c
    } else if (c === "'" || c === '"') {
      quote = c
      started = true
    } else if (/\s/.test(c)) {
      if (started) {
        tokens.push(token)
        token = ''
        started = false
      }
    } else {
      token += c
      started = true
    }
  }
  if (quote) throw new Error('invalid')
  if (started) tokens.push(token)
  return tokens
}
export function validateEnhancedRequest(
  request: EnhancedRequest,
): EnhancedRequest {
  const url = new URL(request.url)
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    !/^[A-Z]+$/.test(request.method) ||
    ['CONNECT', 'TRACE'].includes(request.method) ||
    request.url.length > 10000 ||
    (request.data?.length ?? 0) > 100000
  )
    throw new Error('invalid')
  if (
    Object.keys(request.headers).length > 100 ||
    Array.from(url.searchParams).length > 100
  )
    throw new Error('invalid')
  for (const [key, value] of Object.entries(request.headers))
    if (!/^[!#$%&'*+.^_`|~\w-]+$/.test(key) || /[\r\n]/.test(value))
      throw new Error('invalid')
  return request
}
export function parseEnhancedCurl(command: string): EnhancedRequest {
  const args = curlTokens(command)
  if (args.shift()?.toLowerCase() !== 'curl') throw new Error('invalid')
  const result: EnhancedRequest = { url: '', method: 'GET', headers: {} }
  let explicitMethod = false,
    get = false,
    jsonBody = false
  const bodies: string[] = []
  for (let i = 0; i < args.length; i++) {
    let arg = args[i],
      attached: string | undefined
    if (arg.startsWith('--') && arg.includes('=')) {
      const at = arg.indexOf('=')
      attached = arg.slice(at + 1)
      arg = arg.slice(0, at)
    } else if (/^-[XHd].+/.test(arg)) {
      attached = arg.slice(2)
      arg = arg.slice(0, 2)
    }
    const value = () => {
      const v = attached ?? args[++i]
      if (v === undefined) throw new Error('invalid')
      return v
    }
    if (['-X', '--request'].includes(arg)) {
      result.method = value().toUpperCase()
      explicitMethod = true
    } else if (['-H', '--header'].includes(arg)) {
      const h = value(),
        at = h.indexOf(':')
      if (at < 1) throw new Error('invalid')
      result.headers[h.slice(0, at).trim()] = h.slice(at + 1).trim()
    } else if (
      ['-d', '--data', '--data-raw', '--data-binary', '--json'].includes(arg)
    ) {
      const body = value()
      if (body.startsWith('@') && arg !== '--data-raw')
        throw new Error('invalid')
      bodies.push(body)
      if (arg === '--json') jsonBody = true
    } else if (arg === '--url') result.url = value()
    else if (['-G', '--get'].includes(arg)) get = true
    else if (['-I', '--head'].includes(arg)) {
      result.method = 'HEAD'
      explicitMethod = true
    } else if (
      [
        '-L',
        '--location',
        '-s',
        '--silent',
        '-S',
        '--show-error',
        '--compressed',
        '-i',
        '--include',
      ].includes(arg)
    ) {
      /* Presentation flags do not affect generated request. */
    } else if (arg.startsWith('-') || result.url) throw new Error('invalid')
    else result.url = arg
  }
  if (bodies.length) {
    result.data = bodies.join('&')
    if (!explicitMethod) result.method = 'POST'
  }
  if (get) {
    const url = new URL(result.url)
    for (const [key, value] of new URLSearchParams(result.data))
      url.searchParams.append(key, value)
    result.url = url.toString()
    delete result.data
    if (!explicitMethod) result.method = 'GET'
  }
  const hasHeader = (name: string) =>
    Object.keys(result.headers).some((key) => key.toLowerCase() === name)
  if (result.data !== undefined && !hasHeader('content-type'))
    result.headers['Content-Type'] = jsonBody
      ? 'application/json'
      : 'application/x-www-form-urlencoded'
  if (jsonBody && !hasHeader('accept'))
    result.headers.Accept = 'application/json'
  return validateEnhancedRequest(result)
}
const json = (value: unknown) => JSON.stringify(value, null, 2)
const php = (value: string) =>
  `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
const go = (value: string) => JSON.stringify(value)
export function generateEnhancedCode(
  request: EnhancedRequest,
  language: string,
): string {
  validateEnhancedRequest(request)
  const body = !['GET', 'HEAD'].includes(request.method)
    ? request.data
    : undefined
  if (language === 'python')
    return `import requests\n\nresponse = requests.request(${json(request.method)}, ${json(request.url)}, headers=${json(request.headers)}, data=${json(body ?? '')})\nprint(response.status_code)\nprint(response.text)\n`
  if (language === 'nodejs')
    return `const axios = require('axios');\n\naxios(${json({ method: request.method, url: request.url, headers: request.headers, data: body })}).then(response => console.log(response.data)).catch(console.error);\n`
  if (language === 'php')
    return `<?php\n$curl = curl_init();\ncurl_setopt_array($curl, [\n  CURLOPT_URL => ${php(request.url)},\n  CURLOPT_CUSTOMREQUEST => ${php(request.method)},\n  CURLOPT_RETURNTRANSFER => true,\n  CURLOPT_HTTPHEADER => [${Object.entries(
      request.headers,
    )
      .map(([k, v]) => php(`${k}: ${v}`))
      .join(
        ', ',
      )}],\n${body !== undefined ? `  CURLOPT_POSTFIELDS => ${php(body)},\n` : ''}]);\n$response = curl_exec($curl);\nif ($response === false) { throw new Exception(curl_error($curl)); }\ncurl_close($curl);\necho $response;\n`
  if (language === 'go')
    return `package main\n\nimport (\n "fmt"\n "io"\n "net/http"\n${body !== undefined ? ' "strings"\n' : ''})\n\nfunc main() {\n req, err := http.NewRequest(${go(request.method)}, ${go(request.url)}, ${body !== undefined ? `strings.NewReader(${go(body)})` : 'nil'})\n if err != nil { panic(err) }\n${Object.entries(
      request.headers,
    )
      .map(([k, v]) => ` req.Header.Set(${go(k)}, ${go(v)})`)
      .join(
        '\n',
      )}\n res, err := http.DefaultClient.Do(req)\n if err != nil { panic(err) }\n defer res.Body.Close()\n body, err := io.ReadAll(res.Body)\n if err != nil { panic(err) }\n fmt.Println(string(body))\n}\n`
  return `fetch(${json(request.url)}, ${json({ method: request.method, headers: request.headers, body })})\n  .then(response => response.text())\n  .then(console.log)\n  .catch(console.error);\n`
}
/** Conservative storage: drop all header/query values and the whole body, since arbitrary names can carry secrets. */
export function sanitizeEnhancedTemplate(
  request: EnhancedRequest,
): EnhancedRequest {
  validateEnhancedRequest(request)
  const url = new URL(request.url)
  url.search = ''
  url.hash = ''
  // Paths can also contain credentials. Store only the origin; users refill the path.
  return { url: url.origin, method: request.method, headers: {} }
}
export const ENHANCED_TEMPLATE_KEY = 'toolkit-curl-safe-templates-v1'
