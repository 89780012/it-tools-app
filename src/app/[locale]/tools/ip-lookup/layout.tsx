import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.ip-lookup.meta' })
  const tSite = await getTranslations({ locale, namespace: 'meta' })
  
  return {
    title: `${t('title')} - ${tSite('site.name')}`,
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: `${t('title')} - ${tSite('site.name')}`,
      description: t('description'),
      url: `${process.env.SITE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/ip-lookup`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${t('title')} - ${tSite('site.name')}`,
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.SITE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/ip-lookup`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/ip-lookup',
        'zh': 'https://www.toolkitpub.com/zh/tools/ip-lookup',
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
