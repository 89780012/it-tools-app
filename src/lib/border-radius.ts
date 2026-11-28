export type RadiusUnit = 'px' | '%'
export type RadiusAxis = 'horizontal' | 'vertical'
export type CornerRadii = [string, string, string, string]
export type RadiusErrorCode = 'invalidRadius' | 'invalidUnit' | 'cornerCount'

export class BorderRadiusError extends Error {
  constructor(
    public code: RadiusErrorCode,
    public axis: RadiusAxis = 'horizontal',
    public corner = 0,
  ) {
    super(code)
  }
}

// CSS shorthand order is physical: top-left, top-right, bottom-right, bottom-left.
function shorthand(values: readonly string[]): string {
  const [a, b, c, d] = values
  if (a === b && a === c && a === d) return a
  if (a === c && b === d) return `${a} ${b}`
  if (b === d) return `${a} ${b} ${c}`
  return values.join(' ')
}

export function generateBorderRadius(
  horizontal: readonly string[],
  vertical: readonly string[] | null,
  unit: RadiusUnit,
) {
  if (unit !== 'px' && unit !== '%') throw new BorderRadiusError('invalidUnit')
  const limit = unit === '%' ? 100 : 1000
  function parse(values: readonly string[], axis: RadiusAxis): string[] {
    if (values.length !== 4) throw new BorderRadiusError('cornerCount', axis)
    return values.map((text, corner) => {
      const value = text.trim()
      const number = Number(value)
      if (
        !/^(?:\d{1,4}(?:\.\d{1,2})?|\.\d{1,2})$/.test(value) ||
        !Number.isFinite(number) ||
        number < 0 ||
        number > limit
      )
        throw new BorderRadiusError('invalidRadius', axis, corner)
      return `${number}${unit}`
    })
  }
  const x = parse(horizontal, 'horizontal')
  const y = vertical === null ? x : parse(vertical, 'vertical')
  const h = shorthand(x)
  const v = shorthand(y)
  const value = h === v ? h : `${h} / ${v}`
  return { value, css: `border-radius: ${value};` }
}

export function borderRadiusExample(): {
  horizontal: CornerRadii
  vertical: CornerRadii
  unit: RadiusUnit
} {
  return {
    horizontal: ['30', '70', '60', '40'],
    vertical: ['40', '30', '70', '60'],
    unit: '%',
  }
}
