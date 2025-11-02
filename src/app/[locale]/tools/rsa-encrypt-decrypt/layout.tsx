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