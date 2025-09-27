"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Copy, Download, Upload, RefreshCw, FileCode, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslations } from 'next-intl'
import { ToolSEOSection } from "@/components/seo/tool-seo-section"
import { cn, getTextareaClasses } from "@/lib/utils"

type ConversionMode = 'imageToBase64' | 'base64ToImage'

interface ImageInfo {
  name: string
  size: number
  type: string
}

export default function Base64ImageConverterPage() {
  const t = useTranslations()

  const [mode, setMode] = useState<ConversionMode>('imageToBase64')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [base64Input, setBase64Input] = useState("")
  const [base64Output, setBase64Output] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [convertedImageUrl, setConvertedImageUrl] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // 最大文件大小 5MB (图片专用)
  const MAX_FILE_SIZE = 5 * 1024 * 1024

  // 支持的图片格式
  const SUPPORTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp'
  ]

  // 检查文件是否为支持的图片格式
  const isValidImageFile = (file: File): boolean => {
    return SUPPORTED_IMAGE_TYPES.includes(file.type.toLowerCase())
  }

  // 图片转Base64
  const convertImageToBase64 = async (file: File) => {
    if (!isValidImageFile(file)) {
      setError(t("tools.base64-file-converter.invalid_image_format"))
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(t("tools.base64-file-converter.image_too_large"))
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // 移除 data:mime/type;base64, 前缀
        const base64 = result.split(',')[1] || result
        setBase64Output(base64)
        setImageInfo({
          name: file.name,
          size: file.size,
          type: file.type
        })
      }
      reader.onerror = () => {
        setError("图片读取失败")
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Image conversion failed:', err)
      setError("转换失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  // Base64转图片并显示
  const convertBase64ToImage = () => {
    if (!base64Input.trim()) {
      setError("请输入Base64内容")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      let base64Data = base64Input.trim()
      let mimeType = 'image/png' // 默认为PNG

      // 检查是否是data URL格式
      if (base64Data.startsWith('data:image/')) {
        const dataUrlMatch = base64Data.match(/^data:(image\/[^;]+);base64,(.+)$/)
        if (dataUrlMatch) {
          mimeType = dataUrlMatch[1]
          base64Data = dataUrlMatch[2]
        }
      } else if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1]
      }

      // 验证Base64格式
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
        throw new Error("无效的Base64格式")
      }

      // 创建图片预览URL
      const dataUrl = `data:${mimeType};base64,${base64Data}`
      setConvertedImageUrl(dataUrl)
      setError("")
    } catch (err) {
      console.error('Base64 conversion failed:', err)
      setError(t("tools.base64-file-converter.invalid_base64"))
      setConvertedImageUrl(null)
    } finally {
      setIsLoading(false)
    }
  }

  // 下载转换后的图片
  const downloadConvertedImage = () => {
    if (!convertedImageUrl) return

    try {
      const link = document.createElement('a')
      link.href = convertedImageUrl
      link.download = 'converted-image.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Download failed:', err)
      setError("下载失败，请重试")
    }
  }

  // 处理文件选择
  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0]
      setSelectedImage(file)
      convertImageToBase64(file)
    }
  }

  // 处理拖拽
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    handleFileSelect(e.dataTransfer.files)
  }

  // 复制Base64到剪贴板
  const copyToClipboard = async () => {
    if (base64Output) {
      try {
        await navigator.clipboard.writeText(base64Output)
      } catch (err) {
        console.error('复制失败:', err)
      }
    }
  }

  // 清空所有内容
  const clearAll = () => {
    setSelectedImage(null)
    setBase64Input("")
    setBase64Output("")
    setError("")
    setImageInfo(null)
    setConvertedImageUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // 获取文件大小显示
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 渲染图片预览
  const renderImagePreview = () => {
    if (!selectedImage) {
      return (
        <div className="text-center text-muted-foreground py-8">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>{t("tools.base64-file-converter.no_image_selected")}</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <div className="border rounded-lg p-2">
          <Image
            src={URL.createObjectURL(selectedImage)}
            alt="预览"
            width={300}
            height={200}
            className="max-w-full max-h-32 mx-auto rounded"
          />
        </div>
        <div className="flex items-center gap-2 p-3 border rounded-lg">
          <ImageIcon className="h-4 w-4" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedImage.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(selectedImage.size)} • {selectedImage.type}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("tools.base64-file-converter.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.base64-file-converter.image_description")}
        </p>
      </div>

      {/* 模式切换 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            {t("tools.base64-file-converter.mode_switch")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={mode} onValueChange={(value) => setMode(value as ConversionMode)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="imageToBase64">
                {t("tools.base64-file-converter.image_to_base64")}
              </SelectItem>
              <SelectItem value="base64ToImage">
                {t("tools.base64-file-converter.base64_to_image")}
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 输入区域 */}
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.base64-file-converter.input_title")}</CardTitle>
            <CardDescription>
              {mode === 'imageToBase64'
                ? t("tools.base64-file-converter.drag_image")
                : t("tools.base64-file-converter.base64_input")
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === 'imageToBase64' ? (
              // 图片上传模式
              <>
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                    dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                    "hover:border-primary hover:bg-primary/5"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-1">
                    {t("tools.base64-file-converter.drag_image")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("tools.base64-file-converter.supported_formats")}
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />

                {/* 图片预览 */}
                {renderImagePreview()}
              </>
            ) : (
              // Base64输入模式
              <div className="space-y-4">
                <Textarea
                  value={base64Input}
                  onChange={(e) => {
                    setBase64Input(e.target.value)
                    if (error) setError("")
                  }}
                  placeholder={t("tools.base64-file-converter.base64_input_placeholder")}
                  className={getTextareaClasses('input')}
                />

                <Button
                  onClick={convertBase64ToImage}
                  disabled={!base64Input.trim() || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ImageIcon className="h-4 w-4 mr-2" />
                  )}
                  {t("tools.base64-file-converter.convert_to_image")}
                </Button>
              </div>
            )}

            {error && (
              <div className="text-destructive text-sm p-2 bg-destructive/10 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={clearAll} variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t("common.clear")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 输出区域 */}
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.base64-file-converter.output_title")}</CardTitle>
            <CardDescription>
              {mode === 'imageToBase64'
                ? t("tools.base64-file-converter.base64_output")
                : t("tools.base64-file-converter.image_preview")
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === 'imageToBase64' ? (
              // 图片转Base64模式 - 显示Base64输出
              <>
                <Textarea
                  value={base64Output}
                  readOnly
                  placeholder={t("tools.base64-file-converter.base64_output_placeholder")}
                  className={getTextareaClasses('output')}
                />

                {/* 图片信息 */}
                {imageInfo && (
                  <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                    <h4 className="font-medium text-sm">{t("tools.base64-file-converter.image_info")}</h4>
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      <div><span className="text-muted-foreground">{t("tools.base64-file-converter.image_name")}:</span> {imageInfo.name}</div>
                      <div><span className="text-muted-foreground">{t("tools.base64-file-converter.image_size")}:</span> {formatFileSize(imageInfo.size)}</div>
                      <div><span className="text-muted-foreground">{t("tools.base64-file-converter.image_type")}:</span> {imageInfo.type}</div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    disabled={!base64Output}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {t("tools.base64-file-converter.copy_base64")}
                  </Button>
                </div>
              </>
            ) : (
              // Base64转图片模式 - 显示图片预览和下载
              <>
                <div className="min-h-[300px] border rounded-lg p-4 bg-muted/20 flex items-center justify-center">
                  {convertedImageUrl ? (
                    <div className="text-center space-y-4 w-full">
                      <div className="max-h-[60vh] max-w-full overflow-auto rounded bg-white p-2">
                        <Image
                          src={convertedImageUrl}
                          alt="转换结果"
                          width={800}
                          height={600}
                          className="max-w-full h-auto mx-auto object-contain"
                        />
                      </div>
                      <Button
                        onClick={downloadConvertedImage}
                        className="w-full max-w-xs"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {t("tools.base64-file-converter.download_image")}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>{t("tools.base64-file-converter.convert_to_see_image")}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            {t("tools.base64-file-converter.tips_title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">{t("tools.base64-file-converter.tip1_title")}</h4>
              <p className="text-sm text-muted-foreground">{t("tools.base64-file-converter.tip1_desc")}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">{t("tools.base64-file-converter.tip2_title")}</h4>
              <p className="text-sm text-muted-foreground">{t("tools.base64-file-converter.tip2_desc")}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">{t("tools.base64-file-converter.tip3_title")}</h4>
              <p className="text-sm text-muted-foreground">{t("tools.base64-file-converter.tip3_desc")}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">{t("tools.base64-file-converter.tip4_title")}</h4>
              <p className="text-sm text-muted-foreground">{t("tools.base64-file-converter.tip4_desc")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO优化内容 */}
      <ToolSEOSection toolId="base64-file-converter" />
    </div>
  )
}