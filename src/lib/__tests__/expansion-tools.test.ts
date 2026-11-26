import { describe, expect, it } from 'vitest'
import { Blob as NodeBlob } from 'node:buffer'
import { createHash } from 'node:crypto'
import { textSetOperation, convertTextCase, textStatistics } from '../text-operations'
import { repairJson } from '../json-repair'
import { hashFile, matchesHash } from '../file-hash'
import { parsePermissions, symbolicPermissions, permissionCommand } from '../chmod'
import { parseTable, mergeTables, transformTable, generateInsert, exportTable } from '../table-data'
import { buildCron, nextCronRuns } from '../cron-builder'
import { SSEParser, validateStreamUrl } from '../stream-events'
import { authorizeRequest, exportCurl, formRequest } from '../http-request-extras'
import { generateTypes } from '../developer-json-to-types'
import { validateImageTransform } from '../frontend-image'
import { matchesTool, relatedToolsFor } from '../tool-discovery'
import { validateJsonSchema } from '../network-additions'
import { allTools } from '../tools-config'

describe('text operations', () => {
  it('compares normalized lines and retains original spelling and order', () => {
    expect(textSetOperation(' Ada\n林\nada\n\n', 'ADA\nBob', 'intersection', true)).toEqual({ output: 'Ada', count: 1, duplicatesA: 1, duplicatesB: 0 })
    expect(textSetOperation('a\nb', 'b\nc', 'union').output).toBe('a\nb\nc')
    expect(textSetOperation('a\nb', 'b\nc', 'leftOnly').output).toBe('a')
    expect(textSetOperation('a\nb', 'b\nc', 'rightOnly').output).toBe('c')
    expect(textSetOperation('', '', 'union').count).toBe(0)
  })
  it('handles acronym boundaries, Unicode and UTF-8 counts', () => {
    expect(convertTextCase('HTTPResponse user_id', 'snake')).toBe('http_response_user_id')
    expect(convertTextCase('user-name\nhello_world', 'camel')).toBe('userName\nhelloWorld')
    expect(convertTextCase('élève Nom', 'pascal')).toBe('ÉlèveNom')
    expect(textStatistics('林😀\r\na')).toEqual({ characters: 5, words: 2, bytes: 10, lines: 2 })
  })
})
describe('JSON repair', () => {
  it('repairs missing quotes and removes JSON5 comments/trailing commas', () => {
    expect(JSON.parse(repairJson("{name: 'Ada',}", 'repair').output)).toEqual({ name: 'Ada' })
    expect(JSON.parse(repairJson('{/*comment*/x:0x10,}', 'json5').output)).toEqual({ x: 16 })
    expect(() => repairJson('{x:NaN}', 'json5')).toThrow('nonFinite')
    expect(() => repairJson('', 'repair')).toThrow()
    expect(repairJson('{id:9007199254740993}', 'repair').output).toContain('9007199254740993')
  })
})
describe('incremental file hashing', () => {
  for (const [algorithm, nodeAlgorithm] of [['MD5', 'md5'], ['SHA-256', 'sha256'], ['SHA-512', 'sha512']] as const) {
    it(`matches independently calculated ${algorithm} across chunk boundaries`, async () => {
      const bytes = new Uint8Array(2 * 1024 * 1024 + 37).map((_, index) => index % 251)
      const progress: number[] = []
      const digest = await hashFile(new NodeBlob([bytes]) as unknown as Blob, algorithm, value => progress.push(value))
      expect(digest).toBe(createHash(nodeAlgorithm).update(bytes).digest('hex'))
      expect(progress.at(-1)).toBe(1)
      expect(matchesHash(digest, ` ${digest.toUpperCase()} `)).toBe(true)
      expect(matchesHash(digest, 'xyz')).toBe(false)
    })
  }
  it('hashes empty files and cancels before returning a digest', async () => {
    expect(await hashFile(new NodeBlob([]) as unknown as Blob, 'MD5')).toBe('d41d8cd98f00b204e9800998ecf8427e')
    const controller = new AbortController(); controller.abort()
    await expect(hashFile(new NodeBlob(['abc']) as unknown as Blob, 'SHA-256', undefined, controller.signal)).rejects.toThrow()
  })
})
describe('Unix permissions', () => {
  it('round trips every permission including special bits', () => {
    for (let mode = 0; mode <= 0o7777; mode++) expect(parsePermissions(symbolicPermissions(mode))).toBe(mode)
    expect(symbolicPermissions(0o4755)).toBe('rwsr-xr-x')
    expect(symbolicPermissions(0o1644)).toBe('rw-r--r-T')
    expect(() => parsePermissions('888')).toThrow()
    expect(permissionCommand(0o755, "a'b")).toBe("chmod 755 -- 'a'\\''b'")
  })
})
describe('table processing and SQL output', () => {
  it('preserves quoted newlines and leading zeros, aligns merged columns and filters', () => {
    const first = parseTable('id,name\r\n001,"A\nB"\r\n002,Ada\r\n002,Ada')
    expect(first.rows[0]).toEqual(['001', 'A\nB'])
    const merged = mergeTables([first, parseTable('name,extra\nLin,x')])
    expect(merged.rows.at(-1)).toEqual(['', 'Lin', 'x'])
    const result = transformTable(first, { selected: ['name', 'id'], query: 'Ada', sortColumn: 'id', descending: true, dedupeColumn: 'id' })
    expect(result.rows).toEqual([['Ada', '002']])
    expect(parseTable(exportTable(first))).toEqual(first)
    expect(parseTable('a\tb\n1\t2', '\t').rows).toEqual([['1', '2']])
    expect(() => parseTable('a,a\n1,2')).toThrow('columns')
    expect(() => parseTable('a,b\n1')).toThrow('columns')
    expect(() => parseTable('a\n"unterminated')).toThrow('invalid')
  })
  it('quotes identifiers and values, preserves JSON null and batches rows', () => {
    const sql = generateInsert('[{"id":1,"name":"O\'Reilly","active":true},{"id":2}]', 'json', 'users', 'postgres', 1)
    expect(sql).toContain("(1, 'O''Reilly', TRUE)")
    expect(sql).toContain('(2, NULL, NULL)')
    expect(sql.match(/INSERT INTO/g)).toHaveLength(2)
    expect(generateInsert('code\n001', 'csv', 'x', 'sqlite')).toContain("('001')")
    expect(generateInsert('[{"x":"a\\\\b"}]', 'json', 'a`b', 'mysql')).toContain("CONVERT(X'615c62' USING utf8mb4)")
    expect(generateInsert('[{"x":"林"}]', 'json', 'a]b', 'sqlserver')).toContain("INSERT INTO [a]]b] ([x]) VALUES\n(N'林')")
    expect(generateInsert('[{"id":9007199254740993,"amount":0.1234567890123456789}]', 'json', 't', 'postgres')).toContain('(9007199254740993, 0.1234567890123456789)')
    expect(() => generateInsert('[1]', 'json', 'x', 'postgres')).toThrow()
    expect(() => generateInsert('[{}]', 'json', 'x', 'postgres')).toThrow()
  })
})
describe('cron schedules', () => {
  it('generates valid expressions and schedules in the requested zone', () => {
    expect(buildCron('weekly', 15, 9, 1, 5)).toBe('15 9 * * 1')
    expect(buildCron('minutes', 0, 0, 1, 5)).toBe('*/5 * * * *')
    expect(() => buildCron('monthly', 0, 0, 32, 5)).toThrow()
    const next = nextCronRuns('0 9 * * *', 'Asia/Shanghai', 1, new Date('2026-01-01T00:00:00Z'))
    expect(next[0].toISOString()).toBe('2026-01-01T01:00:00.000Z')
    const dst = nextCronRuns('0 9 * * *', 'America/New_York', 2, new Date('2026-03-07T00:00:00Z'))
    expect(dst.map(date => date.toISOString())).toEqual(['2026-03-07T14:00:00.000Z', '2026-03-08T13:00:00.000Z'])
    expect(() => nextCronRuns('* * * * *', 'Bad/Zone')).toThrow()
  })
})
describe('stream event parsing', () => {
  it('handles split CRLF, comments, multiline data and persistent IDs', () => {
    const parser = new SSEParser()
    expect(parser.push('\uFEFF:ping\r\nid: 4\r\nevent: update\r\ndata: first\r')).toEqual([])
    expect(parser.push('\ndata: second\r\n\r\n')).toEqual([{ id: '4', event: 'update', data: 'first\nsecond' }])
    expect(parser.push('data: next\n\n')).toEqual([{ id: '4', event: 'message', data: 'next' }])
    expect(parser.push('data: unfinished')).toEqual([])
    expect(() => validateStreamUrl('https://example.com', 'websocket')).toThrow()
    expect(() => validateStreamUrl('wss://user:pass@example.com', 'websocket')).toThrow()
  })
})
describe('request forms, auth and export', () => {
  const request = { url: 'https://example.com', method: 'POST', headers: { authorization: 'old' }, data: "a'b" }
  it('replaces auth case-insensitively and encodes Unicode credentials', () => {
    const authorized = authorizeRequest(request, { type: 'basic', username: '林', password: 'pass', token: '' })
    expect(Object.keys(authorized.headers)).toEqual(['Authorization'])
    expect(authorized.headers.Authorization).toBe('Basic ' + Buffer.from('林:pass').toString('base64'))
    expect(() => authorizeRequest(request, { type: 'bearer', token: 'a\r\nb', username: '', password: '' })).toThrow()
  })
  it('preserves repeated form keys and safely quotes exported shell arguments', () => {
    expect(formRequest(request, [['x', 'a b'], ['x', '林']]).data).toBe('x=a+b&x=%E6%9E%97')
    expect(exportCurl(request)).toContain("--data-raw 'a'\\''b'")
    expect(exportCurl(request, { fields: [['x', '@secret']], files: [] })).toContain("--form-string 'x=@secret'")
  })
})
describe('generated models and schema', () => {
  const input = '[{"user-name":"Ada","nested":{"active":true}},{"user-name":null,"value":3}]'
  it('retains aliases and optional fields in each language', () => {
    const python = generateTypes(input, 'python')
    expect(python).toContain('"user-name": str | None')
    expect(python).toContain('NotRequired[float]')
    expect(generateTypes(input, 'java')).toContain('@JsonProperty("user-name")')
    expect(generateTypes(input, 'csharp')).toContain('[JsonPropertyName("user-name")]')
    const schema = JSON.parse(generateTypes(input, 'schema'))
    expect(validateJsonSchema(JSON.stringify(schema), input).valid).toBe(true)
    expect(validateJsonSchema(JSON.stringify(schema), '[{"user-name":3}]').valid).toBe(false)
    expect(schema.items.required).toEqual(['user-name'])
    expect(schema.items.properties['user-name'].anyOf).toEqual([{ type: 'string' }, { type: 'null' }])
  })
})
describe('image transformations and discovery', () => {
  it('validates crop bounds and swaps rotated dimensions', () => {
    expect(validateImageTransform(100, 80, { x: 10, y: 5, cropWidth: 50, cropHeight: 40, rotation: 90 })).toEqual({ width: 40, height: 50 })
    expect(() => validateImageTransform(100, 80, { x: 90, y: 0, cropWidth: 50, cropHeight: 40, rotation: 0 })).toThrow()
  })
  it('finds task aliases and recommends workflow tools without duplicates', () => {
    expect(matchesTool(allTools.find(tool => tool.id === 'time-converter')!, 'epoch', key => key)).toBe(true)
    expect(relatedToolsFor('nginx-certificate-generator').map(tool => tool.id)).toContain('tls-checker')
    expect(relatedToolsFor('dns-lookup').map(tool => tool.id)).not.toContain('dns-lookup')
  })
})
