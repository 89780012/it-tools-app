"use client"

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ToolIntroductionProps {
  toolId: string
  className?: string
}

export function ToolIntroduction({ toolId, className }: ToolIntroductionProps) {
  const t = useTranslations()

  // 获取工具的介绍和功能特性
  const introduction = t(`tools.${toolId}.introduction`)
  const features = t.raw(`tools.${toolId}.features`) as string[]

  // 如果没有介绍内容，不渲染组件
  if (!introduction) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <span className="text-2xl">📖</span>
          {t('seo.tool_introduction')}
        </h2>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 工具介绍 */}
        <div className="text-muted-foreground leading-relaxed">
          {introduction}
        </div>

        {/* 功能特性 */}
        {features && features.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">
              {t('seo.tool_features')}
            </h3>
            <div className="grid gap-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Badge variant="secondary" className="mt-0.5 px-2 py-1 text-xs">
                    {index + 1}
                  </Badge>
                  <span className="text-sm text-muted-foreground leading-relaxed">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}