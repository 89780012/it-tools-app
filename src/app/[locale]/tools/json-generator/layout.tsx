import type { Metadata } from 'next'
import { getTranslations,getLocale } from 'next-intl/server'

export const runtime = "edge";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.json-generator.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/json-generator`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/json-generator`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/json-generator',
        'zh': 'https://www.toolkitpub.com/zh/tools/json-generator',
        'hi': 'https://www.toolkitpub.com/hi/tools/json-generator',
      },
    },
  }
}

export default function JsonGeneratorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}