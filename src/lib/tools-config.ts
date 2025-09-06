export interface Tool {
  id: string
  name: string
  description: string
  category: string
  path: string
  icon?: string
}

export interface ToolCategory {
  id: string
  name: string
  description: string
  icon?: string
  tools: Tool[]
}

export const toolsConfig: ToolCategory[] = [
  {
    id: "json",
    name: "JSON工具",
    description: "JSON数据处理和验证工具",
    icon: "braces",
    tools: [
      {
        id: "json-formatter",
        name: "JSON格式化器",
        description: "格式化、验证和压缩JSON数据",
        category: "json",
        path: "/tools/json-formatter",
        icon: "code"
      }
    ]
  },
  {
    id: "text",
    name: "文本工具", 
    description: "文本处理和转换工具",
    icon: "type",
    tools: []
  },
  {
    id: "crypto",
    name: "加密工具",
    description: "加密解密和哈希工具", 
    icon: "shield",
    tools: []
  },
  {
    id: "network",
    name: "网络工具",
    description: "网络调试和测试工具",
    icon: "globe",
    tools: []
  },
  {
    id: "image", 
    name: "图片工具",
    description: "图片处理和转换工具",
    icon: "image",
    tools: []
  }
]