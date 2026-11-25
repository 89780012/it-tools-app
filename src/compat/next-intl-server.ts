import { defaultLocale, type Locale } from '@/i18n/config'
import { useLocale, useTranslations } from '@/i18n/compat'

export function getLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale
  return (document.documentElement.lang || localStorage.getItem('locale') || defaultLocale) as Locale
}

export function getTranslations(namespace = '') {
  return useTranslations(namespace)
}

export { useLocale, useTranslations }
