"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, Download, Image as ImageIcon, Settings, Eye, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useTranslations } from 'next-intl'
import { ToolSEOSection } from "@/components/seo/tool-seo-section"
import { useToast } from "@/hooks/use-toast"

type ColorMode = 'grayscale' | 'blackwhite' | 'color'
type DotShape = 'circle' | 'square' | 'diamond' | 'hexagon'
type BackgroundType = 'transparent' | 'white' | 'black' | 'custom'

export default function ImageToDotMatrixPage() {
  const t = useTranslations()
  const { toast } = useToast()
  
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [dotSize, setDotSize] = useState(5)
  const [dotSpacing, setDotSpacing] = useState(1.2)
  const [dotShape, setDotShape] = useState<DotShape>('circle')
  const [colorMode, setColorMode] = useState<ColorMode>('grayscale')
  const [threshold, setThreshold] = useState(128)
  const [invert, setInvert] = useState(false)
  const [backgroundType, setBackgroundType] = useState<BackgroundType>('white')
  const [customBgColor, setCustomBgColor] = useState('#FFFFFF')
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // 检查文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t("common.error"),
        description: t("tools.image-to-dot-matrix.image_too_large"),
        variant: "destructive"
      })
      return
    }
    
    // 检查文件类型
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
      toast({
        title: t("common.error"),
        description: t("tools.image-to-dot-matrix.invalid_format"),
        variant: "destructive"
      })
      return
    }
    
    setImageFile(file)
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        setImage(img)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      const fakeEvent = {
        target: { files: [file] }
      } as unknown as React.ChangeEvent<HTMLInputElement>
      handleFileSelect(fakeEvent)
    }
  }
  
  const generateDotMatrix = useCallback(() => {
    if (!image || !canvasRef.current) return
    
    setIsProcessing(true)
    
    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      // 计算画布尺寸
      const spacing = dotSize * dotSpacing
      const cols = Math.floor(image.width / spacing)
      const rows = Math.floor(image.height / spacing)
      
      canvas.width = cols * spacing
      canvas.height = rows * spacing
      
      // 设置背景
      if (backgroundType === 'transparent') {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      } else {
        const bgColor = backgroundType === 'custom' ? customBgColor : 
                       backgroundType === 'black' ? '#000000' : '#FFFFFF'
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      
      // 创建临时画布获取像素数据
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = image.width
      tempCanvas.height = image.height
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) return
      
      tempCtx.drawImage(image, 0, 0)
      const imageData = tempCtx.getImageData(0, 0, image.width, image.height)
      
      // 绘制点阵
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = Math.floor(col * spacing + spacing / 2)
          const y = Math.floor(row * spacing + spacing / 2)
          
          // 获取对应像素的颜色
          const pixelX = Math.min(Math.floor(col * spacing / (cols * spacing) * image.width), image.width - 1)
          const pixelY = Math.min(Math.floor(row * spacing / (rows * spacing) * image.height), image.height - 1)
          const index = (pixelY * image.width + pixelX) * 4
          
          let r = imageData.data[index]
          let g = imageData.data[index + 1]
          let b = imageData.data[index + 2]
          const a = imageData.data[index + 3]
          
          // 计算灰度值
          const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
          
          // 根据颜色模式设置颜色
          let color: string
          if (colorMode === 'blackwhite') {
            const isBlack = invert ? gray > threshold : gray < threshold
            color = isBlack ? '#000000' : '#FFFFFF'
          } else if (colorMode === 'grayscale') {
            const grayValue = invert ? 255 - gray : gray
            color = `rgb(${grayValue}, ${grayValue}, ${grayValue})`
          } else {
            if (invert) {
              r = 255 - r
              g = 255 - g
              b = 255 - b
            }
            color = `rgba(${r}, ${g}, ${b}, ${a / 255})`
          }
          
          // 绘制点
          ctx.fillStyle = color
          const centerX = col * spacing + spacing / 2
          const centerY = row * spacing + spacing / 2
          const radius = dotSize / 2
          
          switch (dotShape) {
            case 'circle':
              ctx.beginPath()
              ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
              ctx.fill()
              break
              
            case 'square':
              ctx.fillRect(centerX - radius, centerY - radius, dotSize, dotSize)
              break
              
            case 'diamond':
              ctx.beginPath()
              ctx.moveTo(centerX, centerY - radius)
              ctx.lineTo(centerX + radius, centerY)
              ctx.lineTo(centerX, centerY + radius)
              ctx.lineTo(centerX - radius, centerY)
              ctx.closePath()
              ctx.fill()
              break
              
            case 'hexagon':
              ctx.beginPath()
              for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i
                const hx = centerX + radius * Math.cos(angle)
                const hy = centerY + radius * Math.sin(angle)
                if (i === 0) ctx.moveTo(hx, hy)
                else ctx.lineTo(hx, hy)
              }
              ctx.closePath()
              ctx.fill()
              break
          }
        }
      }
      
      setIsProcessing(false)
      setHasGenerated(true)
    } catch (error) {
      console.error('Error generating dot matrix:', error)
      toast({
        title: t("common.error"),
        description: t("tools.image-to-dot-matrix.generation_failed"),
        variant: "destructive"
      })
      setIsProcessing(false)
      setHasGenerated(false)
    }
  }, [image, dotSize, dotSpacing, dotShape, colorMode, threshold, invert, backgroundType, customBgColor, toast, t])
  
  const downloadPNG = () => {
    if (!canvasRef.current || !hasGenerated) {
      toast({
        title: t("common.error"),
        description: "请先生成点阵图",
        variant: "destructive"
      })
      return
    }
    
    const url = canvasRef.current.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'dot-matrix.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    toast({
      title: t("common.success"),
      description: t("common.downloaded"),
    })
  }
  
  const downloadSVG = () => {
    if (!image || !canvasRef.current || !hasGenerated) {
      toast({
        title: t("common.error"),
        description: "请先生成点阵图",
        variant: "destructive"
      })
      return
    }
    
    const canvas = canvasRef.current
    const spacing = dotSize * dotSpacing
    const cols = Math.floor(canvas.width / spacing)
    const rows = Math.floor(canvas.height / spacing)
    
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">\n`
    
    // 添加背景
    if (backgroundType !== 'transparent') {
      const bgColor = backgroundType === 'custom' ? customBgColor : 
                     backgroundType === 'black' ? '#000000' : '#FFFFFF'
      svgContent += `  <rect width="100%" height="100%" fill="${bgColor}"/>\n`
    }
    
    // 获取画布上下文以读取像素
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const centerX = col * spacing + spacing / 2
        const centerY = row * spacing + spacing / 2
        const radius = dotSize / 2
        
        // 获取该点的颜色
        const pixelX = Math.floor(centerX)
        const pixelY = Math.floor(centerY)
        const index = (pixelY * canvas.width + pixelX) * 4
        const r = imageData.data[index]
        const g = imageData.data[index + 1]
        const b = imageData.data[index + 2]
        const a = imageData.data[index + 3] / 255
        
        const color = `rgba(${r}, ${g}, ${b}, ${a})`
        
        switch (dotShape) {
          case 'circle':
            svgContent += `  <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="${color}"/>\n`
            break
            
          case 'square':
            svgContent += `  <rect x="${centerX - radius}" y="${centerY - radius}" width="${dotSize}" height="${dotSize}" fill="${color}"/>\n`
            break
            
          case 'diamond':
            svgContent += `  <polygon points="${centerX},${centerY - radius} ${centerX + radius},${centerY} ${centerX},${centerY + radius} ${centerX - radius},${centerY}" fill="${color}"/>\n`
            break
            
          case 'hexagon':
            const points = []
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI / 3) * i
              const hx = centerX + radius * Math.cos(angle)
              const hy = centerY + radius * Math.sin(angle)
              points.push(`${hx},${hy}`)
            }
            svgContent += `  <polygon points="${points.join(' ')}" fill="${color}"/>\n`
            break
        }
      }
    }
    
    svgContent += '</svg>'
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dot-matrix.svg'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: t("common.success"),
      description: t("common.downloaded"),
    })
  }
  
  
  const resetSettings = () => {
    setDotSize(5)
    setDotSpacing(1.2)
    setDotShape('circle')
    setColorMode('grayscale')
    setThreshold(128)
    setInvert(false)
    setBackgroundType('white')
    setCustomBgColor('#FFFFFF')
    setHasGenerated(false)
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("tools.image-to-dot-matrix.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.image-to-dot-matrix.description")}
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：上传和配置 */}
        <div className="space-y-6">
          {/* 上传图片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                {t("tools.image-to-dot-matrix.upload_title")}
              </CardTitle>
              <CardDescription>
                {t("tools.image-to-dot-matrix.upload_desc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
              >
                <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  {t("tools.image-to-dot-matrix.drag_image")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("tools.image-to-dot-matrix.supported_formats")}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              
              {imageFile && image && (
                <div className="space-y-2">
                  <Label>{t("tools.image-to-dot-matrix.image_info")}</Label>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">{t("tools.image-to-dot-matrix.original_size")}:</span> {image?.width} × {image?.height}</p>
                    <p><span className="font-medium">{t("tools.image-to-dot-matrix.file_size")}:</span> {(imageFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* 点阵设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t("tools.image-to-dot-matrix.settings_title")}
              </CardTitle>
              <CardDescription>
                {t("tools.image-to-dot-matrix.settings_desc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            {/* 点大小 */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>{t("tools.image-to-dot-matrix.dot_size_label")}</Label>
                <span className="text-sm text-muted-foreground">{dotSize}px</span>
              </div>
              <Slider
                value={[dotSize]}
                onValueChange={([value]) => setDotSize(value)}
                min={2}
                max={20}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                {t("tools.image-to-dot-matrix.dot_size_hint")}
              </p>
            </div>
            
            {/* 点间距 */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>{t("tools.image-to-dot-matrix.dot_spacing_label")}</Label>
                <span className="text-sm text-muted-foreground">{dotSpacing.toFixed(1)}x</span>
              </div>
              <Slider
                value={[dotSpacing]}
                onValueChange={([value]) => setDotSpacing(value)}
                min={1.0}
                max={3.0}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground">
                {t("tools.image-to-dot-matrix.dot_spacing_hint")}
              </p>
            </div>
            
            {/* 点形状 */}
            <div className="space-y-2">
              <Label>{t("tools.image-to-dot-matrix.dot_shape_label")}</Label>
              <Select value={dotShape} onValueChange={(value) => setDotShape(value as DotShape)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="circle">{t("tools.image-to-dot-matrix.shape_circle")}</SelectItem>
                  <SelectItem value="square">{t("tools.image-to-dot-matrix.shape_square")}</SelectItem>
                  <SelectItem value="diamond">{t("tools.image-to-dot-matrix.shape_diamond")}</SelectItem>
                  <SelectItem value="hexagon">{t("tools.image-to-dot-matrix.shape_hexagon")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* 颜色模式 */}
            <div className="space-y-2">
              <Label>{t("tools.image-to-dot-matrix.color_mode_label")}</Label>
              <Select value={colorMode} onValueChange={(value) => setColorMode(value as ColorMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grayscale">{t("tools.image-to-dot-matrix.mode_grayscale")}</SelectItem>
                  <SelectItem value="blackwhite">{t("tools.image-to-dot-matrix.mode_blackwhite")}</SelectItem>
                  <SelectItem value="color">{t("tools.image-to-dot-matrix.mode_color")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* 黑白阈值 */}
            {colorMode === 'blackwhite' && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>{t("tools.image-to-dot-matrix.threshold_label")}</Label>
                  <span className="text-sm text-muted-foreground">{threshold}</span>
                </div>
                <Slider
                  value={[threshold]}
                  onValueChange={([value]) => setThreshold(value)}
                  min={0}
                  max={255}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  {t("tools.image-to-dot-matrix.threshold_hint")}
                </p>
              </div>
            )}
            
            {/* 反转颜色 */}
            <div className="flex items-center justify-between">
              <Label>{t("tools.image-to-dot-matrix.invert_label")}</Label>
              <Switch checked={invert} onCheckedChange={setInvert} />
            </div>
            
            {/* 背景颜色 */}
            <div className="space-y-2">
              <Label>{t("tools.image-to-dot-matrix.background_label")}</Label>
              <Select value={backgroundType} onValueChange={(value) => setBackgroundType(value as BackgroundType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transparent">{t("tools.image-to-dot-matrix.background_transparent")}</SelectItem>
                  <SelectItem value="white">{t("tools.image-to-dot-matrix.background_white")}</SelectItem>
                  <SelectItem value="black">{t("tools.image-to-dot-matrix.background_black")}</SelectItem>
                  <SelectItem value="custom">{t("tools.image-to-dot-matrix.background_custom")}</SelectItem>
                </SelectContent>
              </Select>
              {backgroundType === 'custom' && (
                <input
                  type="color"
                  value={customBgColor}
                  onChange={(e) => setCustomBgColor(e.target.value)}
                  className="w-full h-10 rounded-md border cursor-pointer"
                />
              )}
            </div>
            
            {/* 操作按钮 */}
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={generateDotMatrix} 
                disabled={!image || isProcessing}
                className="flex-1"
              >
                {isProcessing ? t("tools.image-to-dot-matrix.processing") : t("tools.image-to-dot-matrix.generate_button")}
              </Button>
              <Button 
                onClick={resetSettings}
                variant="outline"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 右侧：预览区域 */}
        <div className="space-y-6">
          {/* 原始图片预览 */}
          {imageFile && image && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  {t("tools.image-to-dot-matrix.original_preview")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden bg-muted/20">
                  <img 
                    src={URL.createObjectURL(imageFile)} 
                    alt="Original Preview" 
                    className="w-full h-auto object-contain"
                  />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* 点阵图预览 */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {t("tools.image-to-dot-matrix.preview_title")}
              </CardTitle>
              <CardDescription>
                {t("tools.image-to-dot-matrix.preview_desc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="min-h-[300px] border rounded-lg p-4 bg-muted/20 flex items-center justify-center overflow-auto">
                {!image ? (
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                    <p>{t("tools.image-to-dot-matrix.no_image")}</p>
                  </div>
                ) : (
                  <canvas ref={canvasRef} className="max-w-full h-auto" />
                )}
              </div>
              
              {/* 导出按钮 */}
              {image && (
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={downloadPNG}
                    variant="outline"
                    size="sm"
                    disabled={!hasGenerated}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t("tools.image-to-dot-matrix.download_png")}
                  </Button>
                  <Button 
                    onClick={downloadSVG}
                    variant="outline"
                    size="sm"
                    disabled={!hasGenerated}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t("tools.image-to-dot-matrix.download_svg")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("tools.image-to-dot-matrix.tips_title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">{t("tools.image-to-dot-matrix.tip1_title")}</h4>
              <p className="text-sm text-muted-foreground">{t("tools.image-to-dot-matrix.tip1_desc")}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">{t("tools.image-to-dot-matrix.tip2_title")}</h4>
              <p className="text-sm text-muted-foreground">{t("tools.image-to-dot-matrix.tip2_desc")}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">{t("tools.image-to-dot-matrix.tip3_title")}</h4>
              <p className="text-sm text-muted-foreground">{t("tools.image-to-dot-matrix.tip3_desc")}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">{t("tools.image-to-dot-matrix.tip4_title")}</h4>
              <p className="text-sm text-muted-foreground">{t("tools.image-to-dot-matrix.tip4_desc")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* SEO优化内容 */}
      <ToolSEOSection toolId="image-to-dot-matrix" />
    </div>
  )
}

