"use client"

import { useState } from "react"
import { Copy, RotateCcw, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { getTextareaClasses } from "@/lib/utils"
import { useTranslations } from 'next-intl'
import { XMLParser } from 'fast-xml-parser'
import { ToolSEOSection } from "@/components/seo/tool-seo-section"

export default function XmlToJsonPage() {
  const t = useTranslations();

  const [input, setInput] = useState(`<?xml version="1.0" encoding="UTF-8"?>
<user>
  <name>Alice</name>
  <age>30</age>
  <isAdmin>false</isAdmin>
  <tags>
    <tag>user</tag>
    <tag>editor</tag>
  </tags>
</user>`)
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")

  const convertXmlToJson = () => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      return
    }

    try {
      const options = {
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        textNodeName: "#text",
        parseAttributeValue: true,
        parseTagValue: true,
        trimValues: true,
        ignoreDeclaration: true,
        ignorePiTags: true
      }

      const parser = new XMLParser(options)
      const result = parser.parse(input)
      const jsonOutput = JSON.stringify(result, null, 2)
      setOutput(jsonOutput)
      setError("")
    } catch {
      setError(t("tools.xml-to-json.invalid_xml"))
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
      const blob = new Blob([output], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `converted.json`
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
        <h1 className="text-3xl font-bold">{t("tools.xml-to-json.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.xml-to-json.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.xml-to-json.input_title")}</CardTitle>
            <CardDescription>
              {t("tools.xml-to-json.input_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setError("")
              }}
              placeholder={t("tools.xml-to-json.placeholder")}
              className={getTextareaClasses('input')}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <div className="flex gap-2">
              <Button onClick={convertXmlToJson} className="flex-1">
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
            <CardTitle>{t("tools.xml-to-json.output_title")}</CardTitle>
            <CardDescription>
              {t("tools.xml-to-json.output_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={output}
              readOnly
              placeholder={t("tools.xml-to-json.output_placeholder")}
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
      <ToolSEOSection toolId="xml-to-json" />
    </div>
  )
}
