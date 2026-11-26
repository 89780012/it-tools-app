import { createMD5, createSHA256, createSHA512 } from 'hash-wasm'
export type HashAlgorithm = 'MD5' | 'SHA-256' | 'SHA-512'
const factories = {
  MD5: createMD5,
  'SHA-256': createSHA256,
  'SHA-512': createSHA512,
}
export async function hashFile(
  file: Blob,
  algorithm: HashAlgorithm,
  progress: (fraction: number) => void = () => {},
  signal?: AbortSignal,
) {
  const hasher = await factories[algorithm]()
  hasher.init()
  const chunkSize = 2 * 1024 * 1024
  for (let offset = 0; offset < file.size; offset += chunkSize) {
    signal?.throwIfAborted()
    const chunk = await file.slice(offset, offset + chunkSize).arrayBuffer()
    signal?.throwIfAborted()
    hasher.update(new Uint8Array(chunk))
    progress(Math.min(1, (offset + chunkSize) / file.size))
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
  signal?.throwIfAborted()
  progress(1)
  return hasher.digest('hex')
}
export function matchesHash(actual: string, expected: string) {
  return (
    /^[a-f\d]+$/i.test(expected.trim()) &&
    actual.toLowerCase() === expected.trim().toLowerCase()
  )
}
