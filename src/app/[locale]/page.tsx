import { matchesTool } from '@/lib/tool-discovery'
import { useMemo, useState } from 'react'
import { useTranslations } from '@/i18n/compat'
import { visibleTools as allTools, visibleToolsConfig as toolsConfig } from '@/lib/tools-config'
import { useToolPreferences } from '@/lib/tool-preferences'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Heart, Clock, Grid2X2 } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { toolIconMap } from '@/components/app-sidebar'

type ToolView = 'all' | 'favorites' | 'recent'

export default function Home() {
  const t = useTranslations()
  const x = useTranslations('homeExtras')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [view, setView] = useState<ToolView>('all')
  const { favorites, recent, storageAvailable, toggleFavorite, clearRecent } =
    useToolPreferences()
  const filteredTools = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase()
    const candidates =
      view === 'recent'
        ? recent.flatMap((id) => allTools.filter((tool) => tool.id === id))
        : allTools
    return candidates.filter(
      (tool) =>
        (!selectedCategory || tool.category === selectedCategory) &&
        (view !== 'favorites' || favorites.includes(tool.id)) &&
        matchesTool(tool, query, t),
    )
  }, [searchQuery, selectedCategory, t, favorites, recent, view])
  const views = [
    { id: 'all', icon: Grid2X2 },
    { id: 'favorites', icon: Heart },
    { id: 'recent', icon: Clock },
  ] as const

  return (
    <section
      className="container mx-auto space-y-6 p-2 md:p-6"
      data-testid="tool-home"
    >
      <header className="flex flex-wrap items-end justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('home.all_tools')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
            {t('home.showing_tools', { count: filteredTools.length })}
          </p>
        </div>
        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            data-testid="tool-search"
            aria-label={x('search')}
            placeholder={x('search')}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="ps-10"
          />
        </div>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={t('home.all_tools')}
        >
          {views.map(({ id, icon: Icon }) => (
            <Button
              key={id}
              data-testid={`view-${id}`}
              variant={view === id ? 'default' : 'outline'}
              aria-pressed={view === id}
              onClick={() => {
                setView(id)
                setSelectedCategory(null)
              }}
            >
              <Icon className="me-2 size-4" />
              {x(id)}
              {id === 'favorites' && ` (${allTools.filter((tool) => favorites.includes(tool.id)).length})`}
            </Button>
          ))}
        </div>
        {view === 'recent' && recent.length > 0 && (
          <Button variant="ghost" onClick={clearRecent}>
            {x('clearRecent')}
          </Button>
        )}
      </div>
      {!storageAvailable && (
        <p
          role="status"
          className="rounded-md border p-3 text-sm text-muted-foreground"
        >
          {x('storageUnavailable')}
        </p>
      )}
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={t('home.all_categories')}
      >
        <Button
          size="sm"
          variant={selectedCategory === null ? 'secondary' : 'ghost'}
          aria-pressed={selectedCategory === null}
          onClick={() => setSelectedCategory(null)}
        >
          {t('home.all_categories')}
        </Button>
        {toolsConfig.map((category) => (
          <Button
            size="sm"
            key={category.id}
            data-testid={`category-${category.id}`}
            variant={selectedCategory === category.id ? 'secondary' : 'ghost'}
            aria-pressed={selectedCategory === category.id}
            onClick={() => setSelectedCategory(category.id)}
          >
            {t(category.nameKey)}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filteredTools.map((tool) => {
          const Icon = toolIconMap[tool.icon as keyof typeof toolIconMap]
          const saved = favorites.includes(tool.id)
          const name = t(tool.nameKey)
          return (
            <Card
              key={tool.id}
              data-testid={`tool-card-${tool.id}`}
              className="group relative h-full transition-colors hover:border-primary/50"
            >
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    {Icon && <Icon className="size-5" />}
                  </div>
                  <Link
                    href={tool.path}
                    className="font-semibold leading-snug after:absolute after:inset-0 after:rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                  >
                    {name}
                  </Link>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="relative z-10 size-8 shrink-0"
                  data-testid={`favorite-${tool.id}`}
                  aria-pressed={saved}
                  aria-label={x(saved ? 'removeFavorite' : 'addFavorite', {
                    name,
                  })}
                  onClick={() => toggleFavorite(tool.id)}
                >
                  <Heart
                    className={`size-4 ${saved ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`}
                  />
                </Button>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-3 text-sm">
                  {t(tool.descriptionKey)}
                </CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>
      {filteredTools.length === 0 && (
        <p className="py-12 text-center text-muted-foreground" role="status">
          {searchQuery || selectedCategory
            ? t('home.no_tools_found')
            : view === 'favorites'
              ? x('emptyFavorites')
              : view === 'recent'
                ? x('emptyRecent')
                : t('home.no_tools_found')}
        </p>
      )}
    </section>
  )
}
