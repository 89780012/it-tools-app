import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.ip-lookup.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/ip-lookup`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/ip-lookup`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/ip-lookup',
        'zh': 'https://www.toolkitpub.com/zh/tools/ip-lookup',
        'es': 'https://www.toolkitpub.com/es/tools/ip-lookup',
        'de': 'https://www.toolkitpub.com/de/tools/ip-lookup',
        'fr': 'https://www.toolkitpub.com/fr/tools/ip-lookup',
        'it': 'https://www.toolkitpub.com/it/tools/ip-lookup',
        'pt': 'https://www.toolkitpub.com/pt/tools/ip-lookup',
        'ru': 'https://www.toolkitpub.com/ru/tools/ip-lookup',
        'ja': 'https://www.toolkitpub.com/ja/tools/ip-lookup',
        'ko': 'https://www.toolkitpub.com/ko/tools/ip-lookup',
        'ar': 'https://www.toolkitpub.com/ar/tools/ip-lookup',
        'hi': 'https://www.toolkitpub.com/hi/tools/ip-lookup',
      },
    },
  }
}

export default function IPLookupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
