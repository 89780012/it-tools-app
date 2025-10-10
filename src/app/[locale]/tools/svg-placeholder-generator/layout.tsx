import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.svg-placeholder-generator.meta' })
  const tSite = await getTranslations({ locale, namespace: 'meta' })
  
  return {
    title: `${t('title')} - ${tSite('site.name')}`,
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: `${t('title')} - ${tSite('site.name')}`,
      description: t('description'),
      url: `${process.env.SITE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/svg-placeholder-generator`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${t('title')} - ${tSite('site.name')}`,
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.SITE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/svg-placeholder-generator`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/svg-placeholder-generator',
        'zh': 'https://www.toolkitpub.com/zh/tools/svg-placeholder-generator',
        'hi': 'https://www.toolkitpub.com/hi/tools/svg-placeholder-generator',
      },
    },
  }
}

export default function SvgPlaceholderGeneratorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}