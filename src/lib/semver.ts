export const MAX_VERSION_INPUT = 500_000
export const MAX_VERSIONS = 10_000

export class SemverError extends Error {
  constructor(
    public code: 'empty' | 'invalid' | 'inputLimit' | 'versionLimit',
    public line = 0,
  ) {
    super(code)
    this.name = 'SemverError'
  }
}

export interface SemanticVersion {
  raw: string
  core: string[]
  prerelease: string[]
}

// Keep numeric identifiers as strings: SemVer does not impose a safe-integer limit.
const numeric = /^[0-9]+$/
const identifier = /^[0-9A-Za-z-]+$/
const coreNumber = /^(0|[1-9][0-9]*)$/

export function parseSemanticVersion(
  raw: string,
  allowV = true,
): SemanticVersion | null {
  const version = allowV && raw.startsWith('v') ? raw.slice(1) : raw
  if (/[^0-9A-Za-z.+-]/.test(version)) return null
  const parts = version.split('+')
  if (parts.length > 2) return null
  if (
    parts.length === 2 &&
    !parts[1].split('.').every((part) => identifier.test(part))
  )
    return null
  const separator = parts[0].indexOf('-')
  const core = (separator < 0 ? parts[0] : parts[0].slice(0, separator)).split(
    '.',
  )
  if (core.length !== 3 || !core.every((part) => coreNumber.test(part)))
    return null
  const prerelease =
    separator < 0 ? [] : parts[0].slice(separator + 1).split('.')
  if (
    !prerelease.every(
      (part) =>
        identifier.test(part) && (!numeric.test(part) || coreNumber.test(part)),
    )
  )
    return null
  return { raw, core, prerelease }
}

function compareNumber(left: string, right: string): number {
  if (left.length !== right.length) return left.length < right.length ? -1 : 1
  return left === right ? 0 : left < right ? -1 : 1
}

export function compareSemanticVersions(
  left: SemanticVersion,
  right: SemanticVersion,
): number {
  for (let index = 0; index < 3; index++) {
    const compared = compareNumber(left.core[index], right.core[index])
    if (compared) return compared
  }
  if (!left.prerelease.length || !right.prerelease.length) {
    return Number(!left.prerelease.length) - Number(!right.prerelease.length)
  }
  for (
    let index = 0;
    index < Math.max(left.prerelease.length, right.prerelease.length);
    index++
  ) {
    const a = left.prerelease[index]
    const b = right.prerelease[index]
    if (a === undefined || b === undefined) return a === undefined ? -1 : 1
    if (a === b) continue
    const aNumeric = numeric.test(a)
    const bNumeric = numeric.test(b)
    if (aNumeric && bNumeric) return compareNumber(a, b)
    if (aNumeric !== bNumeric) return aNumeric ? -1 : 1
    return a < b ? -1 : 1
  }
  return 0
}

export function sortSemanticVersions(
  input: string,
  order: 'ascending' | 'descending' = 'descending',
  allowV = true,
) {
  if (input.length > MAX_VERSION_INPUT) throw new SemverError('inputLimit')
  const versions: SemanticVersion[] = []
  const lines = input.split(/\r\n|\n|\r/)
  for (let index = 0; index < lines.length; index++) {
    const raw = lines[index].trim()
    if (!raw) continue
    if (versions.length === MAX_VERSIONS)
      throw new SemverError('versionLimit', index + 1)
    const parsed = parseSemanticVersion(raw, allowV)
    if (!parsed) throw new SemverError('invalid', index + 1)
    versions.push(parsed)
  }
  if (!versions.length) throw new SemverError('empty')
  const descending = [...versions].sort((a, b) => compareSemanticVersions(b, a))
  // Sort each direction independently to retain input order for equal precedence.
  const sorted =
    order === 'descending'
      ? descending
      : [...versions].sort(compareSemanticVersions)
  return {
    output: sorted.map((version) => version.raw).join('\n'),
    count: versions.length,
    highest: descending[0].raw,
    lowest: [...versions].sort(compareSemanticVersions)[0].raw,
    stable:
      descending.find((version) => !version.prerelease.length)?.raw ?? null,
  }
}

export type SemverSortResult = ReturnType<typeof sortSemanticVersions>
