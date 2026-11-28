export const MAX_SHADOW_LAYERS = 8
export const SHADOW_FIELDS = [
  'x',
  'y',
  'blur',
  'spread',
  'color',
  'opacity',
] as const
export type ShadowField = (typeof SHADOW_FIELDS)[number]
export type ShadowLayer = Record<ShadowField, string> & { inset: boolean }
export type ShadowResult = { value: string; css: string }

export class BoxShadowError extends Error {
  constructor(
    public code:
      | 'layerLimit'
      | 'integer'
      | 'offsetRange'
      | 'blurRange'
      | 'opacityRange'
      | 'invalidColor',
    public layer = 0,
    public field: ShadowField = 'x',
  ) {
    super(code)
  }
}

export function createShadowLayer(): ShadowLayer {
  return {
    x: '0',
    y: '8',
    blur: '24',
    spread: '0',
    color: '#000000',
    opacity: '20',
    inset: false,
  }
}

export function generateBoxShadow(
  layers: readonly ShadowLayer[],
): ShadowResult {
  if (layers.length < 1 || layers.length > MAX_SHADOW_LAYERS)
    throw new BoxShadowError('layerLimit')
  const shadows = layers.map((layer, index) => {
    const numbers = {} as Record<Exclude<ShadowField, 'color'>, number>
    for (const field of SHADOW_FIELDS) {
      if (field === 'color') continue
      const raw = layer[field].trim()
      if (!/^-?\d+$/.test(raw))
        throw new BoxShadowError('integer', index, field)
      const n = Number(raw)
      const min = field === 'blur' || field === 'opacity' ? 0 : -500
      const max = field === 'opacity' ? 100 : 500
      if (n < min || n > max)
        throw new BoxShadowError(
          field === 'blur'
            ? 'blurRange'
            : field === 'opacity'
              ? 'opacityRange'
              : 'offsetRange',
          index,
          field,
        )
      numbers[field] = n
    }
    const color = layer.color.trim()
    if (!/^#[\da-f]{6}$/i.test(color))
      throw new BoxShadowError('invalidColor', index, 'color')
    const rgb = [1, 3, 5].map((position) =>
      parseInt(color.slice(position, position + 2), 16),
    )
    return `${layer.inset ? 'inset ' : ''}${numbers.x}px ${numbers.y}px ${numbers.blur}px ${numbers.spread}px rgba(${rgb.join(', ')}, ${numbers.opacity / 100})`
  })
  return {
    value: shadows.join(', '),
    css: `box-shadow: ${shadows.join(',\n  ')};`,
  }
}
