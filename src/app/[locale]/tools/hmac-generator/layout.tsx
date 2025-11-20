import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.hmac-generator.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/hmac-generator`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/hmac-generator`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/hmac-generator',
        'zh': 'https://www.toolkitpub.com/zh/tools/hmac-generator',
        'hi': 'https://www.toolkitpub.com/hi/tools/hmac-generator',
        'de': 'https://www.toolkitpub.com/de/tools/hmac-generator',
      },
    },
  }
}

export default function HmacGeneratorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}