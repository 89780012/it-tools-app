export const CLAMP_FIELDS = [
  'startWidth',
  'endWidth',
  'startSize',
  'endSize',
  'rootSize',
] as const
export type ClampField = (typeof CLAMP_FIELDS)[number]
export type ClampInput = Record<ClampField, string>
export type ClampUnit = 'px' | 'rem'
export class CssClampError extends Error {
  constructor(
    public code:
      'invalidWidth' | 'invalidSize' | 'invalidRoot' | 'viewportOrder',
    public field: ClampField,
  ) {
    super(code)
    this.name = 'CssClampError'
  }
}
export interface CssClampResult {
  css: string
  startWidth: number
  endWidth: number
  startSize: number
  endSize: number
  rootSize: number
}
function numberText(value: number): string {
  // Fixed decimal output is valid CSS, avoids exponent notation and -0.
  const text = value.toFixed(10).replace(/\.?0+$/, '')
  return text === '-0' ? '0' : text
}
export function generateCssClamp(
  input: ClampInput,
  unit: ClampUnit,
): CssClampResult {
  const values = {} as Record<ClampField, number>
  for (const field of CLAMP_FIELDS) {
    const text = input[field].trim()
    const width = field === 'startWidth' || field === 'endWidth'
    const root = field === 'rootSize'
    const code = width ? 'invalidWidth' : root ? 'invalidRoot' : 'invalidSize'
    const value = Number(text)
    if (
      text.length > 32 ||
      !(width ? /^\d+$/ : /^\d+(?:\.\d{1,3})?$/).test(text) ||
      !Number.isFinite(value) ||
      value < (width || root ? 1 : 0) ||
      value > (width ? 100_000 : root ? 1_000 : 10_000)
    ) {
      throw new CssClampError(code, field)
    }
    values[field] = value
  }
  if (values.endWidth <= values.startWidth)
    throw new CssClampError('viewportOrder', 'endWidth')
  const { startWidth, endWidth, startSize, endSize, rootSize } = values
  const slope = (endSize - startSize) / (endWidth - startWidth)
  const intercept = startSize - slope * startWidth
  const divisor = unit === 'rem' ? rootSize : 1
  const low = numberText(Math.min(startSize, endSize) / divisor)
  const high = numberText(Math.max(startSize, endSize) / divisor)
  const constant = numberText(intercept / divisor)
  const preferred =
    slope === 0
      ? `${constant}${unit}`
      : `calc(${constant}${unit} ${slope < 0 ? '-' : '+'} ${numberText(Math.abs(slope * 100))}vw)`
  return {
    ...values,
    css: `font-size: clamp(${low}${unit}, ${preferred}, ${high}${unit});`,
  }
}
/** Evaluate the original interpolation at a simulated viewport, clamped at both ends. */
export function sizeAtViewport(
  result: CssClampResult,
  viewport: number,
): number {
  const fraction = Math.max(
    0,
    Math.min(
      1,
      (viewport - result.startWidth) / (result.endWidth - result.startWidth),
    ),
  )
  return result.startSize + fraction * (result.endSize - result.startSize)
}
