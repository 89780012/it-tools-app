import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.sha256-hash.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/sha256-hash`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/sha256-hash`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/sha256-hash',
        'zh': 'https://www.toolkitpub.com/zh/tools/sha256-hash',
        'es': 'https://www.toolkitpub.com/es/tools/sha256-hash',
        'de': 'https://www.toolkitpub.com/de/tools/sha256-hash',
        'fr': 'https://www.toolkitpub.com/fr/tools/sha256-hash',
        'it': 'https://www.toolkitpub.com/it/tools/sha256-hash',
        'pt': 'https://www.toolkitpub.com/pt/tools/sha256-hash',
        'ru': 'https://www.toolkitpub.com/ru/tools/sha256-hash',
        'ja': 'https://www.toolkitpub.com/ja/tools/sha256-hash',
        'ko': 'https://www.toolkitpub.com/ko/tools/sha256-hash',
        'ar': 'https://www.toolkitpub.com/ar/tools/sha256-hash',
        'hi': 'https://www.toolkitpub.com/hi/tools/sha256-hash',
      },
    },
  }
}

export default function SHA256HashLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}