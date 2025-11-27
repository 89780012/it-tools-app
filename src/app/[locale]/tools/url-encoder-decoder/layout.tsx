import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.url-encoder-decoder.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/url-encoder-decoder`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/url-encoder-decoder`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/url-encoder-decoder',
        'zh': 'https://www.toolkitpub.com/zh/tools/url-encoder-decoder',
        'es': 'https://www.toolkitpub.com/es/tools/url-encoder-decoder',
        'de': 'https://www.toolkitpub.com/de/tools/url-encoder-decoder',
        'fr': 'https://www.toolkitpub.com/fr/tools/url-encoder-decoder',
        'it': 'https://www.toolkitpub.com/it/tools/url-encoder-decoder',
        'pt': 'https://www.toolkitpub.com/pt/tools/url-encoder-decoder',
        'ru': 'https://www.toolkitpub.com/ru/tools/url-encoder-decoder',
        'ja': 'https://www.toolkitpub.com/ja/tools/url-encoder-decoder',
        'ko': 'https://www.toolkitpub.com/ko/tools/url-encoder-decoder',
        'ar': 'https://www.toolkitpub.com/ar/tools/url-encoder-decoder',
        'hi': 'https://www.toolkitpub.com/hi/tools/url-encoder-decoder',
      },
    },
  }
}

export default function UrlEncoderDecoderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}