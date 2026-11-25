import { describe, expect, it } from 'vitest'
import {
  formatIP,
  getExampleIPs,
  getIPVersion,
  isLocalIP,
  isPrivateIP,
  maskIP,
  validateIP,
  validateIPv4,
  validateIPv6,
} from '../ip-utils'

describe('IP utilities', () => {
  it.each(['0.0.0.0', '8.8.8.8', '255.255.255.255', ' 192.168.1.1 '])(
    'accepts valid IPv4 address %s',
    (ip) => expect(validateIPv4(ip)).toBe(true),
  )

  it.each(['', '256.0.0.1', '1.2.3', '1.2.3.4.5', '1.2.3.-1', 'localhost'])(
    'rejects invalid IPv4 address %s',
    (ip) => expect(validateIPv4(ip)).toBe(false),
  )

  it.each(['2001:4860:4860::8888', '::1', '::', 'fe80::1', '::ffff:192.0.2.1'])(
    'accepts valid IPv6 address %s',
    (ip) => expect(validateIPv6(ip)).toBe(true),
  )

  it.each(['', '2001:::1', 'gggg::1', '1:2:3', '::ffff:256.0.0.1'])(
    'rejects invalid IPv6 address %s',
    (ip) => expect(validateIPv6(ip)).toBe(false),
  )

  it('detects IP version and trims surrounding whitespace', () => {
    expect(getIPVersion(' 8.8.8.8 ')).toBe('IPv4')
    expect(getIPVersion('2001:4860:4860::8888')).toBe('IPv6')
    expect(getIPVersion('not an address')).toBe('Invalid')
    expect(validateIP('::1')).toBe(true)
  })

  it.each(['10.0.0.1', '172.16.0.1', '172.31.255.255', '192.168.1.1', '127.0.0.1'])(
    'recognizes private/reserved IPv4 address %s',
    (ip) => expect(isPrivateIP(ip)).toBe(true),
  )

  it.each(['8.8.8.8', '172.15.255.255', '172.32.0.0', '192.167.1.1', '2001:4860:4860::8888'])(
    'does not mark public/out-of-range address %s as private IPv4',
    (ip) => expect(isPrivateIP(ip)).toBe(false),
  )

  it('formats, recognizes local addresses, and masks IPv4 addresses', () => {
    expect(formatIP(' 8.8.8.8 ')).toBe('8.8.8.8')
    expect(formatIP('')).toBe('')
    expect(isLocalIP('127.0.0.1')).toBe(true)
    expect(isLocalIP('  ::1 ')).toBe(true)
    expect(isLocalIP('8.8.8.8')).toBe(false)
    expect(maskIP('192.168.1.20')).toBe('***.***.***.20')
    expect(maskIP('192.168.1.20', 2)).toBe('***.***.1.20')
    expect(maskIP('invalid')).toBe('invalid')
  })

  it('returns example addresses that all pass validation', () => {
    const examples = getExampleIPs()
    expect(examples).toHaveLength(6)
    expect(examples.every(validateIP)).toBe(true)
  })
})
