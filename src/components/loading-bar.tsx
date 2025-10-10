"use client"

import { useEffect, useState, useRef } from "react"
import { usePathname } from "@/i18n/navigation"

export function LoadingBar() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const timersRef = useRef<NodeJS.Timeout[]>([])

  useEffect(() => {
    // 监听自定义事件
    const handleStart = () => {
      // 清除之前的定时器
      timersRef.current.forEach(timer => clearTimeout(timer))
      timersRef.current = []

      setLoading(true)
      setProgress(0)
      
      // 模拟进度增长
      timersRef.current.push(setTimeout(() => setProgress(30), 50))
      timersRef.current.push(setTimeout(() => setProgress(60), 200))
      timersRef.current.push(setTimeout(() => setProgress(80), 400))
    }

    const handleComplete = () => {
      // 清除所有定时器
      timersRef.current.forEach(timer => clearTimeout(timer))
      timersRef.current = []

      setProgress(100)
      const timer = setTimeout(() => {
        setLoading(false)
        setProgress(0)
      }, 300)
      timersRef.current.push(timer)
    }

    const handleSamePage = () => {
      // 点击当前页面，直接跳到100%
      timersRef.current.forEach(timer => clearTimeout(timer))
      timersRef.current = []

      setLoading(true)
      setProgress(100)
      
      const timer = setTimeout(() => {
        setLoading(false)
        setProgress(0)
      }, 400)
      timersRef.current.push(timer)
    }

    window.addEventListener("navigation-start", handleStart as EventListener)
    window.addEventListener("navigation-complete", handleComplete as EventListener)
    window.addEventListener("navigation-same-page", handleSamePage as EventListener)

    return () => {
      window.removeEventListener("navigation-start", handleStart as EventListener)
      window.removeEventListener("navigation-complete", handleComplete as EventListener)
      window.removeEventListener("navigation-same-page", handleSamePage as EventListener)
      // 清理所有定时器
      timersRef.current.forEach(timer => clearTimeout(timer))
    }
  }, [])

  useEffect(() => {
    // 路径变化时完成加载
    if (loading) {
      const event = new CustomEvent("navigation-complete")
      window.dispatchEvent(event)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  if (!loading && progress === 0) return null

  return (
    <div
      className={`fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out z-50 shadow-lg ${
        progress === 100 ? "opacity-0" : "opacity-100"
      }`}
      style={{ width: `${progress}%` }}
    />
  )
}

