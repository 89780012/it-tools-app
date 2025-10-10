"use client"

import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toolsConfig } from "@/lib/tools-config"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

interface RelatedToolsProps {
  toolId: string
  className?: string
  maxItems?: number
}

// 实际存在的工具页面列表
const availableTools = [
  'json-formatter', 'json-to-csv', 'json-to-yaml', 'json-to-xml',
  'json-diff', 'json-generator', 'json-visualizer',
  'base64-encoder-decoder', 'url-encoder-decoder',
  'md5-hash', 'sha256-hash', 'sha1-hash', 'hex-encoder-decoder',
  'binary-encoder-decoder', 'password-generator', 'aes-encrypt-decrypt',
  'rsa-encrypt-decrypt', 'hmac-generator',
  'ip-lookup',
  'time-converter',
  'qr-code-generator', 'svg-placeholder-generator', 'base64-file-converter',
  'cron-expression-parser', 'uuid-generator'
]

export function RelatedTools({ toolId, className, maxItems = 50 }: RelatedToolsProps) {
  const t = useTranslations()
  const locale = useLocale()

  // 找到当前工具所属的分类
  const currentTool = toolsConfig
    .flatMap(category => category.tools)
    .find(tool => tool.id === toolId)

  if (!currentTool) {
    return null
  }

  // 获取所有实际可用的工具
  const allAvailableTools = toolsConfig
    .flatMap(category => category.tools)
    .filter(tool =>
      availableTools.includes(tool.id) && // 确保工具页面存在
      tool.id !== toolId // 排除当前工具
    )

  // 优先显示同分类的工具
  const sameCategory = allAvailableTools.filter(tool => tool.category === currentTool.category)

  // 获取其他分类的工具，按分类分组显示
  const otherCategories = allAvailableTools.filter(tool => tool.category !== currentTool.category)

  // 智能推荐逻辑：同分类优先，然后是其他热门工具
  let relatedTools = [...sameCategory]

  // 添加其他分类的工具，显示所有可用工具
  relatedTools = [...relatedTools, ...otherCategories]

  // 限制显示数量（如果设置了maxItems且小于总数）
  if (maxItems && maxItems < relatedTools.length) {
    relatedTools = relatedTools.slice(0, maxItems)
  }

  if (relatedTools.length === 0) {
    return null
  }

  const getToolPath = (path: string) => {
    return locale === 'en' ? path : `/${locale}${path}`
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🔗</span>
          {t('seo.related_tools')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {relatedTools.map((tool) => (
            <Link
              key={tool.id}
              href={getToolPath(tool.path)}
              className="group"
            >
              <div className="p-4 border rounded-lg hover:border-primary transition-colors h-full flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                    {t(tool.nameKey)}
                  </h3>
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3 flex-1 line-clamp-2">
                  {t(tool.descriptionKey)}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {t(`categories.${tool.category}`)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-6 px-2"
                    asChild
                  >
                    <span>{t('seo.try_now')}</span>
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 显示可用工具统计 */}
        <div className="mt-4 text-center text-xs text-muted-foreground">
          {t('seo.showing_tools', {
            current: relatedTools.length,
            total: allAvailableTools.length + 1 // +1 是当前工具
          })}
        </div>
      </CardContent>
    </Card>
  )
}
