"use client"

import { useState, useEffect, useCallback } from "react"
import { Copy, RotateCcw, Download, BadgeCheck, AlertTriangle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useTranslations } from 'next-intl';
import { BackToHome } from "@/components/back-to-home"

interface JWTPayload {
  [key: string]: unknown
}

interface JWTHeader {
  alg?: string
  typ?: string
  [key: string]: unknown
}

interface DecodedJWT {
  header: JWTHeader
  payload: JWTPayload
  signature: string
  raw: {
    header: string
    payload: string
    signature: string
  }
}

export default function JwtDecoderPage() {
  const t = useTranslations();

  const [input, setInput] = useState("")
  const [decodedJWT, setDecodedJWT] = useState<DecodedJWT | null>(null)
  const [error, setError] = useState("")
  const [isValid, setIsValid] = useState(true)

  const decodeJWT = useCallback((token: string) => {
    if (!token.trim()) {
      setDecodedJWT(null)
      setError("")
      setIsValid(true)
      return
    }

    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        throw new Error(t("tools.jwt-decoder.invalid_format"))
      }

      const [headerPart, payloadPart, signaturePart] = parts

      // Base64URL解码
      const base64UrlDecode = (str: string) => {
        // 将Base64URL转换为Base64
        const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
        // 补齐缺失的填充
        const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)
        return atob(padded)
      }

      const header = JSON.parse(base64UrlDecode(headerPart))
      const payload = JSON.parse(base64UrlDecode(payloadPart))

      setDecodedJWT({
        header,
        payload,
        signature: signaturePart,
        raw: {
          header: headerPart,
          payload: payloadPart,
          signature: signaturePart
        }
      })
      setError("")
      setIsValid(true)
    } catch {
      setError(t("tools.jwt-decoder.decode_failed"))
      setDecodedJWT(null)
      setIsValid(false)
    }
  }, [t])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      decodeJWT(input)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [input, decodeJWT])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      console.error("Failed to copy")
    }
  }

  const clearAll = () => {
    setInput("")
    setDecodedJWT(null)
    setError("")
    setIsValid(true)
  }

  const downloadJSON = (data: Record<string, unknown>, filename: string) => {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleString()
  }

  const isTokenExpired = (exp?: number) => {
    if (!exp) return false
    return Date.now() / 1000 > exp
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackToHome />
      
      <div>
        <h1 className="text-3xl font-bold">{t("tools.jwt-decoder.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.jwt-decoder.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.jwt-decoder.input_title")}</CardTitle>
            <CardDescription>
              {t("tools.jwt-decoder.input_desc")}
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
              placeholder={t("tools.jwt-decoder.input_placeholder")}
              className={cn(
                "min-h-[300px] font-mono text-sm",
                !isValid && "border-destructive"
              )}
            />
            
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}

            {decodedJWT && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <BadgeCheck className="h-4 w-4" />
                {t("tools.jwt-decoder.valid_jwt")}
              </div>
            )}
            
            <Button onClick={clearAll} variant="outline" className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              {t("common.clear")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("tools.jwt-decoder.output_title")}</CardTitle>
            <CardDescription>
              {t("tools.jwt-decoder.output_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {decodedJWT ? (
              <div className="space-y-4">
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      {t("tools.jwt-decoder.header")}
                    </h4>
                    <div className="flex gap-1">
                      <Button 
                        onClick={() => copyToClipboard(JSON.stringify(decodedJWT.header, null, 2))}
                        variant="outline" 
                        size="sm"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button 
                        onClick={() => downloadJSON(decodedJWT.header, "jwt-header.json")}
                        variant="outline" 
                        size="sm"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded p-3 font-mono text-sm">
                    <pre>{JSON.stringify(decodedJWT.header, null, 2)}</pre>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {decodedJWT.header.alg && (
                      <Badge variant="secondary">ALG: {decodedJWT.header.alg}</Badge>
                    )}
                    {decodedJWT.header.typ && (
                      <Badge variant="secondary">TYP: {decodedJWT.header.typ}</Badge>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Payload */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4" />
                      {t("tools.jwt-decoder.payload")}
                    </h4>
                    <div className="flex gap-1">
                      <Button 
                        onClick={() => copyToClipboard(JSON.stringify(decodedJWT.payload, null, 2))}
                        variant="outline" 
                        size="sm"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button 
                        onClick={() => downloadJSON(decodedJWT.payload, "jwt-payload.json")}
                        variant="outline" 
                        size="sm"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded p-3 font-mono text-sm max-h-[200px] overflow-auto">
                    <pre>{JSON.stringify(decodedJWT.payload, null, 2)}</pre>
                  </div>

                  {/* 常见声明 */}
                  <div className="space-y-2 mt-2">
                    {decodedJWT.payload.iss && typeof decodedJWT.payload.iss === 'string' ? (
                      <div className="text-sm">
                        <span className="font-medium">{t("tools.jwt-decoder.issuer")}: </span>
                        <span className="text-muted-foreground">{String(decodedJWT.payload.iss)}</span>
                      </div>
                    ) : null}
                    {decodedJWT.payload.sub && typeof decodedJWT.payload.sub === 'string' && (
                      <div className="text-sm">
                        <span className="font-medium">{t("tools.jwt-decoder.subject")}: </span>
                        <span className="text-muted-foreground">{String(decodedJWT.payload.sub)}</span>
                      </div>
                    )}
                    {decodedJWT.payload.aud && typeof decodedJWT.payload.aud === 'string' && (
                      <div className="text-sm">
                        <span className="font-medium">{t("tools.jwt-decoder.audience")}: </span>
                        <span className="text-muted-foreground">{decodedJWT.payload.aud}</span>
                      </div>
                    )}
                    {decodedJWT.payload.iat && (
                      <div className="text-sm">
                        <span className="font-medium">{t("tools.jwt-decoder.issued_at")}: </span>
                        <span className="text-muted-foreground">{formatTimestamp(decodedJWT.payload.iat)}</span>
                      </div>
                    )}
                    {decodedJWT.payload.exp && (
                      <div className="text-sm">
                        <span className="font-medium">{t("tools.jwt-decoder.expires_at")}: </span>
                        <span className={`${isTokenExpired(decodedJWT.payload.exp) ? 'text-red-600' : 'text-muted-foreground'}`}>
                          {formatTimestamp(decodedJWT.payload.exp)}
                          {isTokenExpired(decodedJWT.payload.exp) && (
                            <Badge variant="destructive" className="ml-2 text-xs">{t("tools.jwt-decoder.expired")}</Badge>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Signature */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">{t("tools.jwt-decoder.signature")}</h4>
                    <Button 
                      onClick={() => copyToClipboard(decodedJWT.signature)}
                      variant="outline" 
                      size="sm"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="bg-muted/50 rounded p-3 font-mono text-sm break-all">
                    {decodedJWT.signature}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {t("tools.jwt-decoder.no_output")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t("tools.jwt-decoder.tips_title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• <strong>{t("tools.jwt-decoder.tip1_title")}</strong>：{t("tools.jwt-decoder.tip1_desc")}</p>
          <p>• <strong>{t("tools.jwt-decoder.tip2_title")}</strong>：{t("tools.jwt-decoder.tip2_desc")}</p>
          <p>• <strong>{t("tools.jwt-decoder.tip3_title")}</strong>：{t("tools.jwt-decoder.tip3_desc")}</p>
          <p>• <strong>{t("tools.jwt-decoder.tip4_title")}</strong>：{t("tools.jwt-decoder.tip4_desc")}</p>
        </CardContent>
      </Card>
    </div>
  )
}