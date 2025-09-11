"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"

interface BackToHomeProps {
  className?: string
}

export function BackToHome({ className }: BackToHomeProps) {
  const t = useTranslations("common")

  return (
    <Link href="/">
      <Button 
        variant="ghost" 
        size="sm" 
        className={`mb-4 text-muted-foreground hover:text-foreground ${className}`}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t("back_to_home")}
      </Button>
    </Link>
  )
}