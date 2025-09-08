export interface Tool {
  id: string
  nameKey: string
  descriptionKey: string
  category: string
  path: string
  icon?: string
}

export interface ToolCategory {
  id: string
  nameKey: string
  descriptionKey: string
  icon?: string
  tools: Tool[]
}

export const toolsConfig: ToolCategory[] = [
  {
    id: "json",
    nameKey: "categories.json",
    descriptionKey: "categories.json_desc",
    icon: "braces",
    tools: [
      {
        id: "json-formatter",
        nameKey: "tools.json-formatter.name",
        descriptionKey: "tools.json-formatter.description",
        category: "json",
        path: "/tools/json-formatter",
        icon: "code"
      },
      {
        id: "json-to-csv",
        nameKey: "tools.json-to-csv.name",
        descriptionKey: "tools.json-to-csv.description",
        category: "json",
        path: "/tools/json-to-csv",
        icon: "table"
      },
      {
        id: "json-to-yaml",
        nameKey: "tools.json-to-yaml.name",
        descriptionKey: "tools.json-to-yaml.description",
        category: "json",
        path: "/tools/json-to-yaml",
        icon: "file-text"
      }
    ]
  },
  {
    id: "text",
    nameKey: "categories.text",
    descriptionKey: "categories.text_desc",
    icon: "type",
    tools: []
  },
  {
    id: "crypto",
    nameKey: "categories.crypto",
    descriptionKey: "categories.crypto_desc",
    icon: "shield",
    tools: []
  },
  {
    id: "network",
    nameKey: "categories.network",
    descriptionKey: "categories.network_desc",
    icon: "globe",
    tools: []
  },
  {
    id: "image", 
    nameKey: "categories.image",
    descriptionKey: "categories.image_desc",
    icon: "image",
    tools: []
  }
]