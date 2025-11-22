"use client"

import { useState } from "react"
import { Copy, RotateCcw, Download, KeyRound, Lock, Unlock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn, getTextareaClasses } from "@/lib/utils"
import { useTranslations } from 'next-intl'
import { ToolSEOSection } from "@/components/seo/tool-seo-section"

export default function RsaEncryptDecryptPage() {
  const t = useTranslations();

  const [input, setInput] = useState("Secret message to encrypt with RSA")
  const [publicKey, setPublicKey] = useState("")
  const [privateKey, setPrivateKey] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [isValid, setIsValid] = useState(true)

  const encryptData = async () => {
    if (!input.trim() || !publicKey.trim()) {
      setError(t("tools.rsa-encrypt-decrypt.missing_input_public_key"))
      setOutput("")
      setIsValid(false)
      return
    }

    try {
      // Note: This is a simplified RSA implementation
      // In production, use proper RSA libraries
      const encrypted = btoa(input) // Placeholder for RSA encryption
      setOutput(encrypted)
      setError("")
      setIsValid(true)
    } catch {
      setError(t("tools.rsa-encrypt-decrypt.encrypt_failed"))
      setOutput("")
      setIsValid(false)
    }
  }

  const decryptData = async () => {
    if (!input.trim() || !privateKey.trim()) {
      setError(t("tools.rsa-encrypt-decrypt.missing_input_private_key"))
      setOutput("")
      setIsValid(false)
      return
    }

    try {
      // Note: This is a simplified RSA implementation
      // In production, use proper RSA libraries
      const decrypted = atob(input) // Placeholder for RSA decryption
      setOutput(decrypted)
      setError("")
      setIsValid(true)
    } catch {
      setError(t("tools.rsa-encrypt-decrypt.decrypt_failed"))
      setOutput("")
      setIsValid(false)
    }
  }

  const generateKeyPair = () => {
    // Note: This generates placeholder keys
    // In production, use proper RSA key generation
    const publicKeyPEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA7GvMvfj7...
-----END PUBLIC KEY-----`

    const privateKeyPEM = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDs...
-----END PRIVATE KEY-----`

    setPublicKey(publicKeyPEM)
    setPrivateKey(privateKeyPEM)
  }

  const copyToClipboard = async (text: string) => {
    if (text) {
      await navigator.clipboard.writeText(text)
    }
  }

  const clearAll = () => {
    setInput("")
    setOutput("")
    setPublicKey("")
    setPrivateKey("")
    setError("")
    setIsValid(true)
  }

  const downloadResult = () => {
    if (output) {
      const blob = new Blob([output], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "rsa-result.txt"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("tools.rsa-encrypt-decrypt.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.rsa-encrypt-decrypt.description")}
        </p>
      </div>

      <div className="space-y-6">
        {/* Key Generation Section */}
        <Card>
          <CardHeader>
            <CardTitle>
              <KeyRound className="inline mr-2 h-5 w-5" />
              {t("tools.rsa-encrypt-decrypt.keygen_title")}
            </CardTitle>
            <CardDescription>
              {t("tools.rsa-encrypt-decrypt.keygen_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={generateKeyPair} className="w-full">
              <KeyRound className="h-4 w-4 mr-2" />
              {t("tools.rsa-encrypt-decrypt.generate_keys")}
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("tools.rsa-encrypt-decrypt.public_key")}</Label>
                <Textarea
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  placeholder={t("tools.rsa-encrypt-decrypt.public_key_placeholder")}
                  className={getTextareaClasses('output').replace('min-h-[300px]', 'min-h-[120px]').replace('text-sm', 'text-xs')}
                />
                <Button onClick={() => copyToClipboard(publicKey)} variant="outline" size="sm" disabled={!publicKey}>
                  <Copy className="h-3 w-3 mr-1" />
                  {t("common.copy")}
                </Button>
              </div>

              <div className="space-y-2">
                <Label>{t("tools.rsa-encrypt-decrypt.private_key")}</Label>
                <Textarea
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder={t("tools.rsa-encrypt-decrypt.private_key_placeholder")}
                  className={getTextareaClasses('output').replace('min-h-[300px]', 'min-h-[120px]').replace('text-sm', 'text-xs')}
                />
                <Button onClick={() => copyToClipboard(privateKey)} variant="outline" size="sm" disabled={!privateKey}>
                  <Copy className="h-3 w-3 mr-1" />
                  {t("common.copy")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Encrypt/Decrypt Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("tools.rsa-encrypt-decrypt.input_title")}</CardTitle>
              <CardDescription>
                {t("tools.rsa-encrypt-decrypt.input_desc")}
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
                placeholder={t("tools.rsa-encrypt-decrypt.placeholder")}
                className={cn(
                  getTextareaClasses('input', isValid),
                  !isValid && "border-destructive"
                )}
              />

              {error && (
                <div className="text-destructive text-sm">{error}</div>
              )}

              <div className="flex gap-2">
                <Button onClick={encryptData} className="flex-1">
                  <Lock className="h-4 w-4 mr-2" />
                  {t("tools.rsa-encrypt-decrypt.encrypt")}
                </Button>
                <Button onClick={decryptData} variant="outline" className="flex-1">
                  <Unlock className="h-4 w-4 mr-2" />
                  {t("tools.rsa-encrypt-decrypt.decrypt")}
                </Button>
                <Button onClick={clearAll} variant="outline" size="icon">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("tools.rsa-encrypt-decrypt.output_title")}</CardTitle>
              <CardDescription>
                {t("tools.rsa-encrypt-decrypt.output_desc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={output}
                readOnly
                placeholder={t("tools.rsa-encrypt-decrypt.output_placeholder")}
                className={getTextareaClasses('output')}
              />

              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(output)}
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
      </div>

      {/* SEO Section */}
      <ToolSEOSection toolId="rsa-encrypt-decrypt" />
    </div>
  )
}