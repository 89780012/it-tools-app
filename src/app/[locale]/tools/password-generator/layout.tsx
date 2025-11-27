import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.password-generator.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/password-generator`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/password-generator`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/password-generator',
        'zh': 'https://www.toolkitpub.com/zh/tools/password-generator',
        'es': 'https://www.toolkitpub.com/es/tools/password-generator',
        'de': 'https://www.toolkitpub.com/de/tools/password-generator',
        'fr': 'https://www.toolkitpub.com/fr/tools/password-generator',
        'it': 'https://www.toolkitpub.com/it/tools/password-generator',
        'pt': 'https://www.toolkitpub.com/pt/tools/password-generator',
        'ru': 'https://www.toolkitpub.com/ru/tools/password-generator',
        'ja': 'https://www.toolkitpub.com/ja/tools/password-generator',
        'ko': 'https://www.toolkitpub.com/ko/tools/password-generator',
        'ar': 'https://www.toolkitpub.com/ar/tools/password-generator',
        'hi': 'https://www.toolkitpub.com/hi/tools/password-generator',
      },
    },
  }
}

export default function PasswordGeneratorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}