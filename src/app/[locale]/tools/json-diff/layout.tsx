import type { Metadata } from 'next'
import { getTranslations,getLocale } from 'next-intl/server'


export async function generateMetadata(
): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.json-diff.meta' })
  const tSite = await getTranslations({ locale, namespace: 'meta' })
  
  return {
    title: `${t('title')} - ${tSite('site.name')}`,
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: `${t('title')} - ${tSite('site.name')}`,
      description: t('description'),
      url: `${process.env.SITE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/json-diff`,
    },
  }
}

export default function JsonDiffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}