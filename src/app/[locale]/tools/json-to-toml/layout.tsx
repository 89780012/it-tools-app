import { Metadata } from "next"
import { getTranslations } from 'next-intl/server'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })

  return {
    title: t("tools.json-to-toml.meta.title"),
    description: t("tools.json-to-toml.meta.description"),
    keywords: t("tools.json-to-toml.meta.keywords"),
    openGraph: {
      title: t("tools.json-to-toml.meta.title"),
      description: t("tools.json-to-toml.meta.description"),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/json-to-toml`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t("tools.json-to-toml.meta.title"),
      description: t("tools.json-to-toml.meta.description"),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/json-to-toml`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/json-to-toml',
        'zh': 'https://www.toolkitpub.com/zh/tools/json-to-toml',
        'hi': 'https://www.toolkitpub.com/hi/tools/json-to-toml',
        'de': 'https://www.toolkitpub.com/de/tools/json-to-toml',
      },
    },
  }
}

export default function JsonToTomlLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
