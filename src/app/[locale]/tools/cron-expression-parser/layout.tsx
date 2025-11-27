import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.cron-expression-parser.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/cron-expression-parser`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/cron-expression-parser`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/cron-expression-parser',
        'zh': 'https://www.toolkitpub.com/zh/tools/cron-expression-parser',
        'es': 'https://www.toolkitpub.com/es/tools/cron-expression-parser',
        'de': 'https://www.toolkitpub.com/de/tools/cron-expression-parser',
        'fr': 'https://www.toolkitpub.com/fr/tools/cron-expression-parser',
        'it': 'https://www.toolkitpub.com/it/tools/cron-expression-parser',
        'pt': 'https://www.toolkitpub.com/pt/tools/cron-expression-parser',
        'ru': 'https://www.toolkitpub.com/ru/tools/cron-expression-parser',
        'ja': 'https://www.toolkitpub.com/ja/tools/cron-expression-parser',
        'ko': 'https://www.toolkitpub.com/ko/tools/cron-expression-parser',
        'ar': 'https://www.toolkitpub.com/ar/tools/cron-expression-parser',
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
