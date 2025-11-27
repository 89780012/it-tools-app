import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.csv-to-json.meta' })

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/csv-to-json`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/csv-to-json`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/csv-to-json',
        'zh': 'https://www.toolkitpub.com/zh/tools/csv-to-json',
        'es': 'https://www.toolkitpub.com/es/tools/csv-to-json',
        'de': 'https://www.toolkitpub.com/de/tools/csv-to-json',
        'fr': 'https://www.toolkitpub.com/fr/tools/csv-to-json',
        'it': 'https://www.toolkitpub.com/it/tools/csv-to-json',
        'pt': 'https://www.toolkitpub.com/pt/tools/csv-to-json',
        'ru': 'https://www.toolkitpub.com/ru/tools/csv-to-json',
        'ja': 'https://www.toolkitpub.com/ja/tools/csv-to-json',
        'ko': 'https://www.toolkitpub.com/ko/tools/csv-to-json',
        'ar': 'https://www.toolkitpub.com/ar/tools/csv-to-json',
        'hi': 'https://www.toolkitpub.com/hi/tools/csv-to-json',
      },
    },
  }
}

export default function CsvToJsonLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
