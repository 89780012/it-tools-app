import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  calculateIpv6Subnet as calculate,
  Ipv6SubnetError,
  IPV6_MAX_INPUT,
} from '../ipv6-subnet'

describe('IPv6 subnet calculation', () => {
  it('calculates a /64 exactly beyond Number precision', () => {
    expect(calculate('2001:DB8:1234:5678::abcd/64')).toEqual({
      normalized: '2001:db8:1234:5678::abcd/64',
      expanded: '2001:0db8:1234:5678:0000:0000:0000:abcd',
      network: '2001:db8:1234:5678::/64',
      first: '2001:db8:1234:5678::',
      last: '2001:db8:1234:5678:ffff:ffff:ffff:ffff',
      mask: 'ffff:ffff:ffff:ffff:0000:0000:0000:0000',
      prefix: '64',
      hostBits: '64',
      count: '18446744073709551616',
      offset: '43981',
    })
  })
  it('handles /0, /127 and /128 without removing addresses', () => {
    expect(
      calculate('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff/0'),
    ).toMatchObject({
      network: '::/0',
      first: '::',
      last: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
      mask: '0000:0000:0000:0000:0000:0000:0000:0000',
      count: '340282366920938463463374607431768211456',
      offset: '340282366920938463463374607431768211455',
    })
    expect(calculate('2001:db8::3/127')).toMatchObject({
      first: '2001:db8::2',
      last: '2001:db8::3',
      count: '2',
      offset: '1',
    })
    expect(calculate('::1/128')).toMatchObject({
      network: '::1/128',
      first: '::1',
      last: '::1',
      count: '1',
      offset: '0',
    })
  })
  it.each([
    ['0:0:0:0:0:0:0:0/128', '::/128'],
    ['2001:0:0:1:0:0:1:1/64', '2001::1:0:0:1:1/64'],
    ['2001:0:1:1:0:0:0:1/64', '2001:0:1:1::1/64'],
    ['2001:db8:0:1:1:1:1:1/64', '2001:db8:0:1:1:1:1:1/64'],
    ['1:2:3:4:5:0:0:0/64', '1:2:3:4:5::/64'],
    ['::ffff:192.0.2.128/120', '::ffff:c000:280/120'],
    ['1:2:3:4:5:6:192.0.2.1/64', '1:2:3:4:5:6:c000:201/64'],
    ['  ::192.0.2.1/96\n', '::c000:201/96'],
  ])('normalizes %s', (input, expected) =>
    expect(calculate(input).normalized).toBe(expected),
  )
  it('handles prefixes that split a hexadecimal group', () => {
    expect(calculate('2001:db8:abcd:ffff::1/53')).toMatchObject({
      network: '2001:db8:abcd:f800::/53',
      last: '2001:db8:abcd:ffff:ffff:ffff:ffff:ffff',
      count: '37778931862957161709568',
    })
  })
  it.each([
    ['', 'required'],
    [' \n ', 'required'],
    ['::1', 'invalidCidr'],
    ['::/1/2', 'invalidCidr'],
    ['::/-1', 'invalidPrefix'],
    ['::/129', 'invalidPrefix'],
    ['::/064', 'invalidPrefix'],
    ['::/1.5', 'invalidPrefix'],
    ['::/+1', 'invalidPrefix'],
    ['::/1e2', 'invalidPrefix'],
    ['::/ 64', 'invalidPrefix'],
    ['::/', 'invalidPrefix'],
    ['/64', 'invalidAddress'],
    ['1:2:3:4:5:6:7/64', 'invalidAddress'],
    ['1:2:3:4:5:6:7:8:9/64', 'invalidAddress'],
    ['1:2:3:4:5:6:7::8/64', 'invalidAddress'],
    ['1::2::3/64', 'invalidAddress'],
    [':::/64', 'invalidAddress'],
    [':1:2:3:4:5:6:7/64', 'invalidAddress'],
    ['1:2:3:4:5:6:7:/64', 'invalidAddress'],
    ['::10000/64', 'invalidAddress'],
    ['::xyz/64', 'invalidAddress'],
    ['[::1]/128', 'invalidAddress'],
    ['fe80::1%eth0/64', 'invalidAddress'],
    [':: ffff/64', 'invalidAddress'],
    ['::\n1/64', 'invalidAddress'],
    ['::1\n/64', 'invalidAddress'],
    ['192.0.2.1/24', 'invalidAddress'],
    ['::ffff:256.1.1.1/64', 'invalidAddress'],
    ['::ffff:192.00.2.1/64', 'invalidAddress'],
    ['::ffff:192.0.2/64', 'invalidAddress'],
    ['::192.0.2.1:1/64', 'invalidAddress'],
    [' '.repeat(IPV6_MAX_INPUT + 1), 'tooLong'],
  ])('rejects %j with %s', (input, code) => {
    try {
      calculate(input)
      expect.fail('Expected invalid input to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(Ipv6SubnetError)
      expect((error as Ipv6SubnetError).code).toBe(code)
    }
  })
  it('accepts the exact input length boundary', () => {
    expect(calculate('::/0'.padEnd(IPV6_MAX_INPUT)).count).toBe(
      (1n << 128n).toString(),
    )
  })
  it('preserves random 128-bit addresses and computes aligned, enclosing ranges', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: (1n << 128n) - 1n }),
        fc.integer({ min: 0, max: 128 }),
        (address, prefix) => {
          const full = address
            .toString(16)
            .padStart(32, '0')
            .match(/.{4}/g)!
            .join(':')
          const result = calculate(`${full}/${prefix}`)
          const first = BigInt(
            `0x${calculate(`${result.first}/128`).expanded.replaceAll(':', '')}`,
          )
          const last = BigInt(
            `0x${calculate(`${result.last}/128`).expanded.replaceAll(':', '')}`,
          )
          const count = 1n << BigInt(128 - prefix)
          expect(result.expanded).toBe(full)
          expect(calculate(result.normalized)).toEqual(result)
          expect(first % count).toBe(0n)
          expect(first <= address && address <= last).toBe(true)
          expect(last - first + 1n).toBe(count)
          expect(BigInt(result.offset)).toBe(address - first)
        },
      ),
      { numRuns: 200 },
    )
  })
})
