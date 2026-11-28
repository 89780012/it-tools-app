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

function category(
  id: string,
  translationKey: string,
  icon: string,
  entries: [string, string][],
): ToolCategory {
  return {
    id,
    nameKey: `categories.${translationKey}`,
    descriptionKey: `categories.${translationKey}_desc`,
    icon,
    tools: entries.map(([toolId, toolIcon]) => ({
      id: toolId,
      nameKey: `tools.${toolId}.name`,
      descriptionKey: `tools.${toolId}.description`,
      category: id,
      path: `/tools/${toolId}`,
      icon: toolIcon,
    })),
  }
}

export const toolsConfig: ToolCategory[] = [
  category('developer', 'developer', 'code', [
    ['regex-tester', 'code'],
    ['sql-formatter', 'database'],
    ['data-to-sql', 'database'],
    ['chmod-calculator', 'shield'],
    ['number-base-converter', 'binary'],
    ['semver-sorter', 'git-branch'],
    ['git-cheatsheet', 'git-branch'],
    ['nginx-cheatsheet', 'server'],
    ['firewall-cheatsheet', 'shield'],
    ['linux-log-helper', 'terminal-square'],
  ]),
  category('api', 'api', 'terminal', [
    ['curl-converter', 'terminal'],
    ['stream-debugger', 'terminal'],
  ]),
  category('json-tools', 'json_tools', 'file-json', [
    ['json-formatter', 'code'],
    ['json-visualizer', 'eye'],
    ['json-generator', 'database'],
    ['jsonpath-query', 'file-json'],
    ['json-pointer', 'file-json'],
    ['json-schema-validator', 'shield-check'],
    ['i18n-json-translator', 'languages'],
    ['json-diff', 'git-compare'],
    ['json-merge-patch', 'file-json'],
    ['json-patch', 'file-json'],
    ['json-key-fixer', 'file-diff'],
  ]),
  category('json-converters', 'json_converters', 'file-code', [
    ['json-lines-converter', 'file-json'],
    ['json-to-csv', 'table'],
    ['json-to-yaml', 'file-text'],
    ['json-to-xml', 'file-code'],
    ['json-to-toml', 'file-cog'],
    ['yaml-to-json', 'file-json'],
    ['yaml-to-toml', 'file-cog'],
    ['toml-to-json', 'file-json'],
    ['toml-to-yaml', 'file-text'],
    ['csv-to-json', 'file-json'],
    ['csv-table-editor', 'table'],
    ['xml-to-json', 'file-input'],
    ['yaml-formatter', 'file-text'],
    ['xml-formatter', 'file-code'],
  ]),
  category('text', 'text', 'file-text', [
    ['unicode-normalizer', 'type'],
    ['text-diff', 'git-compare'],
    ['text-batch-processor', 'file-text'],
    ['text-set-operations', 'git-compare'],
    ['string-escape', 'code-xml'],
    ['base64-encoder-decoder', 'code-xml'],
    ['url-encoder-decoder', 'link'],
    ['hex-encoder-decoder', 'hexagon'],
    ['binary-encoder-decoder', 'binary'],
  ]),
  category('generators', 'generators', 'code', [
    ['json-to-types', 'file-code'],
    ['uuid-generator', 'fingerprint'],
    ['password-generator', 'key'],
  ]),
  category('frontend', 'frontend', 'palette', [
    ['css-cubic-bezier', 'code'],
    ['css-clamp-generator', 'type'],
    ['markdown-preview', 'file-text'],
    ['css-formatter', 'file-code'],
    ['color-converter', 'palette'],
    ['color-contrast-checker', 'eye'],
  ]),
  category('image', 'image', 'grid-3x3', [
    ['image-compressor', 'file-input'],
    ['aspect-ratio-calculator', 'square-dashed'],
    ['qr-code-generator', 'qr-code'],
    ['qr-code-reader', 'qr-code'],
    ['svg-placeholder-generator', 'square-dashed'],
    ['icon-designer', 'palette'],
    ['base64-file-converter', 'file-code'],
    ['image-to-dot-matrix', 'grid-3x3'],
  ]),
  category('crypto', 'crypto', 'shield', [
    ['totp-generator', 'key'],
    ['jwt-decoder', 'key'],
    ['nginx-certificate-generator', 'shield-check'],
    ['certificate-parser', 'shield-check'],
    ['file-hash', 'fingerprint'],
    ['md5-hash', 'fingerprint'],
    ['sha256-hash', 'shield-check'],
    ['sha1-hash', 'scan-line'],
    ['aes-encrypt-decrypt', 'lock'],
    ['rsa-encrypt-decrypt', 'key-round'],
    ['hmac-generator', 'shield-ellipsis'],
  ]),
  category('network', 'network', 'server', [
    ['url-parser', 'link'],
    ['subnet-calculator', 'server'],
    ['ipv4-cidr-aggregator', 'server'],
    ['ipv6-subnet-calculator', 'server'],
    ['ip-lookup', 'map-pin'],
    ['dns-lookup', 'server'],
    ['tls-checker', 'shield-check'],
  ]),
  category('time', 'time', 'clock-8', [
    ['time-converter', 'history'],
    ['iso-week-calculator', 'clock-8'],
    ['date-duration-calculator', 'clock-8'],
    ['cron-expression-parser', 'clock-8'],
  ]),
  category('docker', 'docker', 'box', [
    ['docker-run-to-compose', 'box'],
    ['docker-cheatsheet', 'terminal'],
  ]),
]

export const allTools = toolsConfig.flatMap((group) => group.tools)

// Temporarily hide the translation entry until its API is configured.
// Keep the complete catalog above so existing routes and saved preferences survive.
const hiddenToolIds = new Set(['i18n-json-translator'])
export const visibleToolsConfig = toolsConfig
  .map((group) => ({
    ...group,
    tools: group.tools.filter((tool) => !hiddenToolIds.has(tool.id)),
  }))
  .filter((group) => group.tools.length > 0)
export const visibleTools = visibleToolsConfig.flatMap((group) => group.tools)
