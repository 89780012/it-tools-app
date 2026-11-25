import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import enMessages from './messages/en.json'
import { locales, defaultLocale, type Locale } from './config'

type Messages = Record<string, unknown>
type LocaleValue = { locale: Locale; messages: Messages }
const dictionaryLoaders = import.meta.glob('./messages/*.json', { import: 'default' }) as Record<string, () => Promise<Messages>>
const LocaleContext = createContext<LocaleValue>({ locale: defaultLocale, messages: enMessages })

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const [messages, setMessages] = useState<Messages>(locale === defaultLocale ? enMessages : enMessages)
  useEffect(() => {
    if (locale === defaultLocale) {
      setMessages(enMessages)
      return
    }
    const loader = dictionaryLoaders[`./messages/${locale}.json`]
    if (loader) void loader().then(setMessages).catch(() => setMessages(enMessages))
    else setMessages(enMessages)
  }, [locale])
  const value = useMemo(() => ({ locale, messages }), [locale, messages])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): Locale {
  return useContext(LocaleContext).locale
}

function valueAtPath(dictionary: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') return undefined
    return (current as Record<string, unknown>)[key]
  }, dictionary)
}

export interface Translator {
  (key: string, values?: Record<string, string | number>): string
  raw(key: string): unknown
  has(key: string): boolean
}

export function useTranslations(namespace = ''): Translator {
  const { messages } = useContext(LocaleContext)
  return useMemo(() => {
    const fullKey = (key: string) => [namespace, key].filter(Boolean).join('.')
    const translate = ((key: string, values?: Record<string, string | number>) => {
      const result = valueAtPath(messages, fullKey(key))
      if (typeof result !== 'string') return key
      return Object.entries(values ?? {}).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), result)
    }) as Translator
    translate.raw = (key: string) => valueAtPath(messages, fullKey(key))
    translate.has = (key: string) => valueAtPath(messages, fullKey(key)) !== undefined
    return translate
  }, [messages, namespace])
}

export function isLocale(value: string | undefined): value is Locale {
  return !!value && locales.includes(value as Locale)
}

export function localePath(path: string, locale: Locale) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return locale === defaultLocale ? cleanPath : `/${locale}${cleanPath === '/' ? '' : cleanPath}`
}
