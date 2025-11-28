"use client"

import { useState, useCallback, useRef, useMemo } from "react"
import { useTranslations } from "next-intl"
import {
  Upload,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileDiff,
  X,
  Eye
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import JSZip from "jszip"
import { cn } from "@/lib/utils"
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'
import {
  flattenJsonWithOrder,
  detectDifferences,
  rebuildJson,
  extractSamples,
  generateFixReport,
  type JsonObject,
  type DiffResult,
  type DiffStats
} from "@/lib/json-key-fixer-utils"
import { ToolSEOSection } from "@/components/seo/tool-seo-section"
import { useToast } from "@/hooks/use-toast"

interface UploadedFile {
  id: string
  file: File
  content: JsonObject
  language: string
  languageConfidence: number
  isSource: boolean
}

interface FixTask {
  fileId: string
  fileName: string
  status: 'pending' | 'fixing' | 'translating' | 'completed' | 'failed'
  progress: number
  originalContent: JsonObject
  fixedContent?: JsonObject
  stats?: DiffStats
  translationStats?: {
    total: number
    completed: number
    failed: string[]
  }
  error?: string
}

export default function JsonKeyFixerPage() {
  const t = useTranslations()
  const { toast } = useToast()

  // 状态管理
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [sourceFileId, setSourceFileId] = useState<string | null>(null)
  const [diffResults, setDiffResults] = useState<Record<string, DiffResult>>({})
  const [fixTasks, setFixTasks] = useState<Record<string, FixTask>>({})
  const [selectedFileForDiff, setSelectedFileForDiff] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isFixing, setIsFixing] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // 修复选项
  const [fixOptions, setFixOptions] = useState({
    fixOrder: true,
    fillMissing: true,
    removeExtra: false
  })

  // 文件上传处理
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setIsUploading(true)
    const newFiles: UploadedFile[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // 验证文件类型
      if (!file.name.endsWith('.json')) {
        toast({
          title: "文件格式错误",
          description: `${file.name} 不是 JSON 文件`,
          variant: "destructive"
        })
        continue
      }

      try {
        // 读取文件内容
        const text = await file.text()
        const content = JSON.parse(text) as JsonObject

        // 提取示例文本进行语种检测
        const samples = extractSamples(content, 10)

        // 调用语种检测 API
        const response = await fetch('/api/detect-language', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ samples, fileName: file.name })
        })

        if (!response.ok) {
          throw new Error('语种检测失败')
        }

        const { language, confidence, languageName } = await response.json()

        newFiles.push({
          id: `${Date.now()}-${i}`,
          file,
          content,
          language: languageName || language,
          languageConfidence: confidence,
          isSource: false
        })
      } catch (error) {
        toast({
          title: "文件处理失败",
          description: `${file.name}: ${error instanceof Error ? error.message : '无效的JSON格式'}`,
          variant: "destructive"
        })
      }
    }

    setUploadedFiles(prev => [...prev, ...newFiles])
    setIsUploading(false)

    if (newFiles.length > 0) {
      toast({
        title: "上传成功",
        description: `已上传 ${newFiles.length} 个文件`
      })
    }
  }

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    handleFileUpload(e.dataTransfer.files)
  }

  // 删除文件
  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
    if (sourceFileId === fileId) {
      setSourceFileId(null)
    }
    if (selectedFileForDiff === fileId) {
      setSelectedFileForDiff(null)
    }
  }

  // 差异分析
  const analyzeDifferences = useCallback(() => {
    if (!sourceFileId) return

    const sourceFile = uploadedFiles.find(f => f.id === sourceFileId)
    if (!sourceFile) return

    const sourceFlat = flattenJsonWithOrder(sourceFile.content)
    const results: Record<string, DiffResult> = {}

    uploadedFiles.forEach(file => {
      if (file.id === sourceFileId) return

      const targetFlat = flattenJsonWithOrder(file.content)
      const diff = detectDifferences(sourceFlat, targetFlat)

      results[file.id] = {
        fileId: file.id,
        fileName: file.file.name,
        language: file.language,
        ...diff
      }
    })

    setDiffResults(results)
  }, [sourceFileId, uploadedFiles])

  // 当源文件改变时,重新分析差异
  useMemo(() => {
    analyzeDifferences()
  }, [analyzeDifferences])

  // 开始修复
  const startFix = async () => {
    if (!sourceFileId) {
      toast({
        title: "请选择源文件",
        description: "请先选择一个文件作为基准源文件",
        variant: "destructive"
      })
      return
    }

    const sourceFile = uploadedFiles.find(f => f.id === sourceFileId)
    if (!sourceFile) return

    setIsFixing(true)

    // 初始化修复任务
    const tasks: Record<string, FixTask> = {}
    Object.values(diffResults).forEach(diff => {
      tasks[diff.fileId] = {
        fileId: diff.fileId,
        fileName: diff.fileName,
        status: 'pending',
        progress: 0,
        originalContent: uploadedFiles.find(f => f.id === diff.fileId)!.content,
        stats: diff.stats
      }
    })
    setFixTasks(tasks)

    // 批量翻译配置
    const BATCH_SIZE = 50

    // 处理每个文件
    for (const fileId of Object.keys(tasks)) {
      const file = uploadedFiles.find(f => f.id === fileId)!
      const diff = diffResults[fileId]

      setFixTasks(prev => ({
        ...prev,
        [fileId]: { ...prev[fileId], status: 'fixing' }
      }))

      // 如果需要翻译缺失的 key
      const translations: Record<string, string> = {}
      if (fixOptions.fillMissing && diff.stats.missingKeys.length > 0) {
        setFixTasks(prev => ({
          ...prev,
          [fileId]: { ...prev[fileId], status: 'translating' }
        }))

        const sourceLanguage = detectLanguageCode(sourceFile.language)
        const targetLanguage = detectLanguageCode(file.language)

        // 准备翻译条目
        const sourceFlat = flattenJsonWithOrder(sourceFile.content)
        const entriesToTranslate = diff.stats.missingKeys.map(keyPath => {
          const sourceEntry = sourceFlat.find(e => e.path === keyPath)
          return {
            key: keyPath,
            value: sourceEntry?.value || ''
          }
        }).filter(e => e.value)

        // 批量翻译
        const totalBatches = Math.ceil(entriesToTranslate.length / BATCH_SIZE)
        const failedKeys: string[] = []

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
          const start = batchIndex * BATCH_SIZE
          const end = Math.min(start + BATCH_SIZE, entriesToTranslate.length)
          const batchEntries = entriesToTranslate.slice(start, end)

          try {
            const response = await fetch('/api/i18n-translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sourceLanguage,
                targetLanguage,
                entries: batchEntries,
                options: {
                  preservePlaceholders: true,
                  skipHtml: false
                }
              })
            })

            if (response.ok) {
              const data = await response.json()
              Object.assign(translations, data.translations || {})
            } else {
              batchEntries.forEach(e => failedKeys.push(e.key))
            }
          } catch {
            batchEntries.forEach(e => failedKeys.push(e.key))
          }

          // 更新进度
          setFixTasks(prev => ({
            ...prev,
            [fileId]: {
              ...prev[fileId],
              progress: Math.round(((batchIndex + 1) / totalBatches) * 100),
              translationStats: {
                total: entriesToTranslate.length,
                completed: Object.keys(translations).length,
                failed: failedKeys
              }
            }
          }))
        }
      }

      // 重构 JSON
      const fixedContent = rebuildJson(
        sourceFile.content,
        file.content,
        translations,
        { keepExtraKeys: !fixOptions.removeExtra }
      )

      setFixTasks(prev => ({
        ...prev,
        [fileId]: {
          ...prev[fileId],
          status: 'completed',
          progress: 100,
          fixedContent
        }
      }))
    }

    setIsFixing(false)
    toast({
      title: "修复完成",
      description: `已修复 ${Object.keys(tasks).length} 个文件`
    })
  }

  // 下载 ZIP
  const downloadZip = async () => {
    const sourceFile = uploadedFiles.find(f => f.id === sourceFileId)
    if (!sourceFile) return

    const zip = new JSZip()

    // 添加修复后的文件
    Object.values(fixTasks).forEach(task => {
      if (task.fixedContent) {
        zip.file(task.fileName, JSON.stringify(task.fixedContent, null, 2))
      }
    })

    // 生成修复报告
    const report = generateFixReport(
      Object.values(fixTasks),
      sourceFile.file.name
    )
    zip.file('README.md', report)

    // 生成并下载
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fixed-i18n-files.zip'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "下载成功",
      description: "修复文件已打包下载"
    })
  }

  // 辅助函数: 检测语言代码
  const detectLanguageCode = (languageName: string): string => {
    const map: Record<string, string> = {
      '简体中文': 'zh',
      'English': 'en',
      'Deutsch': 'de',
      '日本語': 'ja',
      '한국어': 'ko',
      'Español': 'es',
      'Français': 'fr',
      'हिन्दी': 'hi'
    }
    return map[languageName] || languageName.toLowerCase().slice(0, 2)
  }


  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <header className="space-y-3">
        <Badge variant="outline" className="inline-flex items-center gap-2">
          <FileDiff className="h-3.5 w-3.5" />
          {t("tools.json-key-fixer.badge")}
        </Badge>
        <h1 className="text-3xl font-bold">{t("tools.json-key-fixer.name")}</h1>
        <p className="text-muted-foreground max-w-3xl">
          {t("tools.json-key-fixer.description")}
        </p>
      </header>

      {/* 拖拽上传区 */}
      <Card>
        <CardContent className="pt-6">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              "hover:border-primary hover:bg-primary/5"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              {t("tools.json-key-fixer.drag_files")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("tools.json-key-fixer.supported_formats")}
            </p>
            {isUploading && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">正在处理文件...</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </CardContent>
      </Card>

      {/* 文件列表和统计 */}
      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧: 文件列表 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t("tools.json-key-fixer.files")} ({uploadedFiles.length})
              </CardTitle>
              <CardDescription>
                {t("tools.json-key-fixer.select_source_hint")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={sourceFileId || ''} onValueChange={setSourceFileId}>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {uploadedFiles.map(file => (
                    <div
                      key={file.id}
                      className={cn(
                        "flex items-center gap-3 p-3 border rounded-lg transition-colors",
                        sourceFileId === file.id && "border-primary bg-primary/5"
                      )}
                    >
                      <RadioGroupItem value={file.id} id={file.id} />
                      <Label htmlFor={file.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{file.file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {file.language} ({Math.round(file.languageConfidence * 100)}%)
                            </p>
                          </div>
                        </div>
                      </Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* 右侧: 差异统计 & 操作 */}
          <div className="space-y-6">
            {/* 每个文件的差异统计 */}
            {sourceFileId && Object.keys(diffResults).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("tools.json-key-fixer.stats")}</CardTitle>
                  <CardDescription>
                    每个文件相比源文件的差异统计
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {Object.values(diffResults).map(diff => (
                      <div
                        key={diff.fileId}
                        className="p-4 border rounded-lg space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{diff.fileName}</span>
                          </div>
                          <Badge variant="outline">{diff.language}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-2 border rounded bg-muted/50">
                            <p className="text-lg font-bold">{diff.stats.orderDiffCount}</p>
                            <p className="text-xs text-muted-foreground">顺序差异</p>
                          </div>
                          <div className="p-2 border rounded bg-muted/50">
                            <p className="text-lg font-bold text-orange-600">{diff.stats.missingKeys.length}</p>
                            <p className="text-xs text-muted-foreground">缺失key</p>
                          </div>
                          <div className="p-2 border rounded bg-muted/50">
                            <p className="text-lg font-bold text-blue-600">{diff.stats.extraKeys.length}</p>
                            <p className="text-xs text-muted-foreground">多余key</p>
                          </div>
                          <div className="p-2 border rounded bg-muted/50">
                            <p className="text-lg font-bold text-green-600">{diff.stats.matchRate}%</p>
                            <p className="text-xs text-muted-foreground">匹配率</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 修复选项和操作 */}
            {sourceFileId && (
              <Card>
                <CardHeader>
                  <CardTitle>修复选项</CardTitle>
                  <CardDescription>
                    配置修复行为
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 修复选项 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="fix-order" className="cursor-pointer">修复key顺序</Label>
                      <Switch
                        id="fix-order"
                        checked={fixOptions.fixOrder}
                        onCheckedChange={(checked) =>
                          setFixOptions(prev => ({ ...prev, fixOrder: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="fill-missing" className="cursor-pointer">
                        补全缺失key (AI翻译)
                      </Label>
                      <Switch
                        id="fill-missing"
                        checked={fixOptions.fillMissing}
                        onCheckedChange={(checked) =>
                          setFixOptions(prev => ({ ...prev, fillMissing: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="remove-extra" className="cursor-pointer">删除多余key</Label>
                      <Switch
                        id="remove-extra"
                        checked={fixOptions.removeExtra}
                        onCheckedChange={(checked) =>
                          setFixOptions(prev => ({ ...prev, removeExtra: checked }))
                        }
                      />
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={startFix}
                      disabled={isFixing || Object.keys(diffResults).length === 0}
                      className="flex-1"
                    >
                      {isFixing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          修复中...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          开始修复
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={downloadZip}
                      variant="outline"
                      disabled={Object.keys(fixTasks).length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      下载ZIP
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!sourceFileId && (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>选择一个源文件以查看统计信息</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* 修复进度 */}
      {Object.keys(fixTasks).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>修复进度</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {Object.values(fixTasks).map(task => (
                <div key={task.fileId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{task.fileName}</span>
                    <div className="flex items-center gap-2">
                      {task.status === 'completed' && task.fixedContent && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedFileForDiff(task.fileId)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t("tools.json-key-fixer.view_details")}
                        </Button>
                      )}
                      {task.status === 'completed' && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                      {task.status === 'failed' && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      {(task.status === 'translating' || task.status === 'fixing') && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                  </div>
                  <Progress value={task.progress} className="h-2" />
                  {task.translationStats && (
                    <p className="text-xs text-muted-foreground">
                      翻译: {task.translationStats.completed}/{task.translationStats.total}
                      {task.translationStats.failed.length > 0 && (
                        <span className="text-destructive ml-2">
                          ({task.translationStats.failed.length} 个失败)
                        </span>
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diff 查看弹框 */}
      <Dialog open={!!selectedFileForDiff} onOpenChange={(open: boolean) => !open && setSelectedFileForDiff(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDiff className="h-5 w-5" />
              {t("tools.json-key-fixer.diff_dialog_title")}
            </DialogTitle>
            <DialogDescription>
              {selectedFileForDiff && fixTasks[selectedFileForDiff] && (
                <>{t("tools.json-key-fixer.diff_dialog_description", { fileName: fixTasks[selectedFileForDiff].fileName })}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {selectedFileForDiff && fixTasks[selectedFileForDiff] && (
              <div className="space-y-4">
                {/* 统计信息卡片 */}
                {fixTasks[selectedFileForDiff].stats && (
                  <div className="grid grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-orange-600">
                          {fixTasks[selectedFileForDiff].stats.orderDiffCount}
                        </div>
                        <div className="text-xs text-muted-foreground">{t("tools.json-key-fixer.diff_stats_order")}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-red-600">
                          {fixTasks[selectedFileForDiff].stats.missingKeys.length}
                        </div>
                        <div className="text-xs text-muted-foreground">{t("tools.json-key-fixer.diff_stats_missing")}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-blue-600">
                          {fixTasks[selectedFileForDiff].stats.extraKeys.length}
                        </div>
                        <div className="text-xs text-muted-foreground">{t("tools.json-key-fixer.diff_stats_extra")}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-green-600">
                          {fixTasks[selectedFileForDiff].stats.matchRate}%
                        </div>
                        <div className="text-xs text-muted-foreground">{t("tools.json-key-fixer.diff_stats_match")}</div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Diff 视图 */}
                {fixTasks[selectedFileForDiff].fixedContent && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t("tools.json-key-fixer.diff_view_title")}</CardTitle>
                      <CardDescription>
                        {t("tools.json-key-fixer.diff_view_description")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="diff-viewer-wrapper" style={{ fontSize: '13px' }}>
                        <ReactDiffViewer
                          oldValue={JSON.stringify(fixTasks[selectedFileForDiff].originalContent, null, 2)}
                          newValue={JSON.stringify(fixTasks[selectedFileForDiff].fixedContent, null, 2)}
                          splitView={true}
                          compareMethod={DiffMethod.WORDS}
                          leftTitle={t("tools.json-key-fixer.diff_before")}
                          rightTitle={t("tools.json-key-fixer.diff_after")}
                          styles={{
                            variables: {
                              light: {
                                diffViewerBackground: '#fff',
                                diffViewerColor: '#212529',
                                addedBackground: '#e6ffed',
                                addedColor: '#24292e',
                                removedBackground: '#ffeef0',
                                removedColor: '#24292e',
                                wordAddedBackground: '#acf2bd',
                                wordRemovedBackground: '#fdb8c0',
                                addedGutterBackground: '#cdffd8',
                                removedGutterBackground: '#ffdce0',
                                gutterBackground: '#f6f8fa',
                                gutterBackgroundDark: '#f3f4f6',
                                highlightBackground: '#fffbdd',
                                highlightGutterBackground: '#fff5b1',
                              },
                              dark: {
                                diffViewerBackground: '#0d1117',
                                diffViewerColor: '#c9d1d9',
                                addedBackground: '#0d3a20',
                                addedColor: '#c9d1d9',
                                removedBackground: '#3d0c14',
                                removedColor: '#c9d1d9',
                                wordAddedBackground: '#1c6b3a',
                                wordRemovedBackground: '#6e1c28',
                                addedGutterBackground: '#0d3a20',
                                removedGutterBackground: '#3d0c14',
                                gutterBackground: '#161b22',
                                gutterBackgroundDark: '#0d1117',
                                highlightBackground: '#3d2c00',
                                highlightGutterBackground: '#3d2c00',
                              },
                            },
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* SEO 优化内容 */}
      <ToolSEOSection toolId="json-key-fixer" />
    </div>
  )
}
