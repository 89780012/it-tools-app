import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.docker-run-to-compose.meta' })
  const tSite = await getTranslations({ locale, namespace: 'meta' })
  
  return {
    title: `${t('title')} - ${tSite('site.name')}`,
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: `${t('title')} - ${tSite('site.name')}`,
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/docker-run-to-compose`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${t('title')} - ${tSite('site.name')}`,
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/docker-run-to-compose`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/docker-run-to-compose',
        'zh': 'https://www.toolkitpub.com/zh/tools/docker-run-to-compose',
        'hi': 'https://www.toolkitpub.com/hi/tools/docker-run-to-compose',
      },
    },
  }
}

export default function DockerRunToComposeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

