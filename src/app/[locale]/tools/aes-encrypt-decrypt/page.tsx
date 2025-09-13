"use client"

import { useState } from "react"
import { Copy, RotateCcw, Download, Key, Shield, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useTranslations } from 'next-intl';
import { BackToHome } from "@/components/back-to-home"
import { ToolSEOSection } from "@/components/seo/tool-seo-section"

export default function AesEncryptDecryptPage() {
  const t = useTranslations();

  const [input, setInput] = useState("")
  const [key, setKey] = useState("")
  const [iv, setIv] = useState("")
  const [mode, setMode] = useState("CBC")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [isValid, setIsValid] = useState(true)

  // 简化的AES加密实现（实际生产环境建议使用专业加密库）
  const encryptText = async () => {
    if (!input.trim() || !key.trim()) {
      setError(t("tools.aes-encrypt-decrypt.missing_input_key"))
      setOutput("")
      setIsValid(false)
      return
    }

    try {
      // 这里使用Web Crypto API进行AES加密
      const encoder = new TextEncoder()
      const decoder = new TextDecoder()
      
      // 生成密钥
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(key.padEnd(32, '0').slice(0, 32)),
        { name: 'AES-CBC' },
        false,
        ['encrypt']
      )

      // 生成或使用提供的IV
      let ivBytes
      if (iv.trim()) {
        ivBytes = encoder.encode(iv.padEnd(16, '0').slice(0, 16))
      } else {
        ivBytes = window.crypto.getRandomValues(new Uint8Array(16))
        setIv(decoder.decode(ivBytes))
      }

      // 加密
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-CBC', iv: ivBytes },
        keyMaterial,
        encoder.encode(input)
      )

      // 转换为Base64
      const encryptedArray = new Uint8Array(encrypted)
      const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray))
      
      setOutput(encryptedBase64)
      setError("")
      setIsValid(true)
    } catch {
      setError(t("common.error"))
      setOutput("")
      setIsValid(false)
    }
  }

  const decryptText = async () => {
    if (!input.trim() || !key.trim() || !iv.trim()) {
      setError(t("tools.aes-encrypt-decrypt.missing_input_key_iv"))
      setOutput("")
      setIsValid(false)
      return
    }

    try {
      const encoder = new TextEncoder()
      const decoder = new TextDecoder()
      
      // 生成密钥
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(key.padEnd(32, '0').slice(0, 32)),
        { name: 'AES-CBC' },
        false,
        ['decrypt']
      )

      // 获取IV
      const ivBytes = encoder.encode(iv.padEnd(16, '0').slice(0, 16))

      // 将Base64转换为ArrayBuffer
      const encryptedBytes = Uint8Array.from(atob(input), c => c.charCodeAt(0))

      // 解密
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-CBC', iv: ivBytes },
        keyMaterial,
        encryptedBytes
      )

      const decryptedText = decoder.decode(decrypted)
      setOutput(decryptedText)
      setError("")
      setIsValid(true)
    } catch {
      setError(t("tools.aes-encrypt-decrypt.decrypt_failed"))
      setOutput("")
      setIsValid(false)
    }
  }

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setKey(result)
  }

  const generateRandomIV = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setIv(result)
  }

  const copyToClipboard = async () => {
    if (output) {
      try {
        await navigator.clipboard.writeText(output)
      } catch {
        console.error("Failed to copy")
      }
    }
  }

  const clearAll = () => {
    setInput("")
    setKey("")
    setIv("")
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
      a.download = "aes-result.txt"
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
        <h1 className="text-3xl font-bold">{t("tools.aes-encrypt-decrypt.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.aes-encrypt-decrypt.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.aes-encrypt-decrypt.input_title")}</CardTitle>
            <CardDescription>
              {t("tools.aes-encrypt-decrypt.input_desc")}
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
              placeholder={t("tools.aes-encrypt-decrypt.input_placeholder")}
              className={cn(
                "min-h-[200px] font-mono text-sm",
                !isValid && "border-destructive"
              )}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="key">{t("tools.aes-encrypt-decrypt.key_label")}</Label>
                <Button onClick={generateRandomKey} variant="outline" size="sm">
                  <Key className="h-4 w-4 mr-1" />
                  {t("tools.aes-encrypt-decrypt.generate_key")}
                </Button>
              </div>
              <Input
                id="key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder={t("tools.aes-encrypt-decrypt.key_placeholder")}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="iv">{t("tools.aes-encrypt-decrypt.iv_label")}</Label>
                <Button onClick={generateRandomIV} variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-1" />
                  {t("tools.aes-encrypt-decrypt.generate_iv")}
                </Button>
              </div>
              <Input
                id="iv"
                value={iv}
                onChange={(e) => setIv(e.target.value)}
                placeholder={t("tools.aes-encrypt-decrypt.iv_placeholder")}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mode">{t("tools.aes-encrypt-decrypt.mode_label")}</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger>
                  <SelectValue placeholder={t("tools.aes-encrypt-decrypt.select_mode")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CBC">AES-CBC</SelectItem>
                  <SelectItem value="GCM">AES-GCM</SelectItem>
                  <SelectItem value="ECB">AES-ECB</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="text-destructive text-sm">{error}</div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={encryptText} className="flex-1">
                <ShieldCheck className="h-4 w-4 mr-2" />
                {t("tools.aes-encrypt-decrypt.encrypt")}
              </Button>
              <Button onClick={decryptText} variant="outline" className="flex-1">
                <Shield className="h-4 w-4 mr-2" />
                {t("tools.aes-encrypt-decrypt.decrypt")}
              </Button>
              <Button onClick={clearAll} variant="outline" size="icon">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("tools.aes-encrypt-decrypt.output_title")}</CardTitle>
            <CardDescription>
              {t("tools.aes-encrypt-decrypt.output_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={output}
              readOnly
              placeholder={t("tools.aes-encrypt-decrypt.output_placeholder")}
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
      
      <Card>
        <CardHeader>
          <CardTitle>{t("tools.aes-encrypt-decrypt.tips_title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• <strong>{t("tools.aes-encrypt-decrypt.tip1_title")}</strong>：{t("tools.aes-encrypt-decrypt.tip1_desc")}</p>
          <p>• <strong>{t("tools.aes-encrypt-decrypt.tip2_title")}</strong>：{t("tools.aes-encrypt-decrypt.tip2_desc")}</p>
          <p>• <strong>{t("tools.aes-encrypt-decrypt.tip3_title")}</strong>：{t("tools.aes-encrypt-decrypt.tip3_desc")}</p>
          <p>• <strong>{t("tools.aes-encrypt-decrypt.tip4_title")}</strong>：{t("tools.aes-encrypt-decrypt.tip4_desc")}</p>
        </CardContent>
      </Card>

      {/* SEO 优化内容 */}
      <ToolSEOSection toolId="aes-encrypt-decrypt" />
    </div>
  )
}