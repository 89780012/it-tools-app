"use client"

import { useState, memo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FAQItem {
  question: string
  answer: string
}

interface ToolFAQProps {
  toolId: string
  className?: string
}

function ToolFAQComponent({ toolId, className }: ToolFAQProps) {
  const t = useTranslations()
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  // 获取FAQ数据
  const faqItems = t.raw(`tools.${toolId}.faq`) as FAQItem[]

  // 如果没有FAQ内容，不渲染组件
  if (!faqItems || faqItems.length === 0) {
    return null
  }

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems)
    if (openItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }

  const toggleAll = () => {
    if (openItems.size === faqItems.length) {
      // 全部收起
      setOpenItems(new Set())
    } else {
      // 全部展开
      setOpenItems(new Set(Array.from({ length: faqItems.length }, (_, i) => i)))
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <span className="text-2xl">❓</span>
            {t('seo.frequently_asked_questions')}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAll}
            className="text-xs"
          >
            {openItems.size === faqItems.length ? t('seo.collapse') : t('seo.expand')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {faqItems.map((item, index) => (
          <Collapsible
            key={index}
            open={openItems.has(index)}
            onOpenChange={() => toggleItem(index)}
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-left">
              <h3 className="font-medium text-sm pr-2">
                {item.question}
              </h3>
              {openItems.has(index) ? (
                <ChevronDown className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 pb-2 px-4">
              <div className="text-sm text-muted-foreground leading-relaxed">
                {item.answer}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  )
}

// 使用React.memo优化渲染性能
export const ToolFAQ = memo(ToolFAQComponent)