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
      },
      {
        id: "json-to-xml",
        nameKey: "tools.json-to-xml.name",
        descriptionKey: "tools.json-to-xml.description",
        category: "json",
        path: "/tools/json-to-xml",
        icon: "file-code"
      },
      {
        id: "json-visualizer",
        nameKey: "tools.json-visualizer.name",
        descriptionKey: "tools.json-visualizer.description",
        category: "json",
        path: "/tools/json-visualizer",
        icon: "eye"
      },
      {
        id: "json-generator",
        nameKey: "tools.json-generator.name",
        descriptionKey: "tools.json-generator.description",
        category: "json",
        path: "/tools/json-generator",
        icon: "database"
      },
      {
        id: "json-diff",
        nameKey: "tools.json-diff.name",
        descriptionKey: "tools.json-diff.description",
        category: "json",
        path: "/tools/json-diff",
        icon: "git-compare"
      }
    ]
  },
  {
    id: "text",
    nameKey: "categories.text",
    descriptionKey: "categories.text_desc",
    icon: "type",
    tools: [
      {
        id: "base64-encoder-decoder",
        nameKey: "tools.base64-encoder-decoder.name",
        descriptionKey: "tools.base64-encoder-decoder.description",
        category: "text",
        path: "/tools/base64-encoder-decoder",
        icon: "binary"
      },
      {
        id: "url-encoder-decoder",
        nameKey: "tools.url-encoder-decoder.name",
        descriptionKey: "tools.url-encoder-decoder.description",
        category: "text",
        path: "/tools/url-encoder-decoder",
        icon: "link"
      }
    ]
  },
  {
    id: "crypto",
    nameKey: "categories.crypto",
    descriptionKey: "categories.crypto_desc",
    icon: "shield",
    tools: [
      {
        id: "md5-hash",
        nameKey: "tools.md5-hash.name",
        descriptionKey: "tools.md5-hash.description",
        category: "crypto",
        path: "/tools/md5-hash",
        icon: "hash"
      },
      {
        id: "sha256-hash",
        nameKey: "tools.sha256-hash.name",
        descriptionKey: "tools.sha256-hash.description",
        category: "crypto",
        path: "/tools/sha256-hash",
        icon: "hash"
      },
      {
        id: "sha1-hash",
        nameKey: "tools.sha1-hash.name",
        descriptionKey: "tools.sha1-hash.description",
        category: "crypto",
        path: "/tools/sha1-hash",
        icon: "hash"
      },
      {
        id: "hex-encoder-decoder",
        nameKey: "tools.hex-encoder-decoder.name",
        descriptionKey: "tools.hex-encoder-decoder.description",
        category: "crypto",
        path: "/tools/hex-encoder-decoder",
        icon: "binary"
      },
      {
        id: "binary-encoder-decoder",
        nameKey: "tools.binary-encoder-decoder.name",
        descriptionKey: "tools.binary-encoder-decoder.description",
        category: "crypto",
        path: "/tools/binary-encoder-decoder",
        icon: "binary"
      },
      {
        id: "password-generator",
        nameKey: "tools.password-generator.name",
        descriptionKey: "tools.password-generator.description",
        category: "crypto",
        path: "/tools/password-generator",
        icon: "key"
      },
      {
        id: "aes-encrypt-decrypt",
        nameKey: "tools.aes-encrypt-decrypt.name",
        descriptionKey: "tools.aes-encrypt-decrypt.description",
        category: "crypto",
        path: "/tools/aes-encrypt-decrypt",
        icon: "shield-check"
      },
      {
        id: "rsa-encrypt-decrypt",
        nameKey: "tools.rsa-encrypt-decrypt.name",
        descriptionKey: "tools.rsa-encrypt-decrypt.description",
        category: "crypto",
        path: "/tools/rsa-encrypt-decrypt",
        icon: "key-round"
      },
      {
        id: "hmac-generator",
        nameKey: "tools.hmac-generator.name",
        descriptionKey: "tools.hmac-generator.description",
        category: "crypto",
        path: "/tools/hmac-generator",
        icon: "hash"
      }
    ]
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
    tools: [
      {
        id: "qr-code-generator",
        nameKey: "tools.qr-code-generator.name",
        descriptionKey: "tools.qr-code-generator.description",
        category: "image",
        path: "/tools/qr-code-generator",
        icon: "qr-code"
      },
      {
        id: "svg-placeholder-generator",
        nameKey: "tools.svg-placeholder-generator.name",
        descriptionKey: "tools.svg-placeholder-generator.description",
        category: "image",
        path: "/tools/svg-placeholder-generator",
        icon: "image"
      }
    ]
  }
]