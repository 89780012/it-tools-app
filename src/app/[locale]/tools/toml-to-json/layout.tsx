import { Metadata } from "next"
import { getTranslations } from "next-intl/server"

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })

  return {
    title: t("tools.toml-to-json.meta.title"),
    description: t("tools.toml-to-json.meta.description"),
    keywords: t("tools.toml-to-json.meta.keywords"),
    openGraph: {
      title: t("tools.toml-to-json.meta.title"),
      description: t("tools.toml-to-json.meta.description"),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/toml-to-json`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t("tools.toml-to-json.meta.title"),
      description: t("tools.toml-to-json.meta.description"),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/toml-to-json`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/toml-to-json',
        'zh': 'https://www.toolkitpub.com/zh/tools/toml-to-json',
        'hi': 'https://www.toolkitpub.com/hi/tools/toml-to-json',
        'de': 'https://www.toolkitpub.com/de/tools/toml-to-json',
      },
    },
  }
}

export default function TomlToJsonLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
