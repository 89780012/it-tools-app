import { getTranslations } from 'next-intl/server'
import { ToolContainer } from '@/components/tool-container'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{
    locale: string
  }>
}

export default async function CronExpressionParserLayout({
  children,
  params,
}: LayoutProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'tools.cron-expression-parser' })

  return (
    <ToolContainer title={t('name')} description={t('description')}>
      {children}
    </ToolContainer>
  )
}
