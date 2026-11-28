export const MAX_CIDR_INPUT = 500_000
export const MAX_CIDR_ENTRIES = 10_000

export class CidrAggregationError extends Error {
  constructor(
    public readonly code:
      | 'empty'
      | 'inputLimit'
      | 'entryLimit'
      | 'invalidAddress'
      | 'invalidPrefix',
    public readonly line = 0,
  ) {
    super(code)
    this.name = 'CidrAggregationError'
  }
}

function formatAddress(value: number): string {
  return [24, 16, 8, 0]
    .map((bits) => Math.floor(value / 2 ** bits) % 256)
    .join('.')
}

export function aggregateIpv4Cidrs(input: string) {
  if (input.length > MAX_CIDR_INPUT)
    throw new CidrAggregationError('inputLimit')
  const ranges: { start: number; end: number }[] = []
  let normalizedEntries = 0
  const lines = input.split(/\r\n|\n|\r/)
  for (let index = 0; index < lines.length; index++) {
    const text = lines[index].trim()
    if (!text) continue
    const line = index + 1
    if (ranges.length >= MAX_CIDR_ENTRIES)
      throw new CidrAggregationError('entryLimit', line)
    const [address, prefixText, extra] = text.split('/')
    const octets = address.split('.')
    if (
      octets.length !== 4 ||
      octets.some(
        (octet) => !/^(0|[1-9]\d{0,2})$/.test(octet) || Number(octet) > 255,
      )
    )
      throw new CidrAggregationError('invalidAddress', line)
    if (
      extra !== undefined ||
      (prefixText !== undefined &&
        (!/^(0|[1-9]\d?)$/.test(prefixText) || Number(prefixText) > 32))
    )
      throw new CidrAggregationError('invalidPrefix', line)
    const prefix = prefixText === undefined ? 32 : Number(prefixText)
    const value = octets.reduce((sum, octet) => sum * 256 + Number(octet), 0)
    const size = 2 ** (32 - prefix)
    const start = Math.floor(value / size) * size
    if (start !== value) normalizedEntries++
    ranges.push({ start, end: start + size - 1 })
  }
  if (!ranges.length) throw new CidrAggregationError('empty')
  ranges.sort((a, b) => a.start - b.start || a.end - b.end)
  const merged: typeof ranges = []
  for (const range of ranges) {
    const previous = merged[merged.length - 1]
    if (previous && range.start <= previous.end + 1)
      previous.end = Math.max(previous.end, range.end)
    else merged.push({ ...range })
  }
  const cidrs: string[] = []
  let addressCount = 0
  for (const range of merged) {
    addressCount += range.end - range.start + 1
    let start = range.start
    while (start <= range.end) {
      // All arithmetic is exact up to 2^32. Avoid signed 32-bit bitwise operations
      // and never enumerate addresses, including for the entire IPv4 space.
      let bits = 0
      while (
        bits < 32 &&
        start % 2 ** (bits + 1) === 0 &&
        2 ** (bits + 1) <= range.end - start + 1
      )
        bits++
      cidrs.push(`${formatAddress(start)}/${32 - bits}`)
      start += 2 ** bits
    }
  }
  return {
    cidrs,
    output: cidrs.join('\n'),
    inputCount: ranges.length,
    outputCount: cidrs.length,
    addressCount,
    normalizedEntries,
  }
}

export type CidrAggregationResult = ReturnType<typeof aggregateIpv4Cidrs>
