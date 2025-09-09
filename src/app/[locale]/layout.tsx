import type { Metadata } from 'next'
import { getTranslations,getLocale } from 'next-intl/server'

export async function generateMetadata(
): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'meta' })
  
  return {
    title: t('site.title'),
    description: t('site.description'),
    keywords: t('site.keywords'),
    openGraph: {
      title: t('site.title'),
      description: t('site.description'),
      url: `${process.env.SITE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale}`,
      type: "website",
    },
    twitter: {
      title: t('site.title'),
      description: t('site.description'),
    },
  }
}

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}