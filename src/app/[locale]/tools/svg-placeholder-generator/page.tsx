"use client"

import { useState } from "react"
import { Copy, Download, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useTranslations } from 'next-intl'
import { ToolSEOSection } from "@/components/seo/tool-seo-section"

type TemplateType = 'simple' | 'gradient' | 'grid' | 'dots' | 'lines'

export default function SVGPlaceholderGeneratorPage() {
  const t = useTranslations()

  const [width, setWidth] = useState(400)
  const [height, setHeight] = useState(300)
  const [text, setText] = useState("")
  const [bgColor, setBgColor] = useState("#CCCCCC")
  const [textColor, setTextColor] = useState("#333333")
  const [fontSize, setFontSize] = useState([24])
  const [template, setTemplate] = useState<TemplateType>('simple')

  // 生成显示文本
  const getDisplayText = () => {
    if (text.trim()) {
      return text.replace(/\{width\}/g, width.toString()).replace(/\{height\}/g, height.toString())
    }
    return t("tools.svg-placeholder-generator.default_text", { width, height })
  }

  // 生成SVG内容
  const generateSVG = () => {
    const displayText = getDisplayText()
    const centerX = width / 2
    const centerY = height / 2
    const currentFontSize = fontSize[0]

    let backgroundPattern = ""
    let extraDefs = ""

    // 根据模板生成不同的背景
    switch (template) {
      case 'gradient':
        extraDefs = `
          <defs>
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${adjustColor(bgColor, -30)};stop-opacity:1" />
            </linearGradient>
          </defs>
        `
        backgroundPattern = `fill="url(#bgGradient)"`
        break
      
      case 'grid':
        const gridSize = 20
        extraDefs = `
          <defs>
            <pattern id="grid" width="${gridSize}" height="${gridSize}" patternUnits="userSpaceOnUse">
              <path d="M ${gridSize} 0 L 0 0 0 ${gridSize}" fill="none" stroke="${adjustColor(bgColor, -40)}" stroke-width="1"/>
            </pattern>
          </defs>
        `
        backgroundPattern = `fill="${bgColor}"`
        break
      
      case 'dots':
        extraDefs = `
          <defs>
            <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="2" fill="${adjustColor(bgColor, -40)}"/>
            </pattern>
          </defs>
        `
        backgroundPattern = `fill="${bgColor}"`
        break
      
      case 'lines':
        extraDefs = `
          <defs>
            <pattern id="lines" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="10" x2="20" y2="10" stroke="${adjustColor(bgColor, -40)}" stroke-width="1"/>
            </pattern>
          </defs>
        `
        backgroundPattern = `fill="${bgColor}"`
        break
      
      default: // simple
        backgroundPattern = `fill="${bgColor}"`
        break
    }

    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  ${extraDefs}
  <rect width="100%" height="100%" ${backgroundPattern}/>
  ${template === 'grid' ? `<rect width="100%" height="100%" fill="url(#grid)"/>` : ''}
  ${template === 'dots' ? `<rect width="100%" height="100%" fill="url(#dots)"/>` : ''}
  ${template === 'lines' ? `<rect width="100%" height="100%" fill="url(#lines)"/>` : ''}
  <text x="${centerX}" y="${centerY}" 
        font-family="Arial, sans-serif" 
        font-size="${currentFontSize}" 
        fill="${textColor}" 
        text-anchor="middle" 
        dominant-baseline="middle">${displayText}</text>
</svg>`
  }

  // 颜色调整工具函数
  const adjustColor = (color: string, amount: number) => {
    const num = parseInt(color.replace("#", ""), 16)
    const amt = Math.round(2.55 * amount)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
  }

  const copySVG = async () => {
    try {
      await navigator.clipboard.writeText(generateSVG())
    } catch (error) {
      console.error('Failed to copy SVG:', error)
    }
  }

  const downloadSVG = () => {
    const svgContent = generateSVG()
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `placeholder-${width}x${height}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("tools.svg-placeholder-generator.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.svg-placeholder-generator.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 配置面板 */}
        <Card>
          <CardHeader>
            <CardTitle>{t("common.input")}</CardTitle>
            <CardDescription>
              {t("tools.svg-placeholder-generator.width_label")} × {t("tools.svg-placeholder-generator.height_label")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 尺寸设置 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="width">{t("tools.svg-placeholder-generator.width_label")}</Label>
                <Input
                  id="width"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Math.max(50, Math.min(2000, parseInt(e.target.value) || 400)))}
                  min="50"
                  max="2000"
                />
              </div>
              <div>
                <Label htmlFor="height">{t("tools.svg-placeholder-generator.height_label")}</Label>
                <Input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Math.max(50, Math.min(2000, parseInt(e.target.value) || 300)))}
                  min="50"
                  max="2000"
                />
              </div>
            </div>

            {/* 文字设置 */}
            <div>
              <Label htmlFor="text">{t("tools.svg-placeholder-generator.text_label")}</Label>
              <Input
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("tools.svg-placeholder-generator.text_placeholder")}
              />
            </div>

            {/* 字体大小 */}
            <div>
              <Label htmlFor="fontSize">{t("tools.svg-placeholder-generator.font_size_label")}: {fontSize[0]}px</Label>
              <Slider
                id="fontSize"
                min={12}
                max={72}
                step={1}
                value={fontSize}
                onValueChange={setFontSize}
                className="mt-2"
              />
            </div>

            {/* 颜色设置 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bgColor">{t("tools.svg-placeholder-generator.background_color")}</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="textColor">{t("tools.svg-placeholder-generator.text_color")}</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* 模板选择 */}
            <div>
              <Label htmlFor="template">{t("tools.svg-placeholder-generator.template_label")}</Label>
              <Select value={template} onValueChange={(value) => setTemplate(value as TemplateType)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("tools.svg-placeholder-generator.select_template")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">{t("tools.svg-placeholder-generator.templates.simple")}</SelectItem>
                  <SelectItem value="gradient">{t("tools.svg-placeholder-generator.templates.gradient")}</SelectItem>
                  <SelectItem value="grid">{t("tools.svg-placeholder-generator.templates.grid")}</SelectItem>
                  <SelectItem value="dots">{t("tools.svg-placeholder-generator.templates.dots")}</SelectItem>
                  <SelectItem value="lines">{t("tools.svg-placeholder-generator.templates.lines")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 预览面板 */}
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.svg-placeholder-generator.preview_title")}</CardTitle>
            <CardDescription>
              {width} × {height} pixels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* SVG预览 */}
            <div className="border rounded-lg p-4 bg-muted/20 overflow-auto">
              <div 
                className="mx-auto"
                style={{ 
                  width: Math.min(width, 400), 
                  height: Math.min(height * (Math.min(width, 400) / width), 300) 
                }}
                dangerouslySetInnerHTML={{ __html: generateSVG() }}
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <Button 
                onClick={copySVG}
                variant="outline" 
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                {t("tools.svg-placeholder-generator.copy_svg")}
              </Button>
              <Button 
                onClick={downloadSVG}
                variant="outline" 
              >
                <Download className="h-4 w-4 mr-2" />
                {t("tools.svg-placeholder-generator.download_svg")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SVG代码显示 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("tools.svg-placeholder-generator.svg_code_title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 p-4 rounded-lg">
            <pre className="text-sm whitespace-pre-wrap break-all">
              {generateSVG()}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t("tools.svg-placeholder-generator.tips_title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">{t("tools.svg-placeholder-generator.tip1_title")}</h4>
              <p className="text-sm text-muted-foreground">{t("tools.svg-placeholder-generator.tip1_desc")}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">{t("tools.svg-placeholder-generator.tip2_title")}</h4>
              <p className="text-sm text-muted-foreground">{t("tools.svg-placeholder-generator.tip2_desc")}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">{t("tools.svg-placeholder-generator.tip3_title")}</h4>
              <p className="text-sm text-muted-foreground">{t("tools.svg-placeholder-generator.tip3_desc")}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">{t("tools.svg-placeholder-generator.tip4_title")}</h4>
              <p className="text-sm text-muted-foreground">{t("tools.svg-placeholder-generator.tip4_desc")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO优化内容 */}
      <ToolSEOSection toolId="svg-placeholder-generator" />
    </div>
  )
}