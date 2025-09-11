"use client"

import { ReactNode } from 'react'
import { BackToHome } from "@/components/back-to-home"

interface ToolContainerProps {
  title: string
  description: string
  children: ReactNode
}

export function ToolContainer({ title, description, children }: ToolContainerProps) {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackToHome />
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{description}</p>
      </div>
      {children}
    </div>
  )
}