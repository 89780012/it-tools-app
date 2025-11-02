import type { Metadata } from 'next'
import { getTranslations,getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.json-visualizer.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/json-visualizer`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/json-visualizer`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/json-visualizer',
        'zh': 'https://www.toolkitpub.com/zh/tools/json-visualizer',
        'hi': 'https://www.toolkitpub.com/hi/tools/json-visualizer',
      },
    },
  }
}

export default function JsonVisualizerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}