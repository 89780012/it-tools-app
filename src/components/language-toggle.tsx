"use client"

import { Languages } from "lucide-react"
import { useLocale } from 'next-intl';
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter, usePathname } from '@/i18n/navigation';
import { setLocale } from '@/i18n/index';
import { Locale } from '@/i18n/config';
import { useTranslations } from 'next-intl';

export function LanguageToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('common.languages');

  const switchLocale = async (newLocale: Locale) => {
    if (newLocale === locale) return;

    // 更新服务器端的语言设置
    await setLocale(newLocale);

    // 使用 next-intl 的路由器进行导航，它会自动处理语言前缀
    router.push(pathname, { locale: newLocale });
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
        <DropdownMenuItem
          onClick={() => switchLocale("zh")}
          className={locale === "zh" ? "bg-accent" : ""}
        >
          {t('zh')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLocale("en")}
          className={locale === "en" ? "bg-accent" : ""}
        >
          {t('en')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLocale("es")}
          className={locale === "es" ? "bg-accent" : ""}
        >
          {t('es')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLocale("de")}
          className={locale === "de" ? "bg-accent" : ""}
        >
          {t('de')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLocale("fr")}
          className={locale === "fr" ? "bg-accent" : ""}
        >
          {t('fr')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLocale("it")}
          className={locale === "it" ? "bg-accent" : ""}
        >
          {t('it')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLocale("pt")}
          className={locale === "pt" ? "bg-accent" : ""}
        >
          {t('pt')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLocale("ru")}
          className={locale === "ru" ? "bg-accent" : ""}
        >
          {t('ru')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLocale("ja")}
          className={locale === "ja" ? "bg-accent" : ""}
        >
          {t('ja')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLocale("ko")}
          className={locale === "ko" ? "bg-accent" : ""}
        >
          {t('ko')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLocale("ar")}
          className={locale === "ar" ? "bg-accent" : ""}
        >
          {t('ar')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLocale("hi")}
          className={locale === "hi" ? "bg-accent" : ""}
        >
          {t('hi')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}