import React, { Suspense, lazy, useEffect, useMemo } from 'react'
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom'
import { LocaleProvider, isLocale, useTranslations } from '@/i18n/compat'
import { defaultLocale } from '@/i18n/config'
import { applySeoHead, getSeoHead } from '@/seo/metadata'
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
  useEffect(() => {
    applySeoHead(getSeoHead(locale, page, toolId, t), locale)
  }, [locale, page, t, toolId])
  return null
}

export function LocalizedApp({ initialMessages, toolComponent }: { initialMessages?: Record<string, unknown>; toolComponent?: React.ComponentType } = {}) {
  const location = useLocation()
  const navigate = useNavigate()
  const route = useMemo(() => routeContext(location.pathname), [location.pathname])
  const ToolPage = toolComponent ?? (route.toolId ? toolPages[route.toolId] : undefined)
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
    <LocaleProvider key={route.locale} locale={route.locale} initialMessages={initialMessages}>
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
