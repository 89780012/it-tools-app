"use client"

import { useState } from "react"
import { Copy, RotateCcw, Download, Table } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useTranslations } from 'next-intl';

interface JsonRow {
  [key: string]: unknown
}

export default function JsonToCsvPage() {
  const t = useTranslations();
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [isValid, setIsValid] = useState(true)

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
    // 如果包含逗号、引号、换行符，需要用引号包围
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      // 引号需要转义为双引号
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const convertJsonToCsv = () => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      setIsValid(true)
      return
    }

    try {
      const parsed = JSON.parse(input)
      let jsonArray: JsonRow[]

      // 处理不同的输入格式
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
          setOutput("")
          setError("")
          setIsValid(true)
          return
        }
        jsonArray = parsed
      } else if (typeof parsed === 'object' && parsed !== null) {
        // 如果是单个对象，转为数组
        jsonArray = [parsed]
      } else {
        setError(t("tools.json-to-csv.invalid_format"))
        setOutput("")
        setIsValid(false)
        return
      }

      // 扁平化所有对象并收集所有键
      const flattenedRows = jsonArray.map(item => flattenObject(item))
      const allKeys = new Set<string>()
      flattenedRows.forEach(row => {
        Object.keys(row).forEach(key => allKeys.add(key))
      })

      const headers = Array.from(allKeys).sort()
      
      if (headers.length === 0) {
        setOutput("")
        setError("")
        setIsValid(true)
        return
      }

      // 生成CSV内容
      const csvLines: string[] = []
      
      // 添加标题行
      csvLines.push(headers.map(header => escapeCSV(header)).join(','))
      
      // 添加数据行
      flattenedRows.forEach(row => {
        const values = headers.map(header => escapeCSV(row[header] || ''))
        csvLines.push(values.join(','))
      })

      const csvContent = csvLines.join('\n')
      setOutput(csvContent)
      setError("")
      setIsValid(true)
    } catch {
      setError(t("tools.json-to-csv.invalid"))
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

  const downloadCsv = () => {
    if (output) {
      const blob = new Blob([output], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "data.csv"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const getRowCount = () => {
    if (!output) return 0
    return output.split('\n').length - 1 // 减去标题行
  }

  const getColumnCount = () => {
    if (!output) return 0
    const firstLine = output.split('\n')[0]
    if (!firstLine) return 0
    // 简单计算逗号数量，不考虑引号内的逗号
    return firstLine.split(',').length
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
            <CardTitle>{t("tools.json-to-csv.input_title")}</CardTitle>
            <CardDescription>
              {t("tools.json-to-csv.placeholder")}
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
              placeholder={t("tools.json-to-csv.placeholder")}
              className={cn(
                "min-h-[300px] font-mono text-sm",
                !isValid && "border-destructive"
              )}
            />
            
            {error && (
              <div className="text-destructive text-sm">{error}</div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={convertJsonToCsv} className="flex-1">
                <Table className="h-4 w-4 mr-2" />
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
            <CardTitle>{t("tools.json-to-csv.output_title")}</CardTitle>
            <CardDescription>
              {output && (
                <span className="text-sm text-muted-foreground">
                  {t("tools.json-to-csv.rows_columns", { rows: getRowCount(), columns: getColumnCount() })}
                </span>
              )}
              {!output && t("tools.json-to-csv.output_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={output}
              readOnly
              placeholder={t("tools.json-to-csv.output_placeholder")}
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
                onClick={downloadCsv} 
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

      <Card>
        <CardHeader>
          <CardTitle>{t("tools.json-to-csv.usage_title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              {t("tools.json-to-csv.usage_array_format")} <code className="bg-muted px-1 py-0.5 rounded text-xs">{t("tools.json-to-csv.usage_array_example")}</code>
            </p>
            <p>
              {t("tools.json-to-csv.usage_object_format")} <code className="bg-muted px-1 py-0.5 rounded text-xs">{t("tools.json-to-csv.usage_object_example")}</code>
            </p>
            <p>
              {t("tools.json-to-csv.usage_nested_flatten")} <code className="bg-muted px-1 py-0.5 rounded text-xs">{t("tools.json-to-csv.usage_nested_examples")}</code>
            </p>
            <p>{t("tools.json-to-csv.usage_array_stringify")}</p>
            <p>{t("tools.json-to-csv.usage_csv_escape")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}