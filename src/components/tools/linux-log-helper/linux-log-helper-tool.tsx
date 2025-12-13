'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Copy, Search, Check, FileArchive, FileSearch } from 'lucide-react'
import { ToolSEOSection } from '@/components/seo/tool-seo-section'

interface Command {
  cmd: string
  desc: string
}

interface CommandCategory {
  [key: string]: Command
}

interface AllCommands {
  [category: string]: CommandCategory
}

const SEARCH_CATEGORY_ORDER = [
  'basic_search',
  'time_filter',
  'pattern_match',
  'real_time',
  'combine',
  'log_files',
]

const DECOMPRESS_CATEGORY_ORDER = [
  'tar',
  'gzip',
  'zip',
  'bzip2',
  'xz',
  'rar',
  '7z',
]

export default function LinuxLogHelperTool() {
  const t = useTranslations('tools.linux-log-helper')
  const common = useTranslations('common')
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<string>('search')
  const [activeSearchCategory, setActiveSearchCategory] = useState<string | null>(null)
  const [activeDecompressCategory, setActiveDecompressCategory] = useState<string | null>(null)
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)

  // Get all commands from translations using t.raw()
  const searchCommands = useMemo(() => {
    try {
      const commandsData = t.raw('search_commands') as AllCommands
      return commandsData || {}
    } catch {
      return {}
    }
  }, [t])

  const decompressCommands = useMemo(() => {
    try {
      const commandsData = t.raw('decompress_commands') as AllCommands
      return commandsData || {}
    } catch {
      return {}
    }
  }, [t])

  // Filter commands based on search query and active category
  const filteredSearchCommands = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    const result: AllCommands = {}

    for (const category of SEARCH_CATEGORY_ORDER) {
      if (activeSearchCategory && activeSearchCategory !== category) continue
      if (!searchCommands[category]) continue

      const categoryCommands: CommandCategory = {}
      for (const [key, command] of Object.entries(searchCommands[category])) {
        if (
          !query ||
          command.cmd.toLowerCase().includes(query) ||
          command.desc.toLowerCase().includes(query)
        ) {
          categoryCommands[key] = command
        }
      }

      if (Object.keys(categoryCommands).length > 0) {
        result[category] = categoryCommands
      }
    }

    return result
  }, [searchCommands, searchQuery, activeSearchCategory])

  const filteredDecompressCommands = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    const result: AllCommands = {}

    for (const category of DECOMPRESS_CATEGORY_ORDER) {
      if (activeDecompressCategory && activeDecompressCategory !== category) continue
      if (!decompressCommands[category]) continue

      const categoryCommands: CommandCategory = {}
      for (const [key, command] of Object.entries(decompressCommands[category])) {
        if (
          !query ||
          command.cmd.toLowerCase().includes(query) ||
          command.desc.toLowerCase().includes(query)
        ) {
          categoryCommands[key] = command
        }
      }

      if (Object.keys(categoryCommands).length > 0) {
        result[category] = categoryCommands
      }
    }

    return result
  }, [decompressCommands, searchQuery, activeDecompressCategory])

  const handleCopy = async (cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd)
      setCopiedCommand(cmd)
      toast({
        title: t('copy_success'),
      })
      setTimeout(() => setCopiedCommand(null), 2000)
    } catch {
      toast({
        title: common('copy_failed'),
        variant: 'destructive',
      })
    }
  }

  const totalSearchCommands = useMemo(() => {
    let count = 0
    for (const category of Object.values(filteredSearchCommands)) {
      count += Object.keys(category).length
    }
    return count
  }, [filteredSearchCommands])

  const totalDecompressCommands = useMemo(() => {
    let count = 0
    for (const category of Object.values(filteredDecompressCommands)) {
      count += Object.keys(category).length
    }
    return count
  }, [filteredDecompressCommands])

  const renderCommandCards = (
    commands: AllCommands,
    categoryOrder: string[],
    categoryPrefix: string
  ) => (
    <div className="grid gap-6 lg:grid-cols-2">
      {categoryOrder.map((category) => {
        const cmds = commands[category]
        if (!cmds || Object.keys(cmds).length === 0) return null

        return (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {t(`${categoryPrefix}.${category}`)}
                <Badge variant="secondary" className="text-xs">
                  {Object.keys(cmds).length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-y-auto p-4 space-y-2">
                {Object.entries(cmds).map(([key, command]) => (
                  <div
                    key={key}
                    className="group flex items-start justify-between gap-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <code className="block text-sm font-mono bg-muted px-2 py-1 rounded break-all">
                        {command.cmd}
                      </code>
                      <p className="text-xs text-muted-foreground">
                        {command.desc}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopy(command.cmd)}
                    >
                      {copiedCommand === command.cmd ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t('name')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <FileSearch className="h-4 w-4" />
            {t('tab_search')}
          </TabsTrigger>
          <TabsTrigger value="decompress" className="flex items-center gap-2">
            <FileArchive className="h-4 w-4" />
            {t('tab_decompress')}
          </TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('search_title')}</CardTitle>
              <CardDescription>{t('search_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  variant={activeSearchCategory === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveSearchCategory(null)}
                >
                  {t('all_categories')}
                </Button>
                {SEARCH_CATEGORY_ORDER.map((category) => (
                  <Button
                    key={category}
                    variant={activeSearchCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveSearchCategory(activeSearchCategory === category ? null : category)}
                  >
                    {t(`search_categories.${category}`)}
                  </Button>
                ))}
              </div>

              {searchQuery && (
                <p className="text-sm text-muted-foreground">
                  {totalSearchCommands === 0
                    ? t('no_results')
                    : t('result_count', { count: totalSearchCommands })}
                </p>
              )}
            </CardContent>
          </Card>

          {renderCommandCards(filteredSearchCommands, SEARCH_CATEGORY_ORDER, 'search_categories')}

          {totalSearchCommands === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">{t('no_results')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Decompress Tab */}
        <TabsContent value="decompress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('decompress_title')}</CardTitle>
              <CardDescription>{t('decompress_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  variant={activeDecompressCategory === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveDecompressCategory(null)}
                >
                  {t('all_categories')}
                </Button>
                {DECOMPRESS_CATEGORY_ORDER.map((category) => (
                  <Button
                    key={category}
                    variant={activeDecompressCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveDecompressCategory(activeDecompressCategory === category ? null : category)}
                  >
                    {t(`decompress_categories.${category}`)}
                  </Button>
                ))}
              </div>

              {searchQuery && (
                <p className="text-sm text-muted-foreground">
                  {totalDecompressCommands === 0
                    ? t('no_results')
                    : t('result_count', { count: totalDecompressCommands })}
                </p>
              )}
            </CardContent>
          </Card>

          {renderCommandCards(filteredDecompressCommands, DECOMPRESS_CATEGORY_ORDER, 'decompress_categories')}

          {totalDecompressCommands === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">{t('no_results')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* SEO Section */}
      <ToolSEOSection toolId="linux-log-helper" />
    </div>
  )
}
