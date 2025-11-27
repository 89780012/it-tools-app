import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.yaml-to-json.meta' })
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'
  const localePrefix = locale === 'en' ? '' : `${locale}/`
  const url = `${baseUrl}/${localePrefix}tools/yaml-to-json`

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: url,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/yaml-to-json',
        'zh': 'https://www.toolkitpub.com/zh/tools/yaml-to-json',
        'es': 'https://www.toolkitpub.com/es/tools/yaml-to-json',
        'de': 'https://www.toolkitpub.com/de/tools/yaml-to-json',
        'fr': 'https://www.toolkitpub.com/fr/tools/yaml-to-json',
        'it': 'https://www.toolkitpub.com/it/tools/yaml-to-json',
        'pt': 'https://www.toolkitpub.com/pt/tools/yaml-to-json',
        'ru': 'https://www.toolkitpub.com/ru/tools/yaml-to-json',
        'ja': 'https://www.toolkitpub.com/ja/tools/yaml-to-json',
        'ko': 'https://www.toolkitpub.com/ko/tools/yaml-to-json',
        'ar': 'https://www.toolkitpub.com/ar/tools/yaml-to-json',
        'hi': 'https://www.toolkitpub.com/hi/tools/yaml-to-json',
      },
    },
  }
}

export default function YamlToJsonLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
