import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.cron-expression-parser.meta' })
  const tSite = await getTranslations({ locale, namespace: 'meta' })
  
  return {
    title: `${t('title')} - ${tSite('site.name')}`,
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: `${t('title')} - ${tSite('site.name')}`,
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/cron-expression-parser`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${t('title')} - ${tSite('site.name')}`,
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/cron-expression-parser`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/cron-expression-parser',
        'zh': 'https://www.toolkitpub.com/zh/tools/cron-expression-parser',
        'hi': 'https://www.toolkitpub.com/hi/tools/cron-expression-parser',
      },
    },
  }
}

export default function CronExpressionParserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
