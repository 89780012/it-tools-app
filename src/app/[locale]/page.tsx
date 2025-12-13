"use client"

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { toolsConfig } from "@/lib/tools-config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Heart } from "lucide-react"
import { Link } from "@/i18n/navigation"
import * as LucideIcons from "lucide-react"

// Dynamic icon component
function DynamicIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null

  // Convert kebab-case to PascalCase
  const iconName = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('') as keyof typeof LucideIcons

  const IconComponent = LucideIcons[iconName] as React.ComponentType<{ className?: string }>

  if (!IconComponent) return null

  return <IconComponent className={className} />
}

export default function Home() {
  const t = useTranslations()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  // Get all tools with their category info
  const allTools = useMemo(() => {
    return toolsConfig.flatMap(category =>
      category.tools.map(tool => ({
        ...tool,
        categoryId: category.id,
        categoryNameKey: category.nameKey
      }))
    )
  }, [])

  // Filter tools based on search and category
  const filteredTools = useMemo(() => {
    return allTools.filter(tool => {
      // Category filter
      if (selectedCategory && tool.categoryId !== selectedCategory) {
        return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const name = t(tool.nameKey).toLowerCase()
        const description = t(tool.descriptionKey).toLowerCase()
        return name.includes(query) || description.includes(query)
      }

      return true
    })
  }, [allTools, searchQuery, selectedCategory, t])

  // Toggle favorite
  const toggleFavorite = (toolId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(toolId)) {
        newFavorites.delete(toolId)
      } else {
        newFavorites.add(toolId)
      }
      return newFavorites
    })
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Header with search */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">{t("home.all_tools")}</h1>

        {/* Search input */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("home.search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Badge
          variant={selectedCategory === null ? "default" : "outline"}
          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
          onClick={() => setSelectedCategory(null)}
        >
          {t("home.all_categories")}
        </Badge>
        {toolsConfig.map((category) => (
          <Badge
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => setSelectedCategory(category.id)}
          >
            {t(category.nameKey)}
          </Badge>
        ))}
      </div>

      {/* Tools count */}
      <p className="text-sm text-muted-foreground mb-4">
        {t("home.showing_tools", { count: filteredTools.length })}
      </p>

      {/* Tools grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTools.map((tool) => (
          <Link key={tool.id} href={tool.path} className="block">
            <Card className="h-full hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <DynamicIcon name={tool.icon} className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base font-semibold line-clamp-1">
                      {t(tool.nameKey)}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={(e) => toggleFavorite(tool.id, e)}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        favorites.has(tool.id)
                          ? "fill-red-500 text-red-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-2 text-sm">
                  {t(tool.descriptionKey)}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* No results */}
      {filteredTools.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("home.no_tools_found")}</p>
        </div>
      )}
    </div>
  )
}
