import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.rsa-encrypt-decrypt.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/rsa-encrypt-decrypt`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/rsa-encrypt-decrypt`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/rsa-encrypt-decrypt',
        'zh': 'https://www.toolkitpub.com/zh/tools/rsa-encrypt-decrypt',
        'es': 'https://www.toolkitpub.com/es/tools/rsa-encrypt-decrypt',
        'de': 'https://www.toolkitpub.com/de/tools/rsa-encrypt-decrypt',
        'fr': 'https://www.toolkitpub.com/fr/tools/rsa-encrypt-decrypt',
        'it': 'https://www.toolkitpub.com/it/tools/rsa-encrypt-decrypt',
        'pt': 'https://www.toolkitpub.com/pt/tools/rsa-encrypt-decrypt',
        'ru': 'https://www.toolkitpub.com/ru/tools/rsa-encrypt-decrypt',
        'ja': 'https://www.toolkitpub.com/ja/tools/rsa-encrypt-decrypt',
        'ko': 'https://www.toolkitpub.com/ko/tools/rsa-encrypt-decrypt',
        'ar': 'https://www.toolkitpub.com/ar/tools/rsa-encrypt-decrypt',
        'hi': 'https://www.toolkitpub.com/hi/tools/rsa-encrypt-decrypt',
      },
    },
  }
}

export default function RsaEncryptDecryptLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}