import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

type Props = {
  params: { locale: string }
}

export async function generateMetadata(
  { params: { locale } }: Props
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'meta' })
  
  return {
    title: t('site.title'),
    description: t('site.description'),
    keywords: t('site.keywords'),
    openGraph: {
      title: t('site.title'),
      description: t('site.description'),
      url: `${process.env.SITE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale}`,
      type: "website",
    },
    twitter: {
      title: t('site.title'),
      description: t('site.description'),
    },
  }
}

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}