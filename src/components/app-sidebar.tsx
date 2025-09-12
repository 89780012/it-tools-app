"use client"

import { useState } from "react"
import {
  Code,
  ChevronRight,
  ChevronDown,
  Wrench,
  Table,
  FileText,
  FileCode,
  Eye,
  Database,
  GitCompare,
  Binary,
  Link as LinkIcon,
  Hash,
  ShieldCheck,
  KeyRound,
  MapPin,
  QrCode
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { toolsConfig } from "@/lib/tools-config"

const toolIconMap = {
  code: Code,
  table: Table,
  "file-text": FileText,
  "file-code": FileCode,
  eye: Eye,
  database: Database,
  "git-compare": GitCompare,
  binary: Binary,
  link: LinkIcon,
  hash: Hash,
  "shield-check": ShieldCheck,
  "key-round": KeyRound,
  "map-pin": MapPin,
  "qr-code": QrCode,
  key: Hash, // 为密码生成器使用 hash 图标
}

export function AppSidebar() {
  const t = useTranslations()
  const pathname = usePathname()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(toolsConfig.map(category => category.id))
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

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-2">
          <Link
            href="/"
            className={cn(
              "flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              pathname === "/" && "bg-accent text-accent-foreground"
            )}
          >
            <Wrench className="h-4 w-4" />
            <span>{t("common.home")}</span>
          </Link>
          
          {toolsConfig.map((category) => {
            const isExpanded = expandedCategories.has(category.id)
            
            return (
              <div key={category.id} className="space-y-1">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-all duration-200 ease-in-out",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <span>{t(`categories.${category.id}`)}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                  )}
                </button>
                
                <div 
                  className={cn(
                    "ml-4 overflow-hidden transition-all duration-300 ease-in-out",
                    isExpanded
                      ? "max-h-96 opacity-100" 
                      : "max-h-0 opacity-0"
                  )}
                >
                  {category.tools.length > 0 ? (
                    <div className="space-y-1 py-1">
                      {category.tools.map((tool) => {
                        const toolPath = `/tools/${tool.id}`
                        const isActive = pathname === toolPath
                        const ToolIcon = toolIconMap[tool.icon as keyof typeof toolIconMap]
                        
                        return (
                          <Link
                            key={tool.id}
                            href={toolPath}
                            className={cn(
                              "flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left text-sm transition-all duration-200 ease-in-out",
                              "hover:bg-accent hover:text-accent-foreground",
                              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                              isActive && "bg-accent text-accent-foreground"
                            )}
                          >
                            {ToolIcon && <ToolIcon className="h-4 w-4" />}
                            <div className="font-medium">{t(`tools.${tool.id}.name`)}</div>
                          </Link>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {t('common.coming_soon')}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}