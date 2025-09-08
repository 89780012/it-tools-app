"use client"

import { useTranslations } from 'next-intl'

export function ToolContainer() {
  const t = useTranslations()

  return (
    <div className="container mx-auto p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">{t("common.coming_soon")}</h2>
        <p className="text-muted-foreground">{t("common.coming_soon")}</p>
      </div>
    </div>
  )
}