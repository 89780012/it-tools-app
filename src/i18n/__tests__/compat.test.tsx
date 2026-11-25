import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LocaleProvider, isLocale, localePath, useLocale, useTranslations } from '../compat'
import { defaultLocale, locales, type Locale } from '../config'
import { getLocale, setLocale } from '../index'

const dictionaries = import.meta.glob('../messages/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Record<string, unknown>>

function ConvertLabel() {
  const t = useTranslations()
  const locale = useLocale()
  return <span>{`${locale}:${t('common.convert')}`}</span>
}

afterEach(() => cleanup())
beforeEach(() => {
  localStorage.clear()
  document.documentElement.lang = defaultLocale
  document.cookie = 'IT_TOOLS_LOCALE=; Path=/; Max-Age=0'
})

describe('locale configuration and translations', () => {
  it.each(locales)('loads %s translations in the provider', async (locale) => {
    const dictionary = dictionaries[`../messages/${locale}.json`]
    expect(dictionary).toBeDefined()
    const common = dictionary.common as Record<string, string>
    expect(common.convert).toEqual(expect.any(String))

    render(
      <LocaleProvider locale={locale as Locale}>
        <ConvertLabel />
      </LocaleProvider>,
    )
    expect(await screen.findByText(`${locale}:${common.convert}`)).toBeInTheDocument()
  })

  it('validates configured locales and uses the default locale without a URL prefix', () => {
    for (const locale of locales) expect(isLocale(locale)).toBe(true)
    expect(isLocale('not-a-locale')).toBe(false)
    expect(localePath('/tools/json-formatter', defaultLocale)).toBe('/tools/json-formatter')
    expect(localePath('/tools/json-formatter', 'zh')).toBe('/zh/tools/json-formatter')
    expect(localePath('/', 'zh')).toBe('/zh')
  })

  it('interpolates values and exposes raw and key-existence helpers', () => {
    function Probe() {
      const t = useTranslations()
      return <span>{`${t('home.showing_tools', { count: 3 })}|${String(t.has('common.convert'))}|${String(t.raw('common.convert'))}`}</span>
    }

    render(
      <LocaleProvider locale="en">
        <Probe />
      </LocaleProvider>,
    )
    expect(screen.getByText(/3 tools in total\|true\|Convert/)).toBeInTheDocument()
  })

  it('persists and reads the selected locale from local storage', async () => {
    await setLocale('fr')
    expect(localStorage.getItem('IT_TOOLS_LOCALE')).toBe('fr')
    expect(document.cookie).toContain('IT_TOOLS_LOCALE=fr')
    expect(await getLocale()).toBe('fr')
  })

  it('falls back to the HTML language and default locale', async () => {
    document.documentElement.lang = 'hi'
    expect(await getLocale()).toBe('hi')
    document.documentElement.lang = ''
    expect(await getLocale()).toBe(defaultLocale)
  })
})
