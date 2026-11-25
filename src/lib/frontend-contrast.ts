export function frontendHex(value: string): string | null {
  const hex = value.trim().replace(/^#/, '')
  if (!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex)) return null
  return `#${(hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex).toLowerCase()}`
}

export function frontendLuminance(value: string): number {
  const hex = frontendHex(value)
  if (!hex) throw new Error('invalidColor')
  const channels = [1, 3, 5].map((offset) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  })
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

export function frontendContrast(
  foreground: string,
  background: string,
): number {
  const a = frontendLuminance(foreground),
    b = frontendLuminance(background)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

export function frontendContrastLevels(ratio: number) {
  return {
    aaNormal: ratio >= 4.5,
    aaaNormal: ratio >= 7,
    aaLarge: ratio >= 3,
    aaaLarge: ratio >= 4.5,
  }
}
