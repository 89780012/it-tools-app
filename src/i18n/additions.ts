import { type Locale } from './config'

type Messages = Record<string, unknown>
const loaders = import.meta.glob('./messages/*-additions/*.json', {
  import: 'default',
}) as Record<string, () => Promise<Messages>>
// The SSR branch is removed from the browser build. Only English additions are
// eager in the client; the other locales load before their provider is shown.
const bundled = import.meta.env.SSR
  ? (import.meta.glob('./messages/*-additions/*.json', {
      eager: true,
      import: 'default',
    }) as Record<string, Messages>)
  : (import.meta.glob('./messages/*-additions/en.json', {
      eager: true,
      import: 'default',
    }) as Record<string, Messages>)
const cache = new Map<string, Messages>()
const pending = new Map<string, Promise<void>>()

export function mergeMessages(base: Messages, extra: Messages): Messages {
  const result = { ...base }
  for (const [key, value] of Object.entries(extra)) {
    if (key === '__proto__' || key === 'prototype' || key === 'constructor')
      continue
    const previous = result[key]
    result[key] =
      value && typeof value === 'object' && !Array.isArray(value)
        ? mergeMessages(
            previous && typeof previous === 'object' && !Array.isArray(previous)
              ? (previous as Messages)
              : {},
            value as Messages,
          )
        : value
  }
  return result
}

function bundledFor(locale: string): Messages {
  const saved = cache.get(locale)
  if (saved) return saved
  const entries = Object.entries(bundled)
    .filter(([path]) => path.endsWith(`/${locale}.json`))
    .sort(([left], [right]) => left.localeCompare(right))
  const messages = entries.reduce(
    (combined, [, extra]) => mergeMessages(combined, extra),
    {} as Messages,
  )
  if (entries.length) cache.set(locale, messages)
  return messages
}

export async function loadAdditionalMessages(
  locale: string | Locale,
): Promise<void> {
  if (cache.has(locale)) return
  if (import.meta.env.SSR || locale === 'en') {
    bundledFor(locale)
    return
  }
  const loading = pending.get(locale)
  if (loading) return loading
  const operation = Promise.all(
    Object.entries(loaders)
      .filter(([path]) => path.endsWith(`/${locale}.json`))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, loader]) => loader()),
  )
    .then((groups) => {
      cache.set(
        locale,
        groups.reduce((combined, extra) => mergeMessages(combined, extra), {}),
      )
    })
    .finally(() => {
      pending.delete(locale)
    })
  pending.set(locale, operation)
  return operation
}

export function extendMessages(
  locale: string | Locale,
  base: Messages,
): Messages {
  return mergeMessages(base, bundledFor(locale))
}

export function messageAtPath(messages: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (value, key) =>
        value && typeof value === 'object'
          ? (value as Messages)[key]
          : undefined,
      messages,
    )
}
