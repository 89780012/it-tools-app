"use client"

import { useState } from "react"
import { Copy, RotateCcw, Download, RefreshCw } from "lucide-react"
import { getTextareaClasses } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslations } from 'next-intl';
import { ToolSEOSection } from "@/components/seo/tool-seo-section"

// 生成UUID v4
function generateUUIDv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export default function UUIDGeneratorPage() {
  const t = useTranslations();

  const [count, setCount] = useState(10)
  const [format, setFormat] = useState<'default' | 'uppercase' | 'no-dash' | 'no-dash-uppercase'>('default')
  const [uuids, setUuids] = useState<string[]>([])

  const generateUUIDs = () => {
    const generated = Array.from({ length: count }, () => {
      let uuid = generateUUIDv4()
      
      switch (format) {
        case 'uppercase':
          return uuid.toUpperCase()
        case 'no-dash':
          return uuid.replace(/-/g, '')
        case 'no-dash-uppercase':
          return uuid.replace(/-/g, '').toUpperCase()
        default:
          return uuid
      }
    })
    
    setUuids(generated)
  }

  const copyToClipboard = async () => {
    if (uuids.length > 0) {
      try {
        await navigator.clipboard.writeText(uuids.join('\n'))
      } catch (err) {
        console.error("Failed to copy:", err)
      }
    }
  }

  const downloadUUIDs = () => {
    if (uuids.length > 0) {
      const blob = new Blob([uuids.join('\n')], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "uuids.txt"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const clearAll = () => {
    setUuids([])
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("tools.uuid-generator.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.uuid-generator.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.uuid-generator.settings_title")}</CardTitle>
            <CardDescription>
              {t("tools.uuid-generator.settings_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="count">{t("tools.uuid-generator.count_label")}</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={1000}
                value={count}
                onChange={(e) => setCount(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">{t("tools.uuid-generator.count_hint")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">{t("tools.uuid-generator.format_label")}</Label>
              <Select value={format} onValueChange={(value: any) => setFormat(value)}>
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">{t("tools.uuid-generator.format_default")}</SelectItem>
                  <SelectItem value="uppercase">{t("tools.uuid-generator.format_uppercase")}</SelectItem>
                  <SelectItem value="no-dash">{t("tools.uuid-generator.format_no_dash")}</SelectItem>
                  <SelectItem value="no-dash-uppercase">{t("tools.uuid-generator.format_no_dash_uppercase")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={generateUUIDs} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t("tools.uuid-generator.generate")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("tools.uuid-generator.result_title")}</CardTitle>
            <CardDescription>
              {t("tools.uuid-generator.result_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={uuids.join('\n')}
              readOnly
              placeholder={t("tools.uuid-generator.result_placeholder")}
              className={getTextareaClasses('output')}
            />

            {uuids.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {t("tools.uuid-generator.generated_count", { count: uuids.length })}
              </div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={copyToClipboard} variant="outline" className="flex-1" disabled={uuids.length === 0}>
                <Copy className="h-4 w-4 mr-2" />
                {t("common.copy")}
              </Button>
              <Button onClick={downloadUUIDs} variant="outline" className="flex-1" disabled={uuids.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                {t("common.download")}
              </Button>
              <Button onClick={clearAll} variant="outline" size="icon" disabled={uuids.length === 0}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t("tools.uuid-generator.about_title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• <strong>{t("tools.uuid-generator.about_uuid_title")}</strong>：{t("tools.uuid-generator.about_uuid_desc")}</p>
          <p>• <strong>{t("tools.uuid-generator.about_v4_title")}</strong>：{t("tools.uuid-generator.about_v4_desc")}</p>
          <p>• <strong>{t("tools.uuid-generator.about_format_title")}</strong>：{t("tools.uuid-generator.about_format_desc")}</p>
          <p>• <strong>{t("tools.uuid-generator.about_use_title")}</strong>：{t("tools.uuid-generator.about_use_desc")}</p>
        </CardContent>
      </Card>

      {/* SEO 优化内容 */}
      <ToolSEOSection toolId="uuid-generator" />
    </div>
  )
}

