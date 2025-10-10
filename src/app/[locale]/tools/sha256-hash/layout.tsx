import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.sha256-hash.meta' })
  const tSite = await getTranslations({ locale, namespace: 'meta' })
  
  return {
    title: `${t('title')} - ${tSite('site.name')}`,
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: `${t('title')} - ${tSite('site.name')}`,
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/sha256-hash`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${t('title')} - ${tSite('site.name')}`,
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/sha256-hash`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/sha256-hash',
        'zh': 'https://www.toolkitpub.com/zh/tools/sha256-hash',
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