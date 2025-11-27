import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.sha1-hash.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/sha1-hash`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/sha1-hash`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/sha1-hash',
        'zh': 'https://www.toolkitpub.com/zh/tools/sha1-hash',
        'es': 'https://www.toolkitpub.com/es/tools/sha1-hash',
        'de': 'https://www.toolkitpub.com/de/tools/sha1-hash',
        'fr': 'https://www.toolkitpub.com/fr/tools/sha1-hash',
        'it': 'https://www.toolkitpub.com/it/tools/sha1-hash',
        'pt': 'https://www.toolkitpub.com/pt/tools/sha1-hash',
        'ru': 'https://www.toolkitpub.com/ru/tools/sha1-hash',
        'ja': 'https://www.toolkitpub.com/ja/tools/sha1-hash',
        'ko': 'https://www.toolkitpub.com/ko/tools/sha1-hash',
        'ar': 'https://www.toolkitpub.com/ar/tools/sha1-hash',
        'hi': 'https://www.toolkitpub.com/hi/tools/sha1-hash',
      },
    },
  }
}

export default function SHA1HashLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}