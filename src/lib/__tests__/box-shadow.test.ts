import { describe, expect, it } from 'vitest'
import {
  BoxShadowError,
  createShadowLayer,
  generateBoxShadow,
  type ShadowField,
} from '../box-shadow'

describe('CSS box shadows', () => {
  it('generates a reusable declaration and a matching preview value', () => {
    expect(generateBoxShadow([createShadowLayer()])).toEqual({
      css: 'box-shadow: 0px 8px 24px 0px rgba(0, 0, 0, 0.2);',
      value: '0px 8px 24px 0px rgba(0, 0, 0, 0.2)',
    })
  })
  it('preserves front-to-back layer order, inset, negative spread and RGB channels', () => {
    const layers = [
      {
        x: '-12',
        y: '4',
        blur: '0',
        spread: '-2',
        color: ' #Aa00fF ',
        opacity: '1',
        inset: true,
      },
      { ...createShadowLayer(), color: '#010203', opacity: '100' },
    ]
    const original = structuredClone(layers)
    expect(generateBoxShadow(layers)).toEqual({
      value:
        'inset -12px 4px 0px -2px rgba(170, 0, 255, 0.01), 0px 8px 24px 0px rgba(1, 2, 3, 1)',
      css: 'box-shadow: inset -12px 4px 0px -2px rgba(170, 0, 255, 0.01),\n  0px 8px 24px 0px rgba(1, 2, 3, 1);',
    })
    expect(layers).toEqual(original)
  })
  it('accepts exact numeric and layer boundaries, including invisible and zero-sized shadows', () => {
    expect(
      generateBoxShadow([
        {
          x: '-500',
          y: '500',
          blur: '500',
          spread: '-500',
          color: '#ffffff',
          opacity: '0',
          inset: false,
        },
      ]).value,
    ).toBe('-500px 500px 500px -500px rgba(255, 255, 255, 0)')
    expect(
      generateBoxShadow([
        {
          ...createShadowLayer(),
          x: ' 0 ',
          y: '-0',
          blur: '0',
          spread: '500',
          opacity: '100',
        },
      ]).value,
    ).toBe('0px 0px 0px 500px rgba(0, 0, 0, 1)')
    expect(
      generateBoxShadow(
        Array.from({ length: 8 }, createShadowLayer),
      ).value.split('rgba('),
    ).toHaveLength(9)
  })
  it.each([0, 9])('rejects %i layers', (count) => {
    expect(() =>
      generateBoxShadow(Array.from({ length: count }, createShadowLayer)),
    ).toThrowError('layerLimit')
  })
  it.each([
    '',
    ' ',
    '1.5',
    '1e2',
    '12px',
    'NaN',
    'Infinity',
    '+5',
    '1; color:red',
    '−1',
  ])('rejects invalid integers: %s', (value) => {
    expect(() =>
      generateBoxShadow([{ ...createShadowLayer(), x: value }]),
    ).toThrowError('integer')
  })
  it.each<[ShadowField, string, string]>([
    ['x', '-501', 'offsetRange'],
    ['x', '501', 'offsetRange'],
    ['y', '-501', 'offsetRange'],
    ['y', '501', 'offsetRange'],
    ['spread', '-501', 'offsetRange'],
    ['spread', '501', 'offsetRange'],
    ['blur', '-1', 'blurRange'],
    ['blur', '501', 'blurRange'],
    ['opacity', '-1', 'opacityRange'],
    ['opacity', '101', 'opacityRange'],
  ])(
    'locates out-of-range %s=%s on the correct layer',
    (field, value, code) => {
      try {
        generateBoxShadow([
          createShadowLayer(),
          { ...createShadowLayer(), [field]: value },
        ])
        expect.fail('must reject invalid input')
      } catch (error) {
        expect(error).toBeInstanceOf(BoxShadowError)
        expect(error).toMatchObject({ code, layer: 1, field })
      }
    },
  )
  it.each([
    '',
    '#fff',
    '#12345678',
    '#gggggg',
    'red',
    'rgb(0,0,0)',
    '#000000; color:red',
    '#000000\nurl(x)',
  ])('rejects unsupported or injected color %s', (color) => {
    expect(() =>
      generateBoxShadow([{ ...createShadowLayer(), color }]),
    ).toThrowError('invalidColor')
  })
})
