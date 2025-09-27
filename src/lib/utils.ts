import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 生成 textarea 组件的样式类名
 * @param variant - textarea 变体类型：'input' (输入框) 或 'output' (输出框)
 * @param isValid - 是否为有效状态，用于错误样式显示 (默认: true)
 * @returns 合并后的 CSS 类名字符串
 */
export function getTextareaClasses(
  variant: 'input' | 'output',
  isValid: boolean = true
): string {
  return cn(
    // 基础高度和字体样式
    "min-h-[300px] font-mono text-sm",
    // 响应式最大高度：移动端 300px，桌面端 500px
    "max-h-[300px] lg:max-h-[300px]",
    // 滚动和拖拽控制
    "overflow-y-auto resize-none",
    // 输出框特殊背景样式
    variant === 'output' && "bg-muted/50",
    // 错误状态边框样式
    !isValid && "border-destructive"
  )
}
