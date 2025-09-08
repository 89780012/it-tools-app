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

export function LanguageToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale();

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
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => switchLocale("zh")}
          className={locale === "zh" ? "bg-accent" : ""}
        >
          中文
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLocale("en")}
          className={locale === "en" ? "bg-accent" : ""}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLocale("hi")}
          className={locale === "hi" ? "bg-accent" : ""}
        >
          हिंदी
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}