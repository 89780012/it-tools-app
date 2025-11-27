import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.md5-hash.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/md5-hash`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/md5-hash`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/md5-hash',
        'zh': 'https://www.toolkitpub.com/zh/tools/md5-hash',
        'es': 'https://www.toolkitpub.com/es/tools/md5-hash',
        'de': 'https://www.toolkitpub.com/de/tools/md5-hash',
        'fr': 'https://www.toolkitpub.com/fr/tools/md5-hash',
        'it': 'https://www.toolkitpub.com/it/tools/md5-hash',
        'pt': 'https://www.toolkitpub.com/pt/tools/md5-hash',
        'ru': 'https://www.toolkitpub.com/ru/tools/md5-hash',
        'ja': 'https://www.toolkitpub.com/ja/tools/md5-hash',
        'ko': 'https://www.toolkitpub.com/ko/tools/md5-hash',
        'ar': 'https://www.toolkitpub.com/ar/tools/md5-hash',
        'hi': 'https://www.toolkitpub.com/hi/tools/md5-hash',
      },
    },
  }
}

export default function MD5HashLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}