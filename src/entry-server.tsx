import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { LocalizedApp } from './App'
import { ThemeProvider } from '@/components/theme-provider'
import { getSeoHead } from '@/seo/metadata'
import { locales } from '@/i18n/config'
import { toolsConfig } from '@/lib/tools-config'

const pages = import.meta.glob('./app/[locale]/tools/*/page.tsx', { eager: true }) as Record<string, { default: React.ComponentType }>
const dictionaries = import.meta.glob('./i18n/messages/*.json', { eager: true, import: 'default' }) as Record<string, Record<string, unknown>>
export { locales, toolsConfig, getSeoHead }

export function render(url: string, locale: string, toolId?: string) {
  const messages = dictionaries[`./i18n/messages/${locale}.json`]
  if (!messages) throw new Error(`Missing locale: ${locale}`)
  const toolComponent = toolId ? pages[`./app/[locale]/tools/${toolId}/page.tsx`]?.default : undefined
  if (toolId && !toolComponent) throw new Error(`Missing tool page: ${toolId}`)
  return renderToString(
    <MemoryRouter initialEntries={[url]}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <LocalizedApp initialMessages={messages} toolComponent={toolComponent} />
      </ThemeProvider>
    </MemoryRouter>,
  )
}
