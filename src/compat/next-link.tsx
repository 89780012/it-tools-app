import React from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { localePath, useLocale } from '@/i18n/compat'
import { isLocale } from '@/i18n/compat'

export default function NextLink({ href, ...props }: Omit<React.ComponentProps<typeof RouterLink>, 'to'> & { href: string }) {
  const locale = useLocale()
  const firstSegment = href.split('/').filter(Boolean)[0]
  const to = firstSegment && isLocale(firstSegment) ? href : localePath(href, locale)
  return <RouterLink {...props} to={to} />
}
