"use client"

import { useState, useRef } from "react"
import { Copy, RotateCcw, Download, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { getTextareaClasses } from "@/lib/utils"
import { useTranslations } from 'next-intl';
import { ToolSEOSection } from "@/components/seo/tool-seo-section"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function Base64EncoderDecoderPage() {
  const t = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [input, setInput] = useState("Hello, ")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [isValid, setIsValid] = useState(true)
  const [batchMode, setBatchMode] = useState(false)

  const encodeText = () => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      setIsValid(true)
      return
    }

    try {
      if (batchMode) {
        // 批量模式：按行编码
        const lines = input.split('\n')
        const encodedLines = lines.map(line => {
          if (!line.trim()) return line
          try {
            return btoa(unescape(encodeURIComponent(line)))
          } catch {
            return `[${t("common.error")}] ${line}`
          }
        })
        setOutput(encodedLines.join('\n'))
      } else {
        // 单行模式
        const encoded = btoa(unescape(encodeURIComponent(input)))
        setOutput(encoded)
      }
      setError("")
      setIsValid(true)
    } catch (err) {
      setError(`${t("common.error")}: ${err}`)
      setOutput("")
      setIsValid(false)
    }
  }

  const decodeText = () => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      setIsValid(true)
      return
    }

    try {
      if (batchMode) {
        // 批量模式：按行解码
        const lines = input.split('\n')
        const decodedLines = lines.map(line => {
          if (!line.trim()) return line
          try {
            return decodeURIComponent(escape(atob(line.trim())))
          } catch {
            return `[${t("common.error")}] ${line}`
          }
        })
        setOutput(decodedLines.join('\n'))
      } else {
        // 单行模式
        const decoded = decodeURIComponent(escape(atob(input)))
        setOutput(decoded)
      }
      setError("")
      setIsValid(true)
    } catch {
      setError(t("tools.base64-encoder-decoder.invalid_base64"))
      setOutput("")
      setIsValid(false)
    }
  }

  const copyToClipboard = async () => {
    if (output) {
      try {
        await navigator.clipboard.writeText(output)
      } catch (err) {
        console.error("Failed to copy:", err)
      }
    }
  }

  const clearAll = () => {
    setInput("")
    setOutput("")
    setError("")
    setIsValid(true)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 检查文件类型
    if (!file.name.endsWith('.txt')) {
      setError(t("tools.base64-encoder-decoder.file_type_error"))
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setInput(content)
      setError("")
      setIsValid(true)

      // 如果是批量模式，自动检测是否需要编解码
      if (batchMode) {
        // 检查第一行是否是 Base64 格式
        const firstLine = content.split('\n')[0]?.trim()
        if (firstLine && /^[A-Za-z0-9+/]+=*$/.test(firstLine)) {
          // 看起来是 Base64，自动解码
          setTimeout(() => decodeText(), 100)
        } else {
          // 看起来是普通文本，自动编码
          setTimeout(() => encodeText(), 100)
        }
      }
    }
    reader.onerror = () => {
      setError(t("tools.base64-encoder-decoder.file_read_error"))
    }
    reader.readAsText(file)

    // 重置文件输入，允许重复上传同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  const downloadText = () => {
    if (output) {
      const blob = new Blob([output], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "base64-result.txt"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">

      <div>
        <h1 className="text-3xl font-bold">{t("tools.base64-encoder-decoder.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.base64-encoder-decoder.description")}
        </p>
      </div>

      {/* 批量模式切换 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="batch-mode" className="text-base">
                {t("tools.base64-encoder-decoder.batch_mode")}
              </Label>
              <div className="text-sm text-muted-foreground">
                {t("tools.base64-encoder-decoder.batch_mode_desc")}
              </div>
            </div>
            <Switch
              id="batch-mode"
              checked={batchMode}
              onCheckedChange={setBatchMode}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.base64-encoder-decoder.input_title")}</CardTitle>
            <CardDescription>
              {batchMode
                ? t("tools.base64-encoder-decoder.batch_placeholder")
                : t("tools.base64-encoder-decoder.placeholder")}
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
              placeholder={batchMode
                ? t("tools.base64-encoder-decoder.batch_placeholder")
                : t("tools.base64-encoder-decoder.placeholder")}
              className={getTextareaClasses('input', isValid)}
              rows={12}
            />

            {error && (
              <div className="text-destructive text-sm">{error}</div>
            )}

            {/* 隐藏的文件输入 */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="flex flex-wrap gap-2">
              <Button onClick={encodeText} className="flex-1 min-w-[100px]">
                {t("tools.base64-encoder-decoder.encode")}
              </Button>
              <Button onClick={decodeText} variant="outline" className="flex-1 min-w-[100px]">
                {t("tools.base64-encoder-decoder.decode")}
              </Button>
              <Button onClick={triggerFileUpload} variant="outline" size="icon" title={t("tools.base64-encoder-decoder.upload_file")}>
                <Upload className="h-4 w-4" />
              </Button>
              <Button onClick={clearAll} variant="outline" size="icon" title={t("common.clear")}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("tools.base64-encoder-decoder.output_title")}</CardTitle>
            <CardDescription>
              {t("tools.base64-encoder-decoder.output_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={output}
              readOnly
              placeholder={t("tools.base64-encoder-decoder.output_placeholder")}
              className={getTextareaClasses('output')}
              rows={12}
            />

            <div className="flex gap-2">
              <Button onClick={copyToClipboard} variant="outline" className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                {t("common.copy")}
              </Button>
              <Button onClick={downloadText} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                {t("common.download")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEO 优化内容 */}
      <ToolSEOSection toolId="base64-encoder-decoder" />
    </div>
  )
}