export const IPV6_MAX_INPUT = 256
export type Ipv6ErrorCode =
  'required' | 'tooLong' | 'invalidCidr' | 'invalidAddress' | 'invalidPrefix'

export class Ipv6SubnetError extends Error {
  constructor(public readonly code: Ipv6ErrorCode) {
    super(code)
    this.name = 'Ipv6SubnetError'
  }
}

function parseAddress(address: string): bigint {
  const invalid = () => {
    throw new Ipv6SubnetError('invalidAddress')
  }
  if (!address.includes(':') || /[^\da-fA-F:.]/.test(address)) return invalid()
  if (address.includes('.')) {
    const colon = address.lastIndexOf(':')
    const octets = address.slice(colon + 1).split('.')
    if (
      octets.length !== 4 ||
      octets.some(
        (part) => !/^(0|[1-9]\d{0,2})$/.test(part) || Number(part) > 255,
      )
    )
      return invalid()
    const bytes = octets.map(Number)
    address =
      address.slice(0, colon + 1) +
      ((bytes[0] << 8) | bytes[1]).toString(16) +
      ':' +
      ((bytes[2] << 8) | bytes[3]).toString(16)
  }
  const halves = address.split('::')
  if (halves.length > 2) return invalid()
  const left = halves[0] ? halves[0].split(':') : []
  const right = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  const explicit = left.length + right.length
  if (
    (halves.length === 1 && explicit !== 8) ||
    (halves.length === 2 && explicit >= 8)
  )
    return invalid()
  if ([...left, ...right].some((part) => !/^[\da-fA-F]{1,4}$/.test(part)))
    return invalid()
  const groups =
    halves.length === 2
      ? [...left, ...Array<string>(8 - explicit).fill('0'), ...right]
      : left
  return groups.reduce(
    (value, group) => (value << 16n) | BigInt(parseInt(group, 16)),
    0n,
  )
}

function groupsOf(value: bigint): string[] {
  return value.toString(16).padStart(32, '0').match(/.{4}/g)!
}

// RFC 5952: lowercase, suppress leading zeros, compress the first longest run
// of at least two zero groups. IPv4 tails are normalized to hexadecimal.
function compress(value: bigint): string {
  const groups = groupsOf(value).map((group) =>
    parseInt(group, 16).toString(16),
  )
  let start = -1
  let length = 1
  for (let i = 0; i < groups.length;) {
    if (groups[i] !== '0') {
      i++
      continue
    }
    let end = i
    while (end < groups.length && groups[end] === '0') end++
    if (end - i > length) {
      start = i
      length = end - i
    }
    i = end
  }
  return start < 0
    ? groups.join(':')
    : `${groups.slice(0, start).join(':')}::${groups.slice(start + length).join(':')}`
}

export function calculateIpv6Subnet(input: string) {
  if (input.length > IPV6_MAX_INPUT) throw new Ipv6SubnetError('tooLong')
  const text = input.trim()
  if (!text) throw new Ipv6SubnetError('required')
  const parts = text.split('/')
  if (parts.length !== 2) throw new Ipv6SubnetError('invalidCidr')
  if (!/^(0|[1-9]\d{0,2})$/.test(parts[1]) || Number(parts[1]) > 128)
    throw new Ipv6SubnetError('invalidPrefix')
  const address = parseAddress(parts[0])
  const prefix = Number(parts[1])
  const hostBits = 128 - prefix
  const count = 1n << BigInt(hostBits)
  const allBits = (1n << 128n) - 1n
  const mask = allBits ^ (count - 1n)
  const network = address & mask
  return {
    normalized: `${compress(address)}/${prefix}`,
    expanded: groupsOf(address).join(':'),
    network: `${compress(network)}/${prefix}`,
    first: compress(network),
    last: compress(network + count - 1n),
    mask: groupsOf(mask).join(':'),
    prefix: String(prefix),
    hostBits: String(hostBits),
    count: count.toString(),
    offset: (address - network).toString(),
  }
}
