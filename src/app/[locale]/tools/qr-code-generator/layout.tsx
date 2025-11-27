import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.qr-code-generator.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/qr-code-generator`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/qr-code-generator`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/qr-code-generator',
        'zh': 'https://www.toolkitpub.com/zh/tools/qr-code-generator',
        'es': 'https://www.toolkitpub.com/es/tools/qr-code-generator',
        'de': 'https://www.toolkitpub.com/de/tools/qr-code-generator',
        'fr': 'https://www.toolkitpub.com/fr/tools/qr-code-generator',
        'it': 'https://www.toolkitpub.com/it/tools/qr-code-generator',
        'pt': 'https://www.toolkitpub.com/pt/tools/qr-code-generator',
        'ru': 'https://www.toolkitpub.com/ru/tools/qr-code-generator',
        'ja': 'https://www.toolkitpub.com/ja/tools/qr-code-generator',
        'ko': 'https://www.toolkitpub.com/ko/tools/qr-code-generator',
        'ar': 'https://www.toolkitpub.com/ar/tools/qr-code-generator',
        'hi': 'https://www.toolkitpub.com/hi/tools/qr-code-generator',
      },
    },
  }
}

export default function QrCodeGeneratorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}