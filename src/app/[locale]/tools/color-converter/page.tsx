"use client"

import { useState, useEffect } from "react"
import { Copy, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslations } from 'next-intl'
import { ToolSEOSection } from "@/components/seo/tool-seo-section"

interface ColorValues {
  hex: string
  rgb: string
  hsl: string
}

// 解析颜色输入
function parseColor(input: string): { r: number; g: number; b: number } | null {
  const trimmed = input.trim().toLowerCase()
  
  // HEX 格式 (#RGB 或 #RRGGBB)
  const hexMatch = trimmed.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/)
  if (hexMatch) {
    let hex = hexMatch[1]
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    }
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    }
  }
  
  // RGB 格式
  const rgbMatch = trimmed.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)$/)
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3])
    }
  }
  
  // HSL 格式
  const hslMatch = trimmed.match(/^hsla?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*[\d.]+\s*)?\)$/)
  if (hslMatch) {
    const h = parseFloat(hslMatch[1])
    const s = parseFloat(hslMatch[2])
    const l = parseFloat(hslMatch[3])
    return hslToRgb(h, s, l)
  }
  
  return null
}

// RGB 转 HEX
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? "0" + hex : hex
  }).join('').toUpperCase()
}

// RGB 转 HSL
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

// HSL 转 RGB
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = h / 360
  s = s / 100
  l = l / 100

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  }
}

export default function ColorConverterPage() {
  const t = useTranslations()

  const [input, setInput] = useState("")
  const [pickerColor, setPickerColor] = useState("#FF5733")
  const [colorValues, setColorValues] = useState<ColorValues | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!input.trim()) {
      setColorValues(null)
      setError("")
      return
    }

    const rgb = parseColor(input)
    if (!rgb) {
      setError(t("tools.color-converter.invalid_color"))
      setColorValues(null)
      return
    }

    const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)

    setColorValues({
      hex: hex,
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
    })
    setError("")
    
    // 同步更新颜色选择器
    setPickerColor(hex)
  }, [input, t])
  
  // 处理颜色选择器变化
  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value
    setPickerColor(hex)
    setInput(hex)
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
  }

  const clearAll = () => {
    setInput("")
    setColorValues(null)
    setError("")
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("tools.color-converter.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.color-converter.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 输入区域 */}
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.color-converter.input_title")}</CardTitle>
            <CardDescription>
              {t("tools.color-converter.input_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 颜色选择器 */}
            <div className="space-y-2">
              <Label>{t("tools.color-converter.color_preview")}</Label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={pickerColor}
                  onChange={handlePickerChange}
                  className="h-20 w-20 rounded-md cursor-pointer border-2 border-border"
                />
                <div className="flex-1 space-y-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t("tools.color-converter.input_placeholder")}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("tools.color-converter.tip2_desc")}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-destructive text-sm">{error}</div>
            )}

            <Button onClick={clearAll} variant="outline" className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              {t("common.clear")}
            </Button>
          </CardContent>
        </Card>

        {/* 输出区域 */}
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.color-converter.output_title")}</CardTitle>
            <CardDescription>
              {t("tools.color-converter.color_preview")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {colorValues ? (
              <>
                {/* 颜色预览 */}
                <div 
                  className="w-full h-32 rounded-md border-2 border-border shadow-sm"
                  style={{ backgroundColor: colorValues.hex }}
                />

                {/* 格式化结果 */}
                <div className="space-y-3">
                  {/* HEX */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {t("tools.color-converter.hex_format")}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={colorValues.hex}
                        readOnly
                        className="font-mono"
                      />
                      <Button
                        onClick={() => copyToClipboard(colorValues.hex)}
                        variant="outline"
                        size="icon"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* RGB */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {t("tools.color-converter.rgb_format")}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={colorValues.rgb}
                        readOnly
                        className="font-mono"
                      />
                      <Button
                        onClick={() => copyToClipboard(colorValues.rgb)}
                        variant="outline"
                        size="icon"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* HSL */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {t("tools.color-converter.hsl_format")}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={colorValues.hsl}
                        readOnly
                        className="font-mono"
                      />
                      <Button
                        onClick={() => copyToClipboard(colorValues.hsl)}
                        variant="outline"
                        size="icon"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                {t("tools.color-converter.input_placeholder")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SEO内容区域 */}
      <ToolSEOSection toolId="color-converter" />
    </div>
  )
}

