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
  const [isProcessing, setIsProcessing] = useState(false)

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer)
    let binary = ""
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binary = atob(base64)
    const len = binary.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  const pemToArrayBuffer = (pem: string): ArrayBuffer => {
    const lines = pem.trim().split(/\r?\n/)
    const base64 = lines
      .filter((line) => !line.startsWith("-----"))
      .join("")
    return base64ToArrayBuffer(base64)
  }

  const exportKeyToPem = async (key: CryptoKey, type: "public" | "private"): Promise<string> => {
    const format = type === "public" ? "spki" : "pkcs8"
    const exported = await crypto.subtle.exportKey(format, key)
    const base64 = arrayBufferToBase64(exported)
    const chunkSize = 64
    const chunks = base64.match(new RegExp(`.{1,${chunkSize}}`, "g")) || []
    const body = chunks.join("\n")
    const header = type === "public" ? "-----BEGIN PUBLIC KEY-----" : "-----BEGIN PRIVATE KEY-----"
    const footer = type === "public" ? "-----END PUBLIC KEY-----" : "-----END PRIVATE KEY-----"
    return `${header}\n${body}\n${footer}`
  }

  const importRsaPublicKey = async (pem: string): Promise<CryptoKey> => {
    const keyData = pemToArrayBuffer(pem)
    return crypto.subtle.importKey(
      "spki",
      keyData,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["encrypt"]
    )
  }

  const importRsaPrivateKey = async (pem: string): Promise<CryptoKey> => {
    const keyData = pemToArrayBuffer(pem)
    return crypto.subtle.importKey(
      "pkcs8",
      keyData,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["decrypt"]
    )
  }

  const encryptData = async () => {
    if (!input.trim() || !publicKey.trim()) {
      setError(t("tools.rsa-encrypt-decrypt.missing_input_public_key"))
      setOutput("")
      setIsValid(false)
      return
    }

    if (typeof window === "undefined" || !window.crypto?.subtle) {
      setError(t("tools.rsa-encrypt-decrypt.encrypt_failed"))
      setOutput("")
      setIsValid(false)
      return
    }

    try {
      setIsProcessing(true)
      const key = await importRsaPublicKey(publicKey)
      const encoder = new TextEncoder()
      const data = encoder.encode(input)
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: "RSA-OAEP",
        },
        key,
        data
      )
      const encryptedBase64 = arrayBufferToBase64(encryptedBuffer)
      setOutput(encryptedBase64)
      setError("")
      setIsValid(true)
    } catch {
      setError(t("tools.rsa-encrypt-decrypt.encrypt_failed"))
      setOutput("")
      setIsValid(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const decryptData = async () => {
    if (!input.trim() || !privateKey.trim()) {
      setError(t("tools.rsa-encrypt-decrypt.missing_input_private_key"))
      setOutput("")
      setIsValid(false)
      return
    }

    if (typeof window === "undefined" || !window.crypto?.subtle) {
      setError(t("tools.rsa-encrypt-decrypt.decrypt_failed"))
      setOutput("")
      setIsValid(false)
      return
    }

    try {
      setIsProcessing(true)
      const key = await importRsaPrivateKey(privateKey)
      const encryptedBuffer = base64ToArrayBuffer(input.trim())
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: "RSA-OAEP",
        },
        key,
        encryptedBuffer
      )
      const decoder = new TextDecoder()
      const decryptedText = decoder.decode(decryptedBuffer)
      setOutput(decryptedText)
      setError("")
      setIsValid(true)
    } catch {
      setError(t("tools.rsa-encrypt-decrypt.decrypt_failed"))
      setOutput("")
      setIsValid(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const generateKeyPair = async () => {
    if (typeof window === "undefined" || !window.crypto?.subtle) {
      setError(t("tools.rsa-encrypt-decrypt.encrypt_failed"))
      return
    }

    try {
      setIsProcessing(true)
      const keyPair = await crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
      )

      const publicPem = await exportKeyToPem(keyPair.publicKey, "public")
      const privatePem = await exportKeyToPem(keyPair.privateKey, "private")

      setPublicKey(publicPem)
      setPrivateKey(privatePem)
      setError("")
    } catch {
      setError(t("tools.rsa-encrypt-decrypt.encrypt_failed"))
    } finally {
      setIsProcessing(false)
    }
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
            <Button onClick={generateKeyPair} className="w-full" disabled={isProcessing}>
              <KeyRound className="h-4 w-4 mr-2" />
              {isProcessing ? t("tools.rsa-encrypt-decrypt.generating") : t("tools.rsa-encrypt-decrypt.generate_keys")}
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
                <Button onClick={encryptData} className="flex-1" disabled={isProcessing}>
                  <Lock className="h-4 w-4 mr-2" />
                  {t("tools.rsa-encrypt-decrypt.encrypt")}
                </Button>
                <Button onClick={decryptData} variant="outline" className="flex-1" disabled={isProcessing}>
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