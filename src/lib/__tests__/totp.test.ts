import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  decodeTotpSecret,
  generateTotp,
  TotpError,
  TOTP_MAX_SECRET_LENGTH,
  TOTP_MAX_TIMESTAMP,
} from '../totp'

const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'
const defaults = {
  secret,
  algorithm: 'SHA1',
  digits: 8,
  period: 30,
  timestamp: 59,
}
function encodeBase32(bytes: Uint8Array) {
  const bits = Array.from(bytes, (byte) =>
    byte.toString(2).padStart(8, '0'),
  ).join('')
  return (bits.match(/.{1,5}/g) ?? [])
    .map(
      (group) =>
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[parseInt(group.padEnd(5, '0'), 2)],
    )
    .join('')
}
function expectError(run: () => unknown, code: string, field: string) {
  try {
    run()
    expect.fail('Expected an input error')
  } catch (error) {
    expect(error).toBeInstanceOf(TotpError)
    expect(error).toMatchObject({ code, field })
  }
}

describe('RFC 6238 TOTP', () => {
  // Appendix B: each hash uses its published 20-, 32- or 64-byte key.
  const vectors = [
    [59, '94287082', '46119246', '90693936'],
    [1111111109, '07081804', '68084774', '25091201'],
    [1111111111, '14050471', '67062674', '99943326'],
    [1234567890, '89005924', '91819424', '93441116'],
    [2000000000, '69279037', '90698825', '38618901'],
    [20000000000, '65353130', '77737706', '47863826'],
  ] as const
  it.each(vectors)(
    'matches all three official hashes at timestamp %i',
    (timestamp, sha1, sha256, sha512) => {
      const text =
        '1234567890123456789012345678901234567890123456789012345678901234'
      for (const [algorithm, length, expected] of [
        ['SHA1', 20, sha1],
        ['SHA256', 32, sha256],
        ['SHA512', 64, sha512],
      ] as const) {
        expect(
          generateTotp({
            ...defaults,
            secret: encodeBase32(
              new TextEncoder().encode(text.slice(0, length)),
            ),
            algorithm,
            timestamp,
          }).code,
        ).toBe(expected)
      }
    },
  )
  it('preserves leading zeros and supports six digits', () => {
    expect(generateTotp({ ...defaults, timestamp: 1111111109 }).code).toBe(
      '07081804',
    )
    expect(
      generateTotp({ ...defaults, timestamp: 1111111109, digits: 6 }).code,
    ).toBe('081804')
  })
  it('changes exactly at period boundaries, starting at Unix epoch', () => {
    expect(generateTotp({ ...defaults, timestamp: 0 })).toMatchObject({
      code: '84755224',
      counter: 0,
      validFrom: 0,
      validUntil: 30,
      remaining: 30,
    })
    expect(generateTotp({ ...defaults, timestamp: 29 })).toMatchObject({
      code: '84755224',
      remaining: 1,
    })
    expect(generateTotp({ ...defaults, timestamp: 30 })).toMatchObject({
      code: '94287082',
      counter: 1,
      validFrom: 30,
      validUntil: 60,
      remaining: 30,
    })
  })
  it('handles custom periods and counters larger than 32 bits', () => {
    const timestamp = 2 ** 32
    const result = generateTotp({ ...defaults, period: 1, timestamp })
    expect(result.counter).toBe(timestamp)
    expect(result.code).not.toBe(
      generateTotp({ ...defaults, period: 1, timestamp: 0 }).code,
    )
    expect(
      generateTotp({ ...defaults, period: 300, timestamp: 599 }),
    ).toMatchObject({
      counter: 1,
      validFrom: 300,
      validUntil: 600,
      remaining: 1,
    })
    expect(
      generateTotp({ ...defaults, timestamp: TOTP_MAX_TIMESTAMP }).code,
    ).toMatch(/^\d{8}$/)
  })
  it('agrees with independent Node HMAC over 200 random keys, times, periods and algorithms', () => {
    fc.assert(
      fc.property(
        fc.uint8Array({ minLength: 1, maxLength: 128 }),
        fc.integer({ min: 0, max: TOTP_MAX_TIMESTAMP }),
        fc.integer({ min: 1, max: 300 }),
        fc.constantFrom('SHA1', 'SHA256', 'SHA512'),
        fc.constantFrom(6, 8),
        (bytes, timestamp, period, algorithm, digits) => {
          const encoded = encodeBase32(bytes)
          expect(decodeTotpSecret(encoded)).toEqual(bytes)
          const message = Buffer.alloc(8)
          message.writeBigUInt64BE(BigInt(Math.floor(timestamp / period)))
          const digest = createHmac(algorithm.toLowerCase(), bytes)
            .update(message)
            .digest()
          const offset = digest[digest.length - 1] & 15
          const binary = digest.readUInt32BE(offset) & 0x7fffffff
          const expected = String(binary % 10 ** digits).padStart(digits, '0')
          expect(
            generateTotp({
              secret: encoded,
              timestamp,
              period,
              algorithm,
              digits,
            }).code,
          ).toBe(expected)
        },
      ),
      { numRuns: 200, seed: 20261128 },
    )
  })
  it.each([
    ['algorithm', 'MD5', 'invalidAlgorithm'],
    ['digits', 7, 'invalidDigits'],
    ['digits', 0, 'invalidDigits'],
    ['period', 0, 'invalidPeriod'],
    ['period', 301, 'invalidPeriod'],
    ['period', 1.5, 'invalidPeriod'],
    ['period', NaN, 'invalidPeriod'],
    ['timestamp', -1, 'invalidTimestamp'],
    ['timestamp', 0.5, 'invalidTimestamp'],
    ['timestamp', Infinity, 'invalidTimestamp'],
    ['timestamp', NaN, 'invalidTimestamp'],
    ['timestamp', TOTP_MAX_TIMESTAMP + 1, 'invalidTimestamp'],
  ])('rejects %s=%s', (field, value, code) => {
    expectError(
      () => generateTotp({ ...defaults, [field]: value }),
      String(code),
      String(field),
    )
  })
})

describe('Base32 secret parsing', () => {
  it.each([
    ['MY======', 'f'],
    ['MZXQ====', 'fo'],
    ['MZXW6===', 'foo'],
    ['MZXW6YQ=', 'foob'],
    ['MZXW6YTB', 'fooba'],
    ['MZXW6YTBOI======', 'foobar'],
  ])('decodes canonical padded and unpadded %s', (encoded, expected) => {
    expect(new TextDecoder().decode(decodeTotpSecret(encoded))).toBe(expected)
    expect(
      new TextDecoder().decode(decodeTotpSecret(encoded.replace(/=/g, ''))),
    ).toBe(expected)
  })
  it('normalizes lowercase and ASCII separators', () => {
    expect(
      Array.from(
        decodeTotpSecret(' ge-zd\tgnbv\ngy3tqojq\r\ngez dgnbvgy3tqojq '),
      ),
    ).toEqual(Array.from(new TextEncoder().encode('12345678901234567890')))
  })
  it('supports the exact input length limit and rejects beyond it before normalization', () => {
    expect(decodeTotpSecret('A'.repeat(TOTP_MAX_SECRET_LENGTH))).toHaveLength(
      640,
    )
    expectError(
      () => decodeTotpSecret('A'.repeat(TOTP_MAX_SECRET_LENGTH + 1)),
      'secretTooLong',
      'secret',
    )
    expectError(
      () => decodeTotpSecret(' '.repeat(TOTP_MAX_SECRET_LENGTH + 1)),
      'secretTooLong',
      'secret',
    )
  })
  it.each(['', ' \t\n--'])('rejects empty secret %j', (input) => {
    expectError(() => decodeTotpSecret(input), 'secretRequired', 'secret')
  })
  it.each([
    'A',
    'AAA',
    'AAAAAA',
    'MZ',
    'MZ======',
    'MY=',
    'MY=======',
    'MZXW6YTB=',
    '=MY',
    'MY======A',
    'AA0A',
    'AA1A',
    'AA8A',
    'AA9A',
    'AA_A',
    'AA/A',
    'AA\u00a0AA',
    '密钥',
    'ſA',
    'ıA',
    'ﬀAAAAAA',
    'otpauth://totp/test?secret=MY',
  ])('rejects malformed secret %j', (input) => {
    expectError(() => decodeTotpSecret(input), 'invalidSecret', 'secret')
  })
})
