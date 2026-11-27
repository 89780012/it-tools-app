import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { calculateAspectRatio, MAX_ASPECT_DIMENSION, type AspectDimensions } from '../aspect-ratio'

const landscape: AspectDimensions = {
  sourceWidth: '1920',
  sourceHeight: '1080',
  targetWidth: '1000',
  targetHeight: '1000',
}

describe('calculateAspectRatio', () => {
  it('reduces the ratio without requiring target dimensions', () => {
    expect(calculateAspectRatio({ ...landscape, targetWidth: '', targetHeight: '' }, 'ratio')).toEqual({
      ratioWidth: 16,
      ratioHeight: 9,
    })
    expect(calculateAspectRatio({ ...landscape, sourceHeight: '1920' }, 'ratio')).toEqual({
      ratioWidth: 1,
      ratioHeight: 1,
    })
  })

  it('ignores the unused target and scales landscape and portrait sizes', () => {
    expect(calculateAspectRatio({ ...landscape, targetWidth: '1280', targetHeight: '' }, 'width')).toEqual({
      ratioWidth: 16,
      ratioHeight: 9,
      scaled: { width: 1280, height: 720, rounded: false },
    })
    expect(calculateAspectRatio({
      sourceWidth: '1080', sourceHeight: '1920', targetWidth: '', targetHeight: '1280',
    }, 'height')).toEqual({
      ratioWidth: 9,
      ratioHeight: 16,
      scaled: { width: 720, height: 1280, rounded: false },
    })
  })

  it('fits using the limiting axis and rounds half pixels up', () => {
    expect(calculateAspectRatio(landscape, 'fit')).toMatchObject({
      scaled: { width: 1000, height: 563, rounded: true },
    })
    expect(calculateAspectRatio({ ...landscape, targetHeight: '540' }, 'fit')).toMatchObject({
      scaled: { width: 960, height: 540, rounded: false },
    })
    expect(calculateAspectRatio({ ...landscape, targetWidth: '960', targetHeight: '540' }, 'fit')).toMatchObject({
      scaled: { width: 960, height: 540, rounded: false },
    })
  })

  it('keeps one-pixel outputs and handles the largest scaled result exactly', () => {
    expect(calculateAspectRatio({
      sourceWidth: '1000000', sourceHeight: '1', targetWidth: '1', targetHeight: '1',
    }, 'fit')).toMatchObject({
      scaled: { width: 1, height: 1, rounded: true },
    })
    expect(calculateAspectRatio({
      sourceWidth: '1000000', sourceHeight: '1', targetWidth: '', targetHeight: '1000000',
    }, 'height')).toMatchObject({
      scaled: { width: 1_000_000_000_000, height: 1_000_000, rounded: false },
    })
  })

  it('accepts localized digits, surrounding whitespace and leading zeros', () => {
    expect(calculateAspectRatio({
      sourceWidth: ' ٠١٩٢٠ ', sourceHeight: '１０８０', targetWidth: '१०००', targetHeight: '۵۴۰',
    }, 'fit')).toEqual({ ratioWidth: 16, ratioHeight: 9, scaled: { width: 960, height: 540, rounded: false } })
  })

  it.each(['', '0', '-1', '+1', '1.5', '1e3', '1,000', '1 000', 'NaN', '1000001'])(
    'rejects the dimension %j',
    (sourceWidth) => {
      expect(calculateAspectRatio({ ...landscape, sourceWidth }, 'fit')).toEqual({ invalidField: 'sourceWidth' })
    },
  )

  it.each(['sourceHeight', 'targetWidth', 'targetHeight'] as const)('identifies invalid %s', (field) => {
    expect(calculateAspectRatio({ ...landscape, [field]: '' }, 'fit')).toEqual({ invalidField: field })
  })

  it('always fits inside the requested box while filling at least one side', () => {
    const dimension = fc.integer({ min: 1, max: MAX_ASPECT_DIMENSION })
    fc.assert(fc.property(dimension, dimension, dimension, dimension, (sourceWidth, sourceHeight, targetWidth, targetHeight) => {
      const result = calculateAspectRatio({
        sourceWidth: String(sourceWidth),
        sourceHeight: String(sourceHeight),
        targetWidth: String(targetWidth),
        targetHeight: String(targetHeight),
      }, 'fit')
      if ('invalidField' in result || !result.scaled) throw new Error('Expected a scaled result')
      expect(result.ratioWidth * sourceHeight).toBe(result.ratioHeight * sourceWidth)
      expect(result.scaled.width).toBeGreaterThanOrEqual(1)
      expect(result.scaled.width).toBeLessThanOrEqual(targetWidth)
      expect(result.scaled.height).toBeGreaterThanOrEqual(1)
      expect(result.scaled.height).toBeLessThanOrEqual(targetHeight)
      expect(result.scaled.width === targetWidth || result.scaled.height === targetHeight).toBe(true)
    }))
  })
})
