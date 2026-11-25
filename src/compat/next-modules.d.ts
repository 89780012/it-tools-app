declare module 'next-intl' {
  import type { Translator } from '../i18n/compat'
  export function useLocale(): string
  export function useTranslations(namespace?: string): Translator
}

declare module 'next/image' {
  import type React from 'react'
  const Image: React.ComponentType<React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean; quality?: number; unoptimized?: boolean }>
  export default Image
}

declare module 'next/link' {
  import type React from 'react'
  const Link: React.ComponentType<React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>
  export default Link
}
