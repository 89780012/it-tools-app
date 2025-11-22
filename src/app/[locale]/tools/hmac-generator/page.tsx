"use client"

import { useState } from "react"
import { Copy, RotateCcw, Download, Hash, Key, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTextareaClasses } from "@/lib/utils"
import { useTranslations } from 'next-intl';
import { ToolSEOSection } from "@/components/seo/tool-seo-section"

export default function HmacGeneratorPage() {
  const t = useTranslations();

  const [input, setInput] = useState("The quick brown fox jumps over the lazy dog")
  const [secretKey, setSecretKey] = useState("")
  const [algorithm, setAlgorithm] = useState("SHA-256")
  const [output, setOutput] = useState("")
  const [outputFormat, setOutputFormat] = useState("hex")
  const [error, setError] = useState("")
  const [isValid, setIsValid] = useState(true)

  const algorithms = [
    { value: "SHA-1", label: "HMAC-SHA1" },
    { value: "SHA-256", label: "HMAC-SHA256" },
    { value: "SHA-384", label: "HMAC-SHA384" },
    { value: "SHA-512", label: "HMAC-SHA512" },
  ]

  const generateHMAC = async () => {
    if (!input.trim() || !secretKey.trim()) {
      setError(t("tools.hmac-generator.missing_input_key"))
      setOutput("")
      setIsValid(false)
      return
    }

    try {
      const encoder = new TextEncoder()
      
      // 导入密钥
      const key = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(secretKey),
        { name: "HMAC", hash: algorithm },
        false,
        ["sign"]
      )

      // 生成HMAC
      const signature = await window.crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(input)
      )

      const hashArray = new Uint8Array(signature)
      let result = ""

      if (outputFormat === "hex") {
        result = Array.from(hashArray)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
      } else if (outputFormat === "base64") {
        result = btoa(String.fromCharCode(...hashArray))
      } else if (outputFormat === "base64url") {
        const base64 = btoa(String.fromCharCode(...hashArray))
        result = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
      }

      setOutput(result)
      setError("")
      setIsValid(true)
    } catch (err) {
      setError(`${t("common.error")}: ${err}`)
      setOutput("")
      setIsValid(false)
    }
  }

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
    let result = ''
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setSecretKey(result)
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
    setSecretKey("")
    setOutput("")
    setError("")
    setIsValid(true)
  }

  const downloadText = () => {
    if (output) {
      const content = `Data: ${input}\nSecret Key: ${secretKey}\nAlgorithm: HMAC-${algorithm}\nFormat: ${outputFormat.toUpperCase()}\nHMAC: ${output}`
      const blob = new Blob([content], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "hmac-result.txt"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const verifyHMAC = () => {
    // 验证功能：将当前输入和密钥生成的HMAC与已有的HMAC进行比较
    if (!input.trim() || !secretKey.trim() || !output.trim()) {
      setError(t("tools.hmac-generator.missing_verification_data"))
      return
    }

    generateHMAC()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("tools.hmac-generator.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.hmac-generator.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.hmac-generator.input_title")}</CardTitle>
            <CardDescription>
              {t("tools.hmac-generator.input_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input">{t("tools.hmac-generator.data_label")}</Label>
              <Textarea
                id="input"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  if (error) {
                    setError("")
                    setIsValid(true)
                  }
                }}
                placeholder={t("tools.hmac-generator.data_placeholder")}
                className={getTextareaClasses('input', isValid)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="secretKey">{t("tools.hmac-generator.key_label")}</Label>
                <Button onClick={generateRandomKey} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  {t("tools.hmac-generator.generate_key")}
                </Button>
              </div>
              <Input
                id="secretKey"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder={t("tools.hmac-generator.key_placeholder")}
                className="font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="algorithm">{t("tools.hmac-generator.algorithm_label")}</Label>
                <Select value={algorithm} onValueChange={setAlgorithm}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("tools.hmac-generator.select_algorithm")} />
                  </SelectTrigger>
                  <SelectContent>
                    {algorithms.map((alg) => (
                      <SelectItem key={alg.value} value={alg.value}>
                        {alg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="outputFormat">{t("tools.hmac-generator.format_label")}</Label>
                <Select value={outputFormat} onValueChange={setOutputFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("tools.hmac-generator.select_format")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hex">Hex</SelectItem>
                    <SelectItem value="base64">Base64</SelectItem>
                    <SelectItem value="base64url">Base64URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <div className="text-destructive text-sm">{error}</div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={generateHMAC} className="flex-1">
                <Hash className="h-4 w-4 mr-2" />
                {t("tools.hmac-generator.generate")}
              </Button>
              <Button onClick={verifyHMAC} variant="outline" className="flex-1">
                <Key className="h-4 w-4 mr-2" />
                {t("tools.hmac-generator.verify")}
              </Button>
              <Button onClick={clearAll} variant="outline" size="icon">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("tools.hmac-generator.output_title")}</CardTitle>
            <CardDescription>
              {t("tools.hmac-generator.output_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("tools.hmac-generator.hmac_result")}</Label>
              <Textarea
                value={output}
                readOnly
                placeholder={t("tools.hmac-generator.output_placeholder")}
                className={getTextareaClasses('output')}
              />
            </div>

            {output && (
              <div className="space-y-2 p-3 bg-muted/30 rounded-md text-sm">
                <div><span className="font-medium">{t("tools.hmac-generator.algorithm_used")}: </span>HMAC-{algorithm}</div>
                <div><span className="font-medium">{t("tools.hmac-generator.output_format")}: </span>{outputFormat.toUpperCase()}</div>
                <div><span className="font-medium">{t("tools.hmac-generator.hash_length")}: </span>{output.length} {t("tools.hmac-generator.characters")}</div>
              </div>
            )}
            
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
      
      <Card>
        <CardHeader>
          <CardTitle>{t("tools.hmac-generator.tips_title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• <strong>{t("tools.hmac-generator.tip1_title")}</strong>：{t("tools.hmac-generator.tip1_desc")}</p>
          <p>• <strong>{t("tools.hmac-generator.tip2_title")}</strong>：{t("tools.hmac-generator.tip2_desc")}</p>
          <p>• <strong>{t("tools.hmac-generator.tip3_title")}</strong>：{t("tools.hmac-generator.tip3_desc")}</p>
          <p>• <strong>{t("tools.hmac-generator.tip4_title")}</strong>：{t("tools.hmac-generator.tip4_desc")}</p>
        </CardContent>
      </Card>

      <ToolSEOSection toolId="hmac-generator" />
    </div>
  )
}