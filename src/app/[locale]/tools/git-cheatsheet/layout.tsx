import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'tools.git-cheatsheet.meta' })

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/git-cheatsheet`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/git-cheatsheet`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/git-cheatsheet',
        'zh': 'https://www.toolkitpub.com/zh/tools/git-cheatsheet',
        'es': 'https://www.toolkitpub.com/es/tools/git-cheatsheet',
        'de': 'https://www.toolkitpub.com/de/tools/git-cheatsheet',
        'fr': 'https://www.toolkitpub.com/fr/tools/git-cheatsheet',
        'it': 'https://www.toolkitpub.com/it/tools/git-cheatsheet',
        'pt': 'https://www.toolkitpub.com/pt/tools/git-cheatsheet',
        'ru': 'https://www.toolkitpub.com/ru/tools/git-cheatsheet',
        'ja': 'https://www.toolkitpub.com/ja/tools/git-cheatsheet',
        'ko': 'https://www.toolkitpub.com/ko/tools/git-cheatsheet',
        'ar': 'https://www.toolkitpub.com/ar/tools/git-cheatsheet',
        'hi': 'https://www.toolkitpub.com/hi/tools/git-cheatsheet',
      },
    },
  }
}

export default function GitCheatsheetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
