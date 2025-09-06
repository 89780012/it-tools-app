import zh from './locales/zh.json'
import en from './locales/en.json'

export const locales = {
  zh,
  en
} as const

export type Locale = keyof typeof locales
export type LocaleMessages = typeof zh

export const defaultLocale: Locale = 'zh'