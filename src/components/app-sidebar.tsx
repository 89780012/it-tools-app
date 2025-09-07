"use client"

import { useState } from "react"
import {
  Braces,
  Type,
  Shield,
  Globe,
  Image,
  Code,
  ChevronRight,
  ChevronDown,
  Wrench
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from 'next-intl'
import { toolsConfig } from "@/lib/tools-config"

interface AppSidebarProps {
  onToolSelect: (toolId: string) => void
}

const iconMap = {
  braces: Braces,
  type: Type,
  shield: Shield,
  globe: Globe,
  image: Image,
  code: Code,
}

export function AppSidebar({ onToolSelect }: AppSidebarProps) {
  const t = useTranslations()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["json"])
  )

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleToolClick = (toolId: string) => {
    // 通知父组件选择了工具
    onToolSelect(toolId)
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-2">
          {/* 首页按钮 */}
          <button
            onClick={() => onToolSelect('')}
            className={cn(
              "flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            )}
          >
            <Wrench className="h-4 w-4" />
            <span>{t("common.home")}</span>
          </button>
          {toolsConfig.map((category) => {
            const CategoryIcon = iconMap[category.icon as keyof typeof iconMap]
            const isExpanded = expandedCategories.has(category.id)
            
            return (
              <div key={category.id} className="space-y-1">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  )}
                >
                  <div className="flex items-center space-x-2">
                    {CategoryIcon && <CategoryIcon className="h-4 w-4" />}
                    <span>{t(`categories.${category.id}`)}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                
                {isExpanded && category.tools.length > 0 && (
                  <div className="ml-4 space-y-1">
                    {category.tools.map((tool) => {
                      // const ToolIcon = iconMap[tool.icon as keyof typeof iconMap]
                      
                      return (
                        <button
                          key={tool.id}
                          onClick={() => handleToolClick(tool.id)}
                          className={cn(
                            "flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          )}
                        >
                          {/* {ToolIcon && <ToolIcon className="h-4 w-4" />} */}
                          <div>
                            <div className="font-medium">{t(`tools.${tool.id}.name`)}</div>
                            <div className="text-xs text-muted-foreground">
                              {t(`tools.${tool.id}.description`)}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
                
                {isExpanded && category.tools.length === 0 && (
                  <div className="ml-4 px-3 py-2 text-sm text-muted-foreground">
                    {t('common.coming_soon')}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}