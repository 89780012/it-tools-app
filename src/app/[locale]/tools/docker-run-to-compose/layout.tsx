import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.docker-run-to-compose.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/docker-run-to-compose`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/docker-run-to-compose`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/docker-run-to-compose',
        'zh': 'https://www.toolkitpub.com/zh/tools/docker-run-to-compose',
        'es': 'https://www.toolkitpub.com/es/tools/docker-run-to-compose',
        'de': 'https://www.toolkitpub.com/de/tools/docker-run-to-compose',
        'fr': 'https://www.toolkitpub.com/fr/tools/docker-run-to-compose',
        'it': 'https://www.toolkitpub.com/it/tools/docker-run-to-compose',
        'pt': 'https://www.toolkitpub.com/pt/tools/docker-run-to-compose',
        'ru': 'https://www.toolkitpub.com/ru/tools/docker-run-to-compose',
        'ja': 'https://www.toolkitpub.com/ja/tools/docker-run-to-compose',
        'ko': 'https://www.toolkitpub.com/ko/tools/docker-run-to-compose',
        'ar': 'https://www.toolkitpub.com/ar/tools/docker-run-to-compose',
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

