import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.base64-encoder-decoder.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/base64-encoder-decoder`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/base64-encoder-decoder`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/base64-encoder-decoder',
        'zh': 'https://www.toolkitpub.com/zh/tools/base64-encoder-decoder',
        'hi': 'https://www.toolkitpub.com/hi/tools/base64-encoder-decoder',
      },
    },
  }
}

export default function Base64EncoderDecoderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}