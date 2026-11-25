import { describe, expect, it, vi, afterEach } from 'vitest'
import { Blob as NodeBlob } from 'node:buffer'
import {
  frontendContrast,
  frontendContrastLevels,
  frontendHex,
  frontendLuminance,
} from '@/lib/frontend-contrast'
import {
  frontendImageDimensions,
  frontendResize,
  frontendSavings,
  frontendImageExtension,
  frontendDetectImage,
  frontendLoadImage,
} from '@/lib/frontend-image'
import {
  frontendMarkdownTable,
  renderFrontendMarkdown,
} from '@/lib/frontend-markdown'
import { formatFrontendCss } from '@/lib/frontend-css'

afterEach(() => vi.unstubAllGlobals())
describe('frontend contrast math', () => {
  it('uses sRGB luminance and the full precision ratio', () => {
    expect(frontendContrast('#000', '#fff')).toBe(21)
    expect(frontendContrast('#777', '#fff')).toBeCloseTo(4.478089, 5)
    expect(frontendContrast('#fff', '#777')).toBe(
      frontendContrast('#777', '#fff'),
    )
    expect(frontendContrast('#123456', '#123456')).toBe(1)
    expect(frontendLuminance('#0a0a0a')).toBeCloseTo(10 / 255 / 12.92, 8)
    expect(
      frontendContrastLevels(frontendContrast('#777', '#fff')).aaNormal,
    ).toBe(false)
  })
  it('applies exact AA and AAA thresholds', () => {
    expect(frontendContrastLevels(3)).toEqual({
      aaNormal: false,
      aaaNormal: false,
      aaLarge: true,
      aaaLarge: false,
    })
    expect(frontendContrastLevels(4.5)).toEqual({
      aaNormal: true,
      aaaNormal: false,
      aaLarge: true,
      aaaLarge: true,
    })
    expect(frontendContrastLevels(6.99999).aaaNormal).toBe(false)
    expect(frontendContrastLevels(7).aaaNormal).toBe(true)
  })
  it('accepts short HEX and rejects alpha and malformed colors', () => {
    expect(frontendHex(' AbC ')).toBe('#aabbcc')
    for (const value of ['#1234', '#12345678', 'red', '#ggg', ''])
      expect(frontendHex(value)).toBeNull()
    expect(() => frontendLuminance('bad!')).toThrow()
  })
})
describe('frontend image math and file validation', () => {
  it('preserves aspect ratio on either axis, including portrait and tiny dimensions', () => {
    expect(frontendResize(640, 480, 320, 'width')).toEqual({
      width: 320,
      height: 240,
    })
    expect(frontendResize(480, 640, 320, 'height')).toEqual({
      width: 240,
      height: 320,
    })
    expect(frontendResize(1000, 1, 1, 'width')).toEqual({ width: 1, height: 1 })
  })
  it('rejects invalid and oversized output dimensions', () => {
    for (const value of [0, -1, 0.5, NaN, Infinity, 16385])
      expect(() => frontendResize(100, 100, value, 'width')).toThrow(
        'dimensionsError',
      )
    expect(() => frontendImageDimensions(8000, 8000)).toThrow('dimensionsError')
    expect(frontendImageDimensions(8000, 4000)).toEqual({
      width: 8000,
      height: 4000,
    })
  })
  it('reports size increases honestly and uses actual MIME extensions', () => {
    expect(frontendSavings(100, 25)).toBe(75)
    expect(frontendSavings(100, 150)).toBe(-50)
    expect(frontendSavings(0, 10)).toBe(0)
    expect(frontendImageExtension('image/jpeg')).toBe('jpg')
    expect(frontendImageExtension('image/png')).toBe('png')
    expect(frontendImageExtension('image/webp')).toBe('webp')
    expect(() => frontendImageExtension('image/gif')).toThrow()
  })
  it('sniffs bytes instead of trusting the supplied MIME', async () => {
    const blob = new NodeBlob(
      [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])],
      { type: 'image/jpeg' },
    )
    expect(await frontendDetectImage(blob as unknown as Blob)).toBe('image/png')
    await expect(
      frontendDetectImage(new NodeBlob(['invalid']) as unknown as Blob),
    ).rejects.toThrow('fileError')
    await expect(frontendLoadImage(new File([], 'empty.png'))).rejects.toThrow(
      'sizeError',
    )
    await expect(
      frontendLoadImage({ size: 26 * 1024 * 1024 } as File),
    ).rejects.toThrow('sizeError')
  })
})
describe('frontend Markdown safety and tables', () => {
  it('renders GFM tables and code while removing executable content and unsafe links', () => {
    const html = renderFrontendMarkdown(
      '# Title\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n```js\nalert(1)\n```\n\n<script>alert(1)</script><img src=x onerror=alert(1)><svg onload=alert(1)></svg>\n\n[bad](javascript:alert%281%29) [good](https://example.com)',
    )
    expect(html).toContain('<table>')
    expect(html).toContain('<pre><code>')
    expect(html).toContain('href="https://example.com"')
    expect(html).not.toMatch(
      /<script|<img|<svg|onerror|onload|href="javascript/i,
    )
  })
  it('escapes pipes, backslashes and line breaks in generated table cells', () => {
    expect(
      frontendMarkdownTable([
        ['a|b', 'c\\d'],
        ['x\ny', 'z\r\nw'],
      ]),
    ).toBe('| a\\|b | c\\\\d |\n| --- | --- |\n| x<br>y | z<br>w |')
    expect(frontendMarkdownTable([])).toBe('')
    const html = renderFrontendMarkdown(
      frontendMarkdownTable([['a|b'], ['x\ny']]),
    )
    expect(html).toContain('a|b')
    expect(html).toContain('x<br>y')
  })
  it('returns no HTML on the server', () => {
    vi.stubGlobal('window', undefined)
    expect(renderFrontendMarkdown('<script>bad()</script>')).toBe('')
  })
})
describe('frontend CSS formatting', () => {
  it('preserves strings, calc whitespace and custom property values', async () => {
    const source =
      'a{content:"a  b;{}";width:calc(100% - 2px);--gap:1px  2px;margin:var(--gap)}'
    const formatted = await formatFrontendCss(source, '4')
    expect(formatted).toContain('    content: "a  b;{}";')
    expect(formatted).toContain('calc(100% - 2px)')
    expect(formatted).toContain('--gap: 1px 2px;')
    expect(await formatFrontendCss(formatted, '4')).toBe(formatted)
    expect(await formatFrontendCss('a{color:red}', 'tab')).toContain(
      '\tcolor: red;',
    )
  })
  it('rejects invalid CSS rather than emitting partial output', async () => {
    await expect(formatFrontendCss('a { color: red;')).rejects.toThrow()
    await expect(
      formatFrontendCss('a { content: "unterminated; }'),
    ).rejects.toThrow()
    expect(await formatFrontendCss('')).toBe('')
  })
})
