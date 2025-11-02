import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'



export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.xml-to-json.meta' })
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/xml-to-json`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/xml-to-json`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/xml-to-json',
        'zh': 'https://www.toolkitpub.com/zh/tools/xml-to-json',
        'hi': 'https://www.toolkitpub.com/hi/tools/xml-to-json',
      },
    },
  }
}

export default function XmlToJsonLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
