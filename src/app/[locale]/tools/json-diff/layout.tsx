import type { Metadata } from 'next'
import { getTranslations,getLocale } from 'next-intl/server'


export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.json-diff.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/json-diff`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/json-diff`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/json-diff',
        'zh': 'https://www.toolkitpub.com/zh/tools/json-diff',
        'hi': 'https://www.toolkitpub.com/hi/tools/json-diff',
        'de': 'https://www.toolkitpub.com/de/tools/json-diff',
      },
    },
  }
}

export default function JsonDiffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}