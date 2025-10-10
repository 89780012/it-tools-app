"use client"

import { useState } from "react"
import {
  Code,
  ChevronRight,
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
  QrCode,
  Fingerprint,
  ScanLine,
  Hexagon,
  Key,
  Lock,
  ShieldEllipsis,
  CodeXml,
  SquareDashed,
  History,
  Clock8,
  ChevronsDownUp,
  ChevronsUpDown,
} from "lucide-react"
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { toolsConfig } from "@/lib/tools-config"
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"

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
  // 新添加的唯一图标
  fingerprint: Fingerprint,      // MD5 hash
  "scan-line": ScanLine,         // SHA1 hash
  hexagon: Hexagon,              // Hex encoder
  key: Key,                      // Password generator
  lock: Lock,                    // AES encrypt
  "shield-ellipsis": ShieldEllipsis,  // HMAC generator
  "code-xml": CodeXml,           // Base64 encoder
  "square-dashed": SquareDashed, // SVG placeholder
  history: History,
  "clock-8": Clock8,
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

  const expandAll = () => {
    setExpandedCategories(new Set(toolsConfig.map(category => category.id)))
  }

  const collapseAll = () => {
    setExpandedCategories(new Set())
  }

  const isAllExpanded = expandedCategories.size === toolsConfig.length

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2">
          {/* 左侧：首页链接 */}
          <Link 
            href="/" 
            className={`flex items-center gap-3 flex-1 rounded-lg hover:bg-accent transition-colors ${
              pathname === "/" ? "bg-accent" : ""
            }`}
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-500 text-white">
              <Wrench className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{t("common.home")}</span>
              <span className="truncate text-xs text-muted-foreground">
                {t("header.subtitle")}
              </span>
            </div>
          </Link>

          {/* 右侧：全展开/收缩按钮 */}
          <button
            onClick={isAllExpanded ? collapseAll : expandAll}
            className="flex items-center justify-center size-8 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title={isAllExpanded ? "全部收起" : "全部展开"}
          >
            {isAllExpanded ? (
              <ChevronsDownUp className="size-4" />
            ) : (
              <ChevronsUpDown className="size-4" />
            )}
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="gap-1">
          {toolsConfig.map((category) => {
            const isExpanded = expandedCategories.has(category.id)

            return (
              <div key={category.id}>
                {/* 一级菜单 - 分类 */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => toggleCategory(category.id)}
                    className="h-9 font-medium hover:bg-accent"
                  >
                    <span className="flex-1 text-left">{t(`categories.${category.id}`)}</span>
                    <ChevronRight 
                      className={`size-4 shrink-0 transition-transform duration-200 ${
                        isExpanded ? 'rotate-90' : ''
                      }`} 
                    />
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* 二级菜单 - 工具列表 */}
                {isExpanded && (
                  <div className="ml-2 border-l border-sidebar-border pl-2 my-1">
                    {category.tools.length > 0 ? (
                      category.tools.map((tool) => {
                        const toolPath = `/tools/${tool.id}`
                        const isActive = pathname === toolPath
                        const ToolIcon = toolIconMap[tool.icon as keyof typeof toolIconMap]

                        return (
                          <SidebarMenuItem key={tool.id}>
                            <SidebarMenuButton
                              asChild
                              isActive={isActive}
                              tooltip={t(`tools.${tool.id}.name`)}
                              className="h-8"
                            >
                              <Link href={toolPath}>
                                {ToolIcon && <ToolIcon className="size-4" />}
                                <span className="text-sm">{t(`tools.${tool.id}.name`)}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )
                      })
                    ) : (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        {t('common.coming_soon')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
