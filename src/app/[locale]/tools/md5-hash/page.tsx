"use client"

import { useState } from "react"
import { Copy, RotateCcw, Download, Hash } from "lucide-react"
import { getTextareaClasses } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useTranslations } from 'next-intl'
import { ToolSEOSection } from "@/components/seo/tool-seo-section"
import CryptoJS from 'crypto-js'

export default function MD5HashPage() {
  const t = useTranslations();

  const [input, setInput] = useState("The quick brown fox jumps over the lazy dog")
  const [output, setOutput] = useState("")

  const generateMD5 = async () => {
    if (!input.trim()) {
      setOutput("")
      return
    }

    try {
      // MD5 implementation using crypto-js algorithm
      const md5Hash = CryptoJS.MD5(input).toString()
      setOutput(md5Hash)
    } catch (error) {
      console.error('MD5 generation failed:', error)
      setOutput("")
    }
  }


  const copyToClipboard = async () => {
    if (output) {
      await navigator.clipboard.writeText(output)
    }
  }

  const clearAll = () => {
    setInput("")
    setOutput("")
  }

  const downloadHash = () => {
    if (output) {
      const blob = new Blob([output], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "md5-hash.txt"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("tools.md5-hash.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.md5-hash.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.md5-hash.input_title")}</CardTitle>
            <CardDescription>
              {t("tools.md5-hash.placeholder")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                generateMD5()
              }}
              placeholder={t("tools.md5-hash.placeholder")}
              className={getTextareaClasses('input')}
            />
            
            <div className="flex gap-2">
              <Button onClick={generateMD5} className="flex-1">
                <Hash className="h-4 w-4 mr-2" />
                {t("common.generate")}
              </Button>
              <Button onClick={clearAll} variant="outline" size="icon">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("tools.md5-hash.output_title")}</CardTitle>
            <CardDescription>
              {t("tools.md5-hash.output_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={output}
              readOnly
              placeholder={t("tools.md5-hash.output_placeholder")}
              className={getTextareaClasses('output')}
            />
            
            <div className="flex gap-2">
              <Button 
                onClick={copyToClipboard} 
                variant="outline" 
                disabled={!output}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                {t("common.copy")}
              </Button>
              <Button 
                onClick={downloadHash} 
                variant="outline" 
                disabled={!output}
                size="icon"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEO 优化内容 */}
      <ToolSEOSection toolId="md5-hash" />
    </div>
  )
}