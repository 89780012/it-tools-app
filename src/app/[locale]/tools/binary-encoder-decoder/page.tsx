"use client"

import { useState } from "react"
import { Copy, RotateCcw, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn, getTextareaClasses } from "@/lib/utils"
import { useTranslations } from 'next-intl'
import { ToolSEOSection } from "@/components/seo/tool-seo-section"

export default function BinaryEncoderDecoderPage() {
  const t = useTranslations();

  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [isValid, setIsValid] = useState(true)

  const encodeToBinary = () => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      setIsValid(true)
      return
    }

    try {
      const binaryString = Array.from(input)
        .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
        .join(' ')
      setOutput(binaryString)
      setError("")
      setIsValid(true)
    } catch {
      setError(t("tools.binary-encoder-decoder.invalid_input"))
      setOutput("")
      setIsValid(false)
    }
  }

  const decodeFromBinary = () => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      setIsValid(true)
      return
    }

    try {
      const binaryString = input.replace(/\s+/g, '')
      
      if (!/^[01]*$/.test(binaryString)) {
        throw new Error("Invalid binary format")
      }
      
      if (binaryString.length % 8 !== 0) {
        throw new Error("Binary string length must be multiple of 8")
      }

      let decodedString = ''
      for (let i = 0; i < binaryString.length; i += 8) {
        const byte = binaryString.substr(i, 8)
        decodedString += String.fromCharCode(parseInt(byte, 2))
      }
      
      setOutput(decodedString)
      setError("")
      setIsValid(true)
    } catch {
      setError(t("tools.binary-encoder-decoder.invalid_binary"))
      setOutput("")
      setIsValid(false)
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
    setError("")
    setIsValid(true)
  }

  const downloadResult = () => {
    if (output) {
      const blob = new Blob([output], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "binary-result.txt"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("tools.binary-encoder-decoder.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.binary-encoder-decoder.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.binary-encoder-decoder.input_title")}</CardTitle>
            <CardDescription>
              {t("tools.binary-encoder-decoder.placeholder")}
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
              placeholder={t("tools.binary-encoder-decoder.placeholder")}
              className={getTextareaClasses('input', isValid)}
            />
            
            {error && (
              <div className="text-destructive text-sm">{error}</div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={encodeToBinary} className="flex-1">
                {t("tools.binary-encoder-decoder.encode")}
              </Button>
              <Button onClick={decodeFromBinary} variant="outline" className="flex-1">
                {t("tools.binary-encoder-decoder.decode")}
              </Button>
              <Button onClick={clearAll} variant="outline" size="icon">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("tools.binary-encoder-decoder.output_title")}</CardTitle>
            <CardDescription>
              {t("tools.binary-encoder-decoder.output_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={output}
              readOnly
              placeholder={t("tools.binary-encoder-decoder.output_placeholder")}
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
                onClick={downloadResult} 
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
      <ToolSEOSection toolId="binary-encoder-decoder" />
    </div>
  )
}