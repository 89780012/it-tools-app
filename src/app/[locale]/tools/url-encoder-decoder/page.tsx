"use client"

import { useState } from "react"
import { Copy, RotateCcw, Download, Link2, Unlink2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn, getTextareaClasses } from "@/lib/utils"
import { useTranslations } from 'next-intl';
import { ToolSEOSection } from "@/components/seo/tool-seo-section"

export default function UrlEncoderDecoderPage() {
  const t = useTranslations();

  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [isValid, setIsValid] = useState(true)

  const encodeUrl = () => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      setIsValid(true)
      return
    }

    try {
      const encoded = encodeURIComponent(input)
      setOutput(encoded)
      setError("")
      setIsValid(true)
    } catch (err) {
      setError(`${t("common.error")}: ${err}`)
      setOutput("")
      setIsValid(false)
    }
  }

  const decodeUrl = () => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      setIsValid(true)
      return
    }

    try {
      const decoded = decodeURIComponent(input)
      setOutput(decoded)
      setError("")
      setIsValid(true)
    } catch {
      setError(t("tools.url-encoder-decoder.invalid_url"))
      setOutput("")
      setIsValid(false)
    }
  }

  const copyToClipboard = async () => {
    if (output) {
      try {
        await navigator.clipboard.writeText(output)
      } catch (err) {
        console.error("Failed to copy:", err)
      }
    }
  }

  const clearAll = () => {
    setInput("")
    setOutput("")
    setError("")
    setIsValid(true)
  }

  const downloadText = () => {
    if (output) {
      const blob = new Blob([output], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "url-result.txt"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("tools.url-encoder-decoder.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.url-encoder-decoder.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.url-encoder-decoder.input_title")}</CardTitle>
            <CardDescription>
              {t("tools.url-encoder-decoder.placeholder")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                if (error) {
                  setError("")
                  setIsValid(true)
                }
              }}
              placeholder={t("tools.url-encoder-decoder.placeholder")}
              className={getTextareaClasses('input', isValid)}
            />
            
            {error && (
              <div className="text-destructive text-sm">{error}</div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={encodeUrl} className="flex-1">
                <Link2 className="h-4 w-4 mr-2" />
                {t("tools.url-encoder-decoder.encode")}
              </Button>
              <Button onClick={decodeUrl} variant="outline" className="flex-1">
                <Unlink2 className="h-4 w-4 mr-2" />
                {t("tools.url-encoder-decoder.decode")}
              </Button>
              <Button onClick={clearAll} variant="outline" size="icon">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("tools.url-encoder-decoder.output_title")}</CardTitle>
            <CardDescription>
              {t("tools.url-encoder-decoder.output_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={output}
              readOnly
              placeholder={t("tools.url-encoder-decoder.output_placeholder")}
              className={getTextareaClasses('output')}
            />
            
            <div className="flex gap-2">
              <Button onClick={copyToClipboard} variant="outline" className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                {t("common.copy")}
              </Button>
              <Button onClick={downloadText} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                {t("common.download")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEO 优化内容 */}
      <ToolSEOSection toolId="url-encoder-decoder" />
    </div>
  )
}