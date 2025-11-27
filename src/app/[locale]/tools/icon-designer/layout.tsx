import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'


export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.icon-designer.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/icon-designer`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/icon-designer`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/icon-designer',
        'zh': 'https://www.toolkitpub.com/zh/tools/icon-designer',
        'es': 'https://www.toolkitpub.com/es/tools/icon-designer',
        'de': 'https://www.toolkitpub.com/de/tools/icon-designer',
        'fr': 'https://www.toolkitpub.com/fr/tools/icon-designer',
        'it': 'https://www.toolkitpub.com/it/tools/icon-designer',
        'pt': 'https://www.toolkitpub.com/pt/tools/icon-designer',
        'ru': 'https://www.toolkitpub.com/ru/tools/icon-designer',
        'ja': 'https://www.toolkitpub.com/ja/tools/icon-designer',
        'ko': 'https://www.toolkitpub.com/ko/tools/icon-designer',
        'ar': 'https://www.toolkitpub.com/ar/tools/icon-designer',
        'hi': 'https://www.toolkitpub.com/hi/tools/icon-designer',
      },
    },
  }
}

export default function IconDesignerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


