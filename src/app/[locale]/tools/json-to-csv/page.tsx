"use client"

import { useState } from "react"
import { Copy, RotateCcw, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { getTextareaClasses } from "@/lib/utils"
import { useTranslations } from 'next-intl';
import { ToolSEOSection } from "@/components/seo/tool-seo-section"

interface JsonRow {
  [key: string]: unknown
}

export default function JsonToCsvPage() {
  const t = useTranslations();
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")

  const flattenObject = (obj: Record<string, unknown>, prefix = ''): Record<string, unknown> => {
    const flattened: Record<string, unknown> = {}

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key

        if (obj[key] === null || obj[key] === undefined) {
          flattened[newKey] = ''
        } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          Object.assign(flattened, flattenObject(obj[key] as Record<string, unknown>, newKey))
        } else if (Array.isArray(obj[key])) {
          flattened[newKey] = JSON.stringify(obj[key])
        } else {
          flattened[newKey] = obj[key]
        }
      }
    }

    return flattened
  }

  const escapeCSV = (value: unknown): string => {
    if (value === null || value === undefined) return ''

    const str = String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const convertJsonToCsv = () => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      return
    }

    try {
      const parsed = JSON.parse(input)
      let jsonArray: JsonRow[]

      if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
          setOutput("")
          setError("")
          return
        }
        jsonArray = parsed
      } else if (typeof parsed === 'object' && parsed !== null) {
        jsonArray = [parsed]
      } else {
        setError(t("tools.json-to-csv.invalid_format"))
        setOutput("")
        return
      }

      const flattenedRows = jsonArray.map(item => flattenObject(item))
      const allKeys = new Set<string>()
      flattenedRows.forEach(row => {
        Object.keys(row).forEach(key => allKeys.add(key))
      })

      const headers = Array.from(allKeys).sort()

      if (headers.length === 0) {
        setOutput("")
        setError("")
        return
      }

      const csvLines: string[] = []
      csvLines.push(headers.map(header => escapeCSV(header)).join(','))

      flattenedRows.forEach(row => {
        const values = headers.map(header => escapeCSV(row[header] || ''))
        csvLines.push(values.join(','))
      })

      const csvContent = csvLines.join('\n')
      setOutput(csvContent)
      setError("")
    } catch {
      setError(t("tools.json-to-csv.invalid"))
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
      const blob = new Blob([output], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `converted.csv`
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
        <h1 className="text-3xl font-bold">{t("tools.json-to-csv.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.json-to-csv.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {t("tools.json-to-csv.input_title")}
            </CardTitle>
            <CardDescription>
              {t("tools.json-to-csv.input_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setError("")
              }}
              placeholder={t("tools.json-to-csv.placeholder")}
              className={getTextareaClasses('input')}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <div className="flex gap-2">
              <Button onClick={convertJsonToCsv} className="flex-1">
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
              {t("tools.json-to-csv.output_title")}
            </CardTitle>
            <CardDescription>
              {t("tools.json-to-csv.output_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={output}
              readOnly
              placeholder={t("tools.json-to-csv.output_placeholder")}
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
      <ToolSEOSection toolId="json-to-csv" />
    </div>
  )
}
