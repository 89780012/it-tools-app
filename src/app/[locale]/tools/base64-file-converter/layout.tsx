import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.base64-file-converter.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/base64-file-converter`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/base64-file-converter`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/base64-file-converter',
        'zh': 'https://www.toolkitpub.com/zh/tools/base64-file-converter',
        'es': 'https://www.toolkitpub.com/es/tools/base64-file-converter',
        'de': 'https://www.toolkitpub.com/de/tools/base64-file-converter',
        'fr': 'https://www.toolkitpub.com/fr/tools/base64-file-converter',
        'it': 'https://www.toolkitpub.com/it/tools/base64-file-converter',
        'pt': 'https://www.toolkitpub.com/pt/tools/base64-file-converter',
        'ru': 'https://www.toolkitpub.com/ru/tools/base64-file-converter',
        'ja': 'https://www.toolkitpub.com/ja/tools/base64-file-converter',
        'ko': 'https://www.toolkitpub.com/ko/tools/base64-file-converter',
        'ar': 'https://www.toolkitpub.com/ar/tools/base64-file-converter',
        'hi': 'https://www.toolkitpub.com/hi/tools/base64-file-converter',
      },
    },
  }
}

export default function Base64FileConverterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

