"use client"

import { useState, useRef } from "react"
import { Copy, Download, Palette, RefreshCw, PackageIcon, CheckSquare, Maximize2, X, Grid3x3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useTranslations } from 'next-intl'
import { ToolSEOSection } from "@/components/seo/tool-seo-section"
import { MULTICOLOR_TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/icon-templates"
import { ICON_LIBRARY, ICON_CATEGORIES, type IconItem } from "@/lib/icon-library"
import JSZip from 'jszip'

type IconShape = 'square' | 'circle' | 'rounded' | 'squircle'
type FontWeight = 'normal' | 'medium' | 'bold'
type BackgroundMode = 'solid' | 'multicolor'
type ContentMode = 'text' | 'icon' | 'custom-svg'

const PRESET_COLORS = [
  { name: 'Blue', bg: '#3B82F6', text: '#FFFFFF' },
  { name: 'Green', bg: '#10B981', text: '#FFFFFF' },
  { name: 'Purple', bg: '#8B5CF6', text: '#FFFFFF' },
  { name: 'Red', bg: '#EF4444', text: '#FFFFFF' },
  { name: 'Yellow', bg: '#F59E0B', text: '#FFFFFF' },
  { name: 'Pink', bg: '#EC4899', text: '#FFFFFF' },
  { name: 'Indigo', bg: '#6366F1', text: '#FFFFFF' },
  { name: 'Teal', bg: '#14B8A6', text: '#FFFFFF' },
]

// SVG内容颜色预设（用于图标和自定义SVG）
const SVG_PRESET_COLORS = [
  { name: 'White', color: '#FFFFFF' },
  { name: 'Black', color: '#000000' },
  { name: 'Gray', color: '#6B7280' },
  { name: 'Blue', color: '#3B82F6' },
  { name: 'Green', color: '#10B981' },
  { name: 'Purple', color: '#8B5CF6' },
  { name: 'Red', color: '#EF4444' },
  { name: 'Yellow', color: '#F59E0B' },
  { name: 'Pink', color: '#EC4899' },
  { name: 'Indigo', color: '#6366F1' },
  { name: 'Teal', color: '#14B8A6' },
  { name: 'Orange', color: '#F97316' },
]

const ICON_SIZES = [16, 32, 64, 128, 256, 512, 1024]

export default function IconDesignerPage() {
  const t = useTranslations()

  // 基础设置
  const [text, setText] = useState("A")
  const [showText, setShowText] = useState(true)
  const [bgColor, setBgColor] = useState("#3B82F6")
  const [textColor, setTextColor] = useState("#FFFFFF")
  const [shape, setShape] = useState<IconShape>('rounded')
  const [fontSize, setFontSize] = useState([90])
  const [fontWeight, setFontWeight] = useState<FontWeight>('bold')
  
  // 内容模式
  const [contentMode, setContentMode] = useState<ContentMode>('text')
  const [selectedIcon, setSelectedIcon] = useState<IconItem | null>(null)
  const [customSvg, setCustomSvg] = useState("")
  const [iconColor, setIconColor] = useState("#FFFFFF")
  const [customSvgColor, setCustomSvgColor] = useState("#FFFFFF") // 自定义SVG颜色
  const [iconSize, setIconSize] = useState([60]) // 图标大小百分比
  
  // 图标库选择弹窗
  const [showIconLibrary, setShowIconLibrary] = useState(false)
  const [selectedIconCategory, setSelectedIconCategory] = useState('all')
  
  // 背景模式
  const [bgMode, setBgMode] = useState<BackgroundMode>('solid')
  const [selectedTemplate, setSelectedTemplate] = useState(MULTICOLOR_TEMPLATES[0].id)
  const [regionColors, setRegionColors] = useState<Record<string, string>>(
    Object.fromEntries(
      MULTICOLOR_TEMPLATES[0].regions.map(r => [r.id, r.defaultColor])
    )
  )
  
  // 模板选择弹框
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  // 尺寸选择
  const [selectedSizes, setSelectedSizes] = useState<number[]>(ICON_SIZES)
  // 预览尺寸
  const [previewSize, setPreviewSize] = useState<number>(256)
  // 弹窗预览
  const [modalPreviewSize, setModalPreviewSize] = useState<number | null>(null)
  
  const svgRef = useRef<HTMLDivElement>(null)

  // 切换尺寸选择
  const toggleSize = (size: number) => {
    setSelectedSizes(prev => 
      prev.includes(size) 
        ? prev.filter(s => s !== size)
        : [...prev, size].sort((a, b) => a - b)
    )
  }

  // 全选/取消全选
  const toggleAllSizes = () => {
    setSelectedSizes(prev => 
      prev.length === ICON_SIZES.length ? [] : [...ICON_SIZES]
    )
  }
  
  // 生成形状裁剪路径
  const getShapeClipPath = (size: number, id: string) => {
    const centerX = size / 2
    const centerY = size / 2
    
    switch (shape) {
      case 'circle':
        return `<clipPath id="shape-clip-${id}"><circle cx="${centerX}" cy="${centerY}" r="${centerX}"/></clipPath>`
      case 'rounded':
        const roundedRadius = Math.round(size * 0.15)
        return `<clipPath id="shape-clip-${id}"><rect width="${size}" height="${size}" rx="${roundedRadius}" ry="${roundedRadius}"/></clipPath>`
      case 'squircle':
        const squircleRadius = size * 0.6
        return `<clipPath id="shape-clip-${id}"><path d="M ${centerX},0 
                 C ${centerX + squircleRadius * 0.552},0 ${size},${centerY - squircleRadius * 0.552} ${size},${centerY}
                 C ${size},${centerY + squircleRadius * 0.552} ${centerX + squircleRadius * 0.552},${size} ${centerX},${size}
                 C ${centerX - squircleRadius * 0.552},${size} 0,${centerY + squircleRadius * 0.552} 0,${centerY}
                 C 0,${centerY - squircleRadius * 0.552} ${centerX - squircleRadius * 0.552},0 ${centerX},0 Z"/></clipPath>`
      case 'square':
      default:
        return ''
    }
  }

  // 生成SVG内容
  const generateSVG = (size: number = 256) => {
    const centerX = size / 2
    const centerY = size / 2
    const scaleFactor = size / 128 // 文字模式的缩放因子，以256为基础
    const iconScaleFactor = size / 32 // 图标模式的缩放因子，以32为基础
    const currentFontSize = Math.round(fontSize[0] * scaleFactor)
    
    let backgroundElements = ""
    let defsElement = ""
    
    if (bgMode === 'multicolor') {
      // 多色模式：绘制多个几何区域，并应用形状裁剪
      const template = MULTICOLOR_TEMPLATES.find(t => t.id === selectedTemplate)
      if (template) {
        // 添加形状裁剪路径定义
        const clipPath = getShapeClipPath(size, size.toString())
        if (clipPath) {
          defsElement = `<defs>${clipPath}</defs>`
        }
        
        backgroundElements = template.regions.map(region => {
          const color = regionColors[region.id] || region.defaultColor
          const pathData = region.path(size)
          const clipAttr = clipPath ? ` clip-path="url(#shape-clip-${size})"` : ''
          return `<path d="${pathData}" fill="${color}"${clipAttr}/>`
        }).join('\n  ')
      }
    } else {
      // 纯色模式：根据形状绘制单色背景
    switch (shape) {
      case 'circle':
          backgroundElements = `<circle cx="${centerX}" cy="${centerY}" r="${centerX}" fill="${bgColor}"/>`
        break
      case 'rounded':
        const roundedRadius = Math.round(size * 0.15)
          backgroundElements = `<rect width="${size}" height="${size}" rx="${roundedRadius}" ry="${roundedRadius}" fill="${bgColor}"/>`
        break
      case 'squircle':
        const squircleRadius = size * 0.6
          backgroundElements = `<path d="M ${centerX},0 
                   C ${centerX + squircleRadius * 0.552},0 ${size},${centerY - squircleRadius * 0.552} ${size},${centerY}
                   C ${size},${centerY + squircleRadius * 0.552} ${centerX + squircleRadius * 0.552},${size} ${centerX},${size}
                   C ${centerX - squircleRadius * 0.552},${size} 0,${centerY + squircleRadius * 0.552} 0,${centerY}
                   C 0,${centerY - squircleRadius * 0.552} ${centerX - squircleRadius * 0.552},0 ${centerX},0 Z"
                fill="${bgColor}"/>`
        break
      case 'square':
      default:
          backgroundElements = `<rect width="${size}" height="${size}" fill="${bgColor}"/>`
        break
      }
    }

    // 内容元素（文字、图标或自定义SVG）
    let contentElement = ''
    
    if (contentMode === 'text' && showText) {
      // 文字模式
      const fontWeightValue = fontWeight === 'normal' ? '400' : fontWeight === 'medium' ? '500' : '700'
      const displayText = text.trim() || 'A'
      contentElement = `
  <text x="${centerX}" y="${centerY}" 
        font-family="Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" 
        font-size="${currentFontSize}" 
        font-weight="${fontWeightValue}"
        fill="${textColor}" 
        text-anchor="middle" 
        dominant-baseline="central">${displayText}</text>`
    } else if (contentMode === 'icon' && selectedIcon) {
      // 图标库模式 - 居中显示，等比例缩放（以32px为基础）
      const iconScale = (iconSize[0] / 100) * iconScaleFactor
      
      contentElement = `
  <g transform="translate(${centerX}, ${centerY})">
    <g transform="scale(${iconScale})">
      <g transform="translate(-12, -12)" style="color: ${iconColor}">
        ${selectedIcon.svg}
      </g>
    </g>
  </g>`
    } else if (contentMode === 'custom-svg' && customSvg.trim()) {
      // 自定义SVG模式 - 智能检测viewBox并自动缩放居中
      try {
        // 提取SVG内容和viewBox信息
        let svgContent = customSvg.trim()
        let viewBoxWidth = 24
        let viewBoxHeight = 24
        let viewBoxX = 0
        let viewBoxY = 0
        let globalAttrs = '' // 存储SVG标签上的全局属性
        
        // 如果是完整的SVG标签，提取viewBox和内容
        if (svgContent.toLowerCase().startsWith('<svg')) {
          // 提取viewBox
          const viewBoxMatch = svgContent.match(/viewBox=["']([^"']*)["']/i)
          if (viewBoxMatch) {
            const viewBoxValues = viewBoxMatch[1].split(/[\s,]+/).filter(v => v)
            if (viewBoxValues.length === 4) {
              viewBoxX = parseFloat(viewBoxValues[0]) || 0
              viewBoxY = parseFloat(viewBoxValues[1]) || 0
              viewBoxWidth = parseFloat(viewBoxValues[2]) || 24
              viewBoxHeight = parseFloat(viewBoxValues[3]) || 24
            }
          }
          
          // 提取SVG标签上的stroke相关属性
          const svgTagMatch = svgContent.match(/<svg[^>]*>/i)
          if (svgTagMatch) {
            const svgTag = svgTagMatch[0]
            // 提取stroke-width, stroke-linecap, stroke-linejoin等属性
            const strokeWidth = svgTag.match(/stroke-width=["']([^"']*)["']/i)
            const strokeLinecap = svgTag.match(/stroke-linecap=["']([^"']*)["']/i)
            const strokeLinejoin = svgTag.match(/stroke-linejoin=["']([^"']*)["']/i)
            
            if (strokeWidth) globalAttrs += ` stroke-width="${strokeWidth[1]}"`
            if (strokeLinecap) globalAttrs += ` stroke-linecap="${strokeLinecap[1]}"`
            if (strokeLinejoin) globalAttrs += ` stroke-linejoin="${strokeLinejoin[1]}"`
          }
          
          // 提取SVG内容（去除svg标签）
          const match = svgContent.match(/<svg[^>]*>([\s\S]*)<\/svg>/i)
          if (match) {
            svgContent = match[1]
          }
        }
        
        // 检测是否是线条图标（原SVG中有fill="none"）
        const isStrokeIcon = customSvg.includes('fill="none"') || customSvg.includes("fill='none'")
        
        // 应用颜色：替换currentColor
        svgContent = svgContent
          .replace(/stroke=["']currentColor["']/gi, `stroke="${customSvgColor}"`)
          .replace(/fill=["']currentColor["']/gi, `fill="${customSvgColor}"`)
        
        // 如果不是线条图标，才替换fill="none"
        if (!isStrokeIcon) {
          svgContent = svgContent.replace(/fill=["']none["']/gi, `fill="${customSvgColor}"`)
        }
        
        // 为没有颜色属性的元素添加颜色 - 使用更可靠的正则表达式（只匹配开标签）
        svgContent = svgContent.replace(/<(path|circle|rect|ellipse|line|polyline|polygon)(\s[^<>]*?)?(\/?>)/gi, (match, tag, attrs, closing) => {
          // 如果没有属性，初始化为空字符串
          attrs = attrs || ''
          
          // 判断是否是自闭合标签
          const isSelfClosing = closing === '/>'
          
          const hasStroke = /\bstroke\s*=/i.test(attrs)
          const hasFill = /\bfill\s*=/i.test(attrs)
          const hasStrokeWidth = /\bstroke-width\s*=/i.test(attrs)
          const hasStrokeLinecap = /\bstroke-linecap\s*=/i.test(attrs)
          const hasStrokeLinejoin = /\bstroke-linejoin\s*=/i.test(attrs)
          
          // 根据图标类型决定添加什么属性
          let newAttrs = attrs
          
          if (isStrokeIcon) {
            // 线条图标：只添加stroke，保持fill="none"
            if (!hasStroke) {
              newAttrs += ` stroke="${customSvgColor}"`
            }
            if (!hasFill) {
              newAttrs += ` fill="none"`
            }
            // 添加全局stroke属性（如果元素本身没有这些属性）
            if (globalAttrs) {
              if (!hasStrokeWidth) {
                const widthMatch = globalAttrs.match(/stroke-width="([^"]*)"/)
                if (widthMatch) newAttrs += ` stroke-width="${widthMatch[1]}"`
              }
              if (!hasStrokeLinecap) {
                const capMatch = globalAttrs.match(/stroke-linecap="([^"]*)"/)
                if (capMatch) newAttrs += ` stroke-linecap="${capMatch[1]}"`
              }
              if (!hasStrokeLinejoin) {
                const joinMatch = globalAttrs.match(/stroke-linejoin="([^"]*)"/)
                if (joinMatch) newAttrs += ` stroke-linejoin="${joinMatch[1]}"`
              }
            }
          } else {
            // 填充图标：添加fill和stroke
            if (!hasFill) {
              newAttrs += ` fill="${customSvgColor}"`
            }
            if (!hasStroke && (tag === 'path' || tag === 'line' || tag === 'polyline' || tag === 'polygon')) {
              newAttrs += ` stroke="${customSvgColor}"`
            }
          }
          
          return `<${tag}${newAttrs}${isSelfClosing ? '/>' : '>'}`
        })
        
        // 计算居中偏移
        const centerOffsetX = viewBoxX + viewBoxWidth / 2
        const centerOffsetY = viewBoxY + viewBoxHeight / 2
        
        // 自动调整缩放：根据viewBox的最大边来归一化到24x24的基准
        const maxViewBoxSize = Math.max(viewBoxWidth, viewBoxHeight)
        const normalizedScale = 24 / maxViewBoxSize // 将任意大小的viewBox归一化到24的基准
        const iconScale = (iconSize[0] / 100) * iconScaleFactor * normalizedScale
        
        contentElement = `
  <g transform="translate(${centerX}, ${centerY})">
    <g transform="scale(${iconScale})">
      <g transform="translate(-${centerOffsetX}, -${centerOffsetY})">
        ${svgContent}
      </g>
    </g>
  </g>`
      } catch {
        // 如果自定义SVG解析失败，显示错误提示
        contentElement = `
  <text x="${centerX}" y="${centerY}" 
        font-family="Arial" 
        font-size="12" 
        fill="currentColor" 
        text-anchor="middle" 
        dominant-baseline="central">Invalid SVG</text>`
      }
    }

    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  ${defsElement}
  ${backgroundElements}${contentElement}
</svg>`
  }

  // 现在需要从这里开始删除旧代码
  // 下载SVG文件
  const downloadSVG = (size: number) => {
    const svgContent = generateSVG(size)
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `icon-${text.trim() || 'A'}-${size}x${size}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 继续保留其他函数...
  const downloadPNG = (size: number) => {
    const svgContent = generateSVG(size)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return

    const img = new Image()
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((blob) => {
        if (blob) {
          const pngUrl = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = pngUrl
          a.download = `icon-${text.trim() || 'A'}-${size}x${size}.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(pngUrl)
        }
      })
      URL.revokeObjectURL(url)
    }

    img.src = url
  }

  // 此处继续其他已有的函数... (downloadICO, createICO, createBitmap, downloadAllSizes, applyPresetColor, randomizeColors)
  
  // 批量下载ICO文件（每个尺寸单独一个ICO，打包成ZIP）
  const downloadICO = async (useSelectedSizes: boolean = false) => {
    // 确定使用的尺寸
    let sizes: number[]
    if (useSelectedSizes) {
      if (selectedSizes.length === 0) {
        alert(t("tools.icon-designer.no_size_selected"))
        return
      }
      // 使用所有选中的尺寸
      sizes = [...selectedSizes].sort((a, b) => a - b)
    } else {
      // 标准ICO尺寸
      sizes = [16, 32, 48, 64, 128, 256]
    }

    const zip = new JSZip()
    const iconName = text.trim() || 'A'
    const icoFolder = zip.folder('ico')
    
    // 为每个尺寸生成单独的ICO文件
    for (const size of sizes) {
      const svgContent = generateSVG(size)
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      
      if (!ctx) continue

      await new Promise<void>((resolve) => {
        const img = new Image()
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)

        img.onload = () => {
          ctx.drawImage(img, 0, 0)
          const imageData = ctx.getImageData(0, 0, size, size)
          
          // 为单个尺寸创建ICO文件
          const icoData = createICO([imageData])
          const icoBlob = new Blob([icoData], { type: 'image/x-icon' })
          
          if (icoFolder) {
            icoFolder.file(`icon-${iconName}-${size}x${size}.ico`, icoBlob)
          }
          
          URL.revokeObjectURL(url)
          resolve()
        }

        img.src = url
      })
    }

    // 生成ZIP文件并下载
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    const sizeText = useSelectedSizes ? `${sizes.length}-sizes` : 'standard'
    a.download = `icon-${iconName}-ico-${sizeText}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 创建ICO文件格式
  const createICO = (images: ImageData[]): ArrayBuffer => {
    // ICO文件头（6字节）
    const headerSize = 6
    const dirEntrySize = 16
    const icoHeader = new Uint8Array(headerSize + dirEntrySize * images.length)
    
    // ICONDIR结构
    icoHeader[0] = 0 // 保留字段
    icoHeader[1] = 0
    icoHeader[2] = 1 // 类型：1=ICO
    icoHeader[3] = 0
    icoHeader[4] = images.length // 图像数量
    icoHeader[5] = 0

    let offset = headerSize + dirEntrySize * images.length
    const bitmapDataList: Uint8Array[] = []

    // 为每个图像创建ICONDIRENTRY
    images.forEach((imageData, index) => {
      const size = imageData.width
      const bitmapData = createBitmap(imageData)
      bitmapDataList.push(bitmapData)

      const entryOffset = headerSize + index * dirEntrySize
      // 宽度和高度（0表示256）
      icoHeader[entryOffset + 0] = size === 256 ? 0 : size
      icoHeader[entryOffset + 1] = size === 256 ? 0 : size
      icoHeader[entryOffset + 2] = 0 // 颜色数（0=真彩色）
      icoHeader[entryOffset + 3] = 0 // 保留
      icoHeader[entryOffset + 4] = 1 // 颜色平面数
      icoHeader[entryOffset + 5] = 0
      icoHeader[entryOffset + 6] = 32 // 位深度
      icoHeader[entryOffset + 7] = 0
      
      // 图像数据大小
      const dataSize = bitmapData.length
      icoHeader[entryOffset + 8] = dataSize & 0xFF
      icoHeader[entryOffset + 9] = (dataSize >> 8) & 0xFF
      icoHeader[entryOffset + 10] = (dataSize >> 16) & 0xFF
      icoHeader[entryOffset + 11] = (dataSize >> 24) & 0xFF
      
      // 图像数据偏移
      icoHeader[entryOffset + 12] = offset & 0xFF
      icoHeader[entryOffset + 13] = (offset >> 8) & 0xFF
      icoHeader[entryOffset + 14] = (offset >> 16) & 0xFF
      icoHeader[entryOffset + 15] = (offset >> 24) & 0xFF
      
      offset += dataSize
    })

    // 合并所有数据
    const totalSize = icoHeader.length + bitmapDataList.reduce((sum, data) => sum + data.length, 0)
    const result = new Uint8Array(totalSize)
    result.set(icoHeader, 0)
    
    let currentOffset = icoHeader.length
    bitmapDataList.forEach(data => {
      result.set(data, currentOffset)
      currentOffset += data.length
    })

    return result.buffer
  }

  // 创建BMP格式的图像数据
  const createBitmap = (imageData: ImageData): Uint8Array => {
    const size = imageData.width
    const headerSize = 40
    const imageSize = size * size * 4
    const bitmapData = new Uint8Array(headerSize + imageSize)
    
    // BITMAPINFOHEADER
    bitmapData[0] = headerSize // 头部大小
    bitmapData[1] = 0
    bitmapData[2] = 0
    bitmapData[3] = 0
    
    // 宽度
    bitmapData[4] = size & 0xFF
    bitmapData[5] = (size >> 8) & 0xFF
    bitmapData[6] = (size >> 16) & 0xFF
    bitmapData[7] = (size >> 24) & 0xFF
    
    // 高度（双倍，因为包含AND掩码）
    const height = size * 2
    bitmapData[8] = height & 0xFF
    bitmapData[9] = (height >> 8) & 0xFF
    bitmapData[10] = (height >> 16) & 0xFF
    bitmapData[11] = (height >> 24) & 0xFF
    
    bitmapData[12] = 1 // 颜色平面数
    bitmapData[13] = 0
    bitmapData[14] = 32 // 位深度
    bitmapData[15] = 0
    bitmapData[16] = 0 // 压缩方式（0=不压缩）
    
    // 转换像素数据（BMP是从下到上存储的）
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const srcIndex = ((size - 1 - y) * size + x) * 4
        const dstIndex = headerSize + (y * size + x) * 4
        
        // BGRA格式
        bitmapData[dstIndex + 0] = imageData.data[srcIndex + 2] // B
        bitmapData[dstIndex + 1] = imageData.data[srcIndex + 1] // G
        bitmapData[dstIndex + 2] = imageData.data[srcIndex + 0] // R
        bitmapData[dstIndex + 3] = imageData.data[srcIndex + 3] // A
      }
    }
    
    return bitmapData
  }

  // 批量下载选中尺寸（ZIP打包）
  const downloadAllSizes = async (format: 'svg' | 'png' | 'both' = 'both') => {
    if (selectedSizes.length === 0) {
      alert(t("tools.icon-designer.no_size_selected"))
      return
    }

    const zip = new JSZip()
    const iconName = text.trim() || 'A'
    
    // 添加SVG文件
    if (format === 'svg' || format === 'both') {
      const svgFolder = zip.folder('svg')
      if (svgFolder) {
        selectedSizes.forEach(size => {
          const svgContent = generateSVG(size)
          svgFolder.file(`icon-${iconName}-${size}x${size}.svg`, svgContent)
        })
      }
    }

    // 添加PNG文件
    if (format === 'png' || format === 'both') {
      const pngFolder = zip.folder('png')
      if (pngFolder) {
        for (const size of selectedSizes) {
          const svgContent = generateSVG(size)
          const canvas = document.createElement('canvas')
          canvas.width = size
          canvas.height = size
          const ctx = canvas.getContext('2d')
          
          if (!ctx) continue

          await new Promise<void>((resolve) => {
            const img = new Image()
            const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
            const url = URL.createObjectURL(svgBlob)

            img.onload = () => {
              ctx.drawImage(img, 0, 0)
              canvas.toBlob((blob) => {
                if (blob) {
                  pngFolder.file(`icon-${iconName}-${size}x${size}.png`, blob)
                }
                URL.revokeObjectURL(url)
                resolve()
              })
            }

            img.src = url
          })
        }
      }
    }

    // 生成ZIP文件并下载
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    const sizeText = selectedSizes.length === ICON_SIZES.length ? 'all-sizes' : `${selectedSizes.length}-sizes`
    a.download = `icon-${iconName}-${sizeText}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 应用预设颜色
  const applyPresetColor = (preset: typeof PRESET_COLORS[0]) => {
    setBgColor(preset.bg)
    setTextColor(preset.text)
  }

  // 随机生成颜色
  const randomizeColors = () => {
    const randomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
    setBgColor(randomColor())
    setTextColor(randomColor())
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("tools.icon-designer.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.icon-designer.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 配置面板 */}
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.icon-designer.settings_title")}</CardTitle>
            <CardDescription>
              {t("tools.icon-designer.settings_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 内容模式选择 */}
            <div>
              <Label htmlFor="contentMode">{t("tools.icon-designer.content_mode")}</Label>
              <Select value={contentMode} onValueChange={(value) => setContentMode(value as ContentMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">{t("tools.icon-designer.mode_text")}</SelectItem>
                  <SelectItem value="icon">{t("tools.icon-designer.mode_icon_library")}</SelectItem>
                  <SelectItem value="custom-svg">{t("tools.icon-designer.mode_custom_svg")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 文字模式：文字设置 */}
            {contentMode === 'text' && (
              <div>
                <Label htmlFor="text">{t("tools.icon-designer.text_label")}</Label>
                <Input
                  id="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="A"
                  maxLength={20}
                  className="text-2xl text-center font-bold"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("tools.icon-designer.text_hint_new")}
                </p>
              </div>
            )}

            {/* 图标库模式：选择图标 */}
            {contentMode === 'icon' && (
              <div>
                <Label>{t("tools.icon-designer.select_icon")}</Label>
                <Button
                  variant="outline"
                  className="w-full mt-2 justify-start"
                  onClick={() => setShowIconLibrary(true)}
                >
                  <PackageIcon className="h-4 w-4 mr-2" />
                  {selectedIcon ? selectedIcon.nameZh : t("tools.icon-designer.browse_icons")}
                </Button>
                {selectedIcon && (
                  <div className="mt-2 p-3 border rounded-lg bg-muted/20 flex items-center gap-3">
                    <div 
                      className="w-12 h-12 flex items-center justify-center border rounded bg-muted/50"
                      style={{ color: 'currentColor' }}
                      dangerouslySetInnerHTML={{ 
                        __html: `<svg viewBox="0 0 24 24" width="32" height="32">${selectedIcon.svg}</svg>` 
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{selectedIcon.nameZh}</div>
                      <div className="text-xs text-muted-foreground">{selectedIcon.name}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 自定义SVG模式：输入SVG代码 */}
            {contentMode === 'custom-svg' && (
              <div>
                <Label htmlFor="customSvg">{t("tools.icon-designer.custom_svg_label")}</Label>
                <textarea
                  id="customSvg"
                  value={customSvg}
                  onChange={(e) => setCustomSvg(e.target.value)}
                  placeholder={t("tools.icon-designer.custom_svg_placeholder")}
                  className="w-full mt-2 p-3 border rounded-lg font-mono text-sm min-h-[120px] bg-background"
                  style={{ resize: 'vertical' }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("tools.icon-designer.custom_svg_hint")}
                </p>
              </div>
            )}

            {/* 形状选择 */}
            <div>
              <Label htmlFor="shape">{t("tools.icon-designer.shape_label")}</Label>
              <Select value={shape} onValueChange={(value) => setShape(value as IconShape)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">{t("tools.icon-designer.shapes.square")}</SelectItem>
                  <SelectItem value="circle">{t("tools.icon-designer.shapes.circle")}</SelectItem>
                  <SelectItem value="rounded">{t("tools.icon-designer.shapes.rounded")}</SelectItem>
                  <SelectItem value="squircle">{t("tools.icon-designer.shapes.squircle")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 文字模式：字体大小和粗细 */}
            {contentMode === 'text' && (
              <>
                <div>
                  <Label htmlFor="fontSize">
                    {t("tools.icon-designer.font_size_label")}: {fontSize[0]}px
                  </Label>
                  <Slider
                    id="fontSize"
                    min={20}
                    max={180}
                    step={5}
                    value={fontSize}
                    onValueChange={setFontSize}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="fontWeight">{t("tools.icon-designer.font_weight_label")}</Label>
                  <Select value={fontWeight} onValueChange={(value) => setFontWeight(value as FontWeight)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">{t("tools.icon-designer.font_weights.normal")}</SelectItem>
                      <SelectItem value="medium">{t("tools.icon-designer.font_weights.medium")}</SelectItem>
                      <SelectItem value="bold">{t("tools.icon-designer.font_weights.bold")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* 图标/自定义SVG模式：图标大小 */}
            {(contentMode === 'icon' || contentMode === 'custom-svg') && (
              <div>
                <Label htmlFor="iconSize">
                  {t("tools.icon-designer.icon_size_label")}: {iconSize[0]}%
                </Label>
                <Slider
                  id="iconSize"
                  min={20}
                  max={200}
                  step={5}
                  value={iconSize}
                  onValueChange={setIconSize}
                  className="mt-2"
                />
              </div>
            )}

            {/* 图标库模式：图标颜色 */}
            {contentMode === 'icon' && (
              <div>
                <Label htmlFor="iconColor">{t("tools.icon-designer.icon_color")}</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="color"
                    value={iconColor}
                    onChange={(e) => setIconColor(e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={iconColor}
                    onChange={(e) => setIconColor(e.target.value)}
                    className="flex-1 uppercase"
                  />
                </div>
                
                {/* 预设颜色选择 */}
                <div className="mt-3">
                  <Label className="text-xs">{t("tools.icon-designer.preset_colors")}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {SVG_PRESET_COLORS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => setIconColor(preset.color)}
                        className={`w-9 h-9 rounded-md border-2 transition-colors ${
                          iconColor.toLowerCase() === preset.color.toLowerCase()
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-primary'
                        }`}
                        style={{ backgroundColor: preset.color }}
                        title={preset.name}
                      >
                        {preset.color === '#FFFFFF' && (
                          <div className="w-full h-full rounded-sm border border-gray-200" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 自定义SVG模式：SVG颜色 */}
            {contentMode === 'custom-svg' && (
              <div>
                <Label htmlFor="customSvgColor">{t("tools.icon-designer.custom_svg_color")}</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="color"
                    value={customSvgColor}
                    onChange={(e) => setCustomSvgColor(e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={customSvgColor}
                    onChange={(e) => setCustomSvgColor(e.target.value)}
                    className="flex-1 uppercase"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("tools.icon-designer.custom_svg_color_hint")}
                </p>
                
                {/* 预设颜色选择 */}
                <div className="mt-3">
                  <Label className="text-xs">{t("tools.icon-designer.preset_colors")}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {SVG_PRESET_COLORS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => setCustomSvgColor(preset.color)}
                        className={`w-9 h-9 rounded-md border-2 transition-colors ${
                          customSvgColor.toLowerCase() === preset.color.toLowerCase()
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-primary'
                        }`}
                        style={{ backgroundColor: preset.color }}
                        title={preset.name}
                      >
                        {preset.color === '#FFFFFF' && (
                          <div className="w-full h-full rounded-sm border border-gray-200" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 背景模式选择 */}
            <div>
              <Label htmlFor="bgMode">{t("tools.icon-designer.background_mode")}</Label>
              <Select value={bgMode} onValueChange={(value) => {
                setBgMode(value as BackgroundMode)
                // 切换模式时重置区域颜色
                if (value === 'multicolor') {
                  const template = MULTICOLOR_TEMPLATES.find(t => t.id === selectedTemplate)
                  if (template) {
                    setRegionColors(Object.fromEntries(
                      template.regions.map(r => [r.id, r.defaultColor])
                    ))
                  }
                }
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">{t("tools.icon-designer.mode_solid")}</SelectItem>
                  <SelectItem value="multicolor">{t("tools.icon-designer.mode_multicolor")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* 文字显示开关（仅文字模式） */}
            {contentMode === 'text' && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="showText" className="cursor-pointer">
                  {t("tools.icon-designer.show_text")}
                </Label>
                <Switch
                  id="showText"
                  checked={showText}
                  onCheckedChange={setShowText}
                />
              </div>
            )}

            {/* 纯色模式：颜色设置 */}
            {bgMode === 'solid' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bgColor">{t("tools.icon-designer.background_color")}</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="flex-1 uppercase"
                    />
                  </div>
                </div>

                {/* 文字颜色（仅文字模式） */}
                {contentMode === 'text' && showText && (
                  <div>
                    <Label htmlFor="textColor">{t("tools.icon-designer.text_color")}</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="flex-1 uppercase"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 多色模式：几何模板选择 */}
            {bgMode === 'multicolor' && (
              <div className="space-y-4">
                {/* 选择模板按钮 */}
                <div>
                  <Label>{t("tools.icon-designer.multicolor_template")}</Label>
                  <Button
                    variant="outline"
                    className="w-full mt-2 justify-start"
                    onClick={() => setShowTemplateModal(true)}
                  >
                    <Grid3x3 className="h-4 w-4 mr-2" />
                    {MULTICOLOR_TEMPLATES.find(t => t.id === selectedTemplate)?.name || 'Select Template'}
                  </Button>
                </div>

                {/* 当前模板预览 */}
                <div className="border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-center justify-center">
                    <div 
                      style={{ width: '128px', height: '128px' }}
                      dangerouslySetInnerHTML={{ __html: generateSVG(128) }}
                    />
                  </div>
                </div>

                {/* 区域颜色自定义 */}
                <div>
                  <Label>{t("tools.icon-designer.region_colors")}</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {MULTICOLOR_TEMPLATES.find(t => t.id === selectedTemplate)?.regions.map((region) => (
                      <div key={region.id} className="flex items-center gap-2 p-2 border rounded-md">
                        <Label className="flex-1 text-sm">{region.label}</Label>
                        <Input
                          type="color"
                          value={regionColors[region.id] || region.defaultColor}
                          onChange={(e) => setRegionColors(prev => ({
                            ...prev,
                            [region.id]: e.target.value
                          }))}
                          className="w-12 h-8 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={regionColors[region.id] || region.defaultColor}
                          onChange={(e) => setRegionColors(prev => ({
                            ...prev,
                            [region.id]: e.target.value
                          }))}
                          className="w-24 h-8 text-xs uppercase"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 文字颜色（仅文字模式） */}
                {contentMode === 'text' && showText && (
                  <div>
                    <Label htmlFor="textColor">{t("tools.icon-designer.text_color")}</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="flex-1 uppercase"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 预设颜色（仅纯色模式） */}
            {bgMode === 'solid' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>{t("tools.icon-designer.preset_colors")}</Label>
                  <Button
                    onClick={randomizeColors}
                    variant="ghost"
                    size="sm"
                    className="h-8"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    {t("tools.icon-designer.random")}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyPresetColor(preset)}
                      className="w-10 h-10 rounded-md border-2 border-muted hover:border-primary transition-colors"
                      style={{ backgroundColor: preset.bg }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 预览面板 */}
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.icon-designer.preview_title")}</CardTitle>
            <CardDescription>
              {t("tools.icon-designer.preview_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 预览尺寸选择器 */}
            <div className="space-y-2">
              <Label>{t("tools.icon-designer.preview_size_label")}</Label>
              <Select value={previewSize.toString()} onValueChange={(value) => setPreviewSize(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_SIZES.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}×{size} px
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 主预览 */}
            <div className="border rounded-lg bg-muted/20 overflow-auto" style={{ maxHeight: '400px' }}>
              <div className="p-8 flex flex-col items-center justify-center gap-4 min-h-[300px]">
                <div 
                  ref={svgRef}
                  className="drop-shadow-lg"
                  style={{ 
                    width: `${previewSize}px`, 
                    height: `${previewSize}px`
                  }}
                  dangerouslySetInnerHTML={{ __html: generateSVG(previewSize) }}
                />
                <div className="text-sm text-muted-foreground font-medium flex flex-col items-center gap-1">
                  <div>{t("tools.icon-designer.actual_size")}: {previewSize}×{previewSize} px</div>
                  {previewSize > 256 && (
                    <div className="text-xs text-primary">
                      {t("tools.icon-designer.scroll_to_view")}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 多尺寸预览 */}
            <div>
              <Label className="mb-2 block">{t("tools.icon-designer.size_preview")}</Label>
              <div className="flex items-end gap-4 p-4 bg-muted/20 rounded-lg border">
                {[16, 32, 64, 128].map((size) => (
                  <div key={size} className="flex flex-col items-center gap-1">
                    <div
                      style={{ width: `${size}px`, height: `${size}px` }}
                      dangerouslySetInnerHTML={{ __html: generateSVG(size) }}
                    />
                    <span className="text-xs text-muted-foreground">{size}px</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(generateSVG(previewSize))
                  }}
                  variant="outline" 
                  className="flex-1"
                  title={`${t("tools.icon-designer.copy_svg")} (${previewSize}×${previewSize})`}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {t("tools.icon-designer.copy_svg")}
                </Button>
                <Button 
                  onClick={() => downloadSVG(previewSize)}
                  variant="default" 
                  className="flex-1"
                  title={`SVG (${previewSize}×${previewSize})`}
                >
                  <Download className="h-4 w-4 mr-2" />
                  SVG ({previewSize}px)
                </Button>
              </div>
              <Button 
                onClick={() => downloadPNG(previewSize)}
                variant="outline"
                className="w-full"
                title={`PNG (${previewSize}×${previewSize})`}
              >
                <Download className="h-4 w-4 mr-2" />
                PNG ({previewSize}px)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 导出选项 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("tools.icon-designer.export_title")}</CardTitle>
          <CardDescription>
            {t("tools.icon-designer.export_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 批量下载区域 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 批量下载所有格式 */}
            <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <PackageIcon className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold">{t("tools.icon-designer.batch_download_selected")}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("tools.icon-designer.batch_download_selected_desc")}
                    </p>
                  </div>
                </div>
                
                {/* 选中数量显示 */}
                <div className="flex items-center justify-between p-2 bg-background/50 rounded border">
                  <span className="text-sm font-medium">
                    {t("tools.icon-designer.selected_count")}: <span className="text-primary">{selectedSizes.length}</span> / {ICON_SIZES.length}
                  </span>
                  <Button
                    onClick={toggleAllSizes}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    {selectedSizes.length === ICON_SIZES.length 
                      ? t("tools.icon-designer.deselect_all")
                      : t("tools.icon-designer.select_all")}
                  </Button>
                </div>

                <Button
                  onClick={() => downloadAllSizes('both')}
                  variant="default"
                  size="lg"
                  className="w-full"
                  disabled={selectedSizes.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t("tools.icon-designer.download_all_formats")}
                </Button>
                <div className="flex gap-2">
                  <Button
                    onClick={() => downloadAllSizes('svg')}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={selectedSizes.length === 0}
                  >
                    SVG {t("tools.icon-designer.only")}
                  </Button>
                  <Button
                    onClick={() => downloadAllSizes('png')}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={selectedSizes.length === 0}
                  >
                    PNG {t("tools.icon-designer.only")}
                  </Button>
                </div>
                {selectedSizes.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {t("tools.icon-designer.zip_includes")}: {selectedSizes.length} {t("tools.icon-designer.sizes")} × 2 {t("tools.icon-designer.formats")}
                  </div>
                )}
              </div>
            </div>

            {/* 多尺寸ICO文件 */}
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Download className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold">{t("tools.icon-designer.ico_download_title")}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("tools.icon-designer.ico_download_desc")}
                    </p>
                  </div>
                </div>
                
                {/* 选中尺寸ICO */}
                <div className="space-y-2">
                  <Button
                    onClick={() => downloadICO(true)}
                    variant="default"
                    size="lg"
                    className="w-full"
                    disabled={selectedSizes.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t("tools.icon-designer.download_selected_ico")}
                  </Button>
                  {selectedSizes.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {t("tools.icon-designer.ico_includes")} {selectedSizes.length} {t("tools.icon-designer.ico_files")}
                    </div>
                  )}
                </div>

                {/* 标准ICO */}
                <div className="space-y-2">
                  <Button
                    onClick={() => downloadICO(false)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t("tools.icon-designer.download_standard_ico")}
                  </Button>
                  <div className="text-xs text-muted-foreground">
                    {t("tools.icon-designer.standard_ico_desc")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 单独尺寸导出 */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              {t("tools.icon-designer.individual_sizes")}
              <span className="text-xs font-normal text-muted-foreground">
                ({t("tools.icon-designer.click_to_select")})
              </span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
              {ICON_SIZES.map((size) => {
                const previewDisplaySize = Math.min(Math.max(size, 16), 64)
                const isSelected = selectedSizes.includes(size)
                
                return (
                  <div 
                    key={size} 
                    className={`
                      relative space-y-2 p-2.5 rounded-lg cursor-pointer transition-all overflow-hidden
                      ${isSelected 
                        ? 'border-2 border-primary bg-primary/10 shadow-md' 
                        : 'border border-muted hover:border-primary/50 hover:shadow-sm bg-card'
                      }
                    `}
                    onClick={() => toggleSize(size)}
                  >
                    <div className="absolute top-1.5 right-1.5 z-10">
                      <div 
                        className={`
                          w-5 h-5 rounded flex items-center justify-center transition-colors
                          ${isSelected 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-background border-2 border-muted-foreground/30'
                          }
                        `}
                      >
                        {isSelected && <CheckSquare className="h-3 w-3" />}
                      </div>
                    </div>

                    {size <= 64 ? (
                      <div className="flex items-center justify-center p-2 bg-muted/20 rounded min-h-[64px]">
                        <div
                          style={{ 
                            width: `${previewDisplaySize}px`, 
                            height: `${previewDisplaySize}px`
                          }}
                          dangerouslySetInnerHTML={{ __html: generateSVG(size) }}
                        />
                      </div>
                    ) : (
                      <div 
                        className="flex flex-col items-center justify-center p-2 bg-gradient-to-br from-muted/30 to-muted/10 rounded min-h-[64px] cursor-pointer hover:from-muted/40 hover:to-muted/20 transition-all border border-dashed border-muted-foreground/20"
                        onClick={(e) => {
                          e.stopPropagation()
                          setModalPreviewSize(size)
                        }}
                      >
                        <Maximize2 className="h-6 w-6 text-muted-foreground/60 mb-1" />
                        <span className="text-xs text-muted-foreground/80">
                          {t("tools.icon-designer.click_preview")}
                        </span>
                      </div>
                    )}
                    <div className={`text-xs font-medium text-center ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                      {size}×{size}
                    </div>
                    <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        onClick={() => downloadSVG(size)}
                        variant="outline"
                        size="sm"
                        className="w-full h-7 text-xs px-2"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        SVG
                      </Button>
                      <Button
                        onClick={() => downloadPNG(size)}
                        variant="outline"
                        size="sm"
                        className="w-full h-7 text-xs px-2"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        PNG
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SVG代码显示 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("tools.icon-designer.svg_code_title")}</CardTitle>
          <CardDescription>
            {t("tools.icon-designer.svg_code_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 p-4 rounded-lg">
            <pre className="text-sm whitespace-pre-wrap break-all">
              {generateSVG(256)}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t("tools.icon-designer.tips_title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">{t("tools.icon-designer.tip1_title")}</h4>
              <p className="text-sm text-muted-foreground">{t("tools.icon-designer.tip1_desc")}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">{t("tools.icon-designer.tip2_title")}</h4>
              <p className="text-sm text-muted-foreground">{t("tools.icon-designer.tip2_desc")}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">{t("tools.icon-designer.tip3_title")}</h4>
              <p className="text-sm text-muted-foreground">{t("tools.icon-designer.tip3_desc")}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">{t("tools.icon-designer.tip4_title")}</h4>
              <p className="text-sm text-muted-foreground">{t("tools.icon-designer.tip4_desc")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO优化内容 */}
      <ToolSEOSection toolId="icon-designer" />

      {/* 模板选择弹框 */}
      {showTemplateModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4"
          onClick={() => setShowTemplateModal(false)}
        >
          <div 
            className="relative bg-background border rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹框标题栏 */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold">{t("tools.icon-designer.select_template")}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("tools.icon-designer.template_categories")} · {MULTICOLOR_TEMPLATES.length} {t("tools.icon-designer.all_templates")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTemplateModal(false)}
                className="h-10 w-10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* 分类标签 */}
            <div className="flex items-center gap-2 px-6 py-4 border-b overflow-x-auto">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                {t("tools.icon-designer.all_templates")} ({MULTICOLOR_TEMPLATES.length})
              </Button>
              {TEMPLATE_CATEGORIES.map((cat) => {
                const count = MULTICOLOR_TEMPLATES.filter(t => t.category === cat.id).length
                return (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.nameZh} ({count})
                  </Button>
                )
              })}
            </div>

            {/* 模板网格 */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {MULTICOLOR_TEMPLATES
                  .filter(template => selectedCategory === 'all' || template.category === selectedCategory)
                  .map((template) => {
                    const previewSize = 80
                    // 应用当前形状生成预览
                    let clipPathDef = ''
                    let clipAttr = ''
                    if (shape !== 'square') {
                      const clipPath = getShapeClipPath(previewSize, template.id)
                      if (clipPath) {
                        clipPathDef = `<defs>${clipPath}</defs>`
                        clipAttr = ` clip-path="url(#shape-clip-${template.id})"`
                      }
                    }
                    
                    const previewSVG = `<svg width="${previewSize}" height="${previewSize}" viewBox="0 0 ${previewSize} ${previewSize}" xmlns="http://www.w3.org/2000/svg">
                      ${clipPathDef}
                      ${template.regions.map(region => {
                        const color = selectedTemplate === template.id ? (regionColors[region.id] || region.defaultColor) : region.defaultColor
                        return `<path d="${region.path(previewSize)}" fill="${color}"${clipAttr}/>`
                      }).join('')}
                    </svg>`
                    
                    return (
                      <button
                        key={template.id}
                        onClick={() => {
                          setSelectedTemplate(template.id)
                          setRegionColors(Object.fromEntries(
                            template.regions.map(r => [r.id, r.defaultColor])
                          ))
                          setShowTemplateModal(false)
                        }}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:shadow-lg ${
                          selectedTemplate === template.id 
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        <div 
                          className="w-full aspect-square flex items-center justify-center bg-muted/20 rounded"
                          dangerouslySetInnerHTML={{ __html: previewSVG }} 
                        />
                        <span className="text-xs font-medium text-center leading-tight">{template.name}</span>
                      </button>
                    )
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 图标库选择弹窗 */}
      {showIconLibrary && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4"
          onClick={() => setShowIconLibrary(false)}
        >
          <div 
            className="relative bg-background border rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹框标题栏 */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold">{t("tools.icon-designer.icon_library_title")}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {ICON_LIBRARY.length} {t("tools.icon-designer.icons_available")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowIconLibrary(false)}
                className="h-10 w-10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* 分类标签 */}
            <div className="flex items-center gap-2 px-6 py-4 border-b overflow-x-auto">
              <Button
                variant={selectedIconCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedIconCategory('all')}
              >
                {t("tools.icon-designer.all_icons")} ({ICON_LIBRARY.length})
              </Button>
              {ICON_CATEGORIES.map((cat) => {
                const count = ICON_LIBRARY.filter(i => i.category === cat.id).length
                return (
                  <Button
                    key={cat.id}
                    variant={selectedIconCategory === cat.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedIconCategory(cat.id)}
                  >
                    {cat.nameZh} ({count})
                  </Button>
                )
              })}
            </div>

            {/* 图标网格 */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {ICON_LIBRARY
                  .filter(icon => selectedIconCategory === 'all' || icon.category === selectedIconCategory)
                  .map((icon) => {
                    const isSelected = selectedIcon?.id === icon.id
                    
                    return (
                      <button
                        key={icon.id}
                        onClick={() => {
                          setSelectedIcon(icon)
                          setShowIconLibrary(false)
                        }}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:shadow-lg ${
                          isSelected 
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                            : 'border-muted hover:border-primary/50'
                        }`}
                        title={`${icon.nameZh} (${icon.name})`}
                      >
                        <div 
                          className="w-full aspect-square flex items-center justify-center bg-muted/30 rounded p-1"
                          style={{ color: 'currentColor' }}
                          dangerouslySetInnerHTML={{ 
                            __html: `<svg viewBox="0 0 24 24" width="32" height="32">${icon.svg}</svg>` 
                          }}
                        />
                        <span className="text-xs text-center leading-tight line-clamp-2">{icon.nameZh}</span>
                      </button>
                    )
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 全屏预览弹窗 */}
      {modalPreviewSize && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
          onClick={() => setModalPreviewSize(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh] overflow-auto">
            <button
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-background/80 hover:bg-background border border-muted-foreground/30 flex items-center justify-center transition-colors shadow-lg"
              onClick={() => setModalPreviewSize(null)}
              title={t("common.close") || "Close"}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-12 flex flex-col items-center justify-center gap-6">
              <div
                className="drop-shadow-2xl"
                style={{ 
                  width: `${modalPreviewSize}px`, 
                  height: `${modalPreviewSize}px`
                }}
                dangerouslySetInnerHTML={{ __html: generateSVG(modalPreviewSize) }}
              />
              <div className="text-center space-y-2">
                <div className="text-lg font-semibold">
                  {t("tools.icon-designer.actual_size")}: {modalPreviewSize}×{modalPreviewSize} px
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      downloadSVG(modalPreviewSize)
                    }}
                    variant="default"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    SVG ({modalPreviewSize}px)
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      downloadPNG(modalPreviewSize)
                    }}
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PNG ({modalPreviewSize}px)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
