"use client"

import { cn } from "@/lib/utils"
import { ToolIntroduction } from "./tool-introduction"
import { ToolFAQ } from "./tool-faq"
import { RelatedTools } from "./related-tools"

interface ToolSEOSectionProps {
  toolId: string
  className?: string
  showIntroduction?: boolean
  showFAQ?: boolean
  showRelatedTools?: boolean
}

export function ToolSEOSection({
  toolId,
  className,
  showIntroduction = true,
  showFAQ = true,
  showRelatedTools = true,
}: ToolSEOSectionProps) {
  return (
    <section className={cn("space-y-8 mt-12", className)}>
      {/* 工具介绍和功能特性 */}
      {showIntroduction && (
        <ToolIntroduction toolId={toolId} />
      )}

      {/* 常见问题 */}
      {showFAQ && (
        <ToolFAQ toolId={toolId} />
      )}

      {/* 相关工具 */}
      {showRelatedTools && (
        <RelatedTools toolId={toolId} />
      )}
    </section>
  )
}

// 导出所有子组件以支持独立使用
export { ToolIntroduction, ToolFAQ, RelatedTools }