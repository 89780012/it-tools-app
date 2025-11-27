import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.aes-encrypt-decrypt.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/aes-encrypt-decrypt`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/aes-encrypt-decrypt`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/aes-encrypt-decrypt',
        'zh': 'https://www.toolkitpub.com/zh/tools/aes-encrypt-decrypt',
        'es': 'https://www.toolkitpub.com/es/tools/aes-encrypt-decrypt',
        'de': 'https://www.toolkitpub.com/de/tools/aes-encrypt-decrypt',
        'fr': 'https://www.toolkitpub.com/fr/tools/aes-encrypt-decrypt',
        'it': 'https://www.toolkitpub.com/it/tools/aes-encrypt-decrypt',
        'pt': 'https://www.toolkitpub.com/pt/tools/aes-encrypt-decrypt',
        'ru': 'https://www.toolkitpub.com/ru/tools/aes-encrypt-decrypt',
        'ja': 'https://www.toolkitpub.com/ja/tools/aes-encrypt-decrypt',
        'ko': 'https://www.toolkitpub.com/ko/tools/aes-encrypt-decrypt',
        'ar': 'https://www.toolkitpub.com/ar/tools/aes-encrypt-decrypt',
        'hi': 'https://www.toolkitpub.com/hi/tools/aes-encrypt-decrypt',
      },
    },
  }
}

export default function AesEncryptDecryptLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}