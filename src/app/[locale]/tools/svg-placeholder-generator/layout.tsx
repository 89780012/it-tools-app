import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.svg-placeholder-generator.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/svg-placeholder-generator`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/svg-placeholder-generator`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/svg-placeholder-generator',
        'zh': 'https://www.toolkitpub.com/zh/tools/svg-placeholder-generator',
        'es': 'https://www.toolkitpub.com/es/tools/svg-placeholder-generator',
        'de': 'https://www.toolkitpub.com/de/tools/svg-placeholder-generator',
        'fr': 'https://www.toolkitpub.com/fr/tools/svg-placeholder-generator',
        'it': 'https://www.toolkitpub.com/it/tools/svg-placeholder-generator',
        'pt': 'https://www.toolkitpub.com/pt/tools/svg-placeholder-generator',
        'ru': 'https://www.toolkitpub.com/ru/tools/svg-placeholder-generator',
        'ja': 'https://www.toolkitpub.com/ja/tools/svg-placeholder-generator',
        'ko': 'https://www.toolkitpub.com/ko/tools/svg-placeholder-generator',
        'ar': 'https://www.toolkitpub.com/ar/tools/svg-placeholder-generator',
        'hi': 'https://www.toolkitpub.com/hi/tools/svg-placeholder-generator',
      },
    },
  }
}

export default function SvgPlaceholderGeneratorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}