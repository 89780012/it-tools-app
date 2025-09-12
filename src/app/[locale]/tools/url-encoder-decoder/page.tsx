"use client"

import { useState } from "react"
import { Copy, RotateCcw, Download, Link2, Unlink2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useTranslations } from 'next-intl';
import { BackToHome } from "@/components/back-to-home"

export default function UrlEncoderDecoderPage() {
  const t = useTranslations();

  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [isValid, setIsValid] = useState(true)

  const encodeUrl = () => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      setIsValid(true)
      return
    }

    try {
      const encoded = encodeURIComponent(input)
      setOutput(encoded)
      setError("")
      setIsValid(true)
    } catch (err) {
      setError(`${t("common.error")}: ${err}`)
      setOutput("")
      setIsValid(false)
    }
  }

  const decodeUrl = () => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      setIsValid(true)
      return
    }

    try {
      const decoded = decodeURIComponent(input)
      setOutput(decoded)
      setError("")
      setIsValid(true)
    } catch {
      setError(t("tools.url-encoder-decoder.invalid_url"))
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

  const downloadText = () => {
    if (output) {
      const blob = new Blob([output], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "url-result.txt"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackToHome />
      
      <div>
        <h1 className="text-3xl font-bold">{t("tools.url-encoder-decoder.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.url-encoder-decoder.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.url-encoder-decoder.input_title")}</CardTitle>
            <CardDescription>
              {t("tools.url-encoder-decoder.placeholder")}
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
              placeholder={t("tools.url-encoder-decoder.placeholder")}
              className={cn(
                "min-h-[300px] font-mono text-sm",
                !isValid && "border-destructive"
              )}
            />
            
            {error && (
              <div className="text-destructive text-sm">{error}</div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={encodeUrl} className="flex-1">
                <Link2 className="h-4 w-4 mr-2" />
                {t("tools.url-encoder-decoder.encode")}
              </Button>
              <Button onClick={decodeUrl} variant="outline" className="flex-1">
                <Unlink2 className="h-4 w-4 mr-2" />
                {t("tools.url-encoder-decoder.decode")}
              </Button>
              <Button onClick={clearAll} variant="outline" size="icon">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("tools.url-encoder-decoder.output_title")}</CardTitle>
            <CardDescription>
              {t("tools.url-encoder-decoder.output_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={output}
              readOnly
              placeholder={t("tools.url-encoder-decoder.output_placeholder")}
              className="min-h-[300px] font-mono text-sm bg-muted/50"
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• <strong>编码</strong>：将特殊字符转换为 URL 安全格式（%编码）</p>
            <p>• <strong>解码</strong>：将 URL 编码字符串还原为原始文本</p>
            <p>• 使用 encodeURIComponent / decodeURIComponent 标准</p>
            <p>• 适用于 URL 参数、表单数据、AJAX 请求等场景</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>常见编码示例</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <div className="font-mono space-y-1">
              <p><span className="text-primary">空格</span> → %20</p>
              <p><span className="text-primary">中文</span> → %E4%B8%AD%E6%96%87</p>
              <p><span className="text-primary">&</span> → %26</p>
              <p><span className="text-primary">=</span> → %3D</p>
              <p><span className="text-primary">?</span> → %3F</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}