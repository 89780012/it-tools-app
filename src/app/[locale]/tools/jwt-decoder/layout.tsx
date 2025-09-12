import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.jwt-decoder.meta' })
  const tSite = await getTranslations({ locale, namespace: 'meta' })
  
  return {
    title: `${t('title')} - ${tSite('site.name')}`,
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: `${t('title')} - ${tSite('site.name')}`,
      description: t('description'),
      url: `${process.env.SITE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/jwt-decoder`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${t('title')} - ${tSite('site.name')}`,
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.SITE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/jwt-decoder`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/jwt-decoder',
        'zh': 'https://www.toolkitpub.com/zh/tools/jwt-decoder',
        'hi': 'https://www.toolkitpub.com/hi/tools/jwt-decoder',
      },
    },
  }
}

export default function JwtDecoderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}