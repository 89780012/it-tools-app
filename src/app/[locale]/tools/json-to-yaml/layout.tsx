import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'



export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.json-to-yaml.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/json-to-yaml`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/json-to-yaml`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/json-to-yaml',
        'zh': 'https://www.toolkitpub.com/zh/tools/json-to-yaml',
        'hi': 'https://www.toolkitpub.com/hi/tools/json-to-yaml',
        'de': 'https://www.toolkitpub.com/de/tools/json-to-yaml',
      },
    },
  }
}

export default function JsonToYamlLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}