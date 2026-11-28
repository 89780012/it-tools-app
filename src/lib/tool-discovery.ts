import { visibleTools as allTools, type Tool } from './tools-config'
const aliases: Record<string, string> = {
  'semver-sorter': 'semantic version release tags prerelease 语义化版本 版本排序 发布标签',
  'time-converter': 'timestamp epoch unix 时间戳 时区 日期毫秒',
  'date-duration-calculator': 'date difference duration business days working days 日期差 日期间隔 工作日 节假日',
  'nginx-certificate-generator': 'ssl https letsencrypt 证书签发 免费证书',
  'tls-checker': 'ssl certificate expiry expiration 证书到期 证书检查 https',
  'dns-lookup': 'domain resolve txt mx cname 域名解析 dns查询',
  'json-formatter': 'json5 repair json修复 格式化',
  'json-lines-converter': 'jsonl ndjson json lines newline delimited 日志 逐行json',
  'text-set-operations':
    'intersection union difference list 交集 并集 差集 名单',
  'text-batch-processor':
    'uppercase lowercase camelcase snakecase 字数 大小写 驼峰 去重',
  'file-hash': 'checksum sha512 sha256 md5 文件校验 文件哈希',
  'curl-converter': 'http api postman request upload 接口调试 上传',
  'cron-expression-parser': 'crontab schedule 定时任务 cron生成',
  'qr-code-reader': 'qrcode scan decode 二维码识别 扫码',
  'image-compressor':
    'resize crop rotate convert webp 图片缩放 图片裁剪 图片转换 批量',
  'aspect-ratio-calculator': 'resolution resize dimensions 16:9 4:3 分辨率 等比缩放 宽高比',
  'csv-table-editor': 'tsv spreadsheet table 表格 去重 合并csv',
  'data-to-sql': 'insert mysql postgres sqlite sqlserver 导入数据',
  'chmod-calculator': 'linux permissions rwx 755 644 权限',
  'stream-debugger': 'websocket sse events streaming 流式 接口调试',
}
export function matchesTool(
  tool: Tool,
  query: string,
  translate: (key: string) => string,
) {
  const text = [
    tool.id,
    translate(tool.nameKey),
    translate(tool.descriptionKey),
    aliases[tool.id] ?? '',
  ]
    .join(' ')
    .toLocaleLowerCase()
  return query
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/)
    .every((word) => text.includes(word))
}
const workflows = [
  [
    'dns-lookup',
    'nginx-certificate-generator',
    'tls-checker',
    'certificate-parser',
    'nginx-cheatsheet',
    'ip-lookup',
  ],
  [
    'curl-converter',
    'stream-debugger',
    'jwt-decoder',
    'url-parser',
    'json-formatter',
  ],
  [
    'json-formatter',
    'json-diff',
    'jsonpath-query',
    'json-schema-validator',
    'json-to-types',
    'data-to-sql',
  ],
  [
    'csv-table-editor',
    'json-lines-converter',
    'csv-to-json',
    'json-to-csv',
    'data-to-sql',
    'text-set-operations',
    'text-batch-processor',
  ],
  [
    'image-compressor',
    'aspect-ratio-calculator',
    'qr-code-reader',
    'qr-code-generator',
    'base64-file-converter',
    'icon-designer',
  ],
  [
    'chmod-calculator',
    'linux-log-helper',
    'firewall-cheatsheet',
    'docker-cheatsheet',
    'nginx-cheatsheet',
  ],
  ['cron-expression-parser', 'time-converter', 'date-duration-calculator'],
]
export function relatedToolsFor(id: string, limit = 6) {
  const current = allTools.find((tool) => tool.id === id)
  if (!current) return []
  const ids = [
    ...new Set(workflows.filter((group) => group.includes(id)).flat()),
  ]
  const candidates = [
    ...ids.flatMap((key) => allTools.filter((tool) => tool.id === key)),
    ...allTools.filter((tool) => tool.category === current.category),
  ]
  return [
    ...new Map(
      candidates
        .filter((tool) => tool.id !== id)
        .map((tool) => [tool.id, tool]),
    ).values(),
  ].slice(0, limit)
}
