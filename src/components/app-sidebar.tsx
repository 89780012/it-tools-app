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
} from "lucide-react"
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { toolsConfig } from "@/lib/tools-config"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

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
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              isActive={pathname === "/"}
            >
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Wrench className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{t("common.home")}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {t("header.subtitle")}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {toolsConfig.map((category) => {
          const isExpanded = expandedCategories.has(category.id)

          return (
            <SidebarGroup key={category.id}>
              <Collapsible
                open={isExpanded}
                onOpenChange={() => toggleCategory(category.id)}
                className="group/collapsible"
              >
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center justify-between">
                    <span className="text-sidebar-foreground font-medium">
                      {t(`categories.${category.id}`)}
                    </span>
                    <ChevronRight className="ml-auto size-4 shrink-0 transition-transform duration-300 ease-in-out group-data-[state=open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    {category.tools.length > 0 ? (
                      <SidebarMenu>
                        {category.tools.map((tool) => {
                          const toolPath = `/tools/${tool.id}`
                          const isActive = pathname === toolPath
                          const ToolIcon = toolIconMap[tool.icon as keyof typeof toolIconMap]

                          return (
                            <SidebarMenuItem key={tool.id}>
                              <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={t(`tools.${tool.id}.name`)}
                              >
                                <Link href={toolPath}>
                                  {ToolIcon && <ToolIcon className="size-4" />}
                                  <span className="font-medium">{t(`tools.${tool.id}.name`)}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          )
                        })}
                      </SidebarMenu>
                    ) : (
                      <div className="px-2 py-1 text-sm text-muted-foreground">
                        {t('common.coming_soon')}
                      </div>
                    )}
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          )
        })}

      </SidebarContent>
    </Sidebar>
  )
}
