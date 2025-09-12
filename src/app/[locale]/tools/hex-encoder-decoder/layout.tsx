import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.hex-encoder-decoder.meta' })
  const tSite = await getTranslations({ locale, namespace: 'meta' })
  
  return {
    title: `${t('title')} - ${tSite('site.name')}`,
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: `${t('title')} - ${tSite('site.name')}`,
      description: t('description'),
      url: `${process.env.SITE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/hex-encoder-decoder`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${t('title')} - ${tSite('site.name')}`,
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.SITE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/hex-encoder-decoder`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/hex-encoder-decoder',
        'zh': 'https://www.toolkitpub.com/zh/tools/hex-encoder-decoder',
        'hi': 'https://www.toolkitpub.com/hi/tools/hex-encoder-decoder',
      },
    },
  }
}

export default function HexEncoderDecoderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}