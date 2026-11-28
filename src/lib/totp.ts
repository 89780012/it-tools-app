import CryptoJS from 'crypto-js'

export const TOTP_MAX_SECRET_LENGTH = 1024
export const TOTP_MAX_TIMESTAMP = 253402300799
export type TotpErrorCode =
  | 'secretRequired'
  | 'secretTooLong'
  | 'invalidSecret'
  | 'invalidAlgorithm'
  | 'invalidDigits'
  | 'invalidPeriod'
  | 'invalidTimestamp'
export class TotpError extends Error {
  constructor(
    public code: TotpErrorCode,
    public field: 'secret' | 'algorithm' | 'digits' | 'period' | 'timestamp',
  ) {
    super(code)
  }
}

/** RFC 4648 Base32: optional canonical padding; ASCII spaces and hyphens are separators. */
export function decodeTotpSecret(secret: string): Uint8Array {
  if (secret.length > TOTP_MAX_SECRET_LENGTH)
    throw new TotpError('secretTooLong', 'secret')
  const compact = secret.replace(/[\x09-\x0d -]/g, '')
  if (!compact) throw new TotpError('secretRequired', 'secret')
  if (/[^A-Za-z2-7=]/.test(compact))
    throw new TotpError('invalidSecret', 'secret')
  const normalized = compact.toUpperCase()
  const match = /^([A-Z2-7]+)(=*)$/.exec(normalized)
  if (!match) throw new TotpError('invalidSecret', 'secret')
  const [, data, padding] = match
  const remainder = data.length % 8
  if (
    ![0, 2, 4, 5, 7].includes(remainder) ||
    (padding.length > 0 && padding.length !== (8 - remainder) % 8)
  ) {
    throw new TotpError('invalidSecret', 'secret')
  }
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const bytes: number[] = []
  let buffer = 0
  let bits = 0
  for (const character of data) {
    buffer = (buffer << 5) | alphabet.indexOf(character)
    bits += 5
    if (bits >= 8) {
      bits -= 8
      bytes.push((buffer >>> bits) & 255)
      buffer &= (1 << bits) - 1
    }
  }
  // Nonzero unused bits are a noncanonical encoding of a different secret.
  if (buffer !== 0) throw new TotpError('invalidSecret', 'secret')
  return Uint8Array.from(bytes)
}

export interface TotpOptions {
  secret: string
  algorithm: string
  digits: number
  period: number
  timestamp: number
}

export function generateTotp({
  secret,
  algorithm,
  digits,
  period,
  timestamp,
}: TotpOptions) {
  const key = decodeTotpSecret(secret)
  if (!['SHA1', 'SHA256', 'SHA512'].includes(algorithm))
    throw new TotpError('invalidAlgorithm', 'algorithm')
  if (digits !== 6 && digits !== 8)
    throw new TotpError('invalidDigits', 'digits')
  if (!Number.isInteger(period) || period < 1 || period > 300)
    throw new TotpError('invalidPeriod', 'period')
  if (
    !Number.isSafeInteger(timestamp) ||
    timestamp < 0 ||
    timestamp > TOTP_MAX_TIMESTAMP
  )
    throw new TotpError('invalidTimestamp', 'timestamp')
  const counter = Math.floor(timestamp / period)
  // Eight-byte, big-endian counter; never truncate the timestamp to 32 bits.
  const message = CryptoJS.lib.WordArray.create(
    [Math.floor(counter / 0x100000000), counter >>> 0],
    8,
  )
  const words = Array.from({ length: Math.ceil(key.length / 4) }, () => 0)
  key.forEach((byte, index) => {
    words[index >>> 2] |= byte << (24 - (index % 4) * 8)
  })
  const keyWords = CryptoJS.lib.WordArray.create(words, key.length)
  const hmac =
    algorithm === 'SHA1'
      ? CryptoJS.HmacSHA1
      : algorithm === 'SHA256'
        ? CryptoJS.HmacSHA256
        : CryptoJS.HmacSHA512
  const digest = hmac(message, keyWords)
  const byteAt = (index: number) =>
    (digest.words[index >>> 2] >>> (24 - (index % 4) * 8)) & 255
  const offset = byteAt(digest.sigBytes - 1) & 15
  const binary =
    (byteAt(offset) & 127) * 0x1000000 +
    byteAt(offset + 1) * 0x10000 +
    byteAt(offset + 2) * 256 +
    byteAt(offset + 3)
  return {
    code: String(binary % 10 ** digits).padStart(digits, '0'),
    counter,
    validFrom: counter * period,
    validUntil: (counter + 1) * period,
    remaining: period - (timestamp % period),
  }
}
