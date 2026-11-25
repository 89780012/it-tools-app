export interface DecodedJwt {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: Uint8Array
  signingInput: string
}
export type ClaimStatus =
  'expired' | 'active' | 'future' | 'issued' | 'invalidDate'

export function decodeBase64Url(segment: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(segment) || segment.length % 4 === 1)
    throw new Error('invalidToken')
  let binary: string
  try {
    binary = atob(
      segment.replace(/-/g, '+').replace(/_/g, '/') +
        '='.repeat((4 - (segment.length % 4)) % 4),
    )
  } catch {
    throw new Error('invalidToken')
  }
  // Reject noncanonical encodings, including nonzero padding bits.
  if (
    btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_') !==
    segment
  )
    throw new Error('invalidToken')
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

export function decodeJwt(token: string): DecodedJwt {
  const parts = token.trim().split('.')
  if (parts.length !== 3 || token.length > 200_000)
    throw new Error('invalidToken')
  try {
    const parse = (segment: string) => {
      const parsed: unknown = JSON.parse(
        new TextDecoder('utf-8', { fatal: true }).decode(
          decodeBase64Url(segment),
        ),
      )
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
        throw new Error('invalidToken')
      return parsed as Record<string, unknown>
    }
    const header = parse(parts[0])
    const payload = parse(parts[1])
    if (typeof header.alg !== 'string' || !header.alg)
      throw new Error('invalidToken')
    // The empty signature is only valid for unsecured JWTs (alg: none).
    const signature =
      parts[2] === '' && header.alg === 'none'
        ? new Uint8Array()
        : decodeBase64Url(parts[2])
    return {
      header,
      payload,
      signature,
      signingInput: `${parts[0]}.${parts[1]}`,
    }
  } catch {
    throw new Error('invalidToken')
  }
}

export function jwtClaims(payload: Record<string, unknown>, now = Date.now()) {
  return (['exp', 'iat', 'nbf'] as const)
    .filter((key) => Object.hasOwn(payload, key))
    .map((key) => {
      const value = payload[key]
      const milliseconds = typeof value === 'number' ? value * 1000 : NaN
      const date = new Date(milliseconds)
      let status: ClaimStatus = 'invalidDate'
      if (Number.isFinite(milliseconds) && !Number.isNaN(date.getTime())) {
        status =
          key === 'exp'
            ? milliseconds <= now
              ? 'expired'
              : 'active'
            : milliseconds > now
              ? 'future'
              : key === 'iat'
                ? 'issued'
                : 'active'
      }
      return {
        key,
        value,
        date: status === 'invalidDate' ? null : date.toISOString(),
        status,
      }
    })
}

export async function verifyHs256(
  decoded: DecodedJwt,
  secret: string,
): Promise<boolean> {
  if (decoded.header.alg !== 'HS256') throw new Error('unsupportedAlgorithm')
  // Critical extensions require dedicated processing; never report success without it.
  if (decoded.header.crit !== undefined || decoded.header.b64 !== undefined)
    throw new Error('unsupportedAlgorithm')
  if (!secret) throw new Error('secretRequired')
  if (!globalThis.crypto?.subtle) throw new Error('cryptoUnavailable')
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  return crypto.subtle.verify(
    'HMAC',
    key,
    new Uint8Array(decoded.signature),
    new TextEncoder().encode(decoded.signingInput),
  )
}
