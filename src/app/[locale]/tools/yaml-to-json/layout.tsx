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
        'en': `${baseUrl}/tools/yaml-to-json`,
        'zh': `${baseUrl}/zh/tools/yaml-to-json`,
        'hi': `${baseUrl}/hi/tools/yaml-to-json`,
        'de': `${baseUrl}/de/tools/yaml-to-json`,
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
