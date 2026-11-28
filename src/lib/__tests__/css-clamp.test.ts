import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  CssClampError,
  generateCssClamp,
  sizeAtViewport,
  type ClampInput,
} from '../css-clamp'
const example: ClampInput = {
  startWidth: '320',
  endWidth: '1280',
  startSize: '16',
  endSize: '40',
  rootSize: '16',
}
// Read the emitted CSS independently, including rounded coefficients.
function cssValue(css: string, width: number, root: number) {
  const num = '(-?\\d+(?:\\.\\d+)?)'
  const m = css.match(
    new RegExp(`^font-size: clamp\\(${num}(px|rem), (.+), ${num}\\2\\);$`),
  )!
  expect(m).not.toBeNull()
  const [, low, unit, preferred, high] = m
  const scale = unit === 'rem' ? root : 1
  const parts = preferred.match(
    new RegExp(`^calc\\(${num}${unit} ([+-]) ${num}vw\\)$`),
  )
  const value = parts
    ? Number(parts[1]) * scale +
      ((parts[2] === '-' ? -1 : 1) * Number(parts[3]) * width) / 100
    : parseFloat(preferred) * scale
  return Math.max(Number(low) * scale, Math.min(Number(high) * scale, value))
}
describe('fluid font-size CSS', () => {
  it('generates usable px and rem declarations with no implicit root rule', () => {
    expect(generateCssClamp(example, 'rem').css).toBe(
      'font-size: clamp(1rem, calc(0.5rem + 2.5vw), 2.5rem);',
    )
    expect(generateCssClamp(example, 'px').css).toBe(
      'font-size: clamp(16px, calc(8px + 2.5vw), 40px);',
    )
  })
  it('sorts bounds for decreasing sizes and uses a negative slope', () => {
    const result = generateCssClamp(
      { ...example, startSize: '40', endSize: '16' },
      'rem',
    )
    expect(result.css).toBe(
      'font-size: clamp(1rem, calc(3rem - 2.5vw), 2.5rem);',
    )
    expect(sizeAtViewport(result, 320)).toBe(40)
    expect(sizeAtViewport(result, 800)).toBe(28)
    expect(sizeAtViewport(result, 1280)).toBe(16)
    expect(sizeAtViewport(result, 0)).toBe(40)
    expect(sizeAtViewport(result, 2000)).toBe(16)
  })
  it.each(['0', '18.125'])(
    'supports constant sizes, including zero: %s',
    (size) => {
      const result = generateCssClamp(
        { ...example, startSize: size, endSize: size },
        'px',
      )
      expect(result.css).toBe(
        `font-size: clamp(${size}px, ${size}px, ${size}px);`,
      )
      expect(cssValue(result.css, 800, 16)).toBe(Number(size))
    },
  )
  it('supports negative intercepts and decimal sizes/root sizes', () => {
    const result = generateCssClamp(
      { ...example, startSize: '0.125', endSize: '40.875', rootSize: '18.125' },
      'rem',
    )
    expect(result.css).toContain('calc(-')
    expect(cssValue(result.css, 320, 18.125)).toBeCloseTo(0.125, 7)
    expect(cssValue(result.css, 1280, 18.125)).toBeCloseTo(40.875, 7)
  })
  it('accepts exact limits and trims outside whitespace', () => {
    const result = generateCssClamp(
      {
        startWidth: ' 1 ',
        endWidth: '100000',
        startSize: '0',
        endSize: '10000',
        rootSize: '1000',
      },
      'rem',
    )
    expect(cssValue(result.css, 1, 1000)).toBeCloseTo(0, 5)
    expect(cssValue(result.css, 100000, 1000)).toBeCloseTo(10000, 5)
  })
  it('does not emit exponent notation or negative zero at tiny coefficients', () => {
    const result = generateCssClamp(
      {
        startWidth: '1',
        endWidth: '100000',
        startSize: '0.001',
        endSize: '0',
        rootSize: '1000',
      },
      'rem',
    )
    expect(result.css).not.toMatch(/\de[+-]|-0(?:px|rem|vw)/)
    expect(cssValue(result.css, 50000, 1000)).toBeCloseTo(0.0005, 6)
  })
  it.each([
    ['startWidth', '', 'invalidWidth'],
    ['startWidth', '0', 'invalidWidth'],
    ['endWidth', '100001', 'invalidWidth'],
    ['startWidth', '320.5', 'invalidWidth'],
    ['startWidth', '1e3', 'invalidWidth'],
    ['startWidth', '+320', 'invalidWidth'],
    ['startWidth', 'NaN', 'invalidWidth'],
    ['startWidth', 'Infinity', 'invalidWidth'],
    ['startWidth', '３２０', 'invalidWidth'],
    ['startWidth', '320px', 'invalidWidth'],
    ['endWidth', '320', 'viewportOrder'],
    ['endWidth', '319', 'viewportOrder'],
    ['startSize', '', 'invalidSize'],
    ['startSize', '-1', 'invalidSize'],
    ['endSize', '10000.001', 'invalidSize'],
    ['startSize', '1.0001', 'invalidSize'],
    ['startSize', '1,5', 'invalidSize'],
    ['startSize', '.5', 'invalidSize'],
    ['startSize', '2; color: red', 'invalidSize'],
    ['startSize', '0'.repeat(33), 'invalidSize'],
    ['rootSize', '0.999', 'invalidRoot'],
    ['rootSize', '1000.001', 'invalidRoot'],
    ['rootSize', '16.0001', 'invalidRoot'],
    ['rootSize', '', 'invalidRoot'],
  ] as const)(
    'rejects %s = %s and identifies its field',
    (field, value, code) => {
      try {
        generateCssClamp({ ...example, [field]: value }, 'rem')
        expect.fail('Expected a validation error')
      } catch (error) {
        expect(error).toBeInstanceOf(CssClampError)
        expect(error).toMatchObject({ code, field })
      }
    },
  )
  it('keeps emitted CSS within 0.00001px of independent interpolation over varied inputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 99999 }),
        fc.integer({ min: 1, max: 100000 }),
        fc.integer({ min: 0, max: 10000000 }),
        fc.integer({ min: 0, max: 10000000 }),
        fc.integer({ min: 1000, max: 1000000 }),
        (first, distance, a, b, rootMilli) => {
          const end = Math.min(100000, first + distance)
          const startSize = a / 1000,
            endSize = b / 1000,
            root = rootMilli / 1000
          const input = {
            startWidth: String(first),
            endWidth: String(end),
            startSize: String(startSize),
            endSize: String(endSize),
            rootSize: String(root),
          }
          for (const unit of ['px', 'rem'] as const) {
            const result = generateCssClamp(input, unit)
            for (const fraction of [-0.5, 0, 0.25, 0.5, 1, 1.5]) {
              const width = first + (end - first) * fraction
              const expected =
                startSize +
                Math.max(0, Math.min(1, fraction)) * (endSize - startSize)
              expect(
                Math.abs(cssValue(result.css, width, root) - expected),
              ).toBeLessThan(0.00001)
              expect(sizeAtViewport(result, width)).toBeCloseTo(expected, 8)
            }
          }
        },
      ),
      { seed: 20261128, numRuns: 500 },
    )
  })
})
