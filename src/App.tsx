import React, { Suspense, lazy, useEffect, useMemo } from 'react'
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom'
import { LocaleProvider, isLocale, useTranslations } from '@/i18n/compat'
import { defaultLocale, locales } from '@/i18n/config'
import { Header } from '@/components/header'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { LoadingBar } from '@/components/loading-bar'
import { NavigationEvents } from '@/components/navigation-events'
import Home from '@/app/[locale]/page'
import Changelog from '@/app/[locale]/changelog/page'
import { toolsConfig } from '@/lib/tools-config'

const toolPageModules = import.meta.glob('./app/[locale]/tools/*/page.tsx')
const toolPages = Object.fromEntries(Object.entries(toolPageModules).map(([modulePath, loader]) => {
  const toolId = modulePath.split('/').at(-2)!
  return [toolId, lazy(loader as () => Promise<{ default: React.ComponentType }>)]
})) as Record<string, React.LazyExoticComponent<React.ComponentType>>
const toolIds = new Set(toolsConfig.flatMap(category => category.tools.map(tool => tool.id)))

function routeContext(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const locale = isLocale(segments[0]) ? segments.shift()! : defaultLocale
  const isLocalized = pathname.split('/').filter(Boolean).some(segment => isLocale(segment))
  const page = segments[0] === 'tools' ? 'tools' : segments[0] === 'changelog' ? 'changelog' : 'home'
  return { locale: locale as typeof defaultLocale, page, toolId: page === 'tools' ? segments[1] : undefined, isLocalized }
}

function SeoMetadata({ page, toolId, locale }: { page: string; toolId?: string; locale: string }) {
  const t = useTranslations()
  const location = useLocation()
  useEffect(() => {
    const metadataKey = toolId ? `tools.${toolId}.meta` : 'meta.site'
    const title = t(`${metadataKey}.title`)
    const description = t(`${metadataKey}.description`)
    const keywords = t(`${metadataKey}.keywords`)
    const currentTitle = title === `${metadataKey}.title` ? 'IT Tools Collection - Developer Toolbox' : title
    const currentDescription = description === `${metadataKey}.description` ? 'Free, privacy-focused developer tools for everyday development tasks.' : description
    document.title = currentTitle
    document.documentElement.lang = locale
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
    const setMeta = (name: string, content: string, attribute: 'name' | 'property' = 'name') => {
      let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attribute, name)
        document.head.append(element)
      }
      element.content = content
    }
    setMeta('description', currentDescription)
    setMeta('keywords', keywords === `${metadataKey}.keywords` ? 'developer tools, JSON tools, online utilities, format converters' : keywords)
    setMeta('og:title', currentTitle, 'property')
    setMeta('og:description', currentDescription, 'property')
    setMeta('og:type', 'website', 'property')
    setMeta('og:url', `${window.location.origin}${location.pathname}`, 'property')
    setMeta('twitter:card', 'summary_large_image')

    document.head.querySelectorAll('link[data-locale-alternate]').forEach(link => link.remove())
    const basePath = toolId ? `/tools/${toolId}` : page === 'changelog' ? '/changelog' : ''
    for (const supportedLocale of locales) {
      const alternate = document.createElement('link')
      alternate.rel = 'alternate'
      alternate.hreflang = supportedLocale
      alternate.href = `${window.location.origin}${supportedLocale === defaultLocale ? '' : `/${supportedLocale}`}${basePath || '/'}`
      alternate.dataset.localeAlternate = 'true'
      document.head.append(alternate)
    }
    const canonical = document.createElement('link')
    canonical.rel = 'canonical'
    canonical.href = `${window.location.origin}${location.pathname}`
    canonical.dataset.localeAlternate = 'true'
    document.head.append(canonical)
  }, [locale, location.pathname, page, t, toolId])
  return null
}

function LocalizedApp() {
  const location = useLocation()
  const navigate = useNavigate()
  const route = useMemo(() => routeContext(location.pathname), [location.pathname])
  const ToolPage = route.toolId ? toolPages[route.toolId] : undefined
  const validTool = !!route.toolId && toolIds.has(route.toolId) && !!ToolPage
  const content = route.page === 'home'
    ? <Home />
    : route.page === 'changelog'
      ? <Changelog />
      : validTool
        ? <Suspense fallback={<div className="p-8 text-muted-foreground">Loading tool…</div>}><ToolPage /></Suspense>
        : <NotFound onHome={() => navigate('/')} />

  useEffect(() => {
    if (!route.isLocalized && route.locale !== defaultLocale) {
      navigate(`/${route.locale}${location.pathname}`, { replace: true })
    }
  }, [location.pathname, navigate, route.isLocalized, route.locale])

  return (
    <LocaleProvider locale={route.locale}>
      <TooltipProvider>
        <SidebarProvider>
          <SeoMetadata page={route.page} toolId={route.toolId} locale={route.locale} />
          <LoadingBar />
          <NavigationEvents />
          <AppSidebar />
          <SidebarInset>
            <Header />
            <main className="min-h-[calc(100vh-4rem)] flex-1 overflow-auto p-4">{content}</main>
          </SidebarInset>
          <Toaster />
        </SidebarProvider>
      </TooltipProvider>
    </LocaleProvider>
  )
}

function NotFound({ onHome }: { onHome: () => void }) {
  const t = useTranslations()
  return <section className="mx-auto max-w-xl py-20 text-center"><h1 className="text-3xl font-bold">404</h1><p className="mt-2 text-muted-foreground">{t('home.no_tools_found')}</p><button className="mt-6 underline" onClick={onHome}>{t('common.back_to_home')}</button></section>
}

export default function App() {
  return <BrowserRouter><LocalizedApp /></BrowserRouter>
}
