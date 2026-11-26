export const FRONTEND_IMAGE_LIMIT = 25 * 1024 * 1024
export const FRONTEND_PIXEL_LIMIT = 32_000_000
export type FrontendImageMime = 'image/png' | 'image/jpeg' | 'image/webp'
export function frontendImageDimensions(width: number, height: number) {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > 16384 ||
    height > 16384 ||
    width * height > FRONTEND_PIXEL_LIMIT
  )
    throw new Error('dimensionsError')
  return { width, height }
}
export function frontendResize(
  width: number,
  height: number,
  size: number,
  axis: 'width' | 'height',
) {
  frontendImageDimensions(width, height)
  if (!Number.isInteger(size) || size < 1 || size > 16384)
    throw new Error('dimensionsError')
  const scale = size / (axis === 'width' ? width : height)
  return frontendImageDimensions(
    Math.max(1, Math.round(width * scale)),
    Math.max(1, Math.round(height * scale)),
  )
}
export function frontendSavings(original: number, compressed: number): number {
  return original > 0 ? (1 - compressed / original) * 100 : 0
}
export function frontendImageExtension(type: string): string {
  if (type === 'image/jpeg') return 'jpg'
  if (type === 'image/webp') return 'webp'
  if (type === 'image/png') return 'png'
  throw new Error('encodeError')
}
export async function frontendDetectImage(
  blob: Blob,
): Promise<FrontendImageMime> {
  const bytes = new Uint8Array(await blob.slice(0, 12).arrayBuffer())
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v))
    return 'image/png'
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return 'image/jpeg'
  if (
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  )
    return 'image/webp'
  throw new Error('fileError')
}
export async function frontendLoadImage(
  file: File,
): Promise<{ image: HTMLImageElement; url: string }> {
  if (!file.size || file.size > FRONTEND_IMAGE_LIMIT)
    throw new Error('sizeError')
  await frontendDetectImage(file)
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('fileError'))
      image.src = url
    })
    frontendImageDimensions(image.naturalWidth, image.naturalHeight)
    return { image, url }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}
export async function frontendEncodeImage(
  image: HTMLImageElement,
  width: number,
  height: number,
  mime: FrontendImageMime,
  quality: number,
  background: string,
  transform?: ImageTransform,
): Promise<Blob> {
  frontendImageDimensions(width, height)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  try {
    const context = canvas.getContext('2d')
    if (!context) throw new Error('encodeError')
    if (mime === 'image/jpeg') {
      context.fillStyle = background
      context.fillRect(0, 0, width, height)
    }
    if (transform) {
      validateImageTransform(image.naturalWidth, image.naturalHeight, transform)
      context.translate(width / 2, height / 2)
      context.rotate((transform.rotation * Math.PI) / 180)
      const rotated = transform.rotation % 180 !== 0
      const drawWidth = rotated ? height : width
      const drawHeight = rotated ? width : height
      context.drawImage(
        image,
        transform.x,
        transform.y,
        transform.cropWidth,
        transform.cropHeight,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight,
      )
    } else context.drawImage(image, 0, 0, width, height)
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (result) =>
          result ? resolve(result) : reject(new Error('encodeError')),
        mime,
        quality,
      ),
    )
    const actualMime = await frontendDetectImage(blob)
    return blob.type === actualMime
      ? blob
      : new Blob([blob], { type: actualMime })
  } finally {
    canvas.width = 0
    canvas.height = 0
  }
}

export interface ImageTransform {
  x: number
  y: number
  cropWidth: number
  cropHeight: number
  rotation: number
}
export function validateImageTransform(
  sourceWidth: number,
  sourceHeight: number,
  transform: ImageTransform,
) {
  const { x, y, cropWidth, cropHeight, rotation } = transform
  if (
    ![x, y, cropWidth, cropHeight].every(Number.isInteger) ||
    x < 0 ||
    y < 0 ||
    cropWidth < 1 ||
    cropHeight < 1 ||
    x + cropWidth > sourceWidth ||
    y + cropHeight > sourceHeight ||
    ![0, 90, 180, 270].includes(rotation)
  )
    throw new Error('dimensionsError')
  return {
    width: rotation % 180 ? cropHeight : cropWidth,
    height: rotation % 180 ? cropWidth : cropHeight,
  }
}
