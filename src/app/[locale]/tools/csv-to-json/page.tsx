"use client"

import { useState } from "react"
import { Copy, RotateCcw, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { getTextareaClasses } from "@/lib/utils"
import { useTranslations } from 'next-intl';
import { ToolSEOSection } from "@/components/seo/tool-seo-section"

export default function CsvToJsonPage() {
  const t = useTranslations();
  const [input, setInput] = useState(`name,age,isAdmin
Alice,30,false
Bob,25,true`)
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")

  const unflattenObject = (flat: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {}

    for (const key in flat) {
      const parts = key.split('.')
      let current: Record<string, unknown> = result

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i]
        if (!(part in current)) {
          current[part] = {}
        }
        current = current[part] as Record<string, unknown>
      }

      const lastPart = parts[parts.length - 1]
      let value = flat[key]

      // 尝试解析JSON数组
      if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
        try {
          value = JSON.parse(value)
        } catch {
          // 保持原样
        }
      }

      current[lastPart] = value
    }

    return result
  }

  const parseCSV = (csv: string): string[][] => {
    const rows: string[][] = []
    let currentRow: string[] = []
    let currentCell = ''
    let inQuotes = false

    for (let i = 0; i < csv.length; i++) {
      const char = csv[i]
      const nextChar = csv[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // 转义的引号
          currentCell += '"'
          i++ // 跳过下一个引号
        } else {
          // 切换引号状态
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentCell)
        currentCell = ''
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (currentCell || currentRow.length > 0) {
          currentRow.push(currentCell)
          if (currentRow.some(cell => cell !== '')) {
            rows.push(currentRow)
          }
          currentRow = []
          currentCell = ''
        }
        // 跳过 \r\n 中的 \n
        if (char === '\r' && nextChar === '\n') {
          i++
        }
      } else {
        currentCell += char
      }
    }

    // 添加最后一行
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell)
      if (currentRow.some(cell => cell !== '')) {
        rows.push(currentRow)
      }
    }

    return rows
  }

  const convertCsvToJson = () => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      return
    }

    try {
      const rows = parseCSV(input)

      if (rows.length === 0) {
        setOutput("")
        setError("")
        return
      }

      const headers = rows[0]
      const dataRows = rows.slice(1)

      if (dataRows.length === 0) {
        setOutput(JSON.stringify([], null, 2))
        setError("")
        return
      }

      const jsonArray = dataRows.map(row => {
        const flatObj: Record<string, unknown> = {}
        headers.forEach((header, index) => {
          const value = row[index] || ''
          // 尝试转换数字
          if (value !== '' && !isNaN(Number(value))) {
            flatObj[header] = Number(value)
          } else if (value === 'true') {
            flatObj[header] = true
          } else if (value === 'false') {
            flatObj[header] = false
          } else {
            flatObj[header] = value
          }
        })
        return unflattenObject(flatObj)
      })

      setOutput(JSON.stringify(jsonArray, null, 2))
      setError("")
    } catch {
      setError(t("tools.csv-to-json.invalid_csv"))
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
      const blob = new Blob([output], { type: "application/json;charset=utf-8;" })
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
        <h1 className="text-3xl font-bold">{t("tools.csv-to-json.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.csv-to-json.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {t("tools.csv-to-json.input_title")}
            </CardTitle>
            <CardDescription>
              {t("tools.csv-to-json.input_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setError("")
              }}
              placeholder={t("tools.csv-to-json.placeholder")}
              className={getTextareaClasses('input')}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <div className="flex gap-2">
              <Button onClick={convertCsvToJson} className="flex-1">
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
              {t("tools.csv-to-json.output_title")}
            </CardTitle>
            <CardDescription>
              {t("tools.csv-to-json.output_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={output}
              readOnly
              placeholder={t("tools.csv-to-json.output_placeholder")}
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
      <ToolSEOSection toolId="csv-to-json" />
    </div>
  )
}
