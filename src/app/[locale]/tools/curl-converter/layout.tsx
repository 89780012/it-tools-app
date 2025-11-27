import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'


export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.curl-converter.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/curl-converter`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/curl-converter`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/curl-converter',
        'zh': 'https://www.toolkitpub.com/zh/tools/curl-converter',
        'es': 'https://www.toolkitpub.com/es/tools/curl-converter',
        'de': 'https://www.toolkitpub.com/de/tools/curl-converter',
        'fr': 'https://www.toolkitpub.com/fr/tools/curl-converter',
        'it': 'https://www.toolkitpub.com/it/tools/curl-converter',
        'pt': 'https://www.toolkitpub.com/pt/tools/curl-converter',
        'ru': 'https://www.toolkitpub.com/ru/tools/curl-converter',
        'ja': 'https://www.toolkitpub.com/ja/tools/curl-converter',
        'ko': 'https://www.toolkitpub.com/ko/tools/curl-converter',
        'ar': 'https://www.toolkitpub.com/ar/tools/curl-converter',
        'hi': 'https://www.toolkitpub.com/hi/tools/curl-converter',
      },
    },
  }
}

export default function CurlConverterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


