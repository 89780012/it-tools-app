"use client"

import { useEffect } from "react"
import { usePathname } from "@/i18n/navigation"

export function NavigationEvents() {
  const pathname = usePathname()

  useEffect(() => {
    // 监听所有链接点击
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest("a")
      
      if (link && link.href && !link.href.startsWith("#")) {
        // 检查是否是站内链接
        const currentDomain = window.location.origin
        const isInternalLink = link.href.startsWith(currentDomain) || link.href.startsWith("/")

        if (isInternalLink) {
          // 获取链接的路径部分
          const targetPath = link.href.replace(currentDomain, "")
          // 移除可能的 locale 前缀，进行更准确的比较
          const localePattern = /^\/(zh|en|hi)\//
          const currentPathWithoutLocale = pathname.replace(localePattern, "/")
          const targetPathWithoutLocale = targetPath.replace(localePattern, "/")
          

          // 检查是否点击的是当前页面
          const isSamePage = currentPathWithoutLocale === targetPathWithoutLocale || 
                             pathname === targetPath ||
                             targetPath === pathname
          
          if (isSamePage) {
            // 如果是当前页面，直接触发快速完成
            const event = new CustomEvent("navigation-same-page")
            window.dispatchEvent(event)
          } else {
            // 触发加载开始事件
            const event = new CustomEvent("navigation-start")
            window.dispatchEvent(event)
          }
        }
      }
    }

    document.addEventListener("click", handleClick, true)

    return () => {
      document.removeEventListener("click", handleClick, true)
    }
  }, [pathname])

  return null
}

