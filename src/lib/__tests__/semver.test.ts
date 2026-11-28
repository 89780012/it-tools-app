import { describe, expect, it } from 'vitest'
import {
  compareSemanticVersions,
  MAX_VERSION_INPUT,
  MAX_VERSIONS,
  parseSemanticVersion,
  SemverError,
  sortSemanticVersions,
} from '../semver'

const compare = (left: string, right: string) =>
  compareSemanticVersions(
    parseSemanticVersion(left)!,
    parseSemanticVersion(right)!,
  )

describe('SemVer 2.0 parsing and precedence', () => {
  it('implements the complete official prerelease ordering example', () => {
    const sequence = [
      '1.0.0-alpha',
      '1.0.0-alpha.1',
      '1.0.0-alpha.beta',
      '1.0.0-beta',
      '1.0.0-beta.2',
      '1.0.0-beta.11',
      '1.0.0-rc.1',
      '1.0.0',
    ]
    expect(
      sortSemanticVersions([...sequence].reverse().join('\n'), 'ascending')
        .output,
    ).toBe(sequence.join('\n'))
    for (let i = 1; i < sequence.length; i++) {
      expect(compare(sequence[i - 1], sequence[i])).toBe(-1)
      expect(compare(sequence[i], sequence[i - 1])).toBe(1)
    }
  })

  it.each([
    '0.0.0',
    '1.2.3-0',
    '1.2.3-a-b.1',
    '1.2.3+001.build-2',
    '1.2.3-alpha+build.001',
  ])('accepts %s', (version) => {
    expect(parseSemanticVersion(version, false)).not.toBeNull()
  })

  it.each([
    '',
    '1',
    '1.2',
    '1.2.3.4',
    '01.2.3',
    '1.02.3',
    '1.2.03',
    '1.2.3-01',
    '1.2.3-alpha.01',
    '1.2.3-',
    '1.2.3+',
    '1.2.3-a..b',
    '1.2.3+a..b',
    '1.2.3+abc+def',
    '1.2.3-α',
    '1.2.3-a_b',
    '1.2.3 a',
    '>=1.2.3',
    'V1.2.3',
    'vv1.2.3',
    '1.2.3\n',
    '1.2.3-alpha\n',
  ])('rejects %s', (version) => {
    expect(parseSemanticVersion(version)).toBeNull()
  })

  it('compares numeric cores and prereleases beyond Number precision and uses ASCII order', () => {
    expect(compare('9007199254740992.0.0', '9007199254740993.0.0')).toBe(-1)
    expect(compare('1.9007199254740993.0', '1.9007199254740992.99')).toBe(1)
    expect(compare('1.0.9007199254740993', '1.0.9007199254740992')).toBe(1)
    expect(compare('1.0.0-9007199254740992', '1.0.0-9007199254740993')).toBe(-1)
    expect(compare('1.0.0-999999999999999999999', '1.0.0-A')).toBe(-1)
    expect(compare('1.0.0-Z', '1.0.0-a')).toBe(-1)
    expect(compare('1.10.0', '1.9.99')).toBe(1)
  })

  it('ignores build metadata and retains original equal-precedence order in both directions', () => {
    const input = 'v1.0.0+z\n1.0.0+001\n1.0.0+001\n1.0.0+a'
    expect(compare('v1.0.0+z', '1.0.0+a')).toBe(0)
    for (const order of ['ascending', 'descending'] as const) {
      expect(sortSemanticVersions(input, order).output).toBe(input)
    }
  })

  it('handles blank lines, surrounding whitespace, CRLF and lone CR with correct source line errors', () => {
    expect(sortSemanticVersions('\r\n 1.0.0 \r1.2.0\n\t').output).toBe(
      '1.2.0\n1.0.0',
    )
    expect(() => sortSemanticVersions('\n1.0.0\r\nwrong')).toThrow(
      expect.objectContaining({ code: 'invalid', line: 3 }),
    )
    expect(() => sortSemanticVersions(' \n\t')).toThrow(
      expect.objectContaining({ code: 'empty' }),
    )
  })

  it('allows only an optional lowercase v prefix', () => {
    expect(parseSemanticVersion('v1.2.3')).not.toBeNull()
    expect(parseSemanticVersion('v1.2.3', false)).toBeNull()
    expect(() => sortSemanticVersions('v1.2.3', 'ascending', false)).toThrow(
      SemverError,
    )
  })

  it('finds extrema independently of order, distinguishes no stable version and handles a single version', () => {
    for (const order of ['ascending', 'descending'] as const) {
      expect(
        sortSemanticVersions('2.0.0-rc.1\n1.10.0+001\n1.9.0', order),
      ).toMatchObject({
        count: 3,
        highest: '2.0.0-rc.1',
        lowest: '1.9.0',
        stable: '1.10.0+001',
      })
    }
    expect(sortSemanticVersions('1.0.0-alpha')).toMatchObject({
      stable: null,
      highest: '1.0.0-alpha',
      lowest: '1.0.0-alpha',
      count: 1,
    })
    expect(sortSemanticVersions('0.0.0')).toMatchObject({ stable: '0.0.0' })
  })

  it('enforces input and non-empty version limits at their boundaries', () => {
    const exact = '1.0.0+' + 'a'.repeat(MAX_VERSION_INPUT - 6)
    expect(sortSemanticVersions(exact).count).toBe(1)
    expect(() => sortSemanticVersions(exact + 'a')).toThrow(
      expect.objectContaining({ code: 'inputLimit' }),
    )
    const lines = Array(MAX_VERSIONS).fill('1.0.0').join('\n')
    expect(sortSemanticVersions('\n' + lines + '\n').count).toBe(MAX_VERSIONS)
    expect(() => sortSemanticVersions(lines + '\n2.0.0')).toThrow(
      expect.objectContaining({ code: 'versionLimit', line: MAX_VERSIONS + 1 }),
    )
  })
})
