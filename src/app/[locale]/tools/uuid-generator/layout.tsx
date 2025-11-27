import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.uuid-generator.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/uuid-generator`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/uuid-generator`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/uuid-generator',
        'zh': 'https://www.toolkitpub.com/zh/tools/uuid-generator',
        'es': 'https://www.toolkitpub.com/es/tools/uuid-generator',
        'de': 'https://www.toolkitpub.com/de/tools/uuid-generator',
        'fr': 'https://www.toolkitpub.com/fr/tools/uuid-generator',
        'it': 'https://www.toolkitpub.com/it/tools/uuid-generator',
        'pt': 'https://www.toolkitpub.com/pt/tools/uuid-generator',
        'ru': 'https://www.toolkitpub.com/ru/tools/uuid-generator',
        'ja': 'https://www.toolkitpub.com/ja/tools/uuid-generator',
        'ko': 'https://www.toolkitpub.com/ko/tools/uuid-generator',
        'ar': 'https://www.toolkitpub.com/ar/tools/uuid-generator',
        'hi': 'https://www.toolkitpub.com/hi/tools/uuid-generator',
      },
    },
  }
}

export default function UUIDGeneratorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

