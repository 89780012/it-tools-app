import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import CronExpressionParserTool from '@/components/tools/cron-expression-parser/cron-expression-parser-tool'

interface PageProps {
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'tools.cron-expression-parser.meta' })

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
  }
}

export default function CronExpressionParserPage() {
  return <CronExpressionParserTool />
}
