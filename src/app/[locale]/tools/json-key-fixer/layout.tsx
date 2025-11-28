import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({
    locale,
    namespace: 'tools.json-key-fixer.meta'
  })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'
  const localePath = locale === 'en' ? '' : `${locale}/`
  const toolPath = `${localePath}tools/json-key-fixer`

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${baseUrl}/${toolPath}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${baseUrl}/${toolPath}`,
      languages: {
        'en': `${baseUrl}/tools/json-key-fixer`,
        'zh': `${baseUrl}/zh/tools/json-key-fixer`,
        'hi': `${baseUrl}/hi/tools/json-key-fixer`,
        'de': `${baseUrl}/de/tools/json-key-fixer`,
      },
    },
  }
}

export default function JsonKeyFixerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
