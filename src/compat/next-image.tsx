import React from 'react'

type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean
  priority?: boolean
  quality?: number
  unoptimized?: boolean
}

export default function Image({ fill, priority: _priority, quality: _quality, unoptimized: _unoptimized, ...props }: ImageProps) {
  return <img {...props} style={fill ? { ...props.style, objectFit: 'cover', width: '100%', height: '100%' } : props.style} />
}
