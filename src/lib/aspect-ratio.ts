export const MAX_ASPECT_DIMENSION = 1_000_000

export type AspectRatioMode = 'ratio' | 'width' | 'height' | 'fit'
export type AspectDimension = 'sourceWidth' | 'sourceHeight' | 'targetWidth' | 'targetHeight'
export type AspectDimensions = Record<AspectDimension, string>

export type AspectRatioCalculation = {
  ratioWidth: number
  ratioHeight: number
  scaled?: { width: number; height: number; rounded: boolean }
}

export type AspectRatioResult = AspectRatioCalculation | { invalidField: AspectDimension }

const digitSets = ['٠١٢٣٤٥٦٧٨٩', '۰۱۲۳۴۵۶۷۸۹', '०१२३४५६७८९', '０１２３４５６７８９']

function parseDimension(text: string): number | undefined {
  const normalized = text.trim().replace(/[٠-٩۰-۹०-९０-９]/g, (digit) => {
    const digits = digitSets.find((set) => set.includes(digit))!
    return String(digits.indexOf(digit))
  })
  if (!/^\d+$/.test(normalized)) return undefined
  const value = Number(normalized)
  if (value >= 1 && value <= MAX_ASPECT_DIMENSION) return value
}

function greatestCommonDivisor(width: number, height: number): number {
  while (height !== 0) {
    const remainder = width % height
    width = height
    height = remainder
  }
  return width
}

export function calculateAspectRatio(
  input: AspectDimensions,
  mode: AspectRatioMode,
): AspectRatioResult {
  const sourceWidth = parseDimension(input.sourceWidth)
  if (sourceWidth === undefined) return { invalidField: 'sourceWidth' }
  const sourceHeight = parseDimension(input.sourceHeight)
  if (sourceHeight === undefined) return { invalidField: 'sourceHeight' }

  const divisor = greatestCommonDivisor(sourceWidth, sourceHeight)
  const ratioWidth = sourceWidth / divisor
  const ratioHeight = sourceHeight / divisor
  if (mode === 'ratio') return { ratioWidth, ratioHeight }

  const targetWidth = mode === 'height' ? 0 : parseDimension(input.targetWidth)
  if (targetWidth === undefined) return { invalidField: 'targetWidth' }
  const targetHeight = mode === 'width' ? 0 : parseDimension(input.targetHeight)
  if (targetHeight === undefined) return { invalidField: 'targetHeight' }

  const byWidth = mode === 'width' || (
    mode === 'fit' && targetWidth * ratioHeight <= targetHeight * ratioWidth
  )
  const numerator = byWidth ? targetWidth * ratioHeight : targetHeight * ratioWidth
  const denominator = byWidth ? ratioWidth : ratioHeight
  const scaledSide = Math.max(1, Math.round(numerator / denominator))

  return {
    ratioWidth,
    ratioHeight,
    scaled: {
      width: byWidth ? targetWidth : scaledSide,
      height: byWidth ? scaledSide : targetHeight,
      rounded: numerator % denominator !== 0,
    },
  }
}
