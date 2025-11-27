import type { Metadata } from 'next'
import { getTranslations,getLocale } from 'next-intl/server'


export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.json-to-csv.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/json-to-csv`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/json-to-csv`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/json-to-csv',
        'zh': 'https://www.toolkitpub.com/zh/tools/json-to-csv',
        'es': 'https://www.toolkitpub.com/es/tools/json-to-csv',
        'de': 'https://www.toolkitpub.com/de/tools/json-to-csv',
        'fr': 'https://www.toolkitpub.com/fr/tools/json-to-csv',
        'it': 'https://www.toolkitpub.com/it/tools/json-to-csv',
        'pt': 'https://www.toolkitpub.com/pt/tools/json-to-csv',
        'ru': 'https://www.toolkitpub.com/ru/tools/json-to-csv',
        'ja': 'https://www.toolkitpub.com/ja/tools/json-to-csv',
        'ko': 'https://www.toolkitpub.com/ko/tools/json-to-csv',
        'ar': 'https://www.toolkitpub.com/ar/tools/json-to-csv',
        'hi': 'https://www.toolkitpub.com/hi/tools/json-to-csv',
      },
    },
  }
}

export default function JsonToCsvLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}