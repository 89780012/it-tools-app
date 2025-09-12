import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.aes-encrypt-decrypt.meta' })
  const tSite = await getTranslations({ locale, namespace: 'meta' })
  
  return {
    title: `${t('title')} - ${tSite('site.name')}`,
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: `${t('title')} - ${tSite('site.name')}`,
      description: t('description'),
      url: `${process.env.SITE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/aes-encrypt-decrypt`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${t('title')} - ${tSite('site.name')}`,
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.SITE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/aes-encrypt-decrypt`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/aes-encrypt-decrypt',
        'zh': 'https://www.toolkitpub.com/zh/tools/aes-encrypt-decrypt',
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