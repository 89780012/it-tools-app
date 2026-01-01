'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Copy, Search, Check } from 'lucide-react'
import { ToolSEOSection } from '@/components/seo/tool-seo-section'
import { filterConfigs, countConfigs, CATEGORY_ORDER, type AllConfigs } from './filter-utils'

export default function NginxCheatsheetTool() {
  const t = useTranslations('tools.nginx-cheatsheet')
  const common = useTranslations('common')
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [copiedConfig, setCopiedConfig] = useState<string | null>(null)

  // Get all configs from translations using t.raw()
  const allConfigs = useMemo(() => {
    try {
      const configsData = t.raw('configs') as AllConfigs
      return configsData || {}
    } catch {
      return {}
    }
  }, [t])

  // Filter configs based on search query and active category
  const filteredConfigs = useMemo(() => {
    return filterConfigs(allConfigs, searchQuery, activeCategory)
  }, [allConfigs, searchQuery, activeCategory])

  const handleCopy = async (config: string) => {
    try {
      await navigator.clipboard.writeText(config)
      setCopiedConfig(config)
      toast({
        title: t('copy_success'),
      })
      setTimeout(() => setCopiedConfig(null), 2000)
    } catch {
      toast({
        title: common('copy_failed'),
        variant: 'destructive',
      })
    }
  }

  const totalConfigs = useMemo(() => {
    return countConfigs(filteredConfigs)
  }, [filteredConfigs])


  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t('name')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(null)}
            >
              {t('all_categories')}
            </Button>
            {CATEGORY_ORDER.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(activeCategory === category ? null : category)}
              >
                {t(`categories.${category}`)}
              </Button>
            ))}
          </div>

          {searchQuery && (
            <p className="text-sm text-muted-foreground">
              {totalConfigs === 0
                ? t('no_results')
                : t('results_count', { count: totalConfigs })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Config Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {CATEGORY_ORDER.map((category) => {
          const configs = filteredConfigs[category]
          if (!configs || Object.keys(configs).length === 0) return null

          return (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {t(`categories.${category}`)}
                  <Badge variant="secondary" className="text-xs">
                    {Object.keys(configs).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto p-4 space-y-3">
                  {Object.entries(configs).map(([key, config]) => (
                    <div
                      key={key}
                      className="group rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium text-foreground">
                          {config.desc}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleCopy(config.config)}
                        >
                          {copiedConfig === config.config ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <pre className="text-xs font-mono bg-muted p-3 rounded overflow-x-auto whitespace-pre-wrap break-all">
                        {config.config}
                      </pre>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* No Results */}
      {totalConfigs === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t('no_results')}</p>
          </CardContent>
        </Card>
      )}

      {/* SEO Section */}
      <ToolSEOSection toolId="nginx-cheatsheet" />
    </div>
  )
}
