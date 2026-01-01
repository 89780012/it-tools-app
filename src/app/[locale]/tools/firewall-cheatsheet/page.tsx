import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import FirewallCheatsheetTool from '@/components/tools/firewall-cheatsheet/firewall-cheatsheet-tool'

interface PageProps {
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'tools.firewall-cheatsheet.meta' })

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
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/firewall-cheatsheet`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/firewall-cheatsheet',
        'zh': 'https://www.toolkitpub.com/zh/tools/firewall-cheatsheet',
        'es': 'https://www.toolkitpub.com/es/tools/firewall-cheatsheet',
        'de': 'https://www.toolkitpub.com/de/tools/firewall-cheatsheet',
        'fr': 'https://www.toolkitpub.com/fr/tools/firewall-cheatsheet',
        'it': 'https://www.toolkitpub.com/it/tools/firewall-cheatsheet',
        'pt': 'https://www.toolkitpub.com/pt/tools/firewall-cheatsheet',
        'ru': 'https://www.toolkitpub.com/ru/tools/firewall-cheatsheet',
        'ja': 'https://www.toolkitpub.com/ja/tools/firewall-cheatsheet',
        'ko': 'https://www.toolkitpub.com/ko/tools/firewall-cheatsheet',
        'ar': 'https://www.toolkitpub.com/ar/tools/firewall-cheatsheet',
        'hi': 'https://www.toolkitpub.com/hi/tools/firewall-cheatsheet',
      },
    },
  }
}

export default function FirewallCheatsheetPage() {
  return <FirewallCheatsheetTool />
}
