import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.color-converter.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/color-converter`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/color-converter`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/color-converter',
        'zh': 'https://www.toolkitpub.com/zh/tools/color-converter',
        'es': 'https://www.toolkitpub.com/es/tools/color-converter',
        'de': 'https://www.toolkitpub.com/de/tools/color-converter',
        'fr': 'https://www.toolkitpub.com/fr/tools/color-converter',
        'it': 'https://www.toolkitpub.com/it/tools/color-converter',
        'pt': 'https://www.toolkitpub.com/pt/tools/color-converter',
        'ru': 'https://www.toolkitpub.com/ru/tools/color-converter',
        'ja': 'https://www.toolkitpub.com/ja/tools/color-converter',
        'ko': 'https://www.toolkitpub.com/ko/tools/color-converter',
        'ar': 'https://www.toolkitpub.com/ar/tools/color-converter',
        'hi': 'https://www.toolkitpub.com/hi/tools/color-converter',
      },
    },
  }
}

export default function ColorConverterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

