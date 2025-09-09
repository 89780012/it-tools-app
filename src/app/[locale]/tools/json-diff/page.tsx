"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { ToolContainer } from "@/components/tool-container"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Upload, RotateCcw, GitCompare } from "lucide-react"
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'

export default function JsonDiffPage() {
  const t = useTranslations()
  const [leftInput, setLeftInput] = useState("")
  const [rightInput, setRightInput] = useState("")
  const [error, setError] = useState("")
  const [leftFormatted, setLeftFormatted] = useState("")
  const [rightFormatted, setRightFormatted] = useState("")
  const [splitView, setSplitView] = useState(true)

  // 执行对比
  const handleCompare = () => {
    setError("")
    
    if (!leftInput.trim() || !rightInput.trim()) {
      setError(t("tools.json-diff.errors.empty_input"))
      return
    }

    try {
      const left = JSON.parse(leftInput)
      const right = JSON.parse(rightInput)
      // 格式化JSON用于显示
      const leftStr = JSON.stringify(left, null, 2)
      const rightStr = JSON.stringify(right, null, 2)
      setLeftFormatted(leftStr)
      setRightFormatted(rightStr)
  
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t("tools.json-diff.errors.invalid_json")
      setError(errorMsg)
      setLeftFormatted("")
      setRightFormatted("")
    }
  }

  // 文件上传处理
  const handleFileUpload = (side: "left" | "right") => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (side === "left") {
        setLeftInput(content)
      } else {
        setRightInput(content)
      }
      // 重置文件输入框的值，允许重复选择同一文件
      event.target.value = ""
    }
    reader.readAsText(file)
  }

  // 清除所有内容
  const handleClear = () => {
    setLeftInput("")
    setRightInput("")
    setLeftFormatted("")
    setRightFormatted("")
    setError("")
  }

  return (
    <ToolContainer
      title={t("tools.json-diff.name")}
      description={t("tools.json-diff.description")}
    >
      <div className="space-y-6">
        {/* 显示模式切换 */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <Switch
              checked={splitView}
              onCheckedChange={setSplitView}
            />
            {splitView ? "并排显示" : "统一显示"}
          </label>
        </div>

        {/* 输入区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧输入 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                {t("tools.json-diff.original")}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".json,.txt"
                    onChange={handleFileUpload("left")}
                    className="hidden"
                    id="left-file-input"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("left-file-input")?.click()}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={leftInput}
                onChange={(e) => setLeftInput(e.target.value)}
                placeholder={t("tools.json-diff.left_placeholder")}
                className="min-h-[200px] font-mono text-sm"
              />
            </CardContent>
          </Card>

          {/* 右侧输入 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                {t("tools.json-diff.modified")}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".json,.txt"
                    onChange={handleFileUpload("right")}
                    className="hidden"
                    id="right-file-input"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("right-file-input")?.click()}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={rightInput}
                onChange={(e) => setRightInput(e.target.value)}
                placeholder={t("tools.json-diff.right_placeholder")}
                className="min-h-[200px] font-mono text-sm"
              />
            </CardContent>
          </Card>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleCompare} className="flex-1 sm:flex-none">
            <GitCompare className="h-4 w-4 mr-2" />
            {t("tools.json-diff.compare_button")}
          </Button>
         
          <Button variant="outline" onClick={handleClear}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {t("common.clear")}
          </Button>
        </div>

        {/* 错误显示 */}
        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
            {error}
          </div>
        )}

        {/* 差异对比显示区域 */}
        {leftFormatted && rightFormatted && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t("tools.json-diff.differences")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-hidden">
                <ReactDiffViewer
                  oldValue={leftFormatted}
                  newValue={rightFormatted}
                  splitView={splitView}
                  compareMethod={DiffMethod.WORDS}
                  hideLineNumbers={false}
                  showDiffOnly={false}
                  leftTitle={t("tools.json-diff.original")}
                  rightTitle={t("tools.json-diff.modified")}
                  styles={{
                    variables: {
                      light: {
                        codeFoldGutterBackground: '#f8f9fa',
                        codeFoldBackground: '#f1f3f4',
                        addedBackground: '#e6ffed',
                        addedColor: '#24292e',
                        removedBackground: '#ffeef0',
                        removedColor: '#24292e',
                        wordAddedBackground: '#acf2bd',
                        wordRemovedBackground: '#fdb8c0',
                        addedGutterBackground: '#cdffd8',
                        removedGutterBackground: '#fdbfb4',
                        gutterBackground: '#f6f8fa',
                        gutterBackgroundDark: '#f0f0f0',
                        highlightBackground: '#fffbdd',
                        highlightGutterBackground: '#fff5b1',
                        codeFoldContentColor: '#666',
                        diffViewerBackground: '#fff',
                        diffViewerColor: '#24292e',
                        emptyLineBackground: '#fafbfc',
                        gutterColor: '#636c76',
                      },
                      dark: {
                        codeFoldGutterBackground: '#2f2f2f',
                        codeFoldBackground: '#262626',
                        addedBackground: '#044317',
                        addedColor: '#e1e4e8',
                        removedBackground: '#67060c',
                        removedColor: '#e1e4e8',
                        wordAddedBackground: '#28a745',
                        wordRemovedBackground: '#d73a49',
                        addedGutterBackground: '#034e03',
                        removedGutterBackground: '#5a1f1f',
                        gutterBackground: '#2f363d',
                        gutterBackgroundDark: '#262c32',
                        highlightBackground: '#264f78',
                        highlightGutterBackground: '#2f4566',
                        codeFoldContentColor: '#c9d1d9',
                        diffViewerBackground: '#0d1117',
                        diffViewerColor: '#e1e4e8',
                        emptyLineBackground: '#21262d',
                        gutterColor: '#8b949e',
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolContainer>
  )
}