import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

type Props = {
  params: { locale: string }
}

export async function generateMetadata(
  { params: { locale } }: Props
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'tools.json-formatter.meta' })
  const tSite = await getTranslations({ locale, namespace: 'meta' })
  
  return {
    title: `${t('title')} - ${tSite('site.name')}`,
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: `${t('title')} - ${tSite('site.name')}`,
      description: t('description'),
      url: `${process.env.SITE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/json-formatter`,
    },
  }
}

export default function JsonFormatterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}