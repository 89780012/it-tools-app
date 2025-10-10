"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Copy, Download, RotateCcw, ArrowLeftRight } from "lucide-react"
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

function xmlToJson(xml: string): unknown {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xml, "text/xml")
  
  // 检查解析错误
  const parserError = xmlDoc.querySelector("parsererror")
  if (parserError) {
    throw new Error("Invalid XML")
  }
  
  return parseXmlNode(xmlDoc.documentElement)
}

function parseXmlNode(node: Element): unknown {
  // 如果节点没有子节点，返回文本内容
  if (node.childNodes.length === 0) {
    return null
  }
  
  // 如果只有一个文本节点，返回其值
  if (node.childNodes.length === 1 && node.childNodes[0].nodeType === 3) {
    const text = node.childNodes[0].nodeValue?.trim() || ""
    // 尝试转换为数字或布尔值
    if (text === "true") return true
    if (text === "false") return false
    if (!isNaN(Number(text)) && text !== "") return Number(text)
    return text
  }
  
  // 收集所有元素子节点
  const children: Element[] = []
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i]
    if (child.nodeType === 1) { // 元素节点
      children.push(child as Element)
    }
  }
  
  if (children.length === 0) {
    return node.textContent?.trim() || ""
  }
  
  // 检查是否是数组（多个同名元素）
  const tagNames = children.map(c => c.tagName)
  const hasDuplicates = tagNames.some((tag, index) => tagNames.indexOf(tag) !== index)
  
  if (hasDuplicates || (children.length > 0 && children.every(c => c.tagName.endsWith("Item")))) {
    // 数组格式
    return children.map(child => parseXmlNode(child))
  }
  
  // 对象格式
  const result: Record<string, unknown> = {}
  children.forEach(child => {
    result[child.tagName] = parseXmlNode(child)
  })
  return result
}

export default function JsonXmlConverterPage() {
  const t = useTranslations()
  
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [rootElement, setRootElement] = useState("root")
  const [mode, setMode] = useState<'json-to-xml' | 'xml-to-json'>('json-to-xml')
  const [error, setError] = useState("")

  const handleConvert = () => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      return
    }

    try {
      if (mode === 'json-to-xml') {
        const parsed = JSON.parse(input)
        const xml = jsonToXml(parsed, rootElement, 0)
        setOutput(`<?xml version="1.0" encoding="UTF-8"?>\n${xml}`)
        setError("")
      } else {
        const json = xmlToJson(input)
        setOutput(JSON.stringify(json, null, 2))
        setError("")
      }
    } catch {
      setError(mode === 'json-to-xml' 
        ? t("tools.json-to-xml.errors.invalid_json")
        : t("tools.json-to-xml.errors.invalid_xml"))
      setOutput("")
    }
  }

  const switchMode = () => {
    setMode(mode === 'json-to-xml' ? 'xml-to-json' : 'json-to-xml')
    setInput(output)
    setOutput("")
    setError("")
  }

  const copyToClipboard = async () => {
    if (output) {
      await navigator.clipboard.writeText(output)
    }
  }

  const downloadFile = () => {
    if (output) {
      const extension = mode === 'json-to-xml' ? 'xml' : 'json'
      const blob = new Blob([output], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `converted.${extension}`
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

      <div className="flex gap-2 items-center justify-center">
        <Button
          onClick={switchMode}
          variant="outline"
          className="gap-2"
        >
          <ArrowLeftRight className="h-4 w-4" />
          {mode === 'json-to-xml' ? 'JSON → XML' : 'XML → JSON'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {mode === 'json-to-xml' ? t("tools.json-to-xml.input_title") : t("tools.json-to-xml.xml_input_title")}
            </CardTitle>
            <CardDescription>
              {mode === 'json-to-xml' ? t("tools.json-to-xml.input_desc") : t("tools.json-to-xml.xml_input_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === 'json-to-xml' && (
              <div className="space-y-2">
                <Label htmlFor="root-element">{t("tools.json-to-xml.root_element")}</Label>
                <Input
                  id="root-element"
                  value={rootElement}
                  onChange={(e) => setRootElement(e.target.value || "root")}
                  placeholder="root"
                />
              </div>
            )}
            
            <Textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setError("")
              }}
              placeholder={mode === 'json-to-xml' 
                ? t("tools.json-to-xml.input_placeholder")
                : t("tools.json-to-xml.xml_input_placeholder")}
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
              {mode === 'json-to-xml' ? t("tools.json-to-xml.output_title") : t("tools.json-to-xml.json_output_title")}
            </CardTitle>
            <CardDescription>
              {mode === 'json-to-xml' ? t("tools.json-to-xml.output_desc") : t("tools.json-to-xml.json_output_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={output}
              readOnly
              placeholder={mode === 'json-to-xml' 
                ? t("tools.json-to-xml.output_placeholder")
                : t("tools.json-to-xml.json_output_placeholder")}
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
