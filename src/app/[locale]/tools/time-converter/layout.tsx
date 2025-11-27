import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.time-converter.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/time-converter`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/time-converter`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/time-converter',
        'zh': 'https://www.toolkitpub.com/zh/tools/time-converter',
        'es': 'https://www.toolkitpub.com/es/tools/time-converter',
        'de': 'https://www.toolkitpub.com/de/tools/time-converter',
        'fr': 'https://www.toolkitpub.com/fr/tools/time-converter',
        'it': 'https://www.toolkitpub.com/it/tools/time-converter',
        'pt': 'https://www.toolkitpub.com/pt/tools/time-converter',
        'ru': 'https://www.toolkitpub.com/ru/tools/time-converter',
        'ja': 'https://www.toolkitpub.com/ja/tools/time-converter',
        'ko': 'https://www.toolkitpub.com/ko/tools/time-converter',
        'ar': 'https://www.toolkitpub.com/ar/tools/time-converter',
        'hi': 'https://www.toolkitpub.com/hi/tools/time-converter',
      },
    },
  }
}

export default function TimeConverterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
