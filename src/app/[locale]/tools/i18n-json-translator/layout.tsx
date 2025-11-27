import type { Metadata } from "next"
import { getTranslations, getLocale } from "next-intl/server"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({
    locale,
    namespace: "tools.i18n-json-translator.meta",
  })

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://www.toolkitpub.com"
  const basePath =
    locale === "en" ? "tools/i18n-json-translator" : `${locale}/tools/i18n-json-translator`
  const canonicalUrl = `${baseUrl}/${basePath}`

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: canonicalUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': 'https://www.toolkitpub.com/tools/i18n-json-translator',
        'zh': 'https://www.toolkitpub.com/zh/tools/i18n-json-translator',
        'es': 'https://www.toolkitpub.com/es/tools/i18n-json-translator',
        'de': 'https://www.toolkitpub.com/de/tools/i18n-json-translator',
        'fr': 'https://www.toolkitpub.com/fr/tools/i18n-json-translator',
        'it': 'https://www.toolkitpub.com/it/tools/i18n-json-translator',
        'pt': 'https://www.toolkitpub.com/pt/tools/i18n-json-translator',
        'ru': 'https://www.toolkitpub.com/ru/tools/i18n-json-translator',
        'ja': 'https://www.toolkitpub.com/ja/tools/i18n-json-translator',
        'ko': 'https://www.toolkitpub.com/ko/tools/i18n-json-translator',
        'ar': 'https://www.toolkitpub.com/ar/tools/i18n-json-translator',
        'hi': 'https://www.toolkitpub.com/hi/tools/i18n-json-translator',
      },
    },
  }
}

export default function I18nJsonTranslatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
