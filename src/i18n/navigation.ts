import React from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { defaultLocale, type Locale } from './config'
import { localePath, useLocale } from './compat'

type LocalizedLinkProps = Omit<React.ComponentProps<typeof RouterLink>, 'to'> & { href: string; to?: string }

export function Link({ href, to, ...props }: LocalizedLinkProps) {
  const locale = useLocale()
  const destination = to ?? localePath(href, locale)
  return React.createElement(RouterLink, { ...props, to: destination })
}

export function usePathname() {
  const { pathname } = useLocation()
  const locale = useLocale()
  const prefix = locale === defaultLocale ? '' : `/${locale}`
  return prefix && pathname.startsWith(prefix) ? pathname.slice(prefix.length) || '/' : pathname
}

export function useRouter() {
  const navigate = useNavigate()
  const locale = useLocale()
  return {
    push: (path: string, options?: { locale?: Locale }) => navigate(localePath(path, options?.locale ?? locale)),
    replace: (path: string, options?: { locale?: Locale }) => navigate(localePath(path, options?.locale ?? locale), { replace: true }),
    back: () => navigate(-1),
    refresh: () => window.location.reload(),
  }
}

export function redirect(path: string) {
  window.location.assign(path)
}
