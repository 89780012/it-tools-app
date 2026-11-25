'use client'

import { useState } from 'react'
import { useTranslations } from '@/i18n/compat'
import { ToolContainer } from '@/components/tool-container'
import { ToolSEOSection } from '@/components/seo/tool-seo-section'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// Field types and output format use native selects for keyboard access.
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Copy,
  Download,
  RotateCcw,
  Shuffle,
  Database,
  Plus,
  Trash2,
} from 'lucide-react'
import { getTextareaClasses } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

import {
  generateEnhancedData,
  ENHANCED_FIELD_TYPES,
  type EnhancedField as FieldConfig,
} from '@/lib/json-generator-enhanced'

export default function JsonGeneratorPage() {
  const t = useTranslations()
  const { toast } = useToast()
  const [fields, setFields] = useState<FieldConfig[]>([
    { name: 'id', type: 'number', min: 1, max: 1000 },
    { name: 'name', type: 'name' },
    { name: 'email', type: 'email' },
  ])
  const [recordCount, setRecordCount] = useState(5)
  const [output, setOutput] = useState('')
  const [outputFormat, setOutputFormat] = useState<'object' | 'array'>('array')
  const [seed, setSeed] = useState('toolkit')
  const [dataLocale, setDataLocale] = useState<'en' | 'zh'>('en')
  const [boundary, setBoundary] = useState(false)
  const [nullRatio, setNullRatio] = useState(0)
  const [error, setError] = useState('')

  const extra = useTranslations('tools.json-generator')

  const addField = () => {
    if (fields.length < 50)
      setFields([
        ...fields,
        { name: `field${fields.length + 1}`, type: 'string' },
      ])
  }

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const updateField = (index: number, updates: Partial<FieldConfig>) => {
    setFields(
      fields.map((field, i) =>
        i === index ? { ...field, ...updates } : field,
      ),
    )
  }

  const generateData = () => {
    try {
      const data = generateEnhancedData(fields, recordCount, {
        seed,
        locale: dataLocale,
        boundary,
        nullRatio,
      })
      setError('')

      const result =
        outputFormat === 'array' ? data : { data, count: data.length }
      setOutput(JSON.stringify(result, null, 2))

      toast({
        title: t('tools.json-generator.success'),
        description: t('tools.json-generator.generation_complete', {
          count: recordCount,
        }),
      })
    } catch {
      setOutput('')
      setError(extra('extraInvalid'))
      toast({
        title: t('common.error'),
        description: t('tools.json-generator.generation_failed'),
        variant: 'destructive',
      })
    }
  }

  const handleCopy = async () => {
    if (!output) return

    try {
      await navigator.clipboard.writeText(output)
      toast({
        title: t('common.copied'),
        description: t('tools.json-generator.json_copied'),
      })
    } catch {
      toast({
        title: t('common.error'),
        description: t('common.copy_failed'),
        variant: 'destructive',
      })
    }
  }

  const handleDownload = () => {
    if (!output) return

    const blob = new Blob([output], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'generated-data.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: t('common.downloaded'),
      description: t('tools.json-generator.json_downloaded'),
    })
  }

  const handleClear = () => {
    setOutput('')
    setFields([
      { name: 'id', type: 'number', min: 1, max: 1000 },
      { name: 'name', type: 'name' },
      { name: 'email', type: 'email' },
    ])
    setRecordCount(5)
    setSeed('toolkit')
    setDataLocale('en')
    setBoundary(false)
    setNullRatio(0)
    setError('')
  }

  return (
    <div>
      <ToolContainer
        title={t('tools.json-generator.name')}
        description={t('tools.json-generator.description')}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 配置区域 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5" />
                {t('tools.json-generator.configuration')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  {extra('extraSeed')}
                  <Input
                    data-testid="json-seed"
                    maxLength={200}
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                  />
                </label>
                <label>
                  {extra('extraDataLocale')}
                  <select
                    data-testid="json-data-locale"
                    className="block w-full rounded border bg-background p-2"
                    value={dataLocale}
                    onChange={(e) =>
                      setDataLocale(e.target.value as 'en' | 'zh')
                    }
                  >
                    <option value="en">{extra('extraEnglish')}</option>
                    <option value="zh">{extra('extraChinese')}</option>
                  </select>
                </label>
                <label>
                  {extra('extraNull')}
                  <Input
                    data-testid="json-null"
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                    value={nullRatio}
                    onChange={(e) => setNullRatio(Number(e.target.value))}
                  />
                </label>
                <label className="flex items-center gap-2">
                  <input
                    data-testid="json-boundary"
                    type="checkbox"
                    checked={boundary}
                    onChange={(e) => setBoundary(e.target.checked)}
                  />
                  {extra('extraBoundary')}
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                {extra('extraLimits')}
              </p>
              {error && <p role="alert">{error}</p>}
              {/* 基本设置 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recordCount">
                    {t('tools.json-generator.record_count')}
                  </Label>
                  <Input
                    id="recordCount"
                    data-testid="json-rows"
                    type="number"
                    min="1"
                    max="1000"
                    value={recordCount}
                    onChange={(e) => setRecordCount(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="outputFormat">
                    {t('tools.json-generator.output_format')}
                  </Label>
                  <select
                    id="outputFormat"
                    data-testid="json-format"
                    className="block w-full rounded border bg-background p-2"
                    value={outputFormat}
                    onChange={(e) =>
                      setOutputFormat(e.target.value as 'object' | 'array')
                    }
                  >
                    <option value="array">
                      {t('tools.json-generator.array_format')}
                    </option>
                    <option value="object">
                      {t('tools.json-generator.object_format')}
                    </option>
                  </select>
                </div>
              </div>

              {/* 字段配置表格 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>{t('tools.json-generator.fields')}</Label>
                  <Button
                    data-testid="json-add-field"
                    variant="outline"
                    size="sm"
                    onClick={addField}
                    disabled={fields.length >= 50}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('tools.json-generator.add_field')}
                  </Button>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">
                          {t('tools.json-generator.field_name')}
                        </TableHead>
                        <TableHead className="w-[150px]">
                          {t('tools.json-generator.field_type')}
                        </TableHead>
                        <TableHead className="w-[100px]">
                          {t('tools.json-generator.min_value')}
                        </TableHead>
                        <TableHead className="w-[100px]">
                          {t('tools.json-generator.max_value')}
                        </TableHead>
                        <TableHead className="w-[100px]">
                          {t('tools.json-generator.length')}
                        </TableHead>
                        <TableHead className="w-[80px]">
                          {t('common.actions')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              placeholder={t('tools.json-generator.field_name')}
                              data-testid={`json-name-${index}`}
                              aria-label={t('tools.json-generator.field_name')}
                              maxLength={100}
                              value={field.name}
                              onChange={(e) =>
                                updateField(index, { name: e.target.value })
                              }
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <select
                              data-testid={`json-type-${index}`}
                              aria-label={t('tools.json-generator.field_type')}
                              className="w-full rounded border bg-background p-2"
                              value={field.type}
                              onChange={(e) =>
                                updateField(index, { type: e.target.value })
                              }
                            >
                              {ENHANCED_FIELD_TYPES.map((type) => (
                                <option key={type} value={type}>
                                  {extra(`extraType_${type}`)}
                                </option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell>
                            {field.type === 'number' ? (
                              <Input
                                type="number"
                                placeholder="0"
                                data-testid={`json-min-${index}`}
                                aria-label={t('tools.json-generator.min_value')}
                                value={field.min ?? 0}
                                onChange={(e) =>
                                  updateField(index, {
                                    min: Number(e.target.value),
                                  })
                                }
                                className="h-8"
                              />
                            ) : (
                              <div className="text-center text-muted-foreground">
                                -
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {field.type === 'number' ? (
                              <Input
                                type="number"
                                placeholder="100"
                                data-testid={`json-max-${index}`}
                                aria-label={t('tools.json-generator.max_value')}
                                value={field.max ?? 100}
                                onChange={(e) =>
                                  updateField(index, {
                                    max: Number(e.target.value),
                                  })
                                }
                                className="h-8"
                              />
                            ) : (
                              <div className="text-center text-muted-foreground">
                                -
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {field.type === 'string' ||
                            field.type === 'array' ? (
                              <Input
                                type="number"
                                placeholder={
                                  field.type === 'string' ? '10' : '5'
                                }
                                data-testid={`json-length-${index}`}
                                aria-label={t('tools.json-generator.length')}
                                value={field.count ?? 10}
                                onChange={(e) =>
                                  updateField(index, {
                                    count: Number(e.target.value),
                                  })
                                }
                                className="h-8"
                              />
                            ) : (
                              <div className="text-center text-muted-foreground">
                                -
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              aria-label={extra('extraRemove')}
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
                <Button
                  data-testid="json-generate"
                  onClick={generateData}
                  className="flex-1"
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  {t('tools.json-generator.generate_button')}
                </Button>
                <Button variant="outline" onClick={handleClear}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t('common.clear')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 输出区域 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5" />
                {t('common.output')}
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
                  {t('common.copy')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!output}
                  className="w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('common.download')}
                </Button>
              </div>

              <Textarea
                data-testid="json-output"
                placeholder={t('tools.json-generator.output_placeholder')}
                value={output}
                readOnly
                className={getTextareaClasses('output')}
              />

              {output && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('tools.json-generator.output_info', {
                    size:
                      Math.round((new Blob([output]).size / 1024) * 100) / 100,
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ToolContainer>
      <div className="container mx-auto p-6 space-y-6">
        <ToolSEOSection toolId="json-generator" />
      </div>
    </div>
  )
}
