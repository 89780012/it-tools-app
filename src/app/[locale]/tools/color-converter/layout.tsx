import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export const runtime = "edge";

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

