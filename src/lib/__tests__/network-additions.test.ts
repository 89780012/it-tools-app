// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { X509Certificate as NodeCertificate, webcrypto } from 'node:crypto'
import { load, JSON_SCHEMA } from 'js-yaml'
import { XMLParser } from 'fast-xml-parser'
import {
  validateJsonSchema,
  parseNetworkUrl,
  rebuildNetworkUrl,
  formatNetworkYaml,
  formatNetworkXml,
  calculateSubnet,
  convertInteger,
  convertByteUnits,
  parseCertificate,
} from '../network-additions'
import { NETWORK_CERTIFICATE_EXAMPLE } from '../network-certificate-example'

const schema = JSON.stringify({
  type: 'object',
  properties: {
    user: {
      type: 'object',
      properties: { email: { type: 'string', format: 'email' } },
      required: ['email'],
    },
  },
  required: ['user'],
})
describe('draft-07 JSON schema validation', () => {
  it('accepts data, local references, and boolean schemas', () => {
    expect(
      validateJsonSchema(schema, '{"user":{"email":"a@example.com"}}').valid,
    ).toBe(true)
    expect(
      validateJsonSchema(
        '{"definitions":{"n":{"type":"number"}},"$ref":"#/definitions/n"}',
        '4',
      ).valid,
    ).toBe(true)
    expect(validateJsonSchema('false', '4')).toMatchObject({
      valid: false,
      errors: [{ path: '/' }],
    })
  })
  it('reports nested instance paths and format failures', () => {
    expect(
      validateJsonSchema(schema, '{"user":{"email":"broken"}}'),
    ).toMatchObject({
      valid: false,
      errors: [{ path: '/user/email', keyword: 'format' }],
    })
    expect(validateJsonSchema(schema, '{}').errors[0].details).toEqual({
      missingProperty: 'user',
    })
  })
  it.each([
    '{',
    '{"type":"wrong"}',
    '{"$schema":"https://json-schema.org/draft/2020-12/schema"}',
    '{"$ref":"https://example.com/schema.json"}',
  ])('rejects invalid or unavailable schema %s without a request', (text) => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    expect(() => validateJsonSchema(text, '{}')).toThrow('schemaError')
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
  it('distinguishes JSON syntax errors in data', () =>
    expect(() => validateJsonSchema('{}', '{')).toThrow('dataError'))
})
describe('URL parsing and rebuilding', () => {
  it('preserves duplicates, empty values, encoded delimiters and Unicode', () => {
    const parts = parseNetworkUrl(
      'https://example.com:8443/a%2Fb?q=a+b&q=%26%3D&empty=&=x#part%20one',
    )
    expect(parts.params).toEqual([
      ['q', 'a b'],
      ['q', '&='],
      ['empty', ''],
      ['', 'x'],
    ])
    expect(rebuildNetworkUrl(parts)).toBe(
      'https://example.com:8443/a%2Fb?q=a+b&q=%26%3D&empty=&=x#part%20one',
    )
    parts.params.push(['你好', 'é%'])
    expect(parseNetworkUrl(rebuildNetworkUrl(parts)).params.at(-1)).toEqual([
      '你好',
      'é%',
    ])
  })
  it('roundtrips IPv6 and supports edited components', () => {
    const parts = parseNetworkUrl('https://[2001:db8::1]:8443/')
    expect(parts.host).toBe('[2001:db8::1]')
    expect(
      rebuildNetworkUrl({
        ...parts,
        protocol: 'http',
        port: '8080',
        path: '/new path',
        fragment: 'x',
      }),
    ).toBe('http://[2001:db8::1]:8080/new%20path#x')
  })
  it.each([
    'relative/path',
    'https://user:pass@example.com',
    'https://example.com:99999',
    'javascript:alert(1)',
  ])('rejects invalid or unsupported URL %s', (text) =>
    expect(() => parseNetworkUrl(text)).toThrow('urlError'),
  )
  it.each([
    'https://example.com/%',
    'https://example.com/?q=%GG',
    'https://example.com/%C0%AF',
    'https://example.com/#%E2%82',
  ])('rejects malformed encoding %s', (text) =>
    expect(() => parseNetworkUrl(text)).toThrow('encodingError'),
  )
  it('rejects invalid edited components', () => {
    const parts = parseNetworkUrl('https://example.com/')
    expect(() => rebuildNetworkUrl({ ...parts, path: '/a?b' })).toThrow(
      'urlError',
    )
    expect(() => rebuildNetworkUrl({ ...parts, port: '-1' })).toThrow(
      'urlError',
    )
    expect(() => rebuildNetworkUrl({ ...parts, path: '/%zz' })).toThrow(
      'encodingError',
    )
  })
})
describe('safe YAML formatting', () => {
  it('roundtrips nested values, strings, dates-as-strings and booleans', () => {
    const source =
      'date: 2025-01-02\nitems: [true, null, "001", 12]\ntext: |\n  hello\n  world\n'
    expect(load(formatNetworkYaml(source), { schema: JSON_SCHEMA })).toEqual(
      load(source, { schema: JSON_SCHEMA }),
    )
    expect(
      typeof (
        load(formatNetworkYaml(source), { schema: JSON_SCHEMA }) as Record<
          string,
          unknown
        >
      ).date,
    ).toBe('string')
  })
  it('retains alias semantics including cyclic graphs', () => {
    const result = load(formatNetworkYaml('root: &root {self: *root}'), {
      schema: JSON_SCHEMA,
    }) as { root: { self: unknown } }
    expect(result.root.self).toBe(result.root)
  })
  it.each([
    '',
    'x: [1,',
    'a: 1\na: 2',
    'x: !!js/function "function(){}"',
    'x: !custom value',
  ])('rejects invalid input and unsafe tags %s', (text) =>
    expect(() => formatNetworkYaml(text)).toThrow('yamlError'),
  )
})
describe('XML semantics', () => {
  const parser = new XMLParser({
    preserveOrder: true,
    ignoreAttributes: false,
    trimValues: false,
    parseTagValue: false,
    commentPropName: '#comment',
    cdataPropName: '#cdata',
  })
  it('preserves declarations, attributes, mixed text, entities, comments and CDATA in compact mode', () => {
    const source =
      '<?xml version="1.0" encoding="UTF-8"?><root xmlns="urn:test" a="a &amp; b"><p> Hello <b>world</b> ! </p><!--keep--><![CDATA[<raw>]]></root>'
    expect(parser.parse(formatNetworkXml(source, false))).toEqual(
      parser.parse(source),
    )
    expect(formatNetworkXml(source)).toContain('<p> Hello <b>world</b> ! </p>')
    expect(formatNetworkXml(source)).toContain(
      '<?xml version="1.0" encoding="UTF-8"?>',
    )
  })
  it('adds indentation to element-only trees and is idempotent', () => {
    const output = formatNetworkXml('<root><a>1</a><b id="2"/></root>')
    expect(output).toContain('\n  <a>1</a>\n')
    expect(formatNetworkXml(output)).toBe(output)
  })
  it('preserves existing whitespace and inherited xml:space', () => {
    for (const source of [
      '<p>  a\n <b> b </b> c </p>',
      '<root xml:space="preserve"><a><b/></a>  </root>',
      '<p>Hello <b><i>world</i></b>!</p>',
      '<root><![CDATA[<!DOCTYPE text> & literal]]></root>',
    ]) {
      expect(parser.parse(formatNetworkXml(source))).toEqual(
        parser.parse(source),
      )
      expect(parser.parse(formatNetworkXml(source, false))).toEqual(
        parser.parse(source),
      )
    }
  })
  it('protects nested mixed text even across xml:space default declarations', () => {
    const source =
      '<p>Hello <b><i xml:space="default"><x>world</x></i></b>!</p>'
    expect(parser.parse(formatNetworkXml(source))).toEqual(parser.parse(source))
  })
  it.each([
    '',
    '<root><a></root>',
    '<root a="x></root>',
    '<!DOCTYPE x [<!ENTITY a "b">]><x>&a;</x>',
    '<a/><b/>',
    '<a>&oops;</a>',
    '<a>&AMP;</a>',
    '<a>&#0;</a>',
    '<a>]]></a>',
    '<a>\u0001</a>',
  ])('rejects malformed XML and DTD %s', (text) =>
    expect(() => formatNetworkXml(text)).toThrow('xmlError'),
  )
})
describe('IPv4 CIDR calculations', () => {
  it('calculates a normal subnet and membership', () => {
    expect(calculateSubnet('192.168.1.42/24', '192.168.1.255')).toEqual({
      network: '192.168.1.0',
      broadcast: '192.168.1.255',
      mask: '255.255.255.0',
      first: '192.168.1.1',
      last: '192.168.1.254',
      total: 256,
      usable: 254,
      contains: true,
    })
    expect(calculateSubnet('192.168.1.42/24', '192.168.2.1').contains).toBe(
      false,
    )
  })
  it('handles /0 without signed integer overflow', () =>
    expect(calculateSubnet('255.255.255.255/0')).toMatchObject({
      network: '0.0.0.0',
      broadcast: '255.255.255.255',
      mask: '0.0.0.0',
      total: 4294967296,
      usable: 4294967294,
      contains: null,
    }))
  it('uses both point-to-point addresses for /31', () =>
    expect(calculateSubnet('10.0.0.1/31')).toMatchObject({
      first: '10.0.0.0',
      last: '10.0.0.1',
      usable: 2,
    }))
  it('uses the single /32 address', () =>
    expect(calculateSubnet('255.255.255.255/32')).toMatchObject({
      network: '255.255.255.255',
      mask: '255.255.255.255',
      first: '255.255.255.255',
      last: '255.255.255.255',
      total: 1,
      usable: 1,
    }))
  it.each([
    '1.2.3.256/24',
    '1.2.3/24',
    '01.2.3.4/24',
    '1.2.3.4/33',
    '1.2.3.4/-1',
    '1.2.3.4/1.5',
  ])('rejects invalid CIDR %s', (text) =>
    expect(() => calculateSubnet(text)).toThrow('cidrError'),
  )
  it('rejects an invalid membership address', () =>
    expect(() => calculateSubnet('1.2.3.4/24', 'bad')).toThrow('cidrError'))
})
describe('exact base and byte conversions', () => {
  it('preserves integers beyond Number precision and signed values', () => {
    expect(convertInteger('9007199254740993', 10)[16]).toBe('20000000000001')
    expect(convertInteger('-FF', 16)).toEqual({
      2: '-11111111',
      8: '-377',
      10: '-255',
      16: '-ff',
    })
    expect(convertInteger('+000', 8)[10]).toBe('0')
  })
  it.each([
    ['102', 2],
    ['8', 8],
    ['1e3', 10],
    ['12z', 16],
    ['0xFF', 16],
    ['', 10],
    ['-', 10],
    ['1.2', 10],
    ['1 2', 10],
  ] as const)(
    'rejects partial and invalid digits %s in base %s',
    (text, base) =>
      expect(() => convertInteger(text, base)).toThrow('numberError'),
  )
  it('converts decimal byte quantities exactly between SI and IEC', () => {
    expect(convertByteUnits('1', 'MiB', 'MB')).toBe('1.048576')
    expect(convertByteUnits('1', 'B', 'KiB')).toBe('0.0009765625')
    expect(convertByteUnits('0.5', 'KiB', 'B')).toBe('512')
    expect(convertByteUnits('9007199254740993', 'B', 'B')).toBe(
      '9007199254740993',
    )
    expect(convertByteUnits('0', 'TB', 'TiB')).toBe('0')
  })
  it.each(['-1', '1e3', '1.2.3', 'NaN', ''])(
    'rejects invalid byte quantity %s',
    (text) =>
      expect(() => convertByteUnits(text, 'B', 'MB')).toThrow('bytesError'),
  )
  it('rejects unsupported units', () =>
    expect(() => convertByteUnits('1', 'Kb', 'B')).toThrow('bytesError'))
})
describe('local X.509 parsing', () => {
  it('matches Node certificate identity, dates and SHA-256 fingerprint', async () => {
    const nodeCert = new NodeCertificate(NETWORK_CERTIFICATE_EXAMPLE)
    const result = await parseCertificate(
      NETWORK_CERTIFICATE_EXAMPLE,
      new Date('2025-01-01'),
    )
    expect(result.subject).toContain('Entrust')
    expect(result.issuer).toContain('Entrust')
    expect(result.fingerprint).toBe(nodeCert.fingerprint256)
    expect(result.notAfter).toBe(new Date(nodeCert.validTo).toISOString())
    expect(result.state).toBe('valid')
    expect(
      (
        await parseCertificate(
          NETWORK_CERTIFICATE_EXAMPLE,
          new Date('2030-01-01'),
        )
      ).state,
    ).toBe('expired')
    expect(
      (
        await parseCertificate(
          NETWORK_CERTIFICATE_EXAMPLE,
          new Date('2000-01-01'),
        )
      ).state,
    ).toBe('notYetValid')
  })
  it('reads subject alternative names from a generated public certificate', async () => {
    const {
      X509CertificateGenerator,
      SubjectAlternativeNameExtension,
      cryptoProvider,
    } = await import('@peculiar/x509')
    cryptoProvider.set(webcrypto as unknown as Crypto)
    const keys = await webcrypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify'],
    )
    const cert = await X509CertificateGenerator.createSelfSigned({
      serialNumber: '01',
      name: 'CN=example.test',
      keys: keys as unknown as CryptoKeyPair,
      signingAlgorithm: { name: 'ECDSA', hash: 'SHA-256' },
      notBefore: new Date('2020-01-01'),
      notAfter: new Date('2030-01-01'),
      extensions: [
        new SubjectAlternativeNameExtension([
          { type: 'dns', value: 'example.test' },
          { type: 'ip', value: '127.0.0.1' },
        ]),
      ],
    })
    const result = await parseCertificate(cert.toString('pem'))
    expect(result.san).toContain('example.test')
    expect(result.san).toContain('127.0.0.1')
  })
  it.each([
    '',
    'not a certificate',
    '-----BEGIN CERTIFICATE-----\nbm90LWRlcg==\n-----END CERTIFICATE-----',
    NETWORK_CERTIFICATE_EXAMPLE + NETWORK_CERTIFICATE_EXAMPLE,
  ])(
    'rejects invalid certificates',
    async (input) =>
      await expect(parseCertificate(input)).rejects.toThrow('certificateError'),
  )
})
