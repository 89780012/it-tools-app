"use client"

import { useState } from "react"
import { Copy, RotateCcw, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useTranslations } from 'next-intl';

export default function JsonFormatterPage() {
  const t = useTranslations();

  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [isValid, setIsValid] = useState(true)

  const formatJson = () => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      setIsValid(true)
      return
    }

    try {
      const parsed = JSON.parse(input)
      const formatted = JSON.stringify(parsed, null, 2)
      setOutput(formatted)
      setError("")
      setIsValid(true)
    } catch {
      setError(t("tools.json-formatter.invalid"))
      setOutput("")
      setIsValid(false)
    }
  }

  const minifyJson = () => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      setIsValid(true)
      return
    }

    try {
      const parsed = JSON.parse(input)
      const minified = JSON.stringify(parsed)
      setOutput(minified)
      setError("")
      setIsValid(true)
    } catch {
      setError(t("tools.json-formatter.invalid"))
      setOutput("")
      setIsValid(false)
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
    setError("")
    setIsValid(true)
  }

  const downloadJson = () => {
    if (output) {
      const blob = new Blob([output], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "formatted.json"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("tools.json-formatter.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.json-formatter.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.json-formatter.input_title")}</CardTitle>
            <CardDescription>
              {t("tools.json-formatter.placeholder")}
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
              placeholder={t("tools.json-formatter.placeholder")}
              className={cn(
                "min-h-[300px] font-mono text-sm",
                !isValid && "border-destructive"
              )}
            />
            
            {error && (
              <div className="text-destructive text-sm">{error}</div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={formatJson} className="flex-1">
                {t("common.format")}
              </Button>
              <Button onClick={minifyJson} variant="outline" className="flex-1">
                {t("common.minify")}
              </Button>
              <Button onClick={clearAll} variant="outline" size="icon">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("tools.json-formatter.output_title")}</CardTitle>
            <CardDescription>
              {t("tools.json-formatter.output_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={output}
              readOnly
              placeholder={t("tools.json-formatter.output_placeholder")}
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
                onClick={downloadJson} 
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
    </div>
  )
}