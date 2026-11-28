import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  borderRadiusExample,
  BorderRadiusError,
  generateBorderRadius,
  type RadiusUnit,
} from '../border-radius'

const all = (value: string) => Array<string>(4).fill(value)

describe('CSS border-radius generation', () => {
  it.each([
    [['12', '12', '12', '12'], '12px'],
    [['12', '30', '12', '30'], '12px 30px'],
    [['12', '30', '40', '30'], '12px 30px 40px'],
    [['12', '30', '40', '50'], '12px 30px 40px 50px'],
    [['0', '0', '0', '0'], '0px'],
  ])(
    'keeps clockwise physical corners and uses the CSS shorthand for %j',
    (radii, expected) => {
      expect(generateBorderRadius(radii, null, 'px')).toEqual({
        value: expected,
        css: `border-radius: ${expected};`,
      })
    },
  )
  it('keeps axes independent and omits an equivalent vertical shorthand', () => {
    expect(
      generateBorderRadius(
        ['10', '20', '30', '40'],
        ['50', '60', '70', '80'],
        'px',
      ).value,
    ).toBe('10px 20px 30px 40px / 50px 60px 70px 80px')
    expect(
      generateBorderRadius(['.5', '00.50', '0.5', '0.50'], all('0.5'), '%')
        .value,
    ).toBe('0.5%')
  })
  it('allows zero, decimals and limits; normalizes whitespace and leading zeros', () => {
    expect(
      generateBorderRadius([' 0000 ', '0012.50', '.25', '1000'], all('0'), 'px')
        .value,
    ).toBe('0px 12.5px 0.25px 1000px / 0px')
    expect(generateBorderRadius(all('100'), all('0'), '%').value).toBe(
      '100% / 0%',
    )
    expect(generateBorderRadius(all('999.99'), null, 'px').value).toBe(
      '999.99px',
    )
  })
  it('returns a fresh example and never changes input arrays', () => {
    const example = borderRadiusExample()
    expect(
      generateBorderRadius(
        Object.freeze(example.horizontal),
        Object.freeze(example.vertical),
        example.unit,
      ).css,
    ).toBe('border-radius: 30% 70% 60% 40% / 40% 30% 70% 60%;')
    const changed = borderRadiusExample()
    changed.horizontal[0] = '99'
    expect(borderRadiusExample().horizontal[0]).toBe('30')
  })
  it.each([
    '',
    ' ',
    '-1',
    '-0',
    '+1',
    '1e2',
    '0x10',
    '1,5',
    '1.001',
    'NaN',
    'Infinity',
    '1px',
    '10%',
    'calc(2)',
    '1; color:red',
    '1000.01',
    '10000',
    '1.',
  ])('rejects invalid radius %j with its exact field', (text) => {
    try {
      generateBorderRadius(all('10'), ['10', '10', text, '10'], 'px')
      expect.fail('Invalid radius accepted')
    } catch (error) {
      expect(error).toBeInstanceOf(BorderRadiusError)
      expect(error).toMatchObject({
        code: 'invalidRadius',
        axis: 'vertical',
        corner: 2,
      })
    }
  })
  it('uses unit-specific upper bounds without clamping the input', () => {
    expect(() => generateBorderRadius(all('100.01'), null, '%')).toThrow(
      BorderRadiusError,
    )
    expect(generateBorderRadius(all('100.01'), null, 'px').value).toBe(
      '100.01px',
    )
  })
  it('rejects invalid units and incorrect array lengths', () => {
    expect(() =>
      generateBorderRadius(all('1'), null, 'em' as RadiusUnit),
    ).toThrow('invalidUnit')
    for (const radii of [[], ['1'], ['1', '2', '3'], all('1').concat('1')]) {
      expect(() => generateBorderRadius(radii, null, 'px')).toThrow(
        'cornerCount',
      )
      expect(() => generateBorderRadius(all('1'), radii, '%')).toThrow(
        'cornerCount',
      )
    }
  })
  it('round trips all four corners through shorthand compression for random pairs of axes', () => {
    function expand(value: string) {
      const [a, b = a, c = a, d = b] = value.split(' ')
      return [a, b, c, d]
    }
    fc.assert(
      fc.property(
        fc.tuple(
          ...Array.from({ length: 8 }, () =>
            fc.integer({ min: 0, max: 10000 }),
          ),
        ),
        (numbers) => {
          const values = numbers.map((number) => String(number / 100))
          const [h, v = h] = generateBorderRadius(
            values.slice(0, 4),
            values.slice(4),
            '%',
          ).value.split(' / ')
          expect(expand(h)).toEqual(
            values.slice(0, 4).map((value) => `${value}%`),
          )
          expect(expand(v)).toEqual(values.slice(4).map((value) => `${value}%`))
        },
      ),
      { numRuns: 100 },
    )
  })
})
