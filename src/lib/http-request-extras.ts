import { type EnhancedRequest, validateEnhancedRequest } from './curl-enhanced'
export interface RequestAuth {
  type: 'none' | 'bearer' | 'basic'
  token: string
  username: string
  password: string
}
export interface RequestForm {
  fields: [string, string][]
  files: { field: string; file: File }[]
}
export function authorizeRequest(
  request: EnhancedRequest,
  auth: RequestAuth,
): EnhancedRequest {
  if (auth.type === 'none') return request
  const headers = Object.fromEntries(
    Object.entries(request.headers).filter(
      ([key]) => key.toLowerCase() !== 'authorization',
    ),
  )
  if (auth.type === 'bearer') headers.Authorization = `Bearer ${auth.token}`
  else {
    if (auth.username.includes(':')) throw new Error('invalid')
    const bytes = new TextEncoder().encode(`${auth.username}:${auth.password}`)
    headers.Authorization = `Basic ${btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))}`
  }
  return validateEnhancedRequest({ ...request, headers })
}
export function formRequest(
  request: EnhancedRequest,
  fields: [string, string][],
) {
  if (fields.some(([key]) => !key)) throw new Error('invalid')
  const headers = Object.fromEntries(
    Object.entries(request.headers).filter(
      ([key]) => key.toLowerCase() !== 'content-type',
    ),
  )
  headers['Content-Type'] = 'application/x-www-form-urlencoded'
  return validateEnhancedRequest({
    ...request,
    headers,
    data: new URLSearchParams(fields).toString(),
  })
}
export function shellQuote(value: string) {
  return `'${value.replaceAll("'", "'\\''")}'`
}
export function exportCurl(request: EnhancedRequest, form?: RequestForm) {
  validateEnhancedRequest(request)
  const lines = [
    `curl --request ${shellQuote(request.method)} ${shellQuote(request.url)}`,
  ]
  for (const [key, value] of Object.entries(request.headers)) {
    if (form && key.toLowerCase() === 'content-type') continue
    lines.push(`  --header ${shellQuote(`${key}: ${value}`)}`)
  }
  if (!['GET', 'HEAD'].includes(request.method)) {
    if (form) {
      for (const [key, value] of form.fields) {
        if (!key || /[=\r\n]/.test(key)) throw new Error('invalid')
        lines.push(`  --form-string ${shellQuote(`${key}=${value}`)}`)
      }
      for (const { field, file } of form.files) {
        if (/[\r\n"\\]/.test(file.name) || /[=\r\n"\\]/.test(field) || !field)
          throw new Error('invalid')
        lines.push(`  --form ${shellQuote(`${field}=@"${file.name}"`)}`)
      }
    } else if (request.data !== undefined)
      lines.push(`  --data-raw ${shellQuote(request.data)}`)
  }
  return lines.join(' \\\n')
}
export async function multipartPayload(
  request: EnhancedRequest,
  form: RequestForm,
) {
  if (form.files.length > 20 || form.fields.length > 100)
    throw new Error('tooLarge')
  if (
    form.files.reduce((size, value) => size + value.file.size, 0) >
    8 * 1024 * 1024
  )
    throw new Error('tooLarge')
  if (
    form.fields.some(([key]) => !key) ||
    form.files.some(({ field }) => !field)
  )
    throw new Error('invalid')
  const data = new FormData()
  data.append('request', JSON.stringify(request))
  data.append('fields', JSON.stringify(form.fields))
  data.append(
    'fileFields',
    JSON.stringify(form.files.map(({ field }) => field)),
  )
  for (const { file } of form.files) data.append('files', file, file.name)
  return data
}
