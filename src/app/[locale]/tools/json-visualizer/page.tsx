"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { ToolContainer } from "@/components/tool-container"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Upload, RotateCcw, FileText, ChevronDown, ChevronRight, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface JsonViewerProps {
  data: unknown
  level: number
  isLast: boolean
  parentKey?: string
}

function JsonViewer({ data, level, isLast, parentKey }: JsonViewerProps) {
  const [collapsed, setCollapsed] = useState(level > 2)
  
  const getTypeColor = (value: unknown): string => {
    if (value === null) return "text-gray-500"
    if (typeof value === "string") return "text-green-600 dark:text-green-400"
    if (typeof value === "number") return "text-blue-600 dark:text-blue-400"
    if (typeof value === "boolean") return "text-purple-600 dark:text-purple-400"
    if (Array.isArray(value)) return "text-orange-600 dark:text-orange-400"
    if (typeof value === "object") return "text-red-600 dark:text-red-400"
    return "text-gray-600"
  }

  const getValueDisplay = (value: unknown): string => {
    if (value === null) return "null"
    if (typeof value === "string") return `&quot;${value}&quot;`
    if (Array.isArray(value)) return `Array[${value.length}]`
    if (typeof value === "object") return `Object{${Object.keys(value as Record<string, unknown>).length}}`
    return String(value)
  }

  const isExpandable = (value: unknown): boolean => {
    return (Array.isArray(value) && value.length > 0) || 
           (typeof value === "object" && value !== null && Object.keys(value).length > 0)
  }

  const indentSize = level * 20

  if (!isExpandable(data)) {
    return (
      <div 
        className="flex items-center py-1 font-mono text-sm"
        style={{ paddingLeft: `${indentSize}px` }}
      >
        {parentKey && (
          <span className="text-blue-800 dark:text-blue-300 mr-2">
            &ldquo;{parentKey}&rdquo;:
          </span>
        )}
        <span className={cn(getTypeColor(data))}>
          {getValueDisplay(data)}
        </span>
        {!isLast && <span className="text-gray-500">,</span>}
      </div>
    )
  }

  const entries = Array.isArray(data) 
    ? data.map((item, index) => [index.toString(), item] as [string, unknown])
    : Object.entries(data as Record<string, unknown>)

  return (
    <div className="font-mono text-sm">
      <div 
        className="flex items-center py-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        style={{ paddingLeft: `${indentSize}px` }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <button className="mr-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
        
        {parentKey && (
          <span className="text-blue-800 dark:text-blue-300 mr-2">
            &ldquo;{parentKey}&rdquo;:
          </span>
        )}
        
        <span className={cn(getTypeColor(data))}>
          {Array.isArray(data) ? "[" : "{"}
          {collapsed && (
            <span className="text-gray-500 ml-1">
              {Array.isArray(data) ? `${data.length} items` : `${Object.keys(data as Record<string, unknown>).length} keys`}
            </span>
          )}
        </span>
        
        {!isLast && <span className="text-gray-500">,</span>}
      </div>

      {!collapsed && (
        <div>
          {entries.map(([key, value], index) => (
            <JsonViewer
              key={key}
              data={value}
              level={level + 1}
              isLast={index === entries.length - 1}
              parentKey={Array.isArray(data) ? undefined : key}
            />
          ))}
          <div 
            className="flex items-center py-1"
            style={{ paddingLeft: `${indentSize}px` }}
          >
            <span className={cn(getTypeColor(data))}>
              {Array.isArray(data) ? "]" : "}"}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function JsonVisualizerPage() {
  const t = useTranslations()
  const { toast } = useToast()
  const [input, setInput] = useState("")
  const [parsedData, setParsedData] = useState<unknown>(null)
  const [error, setError] = useState("")
  const [viewMode, setViewMode] = useState<"tree" | "raw">("tree")

  const handleParse = () => {
    if (!input.trim()) {
      setError(t("tools.json-visualizer.errors.empty_input"))
      setParsedData(null)
      return
    }

    try {
      const data = JSON.parse(input)
      setParsedData(data)
      setError("")
      
      toast({
        title: t("tools.json-visualizer.success"),
        description: t("tools.json-visualizer.parse_complete")
      })
    } catch {
      setError(t("tools.json-visualizer.errors.invalid_json"))
      setParsedData(null)
    }
  }

  const handleCopy = async () => {
    if (!input) return

    try {
      await navigator.clipboard.writeText(input)
      toast({
        title: t("common.copied"),
        description: t("tools.json-visualizer.json_copied")
      })
    } catch {
      toast({
        title: t("common.error"),
        description: t("common.copy_failed"),
        variant: "destructive"
      })
    }
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
    setParsedData(null)
    setError("")
  }

  const getStatsInfo = (data: unknown): { type: string; size: string; depth: number } => {
    const getDepth = (obj: unknown, currentDepth = 0): number => {
      if (obj === null || typeof obj !== "object") return currentDepth
      if (Array.isArray(obj)) {
        return Math.max(currentDepth, ...obj.map(item => getDepth(item, currentDepth + 1)))
      }
      return Math.max(currentDepth, ...Object.values(obj).map(value => getDepth(value, currentDepth + 1)))
    }

    const type = Array.isArray(data) ? "Array" : typeof data === "object" ? "Object" : typeof data
    const size = Array.isArray(data) 
      ? `${data.length} items`
      : typeof data === "object" && data !== null
      ? `${Object.keys(data).length} keys`
      : "primitive"
    const depth = getDepth(data)

    return { type, size, depth }
  }

  return (
    <ToolContainer
      title={t("tools.json-visualizer.name")}
      description={t("tools.json-visualizer.description")}
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

            <Textarea
              placeholder={t("tools.json-visualizer.input_placeholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />

            <Button onClick={handleParse} className="w-full">
              {t("tools.json-visualizer.parse_button")}
            </Button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 可视化区域 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {t("tools.json-visualizer.visualization")}
              </div>
              
              {parsedData !== null && (
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "tree" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("tree")}
                  >
                    {t("tools.json-visualizer.tree_view")}
                  </Button>
                  <Button
                    variant={viewMode === "raw" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("raw")}
                  >
                    {t("tools.json-visualizer.raw_view")}
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {parsedData !== null && (
              <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-md text-sm">
                {(() => {
                  const stats = getStatsInfo(parsedData)
                  return (
                    <>
                      <div>
                        <div className="font-medium text-gray-600 dark:text-gray-400">
                          {t("tools.json-visualizer.type")}
                        </div>
                        <div className="font-mono">{stats.type}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600 dark:text-gray-400">
                          {t("tools.json-visualizer.size")}
                        </div>
                        <div className="font-mono">{stats.size}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600 dark:text-gray-400">
                          {t("tools.json-visualizer.depth")}
                        </div>
                        <div className="font-mono">{stats.depth}</div>
                      </div>
                    </>
                  )
                })()}
              </div>
            )}

            <div className="min-h-[300px] max-h-[600px] overflow-auto border rounded-md p-4 bg-white dark:bg-gray-950">
              {!parsedData ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  {t("tools.json-visualizer.no_data")}
                </div>
              ) : viewMode === "tree" ? (
                <JsonViewer data={parsedData} level={0} isLast={true} />
              ) : (
                <pre className="font-mono text-sm whitespace-pre-wrap">
                  {JSON.stringify(parsedData, null, 2)}
                </pre>
              )}
            </div>

            {parsedData !== null && (
              <Button variant="outline" onClick={handleCopy} className="w-full">
                <Copy className="h-4 w-4 mr-2" />
                {t("common.copy")}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolContainer>
  )
}