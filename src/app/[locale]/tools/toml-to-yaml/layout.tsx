import { Metadata } from "next"
import { getTranslations } from "next-intl/server"

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })

  return {
    title: t("tools.toml-to-yaml.meta.title"),
    description: t("tools.toml-to-yaml.meta.description"),
    keywords: t("tools.toml-to-yaml.meta.keywords"),
    openGraph: {
      title: t("tools.toml-to-yaml.meta.title"),
      description: t("tools.toml-to-yaml.meta.description"),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/toml-to-yaml`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t("tools.toml-to-yaml.meta.title"),
      description: t("tools.toml-to-yaml.meta.description"),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/toml-to-yaml`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/toml-to-yaml',
        'zh': 'https://www.toolkitpub.com/zh/tools/toml-to-yaml',
        'hi': 'https://www.toolkitpub.com/hi/tools/toml-to-yaml',
        'de': 'https://www.toolkitpub.com/de/tools/toml-to-yaml',
      },
    },
  }
}

export default function TomlToYamlLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
