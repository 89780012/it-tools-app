"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { ToolContainer } from "@/components/tool-container"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Copy, Download, RotateCcw, Shuffle, Database, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FieldConfig {
  name: string
  type: string
  count?: number
  min?: number
  max?: number
  format?: string
}

// 简单的数据生成器
class SimpleDataGenerator {
  private getRandomString(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  private getRandomNumber(min: number = 0, max: number = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  private getRandomBoolean(): boolean {
    return Math.random() < 0.5
  }

  private getRandomDate(): string {
    const start = new Date(2020, 0, 1)
    const end = new Date()
    const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime())
    return new Date(randomTime).toISOString()
  }

  private getRandomEmail(): string {
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'example.com']
    const username = this.getRandomString(8).toLowerCase()
    const domain = domains[Math.floor(Math.random() * domains.length)]
    return `${username}@${domain}`
  }

  private getRandomPhone(): string {
    const formats = ['138-0000-0000', '186-0000-0000', '139-0000-0000']
    const format = formats[Math.floor(Math.random() * formats.length)]
    return format.replace(/0/g, () => Math.floor(Math.random() * 10).toString())
  }

  private getRandomName(): string {
    const firstNames = ['张三', '李四', '王五', '赵六', 'Alice', 'Bob', 'Charlie', 'Diana']
    return firstNames[Math.floor(Math.random() * firstNames.length)]
  }

  private getRandomAddress(): string {
    const addresses = [
      '北京市朝阳区建国路1号',
      '上海市浦东新区世纪大道100号',
      '广州市天河区天河路200号',
      '深圳市南山区科技园',
      '123 Main St, New York, NY 10001',
      '456 Oak Ave, Los Angeles, CA 90210'
    ]
    return addresses[Math.floor(Math.random() * addresses.length)]
  }

  private getRandomUrl(): string {
    const domains = ['example.com', 'test.org', 'demo.net']
    const paths = ['', '/page', '/api/data', '/user/profile']
    const domain = domains[Math.floor(Math.random() * domains.length)]
    const path = paths[Math.floor(Math.random() * paths.length)]
    return `https://${domain}${path}`
  }

  private getRandomUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  generateField(config: FieldConfig): unknown {
    const { type, min = 0, max = 100, count = 10 } = config

    switch (type) {
      case 'string':
        return this.getRandomString(count)
      case 'number':
        return this.getRandomNumber(min, max)
      case 'boolean':
        return this.getRandomBoolean()
      case 'date':
        return this.getRandomDate()
      case 'email':
        return this.getRandomEmail()
      case 'phone':
        return this.getRandomPhone()
      case 'name':
        return this.getRandomName()
      case 'address':
        return this.getRandomAddress()
      case 'url':
        return this.getRandomUrl()
      case 'uuid':
        return this.getRandomUuid()
      case 'array':
        return Array.from({ length: count }, () => this.getRandomString(5))
      case 'null':
        return null
      default:
        return this.getRandomString()
    }
  }
}

const fieldTypes = [
  { value: 'string', label: '字符串' },
  { value: 'number', label: '数字' },
  { value: 'boolean', label: '布尔值' },
  { value: 'date', label: '日期' },
  { value: 'email', label: '邮箱' },
  { value: 'phone', label: '电话' },
  { value: 'name', label: '姓名' },
  { value: 'address', label: '地址' },
  { value: 'url', label: 'URL' },
  { value: 'uuid', label: 'UUID' },
  { value: 'array', label: '数组' },
  { value: 'null', label: 'null' }
]

export default function JsonGeneratorPage() {
  const t = useTranslations()
  const { toast } = useToast()
  const [fields, setFields] = useState<FieldConfig[]>([
    { name: 'id', type: 'number', min: 1, max: 1000 },
    { name: 'name', type: 'name' },
    { name: 'email', type: 'email' }
  ])
  const [recordCount, setRecordCount] = useState(5)
  const [output, setOutput] = useState("")
  const [outputFormat, setOutputFormat] = useState<"object" | "array">("array")

  const generator = new SimpleDataGenerator()

  const addField = () => {
    setFields([...fields, { name: 'newField', type: 'string' }])
  }

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const updateField = (index: number, updates: Partial<FieldConfig>) => {
    setFields(fields.map((field, i) => 
      i === index ? { ...field, ...updates } : field
    ))
  }

  const generateData = () => {
    try {
      const data = Array.from({ length: recordCount }, () => {
        const record: Record<string, unknown> = {}
        fields.forEach(field => {
          record[field.name] = generator.generateField(field)
        })
        return record
      })

      const result = outputFormat === "array" ? data : { data, count: data.length }
      setOutput(JSON.stringify(result, null, 2))
      
      toast({
        title: t("tools.json-generator.success"),
        description: t("tools.json-generator.generation_complete", { count: recordCount })
      })
    } catch {
      toast({
        title: t("common.error"),
        description: t("tools.json-generator.generation_failed"),
        variant: "destructive"
      })
    }
  }

  const handleCopy = async () => {
    if (!output) return

    try {
      await navigator.clipboard.writeText(output)
      toast({
        title: t("common.copied"),
        description: t("tools.json-generator.json_copied")
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

    const blob = new Blob([output], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "generated-data.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: t("common.downloaded"),
      description: t("tools.json-generator.json_downloaded")
    })
  }

  const handleClear = () => {
    setOutput("")
    setFields([
      { name: 'id', type: 'number', min: 1, max: 1000 },
      { name: 'name', type: 'name' },
      { name: 'email', type: 'email' }
    ])
    setRecordCount(5)
  }

  return (
    <ToolContainer
      title={t("tools.json-generator.name")}
      description={t("tools.json-generator.description")}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 配置区域 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5" />
              {t("tools.json-generator.configuration")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 基本设置 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recordCount">{t("tools.json-generator.record_count")}</Label>
                <Input
                  id="recordCount"
                  type="number"
                  min="1"
                  max="1000"
                  value={recordCount}
                  onChange={(e) => setRecordCount(parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label htmlFor="outputFormat">{t("tools.json-generator.output_format")}</Label>
                <Select value={outputFormat} onValueChange={(value: "object" | "array") => setOutputFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="array">{t("tools.json-generator.array_format")}</SelectItem>
                    <SelectItem value="object">{t("tools.json-generator.object_format")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 字段配置表格 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>{t("tools.json-generator.fields")}</Label>
                <Button variant="outline" size="sm" onClick={addField}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("tools.json-generator.add_field")}
                </Button>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">{t("tools.json-generator.field_name")}</TableHead>
                      <TableHead className="w-[150px]">{t("tools.json-generator.field_type")}</TableHead>
                      <TableHead className="w-[100px]">{t("tools.json-generator.min_value")}</TableHead>
                      <TableHead className="w-[100px]">{t("tools.json-generator.max_value")}</TableHead>
                      <TableHead className="w-[100px]">{t("tools.json-generator.length")}</TableHead>
                      <TableHead className="w-[80px]">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            placeholder={t("tools.json-generator.field_name")}
                            value={field.name}
                            onChange={(e) => updateField(index, { name: e.target.value })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={field.type}
                            onValueChange={(value) => updateField(index, { type: value })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {field.type === 'number' ? (
                            <Input
                              type="number"
                              placeholder="0"
                              value={field.min || ''}
                              onChange={(e) => updateField(index, { min: parseInt(e.target.value) || 0 })}
                              className="h-8"
                            />
                          ) : (
                            <div className="text-center text-muted-foreground">-</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {field.type === 'number' ? (
                            <Input
                              type="number"
                              placeholder="100"
                              value={field.max || ''}
                              onChange={(e) => updateField(index, { max: parseInt(e.target.value) || 100 })}
                              className="h-8"
                            />
                          ) : (
                            <div className="text-center text-muted-foreground">-</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {(field.type === 'string' || field.type === 'array') ? (
                            <Input
                              type="number"
                              placeholder={field.type === 'string' ? '10' : '5'}
                              value={field.count || ''}
                              onChange={(e) => updateField(index, { count: parseInt(e.target.value) || 10 })}
                              className="h-8"
                            />
                          ) : (
                            <div className="text-center text-muted-foreground">-</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeField(index)}
                            disabled={fields.length === 1}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={generateData} className="flex-1">
                <Shuffle className="h-4 w-4 mr-2" />
                {t("tools.json-generator.generate_button")}
              </Button>
              <Button variant="outline" onClick={handleClear}>
                <RotateCcw className="h-4 w-4 mr-2" />
                {t("common.clear")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 输出区域 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5" />
              {t("common.output")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
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
              placeholder={t("tools.json-generator.output_placeholder")}
              value={output}
              readOnly
              className="min-h-[400px] font-mono text-sm bg-gray-50 dark:bg-gray-900"
            />

            {output && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t("tools.json-generator.output_info", { 
                  size: Math.round(new Blob([output]).size / 1024 * 100) / 100 
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolContainer>
  )
}