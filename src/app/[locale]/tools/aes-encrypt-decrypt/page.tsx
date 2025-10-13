"use client"

import { useState } from "react"
import { Copy, RotateCcw, Download, Key, Shield, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTextareaClasses } from "@/lib/utils"
import { useTranslations } from 'next-intl';
import { ToolSEOSection } from "@/components/seo/tool-seo-section"
import CryptoJS from 'crypto-js'

export default function AesEncryptDecryptPage() {
  const t = useTranslations();

  const [input, setInput] = useState("")
  const [key, setKey] = useState("")
  const [iv, setIv] = useState("")
  const [mode, setMode] = useState("CBC")
  const [padding, setPadding] = useState("PKCS7")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [isValid, setIsValid] = useState(true)

  // 获取填充模式
  const getPaddingMode = () => {
    switch (padding) {
      case "PKCS7":
        return CryptoJS.pad.Pkcs7
      case "ISO10126":
        return CryptoJS.pad.Iso10126
      case "ISO97971":
        return CryptoJS.pad.Iso97971
      case "ZeroPadding":
        return CryptoJS.pad.ZeroPadding
      case "NoPadding":
        return CryptoJS.pad.NoPadding
      case "AnsiX923":
        return CryptoJS.pad.AnsiX923
      default:
        return CryptoJS.pad.Pkcs7
    }
  }

  // AES加密实现（支持多种填充模式）
  const encryptText = () => {
    if (!input.trim() || !key.trim()) {
      setError(t("tools.aes-encrypt-decrypt.missing_input_key"))
      setOutput("")
      setIsValid(false)
      return
    }

    try {
      // 生成或使用提供的IV
      let ivValue = iv.trim()
      if (!ivValue) {
        // 生成随机 IV
        const randomIv = CryptoJS.lib.WordArray.random(16)
        ivValue = randomIv.toString(CryptoJS.enc.Utf8)
        setIv(ivValue)
      }

      // 使用 crypto-js 进行加密
      const encrypted = CryptoJS.AES.encrypt(input, CryptoJS.enc.Utf8.parse(key), {
        iv: CryptoJS.enc.Utf8.parse(ivValue),
        mode: CryptoJS.mode.CBC,
        padding: getPaddingMode()
      })

      setOutput(encrypted.toString())
      setError("")
      setIsValid(true)
    } catch (err) {
      console.error(err)
      setError(t("common.error"))
      setOutput("")
      setIsValid(false)
    }
  }

  const decryptText = () => {
    if (!input.trim() || !key.trim() || !iv.trim()) {
      setError(t("tools.aes-encrypt-decrypt.missing_input_key_iv"))
      setOutput("")
      setIsValid(false)
      return
    }

    try {
      // 使用 crypto-js 进行解密
      const decrypted = CryptoJS.AES.decrypt(input, CryptoJS.enc.Utf8.parse(key), {
        iv: CryptoJS.enc.Utf8.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: getPaddingMode()
      })

      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8)
      
      if (!decryptedText) {
        throw new Error("Decryption failed")
      }
      
      setOutput(decryptedText)
      setError("")
      setIsValid(true)
    } catch (err) {
      console.error(err)
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
              className={getTextareaClasses('input', isValid)}
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

            <div className="space-y-2">
              <Label htmlFor="padding">{t("tools.aes-encrypt-decrypt.padding_label")}</Label>
              <Select value={padding} onValueChange={setPadding}>
                <SelectTrigger>
                  <SelectValue placeholder={t("tools.aes-encrypt-decrypt.select_padding")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PKCS7">PKCS#7</SelectItem>
                  <SelectItem value="ISO10126">ISO 10126</SelectItem>
                  <SelectItem value="AnsiX923">ANSI X.923</SelectItem>
                  <SelectItem value="ISO97971">ISO/IEC 9797-1</SelectItem>
                  <SelectItem value="ZeroPadding">Zero Padding</SelectItem>
                  <SelectItem value="NoPadding">No Padding</SelectItem>
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
              className={getTextareaClasses('output')}
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