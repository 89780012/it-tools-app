import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.base64-file-converter.meta' })
  const tSite = await getTranslations({ locale, namespace: 'meta' })
  
  return {
    title: `${t('title')} - ${tSite('site.name')}`,
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: `${t('title')} - ${tSite('site.name')}`,
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/base64-file-converter`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${t('title')} - ${tSite('site.name')}`,
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/base64-file-converter`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/base64-file-converter',
        'zh': 'https://www.toolkitpub.com/zh/tools/base64-file-converter',
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

