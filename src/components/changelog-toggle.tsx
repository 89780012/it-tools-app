"use client"

import { Clock } from "lucide-react"
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function ChangelogToggle() {
  const t = useTranslations()
  const pathname = usePathname()
  const isActive = pathname === "/changelog"

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? "default" : "outline"}
            size="icon"
            asChild
          >
            <Link href="/changelog">
              <Clock className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">{t('changelog.title')}</span>
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('changelog.title')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}