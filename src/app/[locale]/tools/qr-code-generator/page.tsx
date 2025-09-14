"use client"

import { useState } from "react"
import { Copy, Download, QrCode, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useTranslations } from 'next-intl'
import { ToolSEOSection } from "@/components/seo/tool-seo-section"
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'

type QRSize = 128 | 256 | 512 | 1024
type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

export default function QRCodeGeneratorPage() {
  const t = useTranslations()

  const [content, setContent] = useState("")
  const [size, setSize] = useState<QRSize>(256)
  const [errorLevel, setErrorLevel] = useState<ErrorCorrectionLevel>('M')
  const [fgColor, setFgColor] = useState("#000000")
  const [bgColor, setBgColor] = useState("#FFFFFF")
  const [format, setFormat] = useState<'svg' | 'png'>('svg')

  const generateQRCode = () => {
    return content.trim() !== ""
  }

  const downloadQR = () => {
    if (!content.trim()) return

    if (format === 'svg') {
      // 下载SVG格式
      const svgElement = document.querySelector('.qr-code-svg') as SVGElement
      if (svgElement) {
        const serializer = new XMLSerializer()
        const svgString = serializer.serializeToString(svgElement)
        const blob = new Blob([svgString], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'qr-code.svg'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } else {
      // 下载PNG格式
      const canvasElement = document.querySelector('.qr-code-canvas') as HTMLCanvasElement
      if (canvasElement) {
        const url = canvasElement.toDataURL('image/png')
        const a = document.createElement('a')
        a.href = url
        a.download = 'qr-code.png'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    }
  }

  const copyToClipboard = async () => {
    if (!content.trim()) return

    try {
      if (format === 'svg') {
        const svgElement = document.querySelector('.qr-code-svg') as SVGElement
        if (svgElement) {
          const serializer = new XMLSerializer()
          const svgString = serializer.serializeToString(svgElement)
          await navigator.clipboard.writeText(svgString)
        }
      } else {
        const canvasElement = document.querySelector('.qr-code-canvas') as HTMLCanvasElement
        if (canvasElement) {
          canvasElement.toBlob(async (blob) => {
            if (blob) {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
              ])
            }
          })
        }
      }
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const renderQRCode = () => {
    if (!generateQRCode()) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <QrCode className="h-12 w-12 mx-auto mb-2" />
            <p>{t("tools.qr-code-generator.empty_content")}</p>
          </div>
        </div>
      )
    }

    const commonProps = {
      value: content,
      size: size,
      level: errorLevel,
      fgColor: fgColor,
      bgColor: bgColor,
      marginSize: 4,
    }

    if (format === 'svg') {
      return (
        <div className="flex justify-center">
          <QRCodeSVG 
            {...commonProps}
            className="qr-code-svg"
          />
        </div>
      )
    } else {
      return (
        <div className="flex justify-center">
          <QRCodeCanvas 
            {...commonProps}
            className="qr-code-canvas"
          />
        </div>
      )
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("tools.qr-code-generator.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.qr-code-generator.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 输入配置 */}
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.qr-code-generator.input_title")}</CardTitle>
            <CardDescription>
              {t("tools.qr-code-generator.input_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 内容输入 */}
            <div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("tools.qr-code-generator.placeholder")}
                className="min-h-[120px]"
              />
            </div>

            {/* 尺寸选择 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="size">{t("tools.qr-code-generator.size_label")}</Label>
                <Select value={size.toString()} onValueChange={(value) => setSize(parseInt(value) as QRSize)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("tools.qr-code-generator.select_size")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="128">{t("tools.qr-code-generator.sizes.small")}</SelectItem>
                    <SelectItem value="256">{t("tools.qr-code-generator.sizes.medium")}</SelectItem>
                    <SelectItem value="512">{t("tools.qr-code-generator.sizes.large")}</SelectItem>
                    <SelectItem value="1024">{t("tools.qr-code-generator.sizes.xlarge")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 纠错级别 */}
              <div>
                <Label htmlFor="errorLevel">{t("tools.qr-code-generator.error_correction_label")}</Label>
                <Select value={errorLevel} onValueChange={(value) => setErrorLevel(value as ErrorCorrectionLevel)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("tools.qr-code-generator.select_error_correction")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">{t("tools.qr-code-generator.error_levels.L")}</SelectItem>
                    <SelectItem value="M">{t("tools.qr-code-generator.error_levels.M")}</SelectItem>
                    <SelectItem value="Q">{t("tools.qr-code-generator.error_levels.Q")}</SelectItem>
                    <SelectItem value="H">{t("tools.qr-code-generator.error_levels.H")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 颜色设置 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fgColor">{t("tools.qr-code-generator.foreground_color")}</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bgColor">{t("tools.qr-code-generator.background_color")}</Label>
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
            </div>

            {/* 导出格式 */}
            <div>
              <Label htmlFor="format">{t("tools.qr-code-generator.format_label")}</Label>
              <Select value={format} onValueChange={(value) => setFormat(value as 'svg' | 'png')}>
                <SelectTrigger>
                  <SelectValue placeholder={t("tools.qr-code-generator.select_format")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="svg">SVG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 生成预览 */}
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.qr-code-generator.output_title")}</CardTitle>
            <CardDescription>
              {t("tools.qr-code-generator.output_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 二维码预览 */}
            <div className="min-h-[300px] border rounded-lg p-4 bg-muted/20">
              {renderQRCode()}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <Button 
                onClick={copyToClipboard}
                variant="outline" 
                disabled={!generateQRCode()}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                {format === 'svg' ? t("tools.qr-code-generator.copy_image") : t("tools.qr-code-generator.copy_image")}
              </Button>
              <Button 
                onClick={downloadQR}
                variant="outline" 
                disabled={!generateQRCode()}
              >
                <Download className="h-4 w-4 mr-2" />
                {format === 'svg' ? t("tools.qr-code-generator.download_svg") : t("tools.qr-code-generator.download_png")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t("tools.qr-code-generator.tips_title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">{t("tools.qr-code-generator.tip1_title")}</h4>
              <p className="text-sm text-muted-foreground">{t("tools.qr-code-generator.tip1_desc")}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">{t("tools.qr-code-generator.tip2_title")}</h4>
              <p className="text-sm text-muted-foreground">{t("tools.qr-code-generator.tip2_desc")}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">{t("tools.qr-code-generator.tip3_title")}</h4>
              <p className="text-sm text-muted-foreground">{t("tools.qr-code-generator.tip3_desc")}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">{t("tools.qr-code-generator.tip4_title")}</h4>
              <p className="text-sm text-muted-foreground">{t("tools.qr-code-generator.tip4_desc")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO优化内容 */}
      <ToolSEOSection toolId="qr-code-generator" />
    </div>
  )
}