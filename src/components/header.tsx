"use client"

import { ThemeToggle } from "./theme-toggle"
import { LanguageToggle } from "./language-toggle"
import { ChangelogToggle } from "./changelog-toggle"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="ml-auto flex items-center space-x-2">
        <LanguageToggle />
        <ThemeToggle />
        <ChangelogToggle />
      </div>
    </header>
  )
}