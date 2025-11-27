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
        en: `${baseUrl}/tools/i18n-json-translator`,
        zh: `${baseUrl}/zh/tools/i18n-json-translator`,
        hi: `${baseUrl}/hi/tools/i18n-json-translator`,
        de: `${baseUrl}/de/tools/i18n-json-translator`,
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
