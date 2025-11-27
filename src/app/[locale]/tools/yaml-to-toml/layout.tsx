import { Metadata } from "next"
import { getTranslations } from "next-intl/server"

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })

  return {
    title: t("tools.yaml-to-toml.meta.title"),
    description: t("tools.yaml-to-toml.meta.description"),
    keywords: t("tools.yaml-to-toml.meta.keywords"),
    openGraph: {
      title: t("tools.yaml-to-toml.meta.title"),
      description: t("tools.yaml-to-toml.meta.description"),
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/yaml-to-toml`,
    },
    twitter: {
      card: 'summary_large_image',
      title: t("tools.yaml-to-toml.meta.title"),
      description: t("tools.yaml-to-toml.meta.description"),
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'}/${locale === 'en' ? '' : locale + '/'}tools/yaml-to-toml`,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/yaml-to-toml',
        'zh': 'https://www.toolkitpub.com/zh/tools/yaml-to-toml',
        'es': 'https://www.toolkitpub.com/es/tools/yaml-to-toml',
        'de': 'https://www.toolkitpub.com/de/tools/yaml-to-toml',
        'fr': 'https://www.toolkitpub.com/fr/tools/yaml-to-toml',
        'it': 'https://www.toolkitpub.com/it/tools/yaml-to-toml',
        'pt': 'https://www.toolkitpub.com/pt/tools/yaml-to-toml',
        'ru': 'https://www.toolkitpub.com/ru/tools/yaml-to-toml',
        'ja': 'https://www.toolkitpub.com/ja/tools/yaml-to-toml',
        'ko': 'https://www.toolkitpub.com/ko/tools/yaml-to-toml',
        'ar': 'https://www.toolkitpub.com/ar/tools/yaml-to-toml',
        'hi': 'https://www.toolkitpub.com/hi/tools/yaml-to-toml',
      },
    },
  }
}

export default function YamlToTomlLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
