import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import NginxCheatsheetTool from '@/components/tools/nginx-cheatsheet/nginx-cheatsheet-tool'

interface PageProps {
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'tools.nginx-cheatsheet.meta' })

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/nginx-cheatsheet`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/nginx-cheatsheet',
        'zh': 'https://www.toolkitpub.com/zh/tools/nginx-cheatsheet',
        'es': 'https://www.toolkitpub.com/es/tools/nginx-cheatsheet',
        'de': 'https://www.toolkitpub.com/de/tools/nginx-cheatsheet',
        'fr': 'https://www.toolkitpub.com/fr/tools/nginx-cheatsheet',
        'it': 'https://www.toolkitpub.com/it/tools/nginx-cheatsheet',
        'pt': 'https://www.toolkitpub.com/pt/tools/nginx-cheatsheet',
        'ru': 'https://www.toolkitpub.com/ru/tools/nginx-cheatsheet',
        'ja': 'https://www.toolkitpub.com/ja/tools/nginx-cheatsheet',
        'ko': 'https://www.toolkitpub.com/ko/tools/nginx-cheatsheet',
        'ar': 'https://www.toolkitpub.com/ar/tools/nginx-cheatsheet',
        'hi': 'https://www.toolkitpub.com/hi/tools/nginx-cheatsheet',
      },
    },
  }
}

export default function NginxCheatsheetPage() {
  return <NginxCheatsheetTool />
}
