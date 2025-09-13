/**
 * SEO相关的类型定义
 */

export interface FAQItem {
  question: string
  answer: string
}

export interface ToolSEOContent {
  introduction?: string
  features?: string[]
  faq?: FAQItem[]
}

export interface ToolMeta {
  title: string
  description: string
  keywords: string
}

/**
 * 扩展原有的Tool接口，添加SEO相关字段
 */
export interface ToolWithSEO {
  id: string
  nameKey: string
  descriptionKey: string
  category: string
  path: string
  icon?: string
  seo?: ToolSEOContent
  meta?: ToolMeta
}

/**
 * SEO组件的通用Props
 */
export interface SEOComponentProps {
  toolId: string
  className?: string
}

/**
 * 验证工具SEO内容的函数类型
 */
export type SEOContentValidator = (content: ToolSEOContent) => boolean

/**
 * 工具SEO内容获取函数类型
 */
export type SEOContentGetter = (toolId: string, locale: string) => ToolSEOContent | null