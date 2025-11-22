"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Copy, Download, RotateCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getTextareaClasses } from "@/lib/utils"
import { ToolSEOSection } from "@/components/seo/tool-seo-section"

function jsonToXml(json: unknown, rootElement = "root", indent = 0): string {
  const spaces = "  ".repeat(indent)
  
  if (json === null || json === undefined) {
    return `${spaces}<${rootElement} />`
  }
  
  if (typeof json === "string") {
    return `${spaces}<${rootElement}>${escapeXml(json)}</${rootElement}>`
  }
  
  if (typeof json === "number" || typeof json === "boolean") {
    return `${spaces}<${rootElement}>${json}</${rootElement}>`
  }
  
  if (Array.isArray(json)) {
    if (json.length === 0) {
      return `${spaces}<${rootElement} />`
    }
    
    const items = json.map((item) => {
      const itemName = rootElement === "root" ? "item" : `${rootElement}Item`
      return jsonToXml(item, itemName, indent + 1)
    }).join("\n")
    
    return `${spaces}<${rootElement}>\n${items}\n${spaces}</${rootElement}>`
  }
  
  if (typeof json === "object" && json !== null) {
    const obj = json as Record<string, unknown>
    const keys = Object.keys(obj)
    if (keys.length === 0) {
      return `${spaces}<${rootElement} />`
    }
    
    const elements = keys.map(key => {
      const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, "_")
      return jsonToXml(obj[key], sanitizedKey, indent + 1)
    }).join("\n")
    
    return `${spaces}<${rootElement}>\n${elements}\n${spaces}</${rootElement}>`
  }
  
  return `${spaces}<${rootElement}>${json}</${rootElement}>`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export default function JsonXmlConverterPage() {
  const t = useTranslations()
  
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [rootElement, setRootElement] = useState("root")
  const [error, setError] = useState("")

  const handleConvert = () => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      return
    }

    try {
      const parsed = JSON.parse(input)
      const xml = jsonToXml(parsed, rootElement, 0)
      setOutput(`<?xml version="1.0" encoding="UTF-8"?>\n${xml}`)
      setError("")
    } catch {
      setError(t("tools.json-to-xml.errors.invalid_json"))
      setOutput("")
    }
  }

  const copyToClipboard = async () => {
    if (output) {
      await navigator.clipboard.writeText(output)
    }
  }

  const downloadFile = () => {
    if (output) {
      const blob = new Blob([output], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `converted.xml`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const clearAll = () => {
    setInput("")
    setOutput("")
    setError("")
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("tools.json-to-xml.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.json-to-xml.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {t("tools.json-to-xml.input_title")}
            </CardTitle>
            <CardDescription>
              {t("tools.json-to-xml.input_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="root-element">{t("tools.json-to-xml.root_element")}</Label>
              <Input
                id="root-element"
                value={rootElement}
                onChange={(e) => setRootElement(e.target.value || "root")}
                placeholder="root"
              />
            </div>
            
            <Textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setError("")
              }}
              placeholder={t("tools.json-to-xml.input_placeholder")}
              className={getTextareaClasses('input')}
            />
            
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            
            <div className="flex gap-2">
              <Button onClick={handleConvert} className="flex-1">
                {t("common.convert")}
              </Button>
              <Button onClick={clearAll} variant="outline" size="icon">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {t("tools.json-to-xml.output_title")}
            </CardTitle>
            <CardDescription>
              {t("tools.json-to-xml.output_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={output}
              readOnly
              placeholder={t("tools.json-to-xml.output_placeholder")}
              className={getTextareaClasses('output')}
            />
            
            <div className="flex gap-2">
              <Button onClick={copyToClipboard} variant="outline" className="flex-1" disabled={!output}>
                <Copy className="h-4 w-4 mr-2" />
                {t("common.copy")}
              </Button>
              <Button onClick={downloadFile} variant="outline" className="flex-1" disabled={!output}>
                <Download className="h-4 w-4 mr-2" />
                {t("common.download")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEO 优化内容 */}
      <ToolSEOSection toolId="json-to-xml" />
    </div>
  )
}
