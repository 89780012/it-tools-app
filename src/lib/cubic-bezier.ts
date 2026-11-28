export const BEZIER_FIELDS = ['x1', 'y1', 'x2', 'y2'] as const
export type BezierField = (typeof BEZIER_FIELDS)[number]
export type BezierInput = Record<BezierField, string>
export type BezierCurve = Record<BezierField, number>
export type BezierResult = BezierCurve & { easing: string; css: string }

export const BEZIER_PRESETS = {
  linear: ['0', '0', '1', '1'],
  ease: ['0.25', '0.1', '0.25', '1'],
  easeIn: ['0.42', '0', '1', '1'],
  easeOut: ['0', '0', '0.58', '1'],
  easeInOut: ['0.42', '0', '0.58', '1'],
  overshoot: ['0.34', '1.56', '0.64', '1'],
} as const
export type BezierPreset = keyof typeof BEZIER_PRESETS

export function presetInput(preset: BezierPreset): BezierInput {
  const [x1, y1, x2, y2] = BEZIER_PRESETS[preset]
  return { x1, y1, x2, y2 }
}

export class BezierError extends Error {
  constructor(
    public field: BezierField,
    public code: 'invalidX' | 'invalidY',
  ) {
    super(code)
  }
}

/** This editor accepts plain decimals with at most four fractional digits. */
export function generateBezier(input: BezierInput): BezierResult {
  const curve = {} as BezierCurve
  for (const field of BEZIER_FIELDS) {
    const raw = input[field].trim()
    const value = Number(raw)
    const isX = field.startsWith('x')
    if (
      raw.length > 32 ||
      !/^[+-]?(?:\d+(?:\.\d{1,4})?|\.\d{1,4})$/.test(raw) ||
      !Number.isFinite(value) ||
      value < (isX ? 0 : -5) ||
      value > (isX ? 1 : 5)
    )
      throw new BezierError(field, isX ? 'invalidX' : 'invalidY')
    curve[field] = value === 0 ? 0 : value
  }
  const easing = `cubic-bezier(${BEZIER_FIELDS.map((field) => curve[field]).join(', ')})`
  return {
    ...curve,
    easing,
    css: `transition-timing-function: ${easing};\nanimation-timing-function: ${easing};`,
  }
}

/** Endpoints are fixed at 0 and 1. t is the curve parameter, not elapsed time. */
export function bezierCoordinate(
  t: number,
  first: number,
  second: number,
): number {
  return 3 * (1 - t) ** 2 * t * first + 3 * (1 - t) * t ** 2 * second + t ** 3
}

/** Invert monotonic x(t) before evaluating y(t); do not clamp overshoot. */
export function sampleBezier(
  curve: BezierCurve,
  time: number,
): { parameter: number; progress: number } {
  if (!Number.isFinite(time) || time < 0 || time > 1)
    throw new RangeError('time must be between 0 and 1')
  if (time === 0 || time === 1) return { parameter: time, progress: time }
  let low = 0
  let high = 1
  // Bisection also handles the zero derivative of x(t) at endpoints or at t=.5.
  for (let iteration = 0; iteration < 60; iteration++) {
    const middle = (low + high) / 2
    const x = bezierCoordinate(middle, curve.x1, curve.x2)
    if (x === time)
      return {
        parameter: middle,
        progress: bezierCoordinate(middle, curve.y1, curve.y2),
      }
    if (x < time) low = middle
    else high = middle
  }
  const parameter = (low + high) / 2
  return {
    parameter,
    progress: bezierCoordinate(parameter, curve.y1, curve.y2),
  }
}
