import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import DockerCheatsheetTool from '@/components/tools/docker-cheatsheet/docker-cheatsheet-tool'

interface PageProps {
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'tools.docker-cheatsheet.meta' })

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/docker-cheatsheet`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/docker-cheatsheet`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/docker-cheatsheet',
        'zh': 'https://www.toolkitpub.com/zh/tools/docker-cheatsheet',
        'es': 'https://www.toolkitpub.com/es/tools/docker-cheatsheet',
        'de': 'https://www.toolkitpub.com/de/tools/docker-cheatsheet',
        'fr': 'https://www.toolkitpub.com/fr/tools/docker-cheatsheet',
        'it': 'https://www.toolkitpub.com/it/tools/docker-cheatsheet',
        'pt': 'https://www.toolkitpub.com/pt/tools/docker-cheatsheet',
        'ru': 'https://www.toolkitpub.com/ru/tools/docker-cheatsheet',
        'ja': 'https://www.toolkitpub.com/ja/tools/docker-cheatsheet',
        'ko': 'https://www.toolkitpub.com/ko/tools/docker-cheatsheet',
        'ar': 'https://www.toolkitpub.com/ar/tools/docker-cheatsheet',
        'hi': 'https://www.toolkitpub.com/hi/tools/docker-cheatsheet',
      },
    },
  }
}

export default function DockerCheatsheetPage() {
  return <DockerCheatsheetTool />
}
