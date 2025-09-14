"use client"

import { useState } from "react"
import { Copy, RotateCcw, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useTranslations } from 'next-intl'
import { ToolSEOSection } from "@/components/seo/tool-seo-section"

export default function HexEncoderDecoderPage() {
  const t = useTranslations();

  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [isValid, setIsValid] = useState(true)

  const encodeToHex = () => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      setIsValid(true)
      return
    }

    try {
      const encoder = new TextEncoder()
      const bytes = encoder.encode(input)
      const hexString = Array.from(bytes, byte =>
        byte.toString(16).padStart(2, '0')
      ).join('')
      setOutput(hexString)
      setError("")
      setIsValid(true)
    } catch {
      setError(t("tools.hex-encoder-decoder.invalid_input"))
      setOutput("")
      setIsValid(false)
    }
  }

  const decodeFromHex = () => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      setIsValid(true)
      return
    }

    try {
      // Remove spaces and validate hex format
      const hexString = input.replace(/\s+/g, '')

      if (!/^[0-9a-fA-F]*$/.test(hexString)) {
        throw new Error("Invalid hex format")
      }

      if (hexString.length % 2 !== 0) {
        throw new Error("Hex string must have even length")
      }

      const bytes = new Uint8Array(hexString.length / 2)
      for (let i = 0; i < hexString.length; i += 2) {
        bytes[i / 2] = parseInt(hexString.substr(i, 2), 16)
      }

      const decoder = new TextDecoder('utf-8')
      const decodedString = decoder.decode(bytes)
      setOutput(decodedString)
      setError("")
      setIsValid(true)
    } catch {
      setError(t("tools.hex-encoder-decoder.invalid_hex"))
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
      a.download = "hex-result.txt"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("tools.hex-encoder-decoder.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.hex-encoder-decoder.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.hex-encoder-decoder.input_title")}</CardTitle>
            <CardDescription>
              {t("tools.hex-encoder-decoder.placeholder")}
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
              placeholder={t("tools.hex-encoder-decoder.placeholder")}
              className={cn(
                "min-h-[300px] font-mono text-sm",
                !isValid && "border-destructive"
              )}
            />

            {error && (
              <div className="text-destructive text-sm">{error}</div>
            )}

            <div className="flex gap-2">
              <Button onClick={encodeToHex} className="flex-1">
                {t("tools.hex-encoder-decoder.encode")}
              </Button>
              <Button onClick={decodeFromHex} variant="outline" className="flex-1">
                {t("tools.hex-encoder-decoder.decode")}
              </Button>
              <Button onClick={clearAll} variant="outline" size="icon">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("tools.hex-encoder-decoder.output_title")}</CardTitle>
            <CardDescription>
              {t("tools.hex-encoder-decoder.output_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={output}
              readOnly
              placeholder={t("tools.hex-encoder-decoder.output_placeholder")}
              className="min-h-[300px] font-mono text-sm bg-muted/50"
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
      <ToolSEOSection toolId="hex-encoder-decoder" />
    </div>
  )
}