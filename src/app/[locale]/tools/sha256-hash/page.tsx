"use client"

import { useState } from "react"
import { Copy, RotateCcw, Download, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useTranslations } from 'next-intl'
import { ToolSEOSection } from "@/components/seo/tool-seo-section"

export default function SHA256HashPage() {
  const t = useTranslations();

  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")

  const generateSHA256 = async () => {
    if (!input.trim()) {
      setOutput("")
      return
    }

    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(input)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      setOutput(hashHex)
    } catch (error) {
      console.error('SHA256 generation failed:', error)
      setOutput("")
    }
  }

  const copyToClipboard = async () => {
    if (output) {
      await navigator.clipboard.writeText(output)
    }
  }

  const clearAll = () => {
    setInput("")
    setOutput("")
  }

  const downloadHash = () => {
    if (output) {
      const blob = new Blob([output], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "sha256-hash.txt"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("tools.sha256-hash.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.sha256-hash.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.sha256-hash.input_title")}</CardTitle>
            <CardDescription>
              {t("tools.sha256-hash.placeholder")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                generateSHA256()
              }}
              placeholder={t("tools.sha256-hash.placeholder")}
              className="min-h-[300px] font-mono text-sm"
            />

            <div className="flex gap-2">
              <Button onClick={generateSHA256} className="flex-1">
                <Hash className="h-4 w-4 mr-2" />
                {t("common.generate")}
              </Button>
              <Button onClick={clearAll} variant="outline" size="icon">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("tools.sha256-hash.output_title")}</CardTitle>
            <CardDescription>
              {t("tools.sha256-hash.output_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={output}
              readOnly
              placeholder={t("tools.sha256-hash.output_placeholder")}
              className="min-h-[300px] font-mono text-sm bg-muted/50"
            />

            <div className="flex gap-2">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                disabled={!output}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                {t("common.copy")}
              </Button>
              <Button
                onClick={downloadHash}
                variant="outline"
                disabled={!output}
                size="icon"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEO 优化内容 */}
      <ToolSEOSection toolId="sha256-hash" />
    </div>
  )
}