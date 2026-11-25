import { defaultLocale, type Locale } from './config'

const COOKIE_NAME = 'IT_TOOLS_LOCALE'

export async function getLocale(): Promise<Locale> {
  if (typeof window === 'undefined') return defaultLocale
  const fromStorage = localStorage.getItem(COOKIE_NAME)
  return (fromStorage || document.documentElement.lang || defaultLocale) as Locale
}

export async function setLocale(locale: Locale) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(COOKIE_NAME, locale)
    document.cookie = `${COOKIE_NAME}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`
  }
}
