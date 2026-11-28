export const MAX_GRADIENT_STOPS = 8
export type GradientStop = { color: string; position: string; opacity: string }
export type GradientField = 'angle' | keyof GradientStop
export type GradientErrorCode =
  | 'invalidAngle'
  | 'invalidColor'
  | 'invalidPosition'
  | 'invalidOpacity'
  | 'stopOrder'
  | 'stopCount'

export class GradientError extends Error {
  constructor(
    public code: GradientErrorCode,
    public field: GradientField = 'angle',
    public stop = 0,
  ) {
    super(code)
  }
}

function integer(
  text: string,
  min: number,
  max: number,
  code: GradientErrorCode,
  field: GradientField,
  stop = 0,
): number {
  const value = text.trim()
  const number = Number(value)
  if (
    !/^-?\d{1,6}$/.test(value) ||
    !Number.isInteger(number) ||
    number < min ||
    number > max
  )
    throw new GradientError(code, field, stop)
  return number === 0 ? 0 : number
}

export function generateLinearGradient(
  angle: string,
  stops: readonly GradientStop[],
) {
  if (stops.length < 2 || stops.length > MAX_GRADIENT_STOPS)
    throw new GradientError('stopCount')
  const degrees = integer(angle, -360, 360, 'invalidAngle', 'angle')
  let previous = -1
  const colors = stops.map((stop, index) => {
    const color = stop.color.trim().toLowerCase()
    if (!/^#[\da-f]{6}$/.test(color))
      throw new GradientError('invalidColor', 'color', index)
    const position = integer(
      stop.position,
      0,
      100,
      'invalidPosition',
      'position',
      index,
    )
    if (position < previous)
      throw new GradientError('stopOrder', 'position', index)
    previous = position
    const opacity = integer(
      stop.opacity,
      0,
      100,
      'invalidOpacity',
      'opacity',
      index,
    )
    const channels = [1, 3, 5].map((offset) =>
      parseInt(color.slice(offset, offset + 2), 16),
    )
    return `${opacity === 100 ? color : `rgba(${channels.join(', ')}, ${opacity / 100})`} ${position}%`
  })
  const value = `linear-gradient(${degrees}deg, ${colors.join(', ')})`
  return { value, css: `background-image: ${value};` }
}

export function gradientExample(): { angle: string; stops: GradientStop[] } {
  return {
    angle: '135',
    stops: [
      { color: '#2563eb', position: '0', opacity: '100' },
      { color: '#a855f7', position: '50', opacity: '80' },
      { color: '#ec4899', position: '100', opacity: '40' },
    ],
  }
}
