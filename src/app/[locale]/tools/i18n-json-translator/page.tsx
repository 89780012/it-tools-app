"use client"

import { useTranslations } from "next-intl"
import { useState, useMemo, useEffect, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  Languages,
  RotateCcw,
  Copy,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { ToolSEOSection } from "@/components/seo/tool-seo-section"
import { cn, getTextareaClasses } from "@/lib/utils"

type TranslationEntry = {
  path: string
  value: string
}

type JsonValue = string | number | boolean | null | JsonObject | JsonArray
type JsonObject = { [key: string]: JsonValue }
type JsonArray = JsonValue[]

type TranslationJob = {
  status: "idle" | "queued" | "translating" | "completed" | "failed"
  entryCount?: number
  translatedCount?: number
  error?: string
  failedKeys?: string[]
}

type TranslatorOptions = {
  preservePlaceholders: boolean
  skipHtml: boolean
  skipShortValues: boolean
  minLength: number
  includeKeys?: boolean
}

type ApiResponse = {
  translations: Record<string, string>
}

const DEFAULT_SAMPLE = `{
  "homepage": {
    "headline": "Design, build and launch apps in minutes",
    "subheading": "Modern components, i18n ready content and automated workflows help your team move faster.",
    "cta": {
      "primary": "Start translating today",
      "secondary": "Invite collaborators"
    }
  },
  "common": {
    "language": "Language",
    "theme": "Theme",
    "search_placeholder": "Search commands, datasets or settings",
    "errors": {
      "network": "Network request failed, please retry later",
      "unauthorized": "You don't have access to this space"
    }
  }
}`

const SOURCE_LANGUAGE_CODES = ["en", "zh", "de", "ja", "ko"]

const TARGET_LANGUAGE_CODES = [
  "en",
  "es",
  "de",
  "fr",
  "it",
  "pt",
  "ru",
  "ja",
  "ko",
  "ar",
  "hi",
]

const flattenJson = (
  value: unknown,
  segments: string[] = [],
  acc: TranslationEntry[] = []
): TranslationEntry[] => {
  if (typeof value === "string") {
    acc.push({ path: segments.join("."), value })
    return acc
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      flattenJson(item, [...segments, String(index)], acc)
    })
    return acc
  }

  if (value && typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(
      ([key, nested]) => {
        flattenJson(nested, [...segments, key], acc)
      }
    )
    return acc
  }

  return acc
}

const isNumericSegment = (segment: string) => /^\d+$/.test(segment)

const rebuildTranslations = (
  source: unknown,
  translations: Record<string, string>
) => {
  const normalized =
    source && typeof source === "object" ? source : {}
  const cloned = JSON.parse(
    JSON.stringify(normalized)
  ) as JsonObject | JsonArray

  Object.entries(translations).forEach(([path, translatedValue]) => {
    if (!path) return
    const segments = path.split(".")
    let cursor: JsonObject | JsonArray = cloned

    segments.forEach((segment, index) => {
      const isLast = index === segments.length - 1
      const key = isNumericSegment(segment) ? Number(segment) : segment

      if (isLast) {
        if (Array.isArray(cursor) && typeof key === "number") {
          cursor[key] = translatedValue
        } else if (!Array.isArray(cursor) && typeof key === "string") {
          cursor[key] = translatedValue
        }
        return
      }

      if (Array.isArray(cursor) && typeof key === "number") {
        if (
          cursor[key] === undefined ||
          cursor[key] === null ||
          typeof cursor[key] !== "object"
        ) {
          cursor[key] = isNumericSegment(segments[index + 1]) ? [] : {}
        }
        cursor = cursor[key] as JsonObject | JsonArray
      } else if (!Array.isArray(cursor) && typeof key === "string") {
        if (!(key in cursor) || cursor[key] === null) {
          cursor[key] = isNumericSegment(segments[index + 1]) ? [] : {}
        }
        cursor = cursor[key] as JsonObject | JsonArray
      }
    })
  })

  return cloned
}

export default function I18nJsonTranslatorPage() {
  const t = useTranslations()
  const { toast } = useToast()

  const [sourceLanguage, setSourceLanguage] = useState("zh")
  const [targetLanguages, setTargetLanguages] = useState<string[]>(["en", "de"])
  const [sourceText, setSourceText] = useState(DEFAULT_SAMPLE)
  const [inputError, setInputError] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [jobs, setJobs] = useState<Record<string, TranslationJob>>({})
  const [results, setResults] = useState<Record<string, string>>({})
  const [activeTarget, setActiveTarget] = useState<string>("en")
  const [options, setOptions] = useState<TranslatorOptions>({
    preservePlaceholders: true,
    skipHtml: false,
    skipShortValues: true,
    minLength: 2,
    includeKeys: false,
  })

  const sourceLanguages = useMemo(
    () =>
      SOURCE_LANGUAGE_CODES.map((code) => ({
        value: code,
        label: t(`common.languages.${code}` as any) || code,
      })),
    [t]
  )

  const targetLanguagePool = useMemo(
    () =>
      TARGET_LANGUAGE_CODES.map((code) => ({
        value: code,
        label: t(`common.languages.${code}` as any) || code,
      })),
    [t]
  )

  const parsedSource = useMemo(() => {
    if (!sourceText.trim()) {
      return null
    }
    try {
      return JSON.parse(sourceText)
    } catch {
      return null
    }
  }, [sourceText])

  useEffect(() => {
    if (!sourceText.trim()) {
      setInputError(null)
      return
    }
    try {
      JSON.parse(sourceText)
      setInputError(null)
    } catch {
      setInputError(t("tools.i18n-json-translator.invalid_json"))
    }
  }, [sourceText, t])

  const flattenedEntries = useMemo(() => {
    if (!parsedSource) return []
    return flattenJson(parsedSource)
  }, [parsedSource])

  useEffect(() => {
    if (targetLanguages.length > 0 && !targetLanguages.includes(activeTarget)) {
      setActiveTarget(targetLanguages[0])
    }
  }, [activeTarget, targetLanguages])

  const toggleLanguage = (lang: string) => {
    setTargetLanguages((prev) => {
      if (prev.includes(lang)) {
        const filtered = prev.filter((item) => item !== lang)
        return filtered
      }
      return [...prev, lang]
    })
  }

  const resetAll = () => {
    setSourceText("")
    setJobs({})
    setResults({})
    setInputError(null)
    setIsTranslating(false)
  }

  const copyResult = async (lang: string) => {
    if (!results[lang]) return
    await navigator.clipboard.writeText(results[lang])
    toast({
      title: t("common.copy"),
      description: t("tools.i18n-json-translator.copied_message", {
        language: lang.toUpperCase(),
      }),
    })
  }

  const downloadResult = (lang: string) => {
    const content = results[lang]
    if (!content) return
    const blob = new Blob([content], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `translations-${lang}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatSource = () => {
    if (!parsedSource) return
    setSourceText(JSON.stringify(parsedSource, null, 2))
  }

  const startTranslation = useCallback(async () => {
    if (!parsedSource) {
      toast({
        variant: "destructive",
        title: t("tools.i18n-json-translator.invalid_json"),
      })
      return
    }

    if (targetLanguages.length === 0) {
      toast({
        title: t("common.error"),
        description: t("tools.i18n-json-translator.select_language_tip"),
        variant: "destructive",
      })
      return
    }

    if (flattenedEntries.length === 0) {
      toast({
        title: t("tools.i18n-json-translator.empty_entries"),
        variant: "destructive",
      })
      return
    }

    setIsTranslating(true)
    setJobs((prev) => {
      const next = { ...prev }
      targetLanguages.forEach((lang) => {
        next[lang] = { status: "queued", entryCount: flattenedEntries.length, translatedCount: 0 }
      })
      return next
    })

    const payloadEntries = flattenedEntries.map((entry) => ({
      key: entry.path,
      value: entry.value,
    }))

    // 分批大小：每批50个条目
    const BATCH_SIZE = 50
    // 并发数：默认10个
    const CONCURRENT_LIMIT = 10
    // 最大重试次数
    const MAX_RETRIES = 3

    // 单个批次翻译请求（带重试）
    const translateBatchWithRetry = async (
      batch: { index: number; entries: typeof payloadEntries },
      lang: string,
      retryCount = 0
    ): Promise<{
      index: number
      translations: Record<string, string>
      error?: string
      failedKeys?: string[]
    }> => {
      try {
        const response = await fetch("/api/i18n-translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sourceLanguage,
            targetLanguage: lang,
            entries: batch.entries,
            options,
          }),
        })

        const data = (await response.json()) as ApiResponse & {
          error?: string
        }
        if (!response.ok) {
          throw new Error(data.error || "Translation failed")
        }

        return {
          index: batch.index,
          translations: data.translations || {},
          error: undefined,
        }
      } catch (error) {
        // 如果还有重试次数，则重试
        if (retryCount < MAX_RETRIES) {
          // 等待一段时间后重试（指数退避）
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, retryCount) * 1000)
          )
          return translateBatchWithRetry(batch, lang, retryCount + 1)
        }

        // 重试次数用尽，返回错误和失败的key
        const failedKeys = batch.entries.map((entry) => entry.key)
        return {
          index: batch.index,
          translations: {},
          error: error instanceof Error ? error.message : String(error),
          failedKeys,
        }
      }
    }

    // 动态并发控制函数（并发池模式）
    const runConcurrentBatches = async (
      batches: Array<{ index: number; entries: typeof payloadEntries }>,
      lang: string
    ) => {
      const results: Array<{
        index: number
        translations: Record<string, string>
        error?: string
        failedKeys?: string[]
      }> = []

      // 创建批次队列
      const batchQueue = [...batches]
      const running = new Set<Promise<void>>()
      let completedCount = 0

      // 处理单个批次并更新进度
      const processBatch = (batch: {
        index: number
        entries: typeof payloadEntries
      }): Promise<void> => {
        // 使用包装对象来保存 promise 引用
        const promiseWrapper = { promise: null as Promise<void> | null }
        
        promiseWrapper.promise = (async () => {
          try {
            const result = await translateBatchWithRetry(batch, lang)
            results.push(result)

            // 更新进度
            completedCount = results.reduce(
              (sum, r) => sum + Object.keys(r.translations).length,
              0
            )
            setJobs((prev) => ({
              ...prev,
              [lang]: {
                status: "translating",
                entryCount: payloadEntries.length,
                translatedCount: completedCount,
              },
            }))
          } finally {
            // 从运行集合中移除当前任务
            if (promiseWrapper.promise) {
              running.delete(promiseWrapper.promise)
            }

            // 如果还有待处理的批次，立即启动下一个
            if (batchQueue.length > 0) {
              const nextBatch = batchQueue.shift()!
              const nextPromise = processBatch(nextBatch)
              running.add(nextPromise)
            }
          }
        })()

        return promiseWrapper.promise
      }

      // 初始化：启动前 CONCURRENT_LIMIT 个批次
      const initialBatches = batchQueue.splice(0, CONCURRENT_LIMIT)
      initialBatches.forEach((batch) => {
        const promise = processBatch(batch)
        running.add(promise)
      })

      // 等待所有批次完成
      while (running.size > 0) {
        await Promise.race(Array.from(running))
      }

      return results
    }

    for (const lang of targetLanguages) {
      setJobs((prev) => ({
        ...prev,
        [lang]: {
          status: "translating",
          entryCount: payloadEntries.length,
          translatedCount: 0,
        },
      }))

      try {
        // 创建批次数组
        const totalBatches = Math.ceil(payloadEntries.length / BATCH_SIZE)
        const batches: Array<{
          index: number
          entries: typeof payloadEntries
        }> = []

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
          const start = batchIndex * BATCH_SIZE
          const end = Math.min(start + BATCH_SIZE, payloadEntries.length)
          const batchEntries = payloadEntries.slice(start, end)
          batches.push({
            index: batchIndex,
            entries: batchEntries,
          })
        }

        // 并发执行所有批次
        const batchResults = await runConcurrentBatches(batches, lang)

        // 按批次索引排序，确保数据顺序正确（即使响应时间不同）
        batchResults.sort((a, b) => a.index - b.index)

        // 检查是否有错误
        const errors = batchResults.filter((r) => r.error)
        const successBatches = batchResults.filter((r) => !r.error)

        // 收集所有失败的key
        const allFailedKeys: string[] = []
        errors.forEach((error) => {
          if (error.failedKeys) {
            allFailedKeys.push(...error.failedKeys)
          }
        })

        // 合并所有成功批次的翻译结果
        const allTranslations: Record<string, string> = {}
        successBatches.forEach((result) => {
          Object.assign(allTranslations, result.translations)
        })

        // 如果有错误，显示警告但继续处理成功的结果
        if (errors.length > 0) {
          const failedKeysText =
            allFailedKeys.length > 0
              ? `\n失败的key: ${allFailedKeys.slice(0, 10).join(", ")}${
                  allFailedKeys.length > 10
                    ? ` ... (共 ${allFailedKeys.length} 个)`
                    : ""
                }`
              : ""
          const errorMessages = errors
            .map((e) => `批次 ${e.index + 1}: ${e.error}`)
            .join("; ")
          toast({
            title: t("common.warning") || "警告",
            description: `部分批次翻译失败（已重试${MAX_RETRIES}次），已合并成功的结果。错误: ${errorMessages}${failedKeysText}`,
            variant: "destructive",
            duration: 10000, // 显示更长时间以便查看失败的key
          })
        }

        // 所有批次完成后，重建 JSON（即使有部分失败，也使用成功的结果）
        const rebuilt = rebuildTranslations(parsedSource, allTranslations)
        const pretty = JSON.stringify(rebuilt, null, 2)

        setResults((prev) => ({
          ...prev,
          [lang]: pretty,
        }))

        // 如果所有批次都成功，标记为完成；否则标记为部分完成
        const finalStatus =
          errors.length === 0
            ? "completed"
            : successBatches.length > 0
              ? "completed"
              : "failed"

        setJobs((prev) => ({
          ...prev,
          [lang]: {
            status: finalStatus,
            entryCount: payloadEntries.length,
            translatedCount: Object.keys(allTranslations).length,
            error:
              errors.length > 0
                ? `${errors.length} 个批次失败（已重试${MAX_RETRIES}次），${successBatches.length} 个批次成功`
                : undefined,
            failedKeys: allFailedKeys.length > 0 ? allFailedKeys : undefined,
          },
        }))
      } catch (error) {
        setJobs((prev) => ({
          ...prev,
          [lang]: {
            status: "failed",
            error: error instanceof Error ? error.message : String(error),
            entryCount: payloadEntries.length,
            translatedCount: 0,
          },
        }))
        toast({
          title: t("common.error"),
          description:
            error instanceof Error ? error.message : t("common.error"),
          variant: "destructive",
        })
      }
    }

    setIsTranslating(false)
  }, [
    flattenedEntries,
    options,
    parsedSource,
    sourceLanguage,
    t,
    targetLanguages,
    toast,
  ])

  const translationProgress = useMemo(() => {
    const total = targetLanguages.length || 1
    const completed = targetLanguages.filter(
      (lang) => jobs[lang]?.status === "completed"
    ).length
    const failed = targetLanguages.filter(
      (lang) => jobs[lang]?.status === "failed"
    ).length
    return {
      completed,
      failed,
      total,
      percentage: Math.round(((completed + failed) / total) * 100),
    }
  }, [jobs, targetLanguages])

  const activeEntries = useMemo(() => {
    if (!activeTarget) return []
    const lines = results[activeTarget]
    if (!lines) return []
    try {
      const parsed = JSON.parse(lines)
      return flattenJson(parsed)
    } catch {
      return []
    }
  }, [activeTarget, results])

  return (
    <div className="container mx-auto p-6 space-y-8">
      <header className="space-y-3">
        <Badge variant="outline" className="inline-flex items-center gap-2">
          <Languages className="h-3.5 w-3.5" />
          {t("tools.i18n-json-translator.workflow_badge")}
        </Badge>
        <h1 className="text-3xl font-bold">
          {t("tools.i18n-json-translator.name")}
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          {t("tools.i18n-json-translator.description")}
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {t("tools.i18n-json-translator.source_title")}
              </CardTitle>
              <CardDescription>
                {t("tools.i18n-json-translator.source_desc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="source-language">
                    {t("tools.i18n-json-translator.source_language")}
                  </Label>
                  <select
                    id="source-language"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={sourceLanguage}
                    onChange={(event) => setSourceLanguage(event.target.value)}
                  >
                    {sourceLanguages.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>
                    {t("tools.i18n-json-translator.target_languages")}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {targetLanguagePool.map((lang) => (
                      <button
                        key={lang.value}
                        type="button"
                        onClick={() => toggleLanguage(lang.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                          targetLanguages.includes(lang.value)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary"
                        )}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Textarea
                value={sourceText}
                onChange={(event) => setSourceText(event.target.value)}
                placeholder={t("tools.i18n-json-translator.source_placeholder")}
                className={getTextareaClasses("input", !inputError)}
              />
              {inputError && (
                <p className="text-sm text-destructive">{inputError}</p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button onClick={startTranslation} disabled={isTranslating}>
                  {isTranslating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("tools.i18n-json-translator.translate_button")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={formatSource}
                >
                  {t("common.format")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSourceText(DEFAULT_SAMPLE)}
                >
                  {t("tools.i18n-json-translator.sample_button")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetAll}
                  className="text-muted-foreground"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {t("common.clear")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {t("tools.i18n-json-translator.options_title")}
              </CardTitle>
              <CardDescription>
                {t("tools.i18n-json-translator.options_desc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">
                    {t("tools.i18n-json-translator.option_placeholders")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("tools.i18n-json-translator.option_placeholders_desc")}
                  </p>
                </div>
                <Switch
                  checked={options.preservePlaceholders}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({
                      ...prev,
                      preservePlaceholders: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">
                    {t("tools.i18n-json-translator.option_skip_short")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("tools.i18n-json-translator.option_skip_short_desc")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={options.skipShortValues}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({
                        ...prev,
                        skipShortValues: checked,
                      }))
                    }
                  />
                  <Input
                    type="number"
                    min={1}
                    className="w-16"
                    value={options.minLength}
                    onChange={(event) =>
                      setOptions((prev) => ({
                        ...prev,
                        minLength: Number(event.target.value) || 1,
                      }))
                    }
                    disabled={!options.skipShortValues}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">
                    {t("tools.i18n-json-translator.option_strip_html")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("tools.i18n-json-translator.option_strip_html_desc")}
                  </p>
                </div>
                <Switch
                  checked={options.skipHtml}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({ ...prev, skipHtml: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">
                    {t("tools.i18n-json-translator.option_include_keys")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("tools.i18n-json-translator.option_include_keys_desc")}
                  </p>
                </div>
                <Switch
                  checked={options.includeKeys}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({ ...prev, includeKeys: checked }))
                  }
                />
              </div>

              <div className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
                {t("tools.i18n-json-translator.entries_detected", {
                  count: flattenedEntries.length,
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                {t("tools.i18n-json-translator.progress_title")}
              </CardTitle>
              <CardDescription>
                {t("tools.i18n-json-translator.progress_desc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-semibold text-primary">
                    {translationProgress.completed}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("tools.i18n-json-translator.completed")}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-semibold">{translationProgress.failed}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("tools.i18n-json-translator.failed")}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-semibold">
                    {translationProgress.percentage}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("tools.i18n-json-translator.progress")}
                  </p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.language")}</TableHead>
                    <TableHead>{t("tools.i18n-json-translator.entries")}</TableHead>
                    <TableHead className="text-right">
                      {t("tools.i18n-json-translator.status")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {targetLanguages.map((lang) => {
                    const job = jobs[lang]
                    const total = job?.entryCount || 0
                    const translated = job?.translatedCount || 0
                    const progress = total > 0 ? (translated / total) * 100 : 0
                    const hasFailedKeys = job?.failedKeys && job.failedKeys.length > 0
                    
                    return (
                      <TableRow key={lang}>
                        <TableCell className="font-medium uppercase">
                          {lang}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="text-sm">
                              {job?.status === "translating" 
                                ? `${translated} / ${total}`
                                : job?.entryCount ?? "-"}
                            </div>
                            {job?.status === "translating" && (
                              <Progress value={progress} max={100} className="h-1.5" />
                            )}
                            {hasFailedKeys && (
                              <div className="mt-2 rounded-md border border-destructive/50 bg-destructive/5 p-2 text-xs">
                                <p className="font-medium text-destructive mb-1">
                                  失败的key ({job.failedKeys!.length} 个):
                                </p>
                                <p className="text-muted-foreground break-words">
                                  {job.failedKeys!.slice(0, 5).join(", ")}
                                  {job.failedKeys!.length > 5 && ` ... (还有 ${job.failedKeys!.length - 5} 个)`}
                                </p>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            {job?.status === "completed" && (
                              <span className="inline-flex items-center gap-1 text-sm text-green-600">
                                <CheckCircle2 className="h-4 w-4" />
                                {t("tools.i18n-json-translator.completed")}
                              </span>
                            )}
                            {job?.status === "failed" && (
                              <span className="inline-flex items-center gap-1 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                {t("tools.i18n-json-translator.failed")}
                              </span>
                            )}
                            {job?.status === "queued" && (
                              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t("tools.i18n-json-translator.queued")}
                              </span>
                            )}
                            {job?.status === "translating" && (
                              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t("tools.i18n-json-translator.translating")}
                              </span>
                            )}
                            {!job && (
                              <span className="text-sm text-muted-foreground">
                                -
                              </span>
                            )}
                            {job?.error && (
                              <p className="text-xs text-destructive mt-1 text-right max-w-xs">
                                {job.error}
                              </p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {targetLanguages.length === 0 && (
                  <Badge variant="secondary">
                    {t("tools.i18n-json-translator.select_language_tip")}
                  </Badge>
                )}
                {targetLanguages.map((lang) => (
                  <Button
                    key={lang}
                    variant={lang === activeTarget ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTarget(lang)}
                    disabled={!results[lang]}
                  >
                    {lang.toUpperCase()}
                  </Button>
                ))}
              </div>
              <CardTitle className="text-xl">
                {t("tools.i18n-json-translator.output_title")}
              </CardTitle>
              <CardDescription>
                {t("tools.i18n-json-translator.output_desc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeTarget && results[activeTarget] ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyResult(activeTarget)}
                    >
                      <Copy className="mr-2 h-3.5 w-3.5" />
                      {t("common.copy")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadResult(activeTarget)}
                    >
                      <Download className="mr-2 h-3.5 w-3.5" />
                      {t("common.download")}
                    </Button>
                  </div>

                  <Textarea
                    value={results[activeTarget]}
                    readOnly
                    className={getTextareaClasses("output")}
                  />

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("tools.i18n-json-translator.key_path")}</TableHead>
                          <TableHead>{t("tools.i18n-json-translator.preview")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeEntries.slice(0, 20).map((entry) => (
                          <TableRow key={entry.path}>
                            <TableCell className="font-mono text-xs">
                              {entry.path}
                            </TableCell>
                            <TableCell className="text-sm">
                              {entry.value}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {activeEntries.length > 20 && (
                      <p className="px-4 py-2 text-xs text-muted-foreground">
                        {t("tools.i18n-json-translator.preview_limit", {
                          count: activeEntries.length - 20,
                        })}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  {t("tools.i18n-json-translator.output_placeholder")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ToolSEOSection toolId="i18n-json-translator" />
    </div>
  )
}
