import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  generateLinearGradient,
  gradientExample,
  GradientError,
  type GradientStop,
} from '../css-gradient'

const stops = (): GradientStop[] => [
  { color: '#FF0000', position: '0', opacity: '100' },
  { color: '#00ff00', position: '100', opacity: '100' },
]
describe('linear CSS gradient', () => {
  it('normalizes colors and numbers and emits a pasteable declaration', () => {
    const input = stops()
    input[0].color = ' #FF0000 '
    input[0].position = ' 000 '
    expect(generateLinearGradient(' 090 ', input)).toEqual({
      value: 'linear-gradient(90deg, #ff0000 0%, #00ff00 100%)',
      css: 'background-image: linear-gradient(90deg, #ff0000 0%, #00ff00 100%);',
    })
  })
  it('converts opacity without discarding RGB channels and allows transparent ends', () => {
    const input = stops()
    input[0].opacity = '0'
    input[1].opacity = '1'
    expect(generateLinearGradient('-360', input).value).toBe(
      'linear-gradient(-360deg, rgba(255, 0, 0, 0) 0%, rgba(0, 255, 0, 0.01) 100%)',
    )
  })
  it('preserves same-position hard stops and allows endpoints inside the range', () => {
    const input = stops()
    input[0].position = input[1].position = '50'
    expect(generateLinearGradient('360', input).value).toBe(
      'linear-gradient(360deg, #ff0000 50%, #00ff00 50%)',
    )
  })
  it('accepts the maximum eight stops, identical colors and zero angle', () => {
    const input = Array.from({ length: 8 }, () => stops()[0])
    expect(generateLinearGradient('-0', input).value).toBe(
      `linear-gradient(0deg, ${Array(8).fill('#ff0000 0%').join(', ')})`,
    )
  })
  it('generates the three-stop example without modifying its input', () => {
    const example = gradientExample()
    const original = structuredClone(example)
    expect(generateLinearGradient(example.angle, example.stops).value).toBe(
      'linear-gradient(135deg, #2563eb 0%, rgba(168, 85, 247, 0.8) 50%, rgba(236, 72, 153, 0.4) 100%)',
    )
    expect(example).toEqual(original)
    example.stops[0].color = '#000000'
    expect(gradientExample()).toEqual(original)
  })
  it.each([
    '',
    ' ',
    '361',
    '-361',
    '1.5',
    '1e2',
    '0x10',
    'NaN',
    'Infinity',
    '+90',
    '90deg',
    '1; color:red',
  ])('rejects invalid angle %j', (angle) => {
    expect(() => generateLinearGradient(angle, stops())).toThrowError(
      new GradientError('invalidAngle'),
    )
  })
  it.each([
    'red',
    '#fff',
    '#ffff',
    '#ffffffff',
    'ff0000',
    '#ff00gg',
    '#123456; color:red',
    '',
  ])('rejects invalid color %j', (color) => {
    const input = stops()
    input[1].color = color
    try {
      generateLinearGradient('0', input)
      expect.fail('must reject invalid color')
    } catch (error) {
      expect(error).toMatchObject({
        code: 'invalidColor',
        field: 'color',
        stop: 1,
      })
    }
  })
  it.each(['position', 'opacity'] as const)(
    'validates %s bounds and integer syntax with the correct field',
    (field) => {
      for (const value of [
        '',
        '101',
        '-1',
        '99.5',
        '1e1',
        '100%',
        'Infinity',
      ]) {
        const input = stops()
        input[1][field] = value
        try {
          generateLinearGradient('0', input)
          expect.fail('must reject invalid number')
        } catch (error) {
          expect(error).toMatchObject({
            code: field === 'position' ? 'invalidPosition' : 'invalidOpacity',
            field,
            stop: 1,
          })
        }
      }
    },
  )
  it('rejects decreasing positions instead of silently moving or sorting stops', () => {
    const input = stops()
    input[0].position = '80'
    input[1].position = '20'
    try {
      generateLinearGradient('0', input)
      expect.fail('must reject decreasing positions')
    } catch (error) {
      expect(error).toMatchObject({
        code: 'stopOrder',
        field: 'position',
        stop: 1,
      })
    }
  })
  it.each([0, 1, 9])('rejects %i stops', (count) => {
    expect(() =>
      generateLinearGradient(
        '0',
        Array.from({ length: count }, () => stops()[0]),
      ),
    ).toThrowError(new GradientError('stopCount'))
  })
  it('keeps arbitrary valid stop counts, RGB values, opacity and positions in order', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -360, max: 360 }),
        fc.array(
          fc.record({
            rgb: fc.integer({ min: 0, max: 0xffffff }),
            position: fc.integer({ min: 0, max: 100 }),
            opacity: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 2, maxLength: 8 },
        ),
        (angle, samples) => {
          samples.sort((a, b) => a.position - b.position)
          const input = samples.map((sample) => ({
            color: `#${sample.rgb.toString(16).padStart(6, '0')}`,
            position: String(sample.position),
            opacity: String(sample.opacity),
          }))
          const output = generateLinearGradient(String(angle), input)
          const expected = samples.map(
            (sample, index) =>
              `${sample.opacity === 100 ? input[index].color : `rgba(${sample.rgb >> 16}, ${(sample.rgb >> 8) & 255}, ${sample.rgb & 255}, ${sample.opacity / 100})`} ${sample.position}%`,
          )
          expect(output.css).toBe(
            `background-image: linear-gradient(${angle}deg, ${expected.join(', ')});`,
          )
        },
      ),
      { numRuns: 100 },
    )
  })
})
