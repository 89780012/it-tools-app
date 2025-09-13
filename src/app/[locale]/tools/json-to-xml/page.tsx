"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { ToolContainer } from "@/components/tool-container"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Download, Upload, RotateCcw, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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
  
  return `${spaces}<${rootElement}>${escapeXml(String(json))}</${rootElement}>`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export default function JsonToXmlPage() {
  const t = useTranslations()
  const { toast } = useToast()
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [rootElementName, setRootElementName] = useState("root")

  const handleConvert = () => {
    if (!input.trim()) {
      setError(t("tools.json-to-xml.errors.empty_input"))
      setOutput("")
      return
    }

    try {
      const jsonData = JSON.parse(input)
      const xmlResult = `<?xml version="1.0" encoding="UTF-8"?>\n${jsonToXml(jsonData, rootElementName)}`
      setOutput(xmlResult)
      setError("")
      
      toast({
        title: t("tools.json-to-xml.success"),
        description: t("tools.json-to-xml.conversion_complete")
      })
    } catch {
      setError(t("tools.json-to-xml.errors.invalid_json"))
      setOutput("")
    }
  }

  const handleCopy = async () => {
    if (!output) return

    try {
      await navigator.clipboard.writeText(output)
      toast({
        title: t("common.copied"),
        description: t("tools.json-to-xml.xml_copied")
      })
    } catch {
      toast({
        title: t("common.error"),
        description: t("common.copy_failed"),
        variant: "destructive"
      })
    }
  }

  const handleDownload = () => {
    if (!output) return

    const blob = new Blob([output], { type: "application/xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "converted.xml"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: t("common.downloaded"),
      description: t("tools.json-to-xml.xml_downloaded")
    })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setInput(content)
    }
    reader.readAsText(file)
  }

  const handleClear = () => {
    setInput("")
    setOutput("")
    setError("")
    setRootElementName("root")
  }

  return (
    <ToolContainer
      title={t("tools.json-to-xml.name")}
      description={t("tools.json-to-xml.description")}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 输入区域 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t("common.input")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("file-upload")?.click()}
                className="w-full sm:w-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                {t("common.upload_file")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="w-full sm:w-auto"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {t("common.clear")}
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                {t("tools.json-to-xml.root_element")}
              </label>
              <input
                type="text"
                value={rootElementName}
                onChange={(e) => setRootElementName(e.target.value || "root")}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="root"
              />
            </div>

            <Textarea
              placeholder={t("tools.json-to-xml.input_placeholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />

            <Button onClick={handleConvert} className="w-full">
              {t("tools.json-to-xml.convert_button")}
            </Button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 输出区域 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t("common.output")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!output}
                className="w-full sm:w-auto"
              >
                <Copy className="h-4 w-4 mr-2" />
                {t("common.copy")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!output}
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                {t("common.download")}
              </Button>
            </div>

            <Textarea
              placeholder={t("tools.json-to-xml.output_placeholder")}
              value={output}
              readOnly
              className="min-h-[300px] font-mono text-sm bg-gray-50 dark:bg-gray-900"
            />
          </CardContent>
        </Card>
      </div>

      {/* SEO 优化内容 */}
      <ToolSEOSection toolId="json-to-xml" />
    </ToolContainer>
  )
}