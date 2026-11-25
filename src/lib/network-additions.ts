import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { load, dump, JSON_SCHEMA } from 'js-yaml'
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser'

export class NetworkToolError extends Error {
  constructor(public code: string) {
    super(code)
  }
}
const fail = (code: string): never => {
  throw new NetworkToolError(code)
}

/** Synchronous Ajv compilation never loads remote references. Only draft-07 is offered. */
export function validateJsonSchema(schemaText: string, dataText: string) {
  let schema: unknown, data: unknown
  try {
    schema = JSON.parse(schemaText)
  } catch {
    return fail('schemaError')
  }
  try {
    data = JSON.parse(dataText)
  } catch {
    return fail('dataError')
  }
  try {
    const ajv = new Ajv({
      allErrors: true,
      strict: false,
      validateFormats: true,
    })
    addFormats(ajv)
    const validate = ajv.compile(schema as object | boolean)
    if ('$async' in validate && validate.$async) return fail('schemaError')
    const valid = validate(data)
    return {
      valid: !!valid,
      errors: (validate.errors ?? []).map((error) => ({
        path: error.instancePath || '/',
        keyword: error.keyword,
        details: error.params,
      })),
    }
  } catch {
    return fail('schemaError')
  }
}

export interface UrlParts {
  protocol: string
  host: string
  port: string
  path: string
  fragment: string
  params: [string, string][]
}
function checkEncoding(value: string) {
  try {
    decodeURIComponent(value)
  } catch {
    fail('encodingError')
  }
}
export function parseNetworkUrl(input: string): UrlParts {
  checkEncoding(input)
  try {
    if (
      !/^https?:\/\//i.test(input.trim()) ||
      /[\u0000-\u0020\\]/.test(input.trim().split(/[?#]/)[0])
    )
      return fail('urlError')
    const url = new URL(input)
    if (url.username || url.password) return fail('urlError')
    return {
      protocol: url.protocol.slice(0, -1),
      host: url.hostname,
      port: url.port,
      path: url.pathname,
      fragment: url.hash.slice(1),
      params: [...url.searchParams.entries()],
    }
  } catch {
    return fail('urlError')
  }
}
export function rebuildNetworkUrl(parts: UrlParts): string {
  if (
    !/^https?$/.test(parts.protocol) ||
    !/^(\[[\da-f:.]+\]|[^:\s/?#@\\]+)$/i.test(parts.host) ||
    (parts.port && (!/^\d+$/.test(parts.port) || +parts.port > 65535))
  )
    return fail('urlError')
  checkEncoding(parts.path)
  checkEncoding(parts.fragment)
  if (/[?#]/.test(parts.path) || parts.fragment.includes('#'))
    return fail('urlError')
  try {
    const url = new URL(
      `${parts.protocol}://${parts.host}${parts.port ? `:${parts.port}` : ''}/`,
    )
    url.pathname = parts.path.startsWith('/') ? parts.path : `/${parts.path}`
    url.hash = parts.fragment
    for (const [key, value] of parts.params) url.searchParams.append(key, value)
    return url.href
  } catch {
    return fail('urlError')
  }
}

export function formatNetworkYaml(input: string) {
  if (!input.trim()) return fail('yamlError')
  try {
    const parsed: unknown = load(input, { schema: JSON_SCHEMA })
    const visited = new Set<object>()
    const inspect = (value: unknown) => {
      if (
        typeof value === 'number' &&
        (!Number.isFinite(value) ||
          (Number.isInteger(value) && !Number.isSafeInteger(value)))
      )
        fail('precisionError')
      if (value && typeof value === 'object' && !visited.has(value)) {
        visited.add(value)
        Object.values(value).forEach(inspect)
      }
    }
    inspect(parsed)
    return dump(parsed, {
      schema: JSON_SCHEMA,
      indent: 2,
      lineWidth: -1,
      noRefs: false,
      sortKeys: false,
    })
  } catch (error) {
    if (error instanceof NetworkToolError) throw error
    return fail('yamlError')
  }
}

const xmlOptions = {
  preserveOrder: true,
  ignoreAttributes: false,
  trimValues: false,
  parseTagValue: false,
  parseAttributeValue: false,
  commentPropName: '#comment',
  cdataPropName: '#cdata',
  processEntities: false,
  ignoreDeclaration: false,
  ignorePiTags: false,
}
type XmlNode = Record<string, unknown>
function xmlCharacter(code: number) {
  return (
    code === 9 ||
    code === 10 ||
    code === 13 ||
    (code >= 32 && code <= 0xd7ff) ||
    (code >= 0xe000 && code <= 0xfffd) ||
    (code >= 0x10000 && code <= 0x10ffff)
  )
}
function validateXmlText(text: string, attribute = false) {
  if (
    (!attribute && text.includes(']]>')) ||
    /&(?!(?:amp|lt|gt|apos|quot|#\d+|#x[\da-fA-F]+);)/.test(text)
  )
    fail('xmlError')
  for (const reference of text.matchAll(/&#(x[\da-fA-F]+|\d+);/g)) {
    const code = reference[1].startsWith('x')
      ? parseInt(reference[1].slice(1), 16)
      : Number(reference[1])
    if (!xmlCharacter(code)) fail('xmlError')
  }
}
/** Preserve every text node (including whitespace), comments, CDATA and attribute values. */
export function formatNetworkXml(input: string, pretty = true): string {
  if (
    !input.trim() ||
    /<!DOCTYPE/.test(
      input.replace(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>/g, ''),
    )
  )
    return fail('xmlError')
  if (XMLValidator.validate(input, { allowBooleanAttributes: false }) !== true)
    return fail('xmlError')
  for (const character of input)
    if (!xmlCharacter(character.codePointAt(0)!)) return fail('xmlError')
  try {
    const nodes = new XMLParser(xmlOptions).parse(input) as XmlNode[]
    const roots = nodes.filter((node) =>
      Object.keys(node).some(
        (key) => key !== ':@' && !key.startsWith('?') && !key.startsWith('#'),
      ),
    )
    if (
      roots.length !== 1 ||
      nodes.some(
        (node) => typeof node['#text'] === 'string' && node['#text'].trim(),
      )
    )
      return fail('xmlError')
    function validateNodes(items: XmlNode[]) {
      for (const item of items) {
        for (const value of Object.values(
          (item[':@'] ?? {}) as Record<string, string>,
        ))
          validateXmlText(value, true)
        for (const [tag, children] of Object.entries(item)) {
          if (tag === '#text') validateXmlText(String(children))
          else if (Array.isArray(children) && !tag.startsWith('#'))
            validateNodes(children)
        }
      }
    }
    validateNodes(nodes)
    const builder = new XMLBuilder({
      ...xmlOptions,
      format: false,
      suppressEmptyNode: false,
    })
    function decorate(
      items: XmlNode[],
      depth: number,
      preserve = false,
    ): XmlNode[] {
      const hasText = items.some((item) => '#text' in item || '#cdata' in item)
      const mapped = items.map((item) => {
        const tag = Object.keys(item).find((key) => key !== ':@')!
        const children = item[tag]
        if (
          !Array.isArray(children) ||
          tag.startsWith('#') ||
          tag.startsWith('?')
        )
          return item
        const attrs = item[':@'] as Record<string, string> | undefined
        const keep =
          hasText || preserve || attrs?.['@_xml:space'] === 'preserve'
        return { ...item, [tag]: decorate(children, depth + 1, keep) }
      })
      if (!pretty || preserve || hasText || !mapped.length) return mapped
      const result: XmlNode[] = []
      mapped.forEach((node, index) => {
        if (depth || index) result.push({ '#text': `\n${'  '.repeat(depth)}` })
        result.push(node)
      })
      if (depth) result.push({ '#text': `\n${'  '.repeat(depth - 1)}` })
      return result
    }
    return builder.build(decorate(nodes, 0)) as string
  } catch {
    return fail('xmlError')
  }
}

export function ipv4Number(input: string): number {
  const parts = input.split('.')
  if (
    parts.length !== 4 ||
    parts.some((p) => !/^(0|[1-9]\d{0,2})$/.test(p) || +p > 255)
  )
    return fail('cidrError')
  return parts.reduce((value, p) => value * 256 + +p, 0)
}
export function ipv4String(value: number) {
  return [24, 16, 8, 0]
    .map((shift) => Math.floor(value / 2 ** shift) % 256)
    .join('.')
}
export function calculateSubnet(input: string, member = '') {
  const match = /^(.*)\/(0|[1-9]\d?)$/.exec(input.trim())
  if (!match || +match[2] > 32) return fail('cidrError')
  const ip = ipv4Number(match[1]),
    prefix = +match[2],
    total = 2 ** (32 - prefix)
  const network = Math.floor(ip / total) * total,
    broadcast = network + total - 1
  const usable = prefix >= 31 ? total : total - 2
  const memberNumber = member.trim() ? ipv4Number(member.trim()) : undefined
  return {
    network: ipv4String(network),
    broadcast: ipv4String(broadcast),
    mask: ipv4String(2 ** 32 - total),
    first: ipv4String(network + (prefix < 31 ? 1 : 0)),
    last: ipv4String(broadcast - (prefix < 31 ? 1 : 0)),
    total,
    usable,
    contains:
      memberNumber === undefined
        ? null
        : memberNumber >= network && memberNumber <= broadcast,
  }
}

export function convertInteger(
  input: string,
  base: number,
): Record<number, string> {
  if (![2, 8, 10, 16].includes(base)) return fail('numberError')
  const clean = input.trim(),
    negative = clean.startsWith('-'),
    digits = clean.replace(/^[+-]/, '')
  const patterns: Record<number, RegExp> = {
    2: /^[01]+$/,
    8: /^[0-7]+$/,
    10: /^\d+$/,
    16: /^[\da-f]+$/i,
  }
  if (!patterns[base].test(digits)) return fail('numberError')
  const value =
    BigInt(
      (base === 10
        ? ''
        : ({ 2: '0b', 8: '0o', 16: '0x' } as Record<number, string>)[base]) +
        digits,
    ) * (negative ? -1n : 1n)
  return Object.fromEntries(
    [2, 8, 10, 16].map((radix) => [radix, value.toString(radix)]),
  )
}
export const byteUnits = [
  'B',
  'kB',
  'MB',
  'GB',
  'TB',
  'KiB',
  'MiB',
  'GiB',
  'TiB',
] as const
export function byteFactor(unit: string) {
  const si = ['B', 'kB', 'MB', 'GB', 'TB'].indexOf(unit)
  if (si >= 0) return 1000n ** BigInt(si)
  const iec = ['B', 'KiB', 'MiB', 'GiB', 'TiB'].indexOf(unit)
  if (iec < 0) return fail('bytesError')
  return 1024n ** BigInt(iec)
}
export function convertByteUnits(input: string, from: string, to: string) {
  if (!/^\d+(\.\d+)?$/.test(input.trim())) return fail('bytesError')
  const [integer, fraction = ''] = input.trim().split('.')
  const numerator = BigInt(integer + fraction) * byteFactor(from)
  const denominator = 10n ** BigInt(fraction.length) * byteFactor(to)
  let result = (numerator / denominator).toString(),
    remainder = numerator % denominator
  if (remainder) result += '.'
  while (remainder) {
    remainder *= 10n
    result += (remainder / denominator).toString()
    remainder %= denominator
  }
  return result
}

export async function parseCertificate(pem: string, now = new Date()) {
  if (
    !/^\s*-----BEGIN CERTIFICATE-----[\s\S]+-----END CERTIFICATE-----\s*$/.test(
      pem,
    ) ||
    pem.match(/BEGIN CERTIFICATE/g)?.length !== 1
  )
    return fail('certificateError')
  try {
    await import('reflect-metadata')
    const { X509Certificate, SubjectAlternativeNameExtension } =
      await import('@peculiar/x509')
    const cert = new X509Certificate(pem)
    const san = cert.getExtension(SubjectAlternativeNameExtension)
    const fingerprint = Array.from(
      new Uint8Array(await cert.getThumbprint('SHA-256')),
      (b) => b.toString(16).padStart(2, '0'),
    )
      .join(':')
      .toUpperCase()
    return {
      subject: cert.subject,
      issuer: cert.issuer,
      serial: cert.serialNumber,
      san:
        san?.names.items
          .map((name) => `${name.type}: ${name.value}`)
          .join('\n') ?? '',
      notBefore: cert.notBefore.toISOString(),
      notAfter: cert.notAfter.toISOString(),
      fingerprint,
      state:
        now < cert.notBefore
          ? 'notYetValid'
          : now > cert.notAfter
            ? 'expired'
            : 'valid',
    }
  } catch {
    return fail('certificateError')
  }
}
