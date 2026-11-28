import { visibleTools as allTools, type Tool } from './tools-config'
const aliases: Record<string, string> = {
  'css-cubic-bezier': 'cubic bezier easing curve transition animation timing function ease in out overshoot CSS 贝塞尔 缓动曲线 动画 过渡',
  'json-patch': 'RFC 6902 JSON Patch add remove replace move copy test operation array 补丁 操作数组 配置修改',
  'iso-week-calculator': 'ISO 8601 week date week number calendar week year Monday 周数 周编号 周日期 跨年 周报 排期',
  'css-clamp-generator': 'fluid typography responsive font size CSS clamp rem vw 响应式字号 流体排版 字体大小',
  'json-pointer': 'RFC 6901 JSON Pointer URI fragment reference resolve extract 精确路径 JSON指针 提取 片段',
  'ipv4-cidr-aggregator': 'IPv4 CIDR aggregate collapse summarize firewall allowlist merge networks 网段聚合 白名单 合并子网 防火墙',
  'unicode-normalizer': 'Unicode NFC NFD NFKC NFKD normalization combining accents fullwidth 规范化 标准化 重音 全角 半角 码点',
  'base32-encoder-decoder': 'RFC 4648 Base32 Base32hex UTF-8 hex bytes encoding decoding padding TOTP 编码 解码 填充 字节',
  'totp-generator': 'TOTP OTP 2FA MFA authenticator RFC 6238 Base32 动态验证码 双因素认证 一次性密码',
  'ipv6-subnet-calculator': 'IPv6 CIDR prefix network range subnet mask RFC 5952 IPv6子网 地址范围 前缀 掩码',
  'json-merge-patch': 'RFC 7396 merge patch configuration 合并补丁 配置合并 JSON合并',
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
  ['json-patch', 'json-merge-patch', 'json-pointer', 'json-diff', 'json-formatter'],
  ['css-cubic-bezier', 'css-clamp-generator', 'css-formatter', 'color-contrast-checker', 'aspect-ratio-calculator'],
  ['json-pointer', 'jsonpath-query', 'json-schema-validator', 'json-merge-patch', 'json-formatter'],
  ['ipv4-cidr-aggregator', 'subnet-calculator', 'ipv6-subnet-calculator', 'firewall-cheatsheet'],
  ['unicode-normalizer', 'string-escape', 'text-diff', 'text-batch-processor'],
  ['base32-encoder-decoder', 'base64-encoder-decoder', 'hex-encoder-decoder', 'totp-generator'],
  ['totp-generator', 'hmac-generator', 'jwt-decoder', 'time-converter'],
  ['ipv6-subnet-calculator', 'subnet-calculator', 'ip-lookup', 'dns-lookup'],
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
    'json-merge-patch',
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
  ['cron-expression-parser', 'time-converter', 'date-duration-calculator', 'iso-week-calculator'],
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
