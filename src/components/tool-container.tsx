"use client"

import { useState } from "react"
import { Copy, RotateCcw, Download, Table } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useTranslations } from 'next-intl'

interface JsonRow {
  [key: string]: unknown
}

interface ToolContainerProps {
  toolId: string
}

export function ToolContainer({ toolId }: ToolContainerProps) {
  const t = useTranslations()

  if (toolId === 'json-formatter') {
    return <JsonFormatterTool />
  }
  
  if (toolId === 'json-to-csv') {
    return <JsonToCsvTool />
  }

  return (
    <div className="container mx-auto p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">{t("common.coming_soon")}</h2>
        <p className="text-muted-foreground">{t("common.coming_soon")}</p>
      </div>
    </div>
  )
}

function JsonFormatterTool() {
  const t = useTranslations()
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

  const clearAll = () => {
    setInput("")
    setOutput("")
    setError("")
    setIsValid(true)
  }

  const copyToClipboard = async () => {
    if (output) {
      await navigator.clipboard.writeText(output)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{t("tools.json-formatter.name")}</h1>
        <p className="text-muted-foreground">{t("tools.json-formatter.description")}</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button onClick={formatJson} className="flex items-center space-x-2">
          <span>{t("common.format")}</span>
        </Button>
        <Button onClick={minifyJson} variant="outline" className="flex items-center space-x-2">
          <span>{t("common.minify")}</span>
        </Button>
        <Button onClick={clearAll} variant="outline" className="flex items-center space-x-2">
          <RotateCcw className="h-4 w-4" />
          <span>{t("common.clear")}</span>
        </Button>
        <Button onClick={copyToClipboard} variant="outline" className="flex items-center space-x-2" disabled={!output}>
          <Copy className="h-4 w-4" />
          <span>{t("common.copy")}</span>
        </Button>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("tools.json-formatter.output_title")}</CardTitle>
            <CardDescription>
              {t("tools.json-formatter.output_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={output}
              readOnly
              placeholder={t("tools.json-formatter.output_placeholder")}
              className="min-h-[300px] font-mono text-sm bg-muted/50"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function JsonToCsvTool() {
  const t = useTranslations()
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [isValid, setIsValid] = useState(true)

  const flattenObject = (obj: JsonRow, prefix = ''): JsonRow => {
    const flattened: JsonRow = {}
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key
        const value = obj[key]
        
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(flattened, flattenObject(value as JsonRow, newKey))
        } else {
          flattened[newKey] = Array.isArray(value) ? JSON.stringify(value) : value
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
      setIsValid(true)
      return
    }

    try {
      const parsed = JSON.parse(input)
      let data: JsonRow[]

      if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
          setOutput("")
          setError("")
          setIsValid(true)
          return
        }
        data = parsed
      } else if (typeof parsed === 'object' && parsed !== null) {
        data = [parsed]
      } else {
        setError(t("tools.json-to-csv.invalid_format"))
        setOutput("")
        setIsValid(false)
        return
      }

      const flattenedData = data.map(item => flattenObject(item as JsonRow))
      
      if (flattenedData.length === 0) {
        setOutput("")
        setError("")
        setIsValid(true)
        return
      }

      const allKeys = new Set<string>()
      flattenedData.forEach(item => {
        Object.keys(item).forEach(key => allKeys.add(key))
      })

      const headers = Array.from(allKeys)
      const csvRows = [
        headers.map(header => escapeCSV(header)).join(','),
        ...flattenedData.map(item =>
          headers.map(header => escapeCSV(item[header])).join(',')
        )
      ]

      setOutput(csvRows.join('\n'))
      setError("")
      setIsValid(true)
    } catch {
      setError(t("tools.json-to-csv.invalid"))
      setOutput("")
      setIsValid(false)
    }
  }

  const getRowCount = (): number => {
    if (!output) return 0
    return output.split('\n').length - 1
  }

  const getColumnCount = (): number => {
    if (!output) return 0
    const firstLine = output.split('\n')[0]
    if (!firstLine) return 0
    return firstLine.split(',').length
  }

  const clearAll = () => {
    setInput("")
    setOutput("")
    setError("")
    setIsValid(true)
  }

  const copyToClipboard = async () => {
    if (output) {
      await navigator.clipboard.writeText(output)
    }
  }

  const downloadCsv = () => {
    if (!output) return
    
    const blob = new Blob([output], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'converted.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{t("tools.json-to-csv.name")}</h1>
        <p className="text-muted-foreground">{t("tools.json-to-csv.description")}</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button onClick={convertJsonToCsv} className="flex items-center space-x-2">
          <Table className="h-4 w-4" />
          <span>{t("common.convert")}</span>
        </Button>
        <Button onClick={clearAll} variant="outline" className="flex items-center space-x-2">
          <RotateCcw className="h-4 w-4" />
          <span>{t("common.clear")}</span>
        </Button>
        <Button onClick={copyToClipboard} variant="outline" className="flex items-center space-x-2" disabled={!output}>
          <Copy className="h-4 w-4" />
          <span>{t("common.copy")}</span>
        </Button>
        <Button onClick={downloadCsv} variant="outline" className="flex items-center space-x-2" disabled={!output}>
          <Download className="h-4 w-4" />
          <span>{t("common.download")}</span>
        </Button>
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
