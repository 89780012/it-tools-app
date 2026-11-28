import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  aggregateIpv4Cidrs as aggregate,
  CidrAggregationError,
  MAX_CIDR_ENTRIES,
  MAX_CIDR_INPUT,
} from '../ipv4-cidr-aggregator'

function fails(input: string, code: CidrAggregationError['code'], line = 0) {
  try {
    aggregate(input)
    throw new Error('Expected rejection')
  } catch (error) {
    expect(error).toBeInstanceOf(CidrAggregationError)
    expect(error).toMatchObject({ code, line })
  }
}

describe('IPv4 CIDR aggregation', () => {
  it('normalizes host bits, removes duplicates and covered networks, and sorts numerically', () => {
    expect(
      aggregate(
        '198.51.100.9\n192.0.2.10/25\n192.0.2.128/25\n192.0.2.64/26\n198.51.100.9/32',
      ),
    ).toEqual({
      cidrs: ['192.0.2.0/24', '198.51.100.9/32'],
      output: '192.0.2.0/24\n198.51.100.9/32',
      inputCount: 5,
      outputCount: 2,
      addressCount: 257,
      normalizedEntries: 1,
    })
    expect(aggregate('10.0.0.0/8\n2.0.0.0/8\n10.0.0.7/32').cidrs).toEqual([
      '2.0.0.0/8',
      '10.0.0.0/8',
    ])
  })
  it('handles the full address space without enumerating addresses or signed overflow', () => {
    expect(aggregate('0.0.0.0/1\n128.0.0.0/1')).toMatchObject({
      output: '0.0.0.0/0',
      addressCount: 4294967296,
    })
    expect(aggregate('255.255.255.255/0\n127.0.0.1')).toMatchObject({
      output: '0.0.0.0/0',
      normalizedEntries: 1,
    })
    expect(aggregate('255.255.255.255\n255.255.255.254')).toMatchObject({
      output: '255.255.255.254/31',
      addressCount: 2,
    })
    expect(aggregate('0.0.0.0\n255.255.255.255').cidrs).toEqual([
      '0.0.0.0/32',
      '255.255.255.255/32',
    ])
  })
  it('does not fill holes or combine unaligned adjacent networks into oversized CIDRs', () => {
    expect(
      aggregate('192.0.2.1\n192.0.2.2\n192.0.2.3\n192.0.2.5').cidrs,
    ).toEqual(['192.0.2.1/32', '192.0.2.2/31', '192.0.2.5/32'])
    expect(aggregate('192.0.3.0/24\n192.0.4.0/24').cidrs).toEqual([
      '192.0.3.0/24',
      '192.0.4.0/24',
    ])
    expect(aggregate('192.0.2.0/24\n192.0.3.0/24').cidrs).toEqual([
      '192.0.2.0/23',
    ])
  })
  it('accepts CRLF, CR, blank lines and surrounding whitespace, preserving physical line numbers', () => {
    expect(aggregate(' \r\n 192.0.2.1 \r\r\n192.0.2.0/32\n').output).toBe(
      '192.0.2.0/31',
    )
    fails('\n192.0.2.1\r\n\ninvalid', 'invalidAddress', 4)
  })
  it.each(['', ' \n\t\r\n'])('rejects empty input %j', (input) =>
    fails(input, 'empty'),
  )
  it.each([
    '256.0.0.1',
    '-1.0.0.1',
    '1.2.3',
    '1.2.3.4.5',
    '01.2.3.4',
    '1.2.3.004',
    '1e1.2.3.4',
    '0x1.2.3.4',
    '１.2.3.4',
    '::1',
    '1.2. 3.4',
    '1.2.3.4 # comment',
    '1.2.3.4,1.2.3.5',
    '1.2.3.4-1.2.3.8',
  ])('rejects address syntax %s', (input) => fails(input, 'invalidAddress', 1))
  it.each([
    '',
    '33',
    '-1',
    '1.5',
    '01',
    '1e1',
    '0x10',
    ' 24',
    '24 ',
    '24/1',
    '32/',
    '２４',
  ])('rejects prefix syntax %j', (prefix) => {
    // Trailing whitespace around the whole entry is deliberately allowed.
    if (prefix === '24 ')
      expect(aggregate(`1.2.3.4/${prefix}`).output).toBe('1.2.3.0/24')
    else fails(`1.2.3.4/${prefix}`, 'invalidPrefix', 1)
  })
  it('enforces input and entry limits at their boundaries', () => {
    expect(aggregate('1.2.3.4'.padEnd(MAX_CIDR_INPUT, ' ')).output).toBe(
      '1.2.3.4/32',
    )
    fails(' '.repeat(MAX_CIDR_INPUT + 1), 'inputLimit')
    expect(
      aggregate(Array(MAX_CIDR_ENTRIES).fill('1.2.3.4').join('\n')).inputCount,
    ).toBe(MAX_CIDR_ENTRIES)
    fails(
      Array(MAX_CIDR_ENTRIES + 1)
        .fill('1.2.3.4')
        .join('\n'),
      'entryLimit',
      MAX_CIDR_ENTRIES + 1,
    )
  })
  it('matches an independent exhaustive binary-tree oracle for 300 generated network lists', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            host: fc.integer({ min: 0, max: 255 }),
            prefix: fc.integer({ min: 24, max: 32 }),
          }),
          { minLength: 1, maxLength: 40 },
        ),
        (entries) => {
          const covered = Array<boolean>(256).fill(false)
          for (const { host, prefix } of entries) {
            const size = 2 ** (32 - prefix)
            const start = host - (host % size)
            for (let offset = start; offset < start + size; offset++)
              covered[offset] = true
          }
          const expected: string[] = []
          function visit(start: number, size: number, prefix: number) {
            const slice = covered.slice(start, start + size)
            if (slice.every(Boolean))
              expected.push(`203.0.113.${start}/${prefix}`)
            else if (slice.some(Boolean)) {
              visit(start, size / 2, prefix + 1)
              visit(start + size / 2, size / 2, prefix + 1)
            }
          }
          visit(0, 256, 24)
          const result = aggregate(
            entries
              .map(({ host, prefix }) => `203.0.113.${host}/${prefix}`)
              .join('\n'),
          )
          expect(result.cidrs).toEqual(expected)
          expect(result.addressCount).toBe(covered.filter(Boolean).length)
          expect(aggregate(result.output).output).toBe(result.output)
        },
      ),
      { seed: 20261128, numRuns: 300 },
    )
  })
})
