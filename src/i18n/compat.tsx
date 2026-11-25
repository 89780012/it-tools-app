import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import enBaseMessages from './messages/en.json'
import { locales, defaultLocale, type Locale } from './config'
import { extendMessages, loadAdditionalMessages } from './additions'

const enMessages = extendMessages('en', enBaseMessages)

type Messages = Record<string, unknown>
type LocaleValue = { locale: Locale; messages: Messages }
const dictionaryLoaders = import.meta.glob('./messages/*.json', { import: 'default' }) as Record<string, () => Promise<Messages>>
const LocaleContext = createContext<LocaleValue>({ locale: defaultLocale, messages: enMessages })

const dictionaryCache = new Map<Locale, Messages>([[defaultLocale, enMessages]])
export async function loadLocaleMessages(locale: Locale): Promise<Messages> {
  const cached = dictionaryCache.get(locale)
  if (cached) return cached
  const loader = dictionaryLoaders[`./messages/${locale}.json`]
  const [base] = await Promise.all([loader ? loader() : Promise.resolve(enBaseMessages), loadAdditionalMessages(locale)])
  const messages = extendMessages(locale, base)
  dictionaryCache.set(locale, messages)
  return messages
}

export function LocaleProvider({ locale, children, initialMessages }: { locale: Locale; children: React.ReactNode; initialMessages?: Messages }) {
  const providedMessages = useMemo(() => initialMessages ? extendMessages(locale, initialMessages) : undefined, [locale, initialMessages])
  const [loaded, setLoaded] = useState(() => ({ locale, messages: initialMessages ?? dictionaryCache.get(locale) }))
  useEffect(() => {
    if (initialMessages || dictionaryCache.has(locale)) return
    let active = true
    void loadLocaleMessages(locale).then(messages => { if (active) setLoaded({ locale, messages }) }).catch(() => { if (active) setLoaded({ locale, messages: enMessages }) })
    return () => { active = false }
  }, [locale, initialMessages])
  const messages = providedMessages ?? dictionaryCache.get(locale) ?? (loaded.locale === locale ? loaded.messages : undefined)
  const value = useMemo(() => ({ locale, messages: messages ?? enMessages }), [locale, messages])
  return messages ? <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider> : null
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
