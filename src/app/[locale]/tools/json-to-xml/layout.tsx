import type { Metadata } from 'next'
import { getTranslations,getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.json-to-xml.meta' })
  const tSite = await getTranslations({ locale, namespace: 'meta' })
  
  return {
    title: `${t('title')} - ${tSite('site.name')}`,
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: `${t('title')} - ${tSite('site.name')}`,
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/json-to-xml`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${t('title')} - ${tSite('site.name')}`,
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/json-to-xml`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/json-to-xml',
        'zh': 'https://www.toolkitpub.com/zh/tools/json-to-xml',
        'hi': 'https://www.toolkitpub.com/hi/tools/json-to-xml',
      },
    },
  }
}

export default function JsonToXmlLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}