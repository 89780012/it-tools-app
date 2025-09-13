"use client"

import { useState } from "react"
import { Copy, RotateCcw, Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useTranslations } from 'next-intl';
import { BackToHome } from "@/components/back-to-home"
import { ToolSEOSection } from "@/components/seo/tool-seo-section"

export default function PasswordGeneratorPage() {
  const t = useTranslations();

  const [length, setLength] = useState(12)
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [includeLowercase, setIncludeLowercase] = useState(true)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeSymbols, setIncludeSymbols] = useState(true)
  const [excludeSimilar, setExcludeSimilar] = useState(false)
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false)
  const [password, setPassword] = useState("")
  const [strength, setStrength] = useState("")

  const generatePassword = () => {
    let charset = ""
    
    if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz"
    if (includeNumbers) charset += "0123456789"
    if (includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?"
    
    if (excludeSimilar) {
      charset = charset.replace(/[il1Lo0O]/g, "")
    }
    
    if (excludeAmbiguous) {
      charset = charset.replace(/[{}[\]()\/\\'"~,;<>.]/g, "")
    }

    if (!charset) {
      setPassword("")
      setStrength(t("tools.password-generator.no_charset"))
      return
    }

    let result = ""
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length))
    }

    setPassword(result)
    
    // 计算密码强度
    let strengthScore = 0
    if (result.length >= 8) strengthScore += 25
    if (result.length >= 12) strengthScore += 25
    if (/[a-z]/.test(result)) strengthScore += 10
    if (/[A-Z]/.test(result)) strengthScore += 10
    if (/[0-9]/.test(result)) strengthScore += 15
    if (/[^A-Za-z0-9]/.test(result)) strengthScore += 15
    
    if (strengthScore < 40) {
      setStrength(t("tools.password-generator.weak"))
    } else if (strengthScore < 70) {
      setStrength(t("tools.password-generator.medium"))
    } else {
      setStrength(t("tools.password-generator.strong"))
    }
  }

  const copyToClipboard = async () => {
    if (password) {
      try {
        await navigator.clipboard.writeText(password)
      } catch (err) {
        console.error("Failed to copy:", err)
      }
    }
  }

  const downloadPassword = () => {
    if (password) {
      const blob = new Blob([password], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "password.txt"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const clearAll = () => {
    setPassword("")
    setStrength("")
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackToHome />
      
      <div>
        <h1 className="text-3xl font-bold">{t("tools.password-generator.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.password-generator.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.password-generator.settings_title")}</CardTitle>
            <CardDescription>
              {t("tools.password-generator.settings_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="length">{t("tools.password-generator.length")}</Label>
              <Input
                id="length"
                type="number"
                min={4}
                max={128}
                value={length}
                onChange={(e) => setLength(parseInt(e.target.value) || 4)}
                className="w-full"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="uppercase">{t("tools.password-generator.uppercase")}</Label>
                <Switch
                  id="uppercase"
                  checked={includeUppercase}
                  onCheckedChange={setIncludeUppercase}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="lowercase">{t("tools.password-generator.lowercase")}</Label>
                <Switch
                  id="lowercase"
                  checked={includeLowercase}
                  onCheckedChange={setIncludeLowercase}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="numbers">{t("tools.password-generator.numbers")}</Label>
                <Switch
                  id="numbers"
                  checked={includeNumbers}
                  onCheckedChange={setIncludeNumbers}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="symbols">{t("tools.password-generator.symbols")}</Label>
                <Switch
                  id="symbols"
                  checked={includeSymbols}
                  onCheckedChange={setIncludeSymbols}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="excludeSimilar">{t("tools.password-generator.exclude_similar")}</Label>
                <Switch
                  id="excludeSimilar"
                  checked={excludeSimilar}
                  onCheckedChange={setExcludeSimilar}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="excludeAmbiguous">{t("tools.password-generator.exclude_ambiguous")}</Label>
                <Switch
                  id="excludeAmbiguous"
                  checked={excludeAmbiguous}
                  onCheckedChange={setExcludeAmbiguous}
                />
              </div>
            </div>

            <Button onClick={generatePassword} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t("tools.password-generator.generate")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("tools.password-generator.result_title")}</CardTitle>
            <CardDescription>
              {t("tools.password-generator.result_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={password}
              readOnly
              placeholder={t("tools.password-generator.result_placeholder")}
              className="min-h-[120px] font-mono text-sm bg-muted/50"
            />

            {strength && (
              <div className="text-sm">
                <span className="font-medium">{t("tools.password-generator.strength")}: </span>
                <span className={
                  strength === t("tools.password-generator.strong") ? "text-green-600" :
                  strength === t("tools.password-generator.medium") ? "text-yellow-600" :
                  "text-red-600"
                }>
                  {strength}
                </span>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={copyToClipboard} variant="outline" className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                {t("common.copy")}
              </Button>
              <Button onClick={downloadPassword} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                {t("common.download")}
              </Button>
              <Button onClick={clearAll} variant="outline" size="icon">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t("tools.password-generator.tips_title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• <strong>{t("tools.password-generator.tip1_title")}</strong>：{t("tools.password-generator.tip1_desc")}</p>
          <p>• <strong>{t("tools.password-generator.tip2_title")}</strong>：{t("tools.password-generator.tip2_desc")}</p>
          <p>• <strong>{t("tools.password-generator.tip3_title")}</strong>：{t("tools.password-generator.tip3_desc")}</p>
          <p>• <strong>{t("tools.password-generator.tip4_title")}</strong>：{t("tools.password-generator.tip4_desc")}</p>
        </CardContent>
      </Card>

      {/* SEO 优化内容 */}
      <ToolSEOSection toolId="password-generator" />
    </div>
  )
}