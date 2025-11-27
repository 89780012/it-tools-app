import type { Metadata } from 'next'
import { getTranslations,getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.json-to-xml.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/json-to-xml`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/json-to-xml`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/json-to-xml',
        'zh': 'https://www.toolkitpub.com/zh/tools/json-to-xml',
        'es': 'https://www.toolkitpub.com/es/tools/json-to-xml',
        'de': 'https://www.toolkitpub.com/de/tools/json-to-xml',
        'fr': 'https://www.toolkitpub.com/fr/tools/json-to-xml',
        'it': 'https://www.toolkitpub.com/it/tools/json-to-xml',
        'pt': 'https://www.toolkitpub.com/pt/tools/json-to-xml',
        'ru': 'https://www.toolkitpub.com/ru/tools/json-to-xml',
        'ja': 'https://www.toolkitpub.com/ja/tools/json-to-xml',
        'ko': 'https://www.toolkitpub.com/ko/tools/json-to-xml',
        'ar': 'https://www.toolkitpub.com/ar/tools/json-to-xml',
        'hi': 'https://www.toolkitpub.com/hi/tools/json-to-xml',
      },
    },
  }
}

export default function JsonToXmlLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}