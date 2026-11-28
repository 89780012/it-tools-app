import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  BEZIER_FIELDS,
  BEZIER_PRESETS,
  BezierError,
  bezierCoordinate,
  generateBezier,
  presetInput,
  sampleBezier,
  type BezierField,
} from '../cubic-bezier'

describe('CSS cubic Bézier generation', () => {
  it('emits both CSS timing declarations and normalizes decimals without losing input precision', () => {
    const result = generateBezier({
      x1: ' +.3400 ',
      y1: '1.5600',
      x2: '0.6400',
      y2: '-0.0000',
    })
    expect(result.easing).toBe('cubic-bezier(0.34, 1.56, 0.64, 0)')
    expect(result.css).toBe(
      'transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 0);\nanimation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 0);',
    )
  })
  it.each(Object.keys(BEZIER_PRESETS) as (keyof typeof BEZIER_PRESETS)[])(
    'accepts the %s preset',
    (preset) => {
      expect(generateBezier(presetInput(preset)).easing).toMatch(
        /^cubic-bezier\(/,
      )
    },
  )
  const invalid = [
    '',
    ' ',
    'NaN',
    'Infinity',
    '1e-1',
    '0x1',
    '1,0',
    '1px',
    '1; color: red',
    '0.00001',
    '--1',
    '.',
    '1.',
    '1'.repeat(33),
  ]
  it.each(BEZIER_FIELDS)(
    'rejects malformed decimals in %s and identifies the field',
    (field) => {
      for (const value of invalid) {
        try {
          generateBezier({ ...presetInput('ease'), [field]: value })
          expect.fail(`accepted ${field}=${value}`)
        } catch (error) {
          expect(error).toBeInstanceOf(BezierError)
          expect(error).toMatchObject({
            field,
            code: field.startsWith('x') ? 'invalidX' : 'invalidY',
          })
        }
      }
    },
  )
  it.each([
    ['x1', '-0.0001'],
    ['x2', '1.0001'],
    ['y1', '-5.0001'],
    ['y2', '5.0001'],
  ] as [BezierField, string][])(
    'rejects the range violation %s=%s',
    (field, value) => {
      expect(() =>
        generateBezier({ ...presetInput('ease'), [field]: value }),
      ).toThrow(BezierError)
    },
  )
  it('accepts exact bounds and keeps the source input unchanged', () => {
    const input = { x1: '0', y1: '-5', x2: '1', y2: '5' }
    expect(generateBezier(input)).toMatchObject({
      x1: 0,
      y1: -5,
      x2: 1,
      y2: 5,
    })
    expect(input).toEqual({ x1: '0', y1: '-5', x2: '1', y2: '5' })
  })
})

describe('elapsed time sampling', () => {
  it.each([
    ['ease', 0.802403387584857],
    ['easeIn', 0.31535681257253934],
    ['easeOut', 0.6846431874274608],
    ['easeInOut', 0.5],
  ] as const)('matches the known %s midpoint', (preset, expected) => {
    expect(
      sampleBezier(generateBezier(presetInput(preset)), 0.5).progress,
    ).toBeCloseTo(expected, 12)
  })
  it('preserves exact endpoints for every preset', () => {
    for (const preset of Object.keys(
      BEZIER_PRESETS,
    ) as (keyof typeof BEZIER_PRESETS)[]) {
      const curve = generateBezier(presetInput(preset))
      for (const endpoint of [0, 1])
        expect(sampleBezier(curve, endpoint)).toEqual({
          parameter: endpoint,
          progress: endpoint,
        })
    }
  })
  it('inverts time rather than using it as the curve parameter', () => {
    const curve = { x1: 0, x2: 0, y1: 0, y2: 1 }
    expect(sampleBezier(curve, 0.125)).toEqual({
      parameter: 0.5,
      progress: 0.5,
    })
    expect(sampleBezier({ ...curve, x1: 1, x2: 1 }, 0.875)).toEqual({
      parameter: 0.5,
      progress: 0.5,
    })
  })
  it('handles a stationary derivative and reversed X control points', () => {
    const curve = { x1: 1, x2: 0, y1: 0, y2: 1 }
    expect(sampleBezier(curve, 0.5)).toEqual({ parameter: 0.5, progress: 0.5 })
    for (const time of [1e-10, 0.1, 0.4999, 0.5001, 0.9, 1 - 1e-10]) {
      const sample = sampleBezier(curve, time)
      expect(
        bezierCoordinate(sample.parameter, curve.x1, curve.x2),
      ).toBeCloseTo(time, 14)
    }
  })
  it('retains undershoot and overshoot instead of clamping progress', () => {
    expect(
      sampleBezier({ x1: 0.5, x2: 0.5, y1: -5, y2: -5 }, 0.5).progress,
    ).toBe(-3.625)
    expect(sampleBezier({ x1: 0.5, x2: 0.5, y1: 5, y2: 5 }, 0.5).progress).toBe(
      3.875,
    )
    expect(
      sampleBezier(generateBezier(presetInput('overshoot')), 0.5).progress,
    ).toBeGreaterThan(1)
  })
  it.each([-1, 1.00001, NaN, Infinity, -Infinity])(
    'rejects invalid simulation time %s',
    (time) => {
      expect(() =>
        sampleBezier(generateBezier(presetInput('ease')), time),
      ).toThrow(RangeError)
    },
  )
  it('roundtrips random time coordinates and preserves linear curves with arbitrary X control points', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        fc.integer({ min: 0, max: 10000 }),
        fc.integer({ min: 1, max: 9999 }),
        (first, second, position) => {
          const a = first / 10000,
            b = second / 10000,
            time = position / 10000
          const curve = { x1: a, x2: b, y1: a, y2: b }
          const sample = sampleBezier(curve, time)
          expect(sample.progress).toBeCloseTo(time, 12)
          expect(sample.parameter).toBeGreaterThanOrEqual(0)
          expect(sample.parameter).toBeLessThanOrEqual(1)
        },
      ),
      { seed: 2026112823, numRuns: 300 },
    )
  })
})
