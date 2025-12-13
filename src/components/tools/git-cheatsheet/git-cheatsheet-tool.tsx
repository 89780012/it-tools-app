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

const CATEGORY_ORDER = [
  'setup',
  'basic',
  'branch',
  'remote',
  'undo',
  'stash',
  'log',
  'tag',
  'merge',
  'advanced',
]

export default function GitCheatsheetTool() {
  const t = useTranslations('tools.git-cheatsheet')
  const common = useTranslations('common')
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)

  // Get all commands from translations using t.raw()
  const allCommands = useMemo(() => {
    try {
      const commandsData = t.raw('commands') as AllCommands
      return commandsData || {}
    } catch {
      return {}
    }
  }, [t])

  // Filter commands based on search query and active category
  const filteredCommands = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    const result: AllCommands = {}

    for (const category of CATEGORY_ORDER) {
      if (activeCategory && activeCategory !== category) continue
      if (!allCommands[category]) continue

      const categoryCommands: CommandCategory = {}
      for (const [key, command] of Object.entries(allCommands[category])) {
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
  }, [allCommands, searchQuery, activeCategory])

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

  const totalCommands = useMemo(() => {
    let count = 0
    for (const category of Object.values(filteredCommands)) {
      count += Object.keys(category).length
    }
    return count
  }, [filteredCommands])

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
              {totalCommands === 0
                ? t('no_results')
                : `${totalCommands} 个命令`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Command Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {CATEGORY_ORDER.map((category) => {
          const commands = filteredCommands[category]
          if (!commands || Object.keys(commands).length === 0) return null

          return (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {t(`categories.${category}`)}
                  <Badge variant="secondary" className="text-xs">
                    {Object.keys(commands).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[400px] overflow-y-auto p-4 space-y-2">
                  {Object.entries(commands).map(([key, command]) => (
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

      {/* No Results */}
      {totalCommands === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t('no_results')}</p>
          </CardContent>
        </Card>
      )}

      {/* SEO Section */}
      <ToolSEOSection toolId="git-cheatsheet" />
    </div>
  )
}
