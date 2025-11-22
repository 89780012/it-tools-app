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
    id: "developer",
    nameKey: "categories.developer",
    descriptionKey: "categories.developer_desc",
    icon: "code",
    tools: [
      {
        id: "cron-expression-parser",
        nameKey: "tools.cron-expression-parser.name",
        descriptionKey: "tools.cron-expression-parser.description",
        category: "developer",
        path: "/tools/cron-expression-parser",
        icon: "clock-8"
      },
      {
        id: "curl-converter",
        nameKey: "tools.curl-converter.name",
        descriptionKey: "tools.curl-converter.description",
        category: "developer",
        path: "/tools/curl-converter",
        icon: "terminal"
      }
    ]
  },
  {
    id: "json-converters",
    nameKey: "categories.json_converters",
    descriptionKey: "categories.json_converters_desc",
    icon: "repeat",
    tools: [
      {
        id: "json-to-csv",
        nameKey: "tools.json-to-csv.name",
        descriptionKey: "tools.json-to-csv.description",
        category: "json-converters",
        path: "/tools/json-to-csv",
        icon: "table"
      },
      {
        id: "csv-to-json",
        nameKey: "tools.csv-to-json.name",
        descriptionKey: "tools.csv-to-json.description",
        category: "json-converters",
        path: "/tools/csv-to-json",
        icon: "file-json"
      },
      {
        id: "json-to-yaml",
        nameKey: "tools.json-to-yaml.name",
        descriptionKey: "tools.json-to-yaml.description",
        category: "json-converters",
        path: "/tools/json-to-yaml",
        icon: "file-text"
      },
      {
        id: "yaml-to-json",
        nameKey: "tools.yaml-to-json.name",
        descriptionKey: "tools.yaml-to-json.description",
        category: "json-converters",
        path: "/tools/yaml-to-json",
        icon: "file-json"
      },
      {
        id: "json-to-xml",
        nameKey: "tools.json-to-xml.name",
        descriptionKey: "tools.json-to-xml.description",
        category: "json-converters",
        path: "/tools/json-to-xml",
        icon: "file-code"
      },
      {
        id: "xml-to-json",
        nameKey: "tools.xml-to-json.name",
        descriptionKey: "tools.xml-to-json.description",
        category: "json-converters",
        path: "/tools/xml-to-json",
        icon: "file-input"
      },
      {
        id: "color-converter",
        nameKey: "tools.color-converter.name",
        descriptionKey: "tools.color-converter.description",
        category: "json-converters",
        path: "/tools/color-converter",
        icon: "palette"
      },
      {
        id: "json-to-toml",
        nameKey: "tools.json-to-toml.name",
        descriptionKey: "tools.json-to-toml.description",
        category: "json-converters",
        path: "/tools/json-to-toml",
        icon: "file-cog"
      },
      {
        id: "toml-to-json",
        nameKey: "tools.toml-to-json.name",
        descriptionKey: "tools.toml-to-json.description",
        category: "json-converters",
        path: "/tools/toml-to-json",
        icon: "file-json"
      },
      {
        id: "yaml-to-toml",
        nameKey: "tools.yaml-to-toml.name",
        descriptionKey: "tools.yaml-to-toml.description",
        category: "json-converters",
        path: "/tools/yaml-to-toml",
        icon: "file-cog"
      },
      {
        id: "toml-to-yaml",
        nameKey: "tools.toml-to-yaml.name",
        descriptionKey: "tools.toml-to-yaml.description",
        category: "json-converters",
        path: "/tools/toml-to-yaml",
        icon: "file-text"
      }
    ]
  },
  {
    id: "json-tools",
    nameKey: "categories.json_tools",
    descriptionKey: "categories.json_tools_desc",
    icon: "braces",
    tools: [
      {
        id: "json-formatter",
        nameKey: "tools.json-formatter.name",
        descriptionKey: "tools.json-formatter.description",
        category: "json-tools",
        path: "/tools/json-formatter",
        icon: "code"
      },
      {
        id: "json-visualizer",
        nameKey: "tools.json-visualizer.name",
        descriptionKey: "tools.json-visualizer.description",
        category: "json-tools",
        path: "/tools/json-visualizer",
        icon: "eye"
      },
      {
        id: "json-generator",
        nameKey: "tools.json-generator.name",
        descriptionKey: "tools.json-generator.description",
        category: "json-tools",
        path: "/tools/json-generator",
        icon: "database"
      },
      {
        id: "json-diff",
        nameKey: "tools.json-diff.name",
        descriptionKey: "tools.json-diff.description",
        category: "json-tools",
        path: "/tools/json-diff",
        icon: "git-compare"
      }
    ]
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
        icon: "square-dashed"
      },
      {
        id: "icon-designer",
        nameKey: "tools.icon-designer.name",
        descriptionKey: "tools.icon-designer.description",
        category: "image",
        path: "/tools/icon-designer",
        icon: "palette"
      },
      {
        id: "base64-file-converter",
        nameKey: "tools.base64-file-converter.name",
        descriptionKey: "tools.base64-file-converter.description",
        category: "image",
        path: "/tools/base64-file-converter",
        icon: "file-code"
      },
      {
        id: "image-to-dot-matrix",
        nameKey: "tools.image-to-dot-matrix.name",
        descriptionKey: "tools.image-to-dot-matrix.description",
        category: "image",
        path: "/tools/image-to-dot-matrix",
        icon: "grid-3x3"
      }
    ]
  },
  {
    id: "generators",
    nameKey: "categories.generators",
    descriptionKey: "categories.generators_desc",
    icon: "sparkles",
    tools: [
      {
        id: "uuid-generator",
        nameKey: "tools.uuid-generator.name",
        descriptionKey: "tools.uuid-generator.description",
        category: "generators",
        path: "/tools/uuid-generator",
        icon: "fingerprint"
      },
      {
        id: "password-generator",
        nameKey: "tools.password-generator.name",
        descriptionKey: "tools.password-generator.description",
        category: "generators",
        path: "/tools/password-generator",
        icon: "key"
      }
    ]
  },
  {
    id: "docker",
    nameKey: "categories.docker",
    descriptionKey: "categories.docker_desc",
    icon: "container",
    tools: [
      {
        id: "docker-run-to-compose",
        nameKey: "tools.docker-run-to-compose.name",
        descriptionKey: "tools.docker-run-to-compose.description",
        category: "docker",
        path: "/tools/docker-run-to-compose",
        icon: "box"
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
        icon: "code-xml"
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
        icon: "fingerprint"
      },
      {
        id: "sha256-hash",
        nameKey: "tools.sha256-hash.name",
        descriptionKey: "tools.sha256-hash.description",
        category: "crypto",
        path: "/tools/sha256-hash",
        icon: "shield-check"
      },
      {
        id: "sha1-hash",
        nameKey: "tools.sha1-hash.name",
        descriptionKey: "tools.sha1-hash.description",
        category: "crypto",
        path: "/tools/sha1-hash",
        icon: "scan-line"
      },
      {
        id: "hex-encoder-decoder",
        nameKey: "tools.hex-encoder-decoder.name",
        descriptionKey: "tools.hex-encoder-decoder.description",
        category: "crypto",
        path: "/tools/hex-encoder-decoder",
        icon: "hexagon"
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
        id: "aes-encrypt-decrypt",
        nameKey: "tools.aes-encrypt-decrypt.name",
        descriptionKey: "tools.aes-encrypt-decrypt.description",
        category: "crypto",
        path: "/tools/aes-encrypt-decrypt",
        icon: "lock"
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
        icon: "shield-ellipsis"
      }
    ]
  },
  {
    id: "network",
    nameKey: "categories.network",
    descriptionKey: "categories.network_desc",
    icon: "globe",
    tools: [
      {
        id: "ip-lookup",
        nameKey: "tools.ip-lookup.name",
        descriptionKey: "tools.ip-lookup.description",
        category: "network",
        path: "/tools/ip-lookup",
        icon: "map-pin"
      }
    ]
  },
  {
    id: "time",
    nameKey: "categories.time",
    descriptionKey: "categories.time_desc",
    icon: "clock",
    tools: [
      {
        id: "time-converter",
        nameKey: "tools.time-converter.name",
        descriptionKey: "tools.time-converter.description",
        category: "time",
        path: "/tools/time-converter",
        icon: "history"
      }
    ]
  }
 
]
