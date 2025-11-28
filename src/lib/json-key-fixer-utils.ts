// JSON Key Fixer 工具函数库

export type JsonValue = string | number | boolean | null | JsonObject | JsonArray
export type JsonObject = { [key: string]: JsonValue }
export type JsonArray = JsonValue[]

export interface FlatEntry {
  path: string
  value: string
  depth: number
  index: number
}

export interface DiffDetail {
  type: 'order-diff' | 'missing' | 'extra' | 'matched'
  keyPath: string
  sourceValue?: string
  targetValue?: string
  sourceIndex?: number
  targetIndex?: number
}

export interface DiffStats {
  orderDiffCount: number
  missingKeys: string[]
  extraKeys: string[]
  matchRate: number
}

export interface DiffResult {
  fileId: string
  fileName: string
  language: string
  stats: DiffStats
  details: DiffDetail[]
}

/**
 * 扁平化 JSON 并保留 key 的原始顺序
 *
 * @param obj - 要扁平化的 JSON 对象
 * @returns 扁平化的条目数组,保留原始顺序
 *
 * @example
 * flattenJsonWithOrder({ "a": { "b": "value" }, "c": "value2" })
 * // => [
 * //   { path: "a.b", value: "value", depth: 2, index: 0 },
 * //   { path: "c", value: "value2", depth: 1, index: 1 }
 * // ]
 */
export function flattenJsonWithOrder(obj: JsonObject): FlatEntry[] {
  const result: FlatEntry[] = []
  let globalIndex = 0

  function traverse(current: unknown, path: string[], depth: number) {
    if (typeof current === 'string') {
      result.push({
        path: path.join('.'),
        value: current,
        depth,
        index: globalIndex++
      })
      return
    }

    // 处理数组 - 如果数组包含字符串,也需要扁平化
    if (Array.isArray(current)) {
      current.forEach((item, index) => {
        if (typeof item === 'string') {
          result.push({
            path: [...path, String(index)].join('.'),
            value: item,
            depth: depth + 1,
            index: globalIndex++
          })
        } else if (item && typeof item === 'object') {
          // 如果数组项是对象,递归处理
          traverse(item, [...path, String(index)], depth + 1)
        }
      })
      return
    }

    if (current && typeof current === 'object') {
      Object.entries(current).forEach(([key, value]) => {
        traverse(value, [...path, key], depth + 1)
      })
    }

    // 忽略数字、布尔值和 null
  }

  traverse(obj, [], 0)
  return result
}

/**
 * 检测源文件和目标文件之间的三维差异
 *
 * @param sourceFlat - 源文件的扁平化数据
 * @param targetFlat - 目标文件的扁平化数据
 * @returns 差异分析结果
 */
export function detectDifferences(
  sourceFlat: FlatEntry[],
  targetFlat: FlatEntry[]
): Pick<DiffResult, 'stats' | 'details'> {
  const sourceMap = new Map(sourceFlat.map(e => [e.path, e]))
  const targetMap = new Map(targetFlat.map(e => [e.path, e]))

  const details: DiffDetail[] = []
  const missingKeys: string[] = []
  const extraKeys: string[] = []
  let orderDiffCount = 0

  // 检测缺失和顺序差异
  sourceFlat.forEach((sourceEntry, sourceIndex) => {
    const targetEntry = targetMap.get(sourceEntry.path)

    if (!targetEntry) {
      // 缺失的 key
      missingKeys.push(sourceEntry.path)
      details.push({
        type: 'missing',
        keyPath: sourceEntry.path,
        sourceValue: sourceEntry.value
      })
    } else {
      // 检查顺序
      const targetIndex = targetFlat.findIndex(t => t.path === sourceEntry.path)
      if (targetIndex !== sourceIndex) {
        orderDiffCount++
        details.push({
          type: 'order-diff',
          keyPath: sourceEntry.path,
          sourceValue: sourceEntry.value,
          targetValue: targetEntry.value,
          sourceIndex,
          targetIndex
        })
      } else {
        details.push({
          type: 'matched',
          keyPath: sourceEntry.path,
          sourceValue: sourceEntry.value,
          targetValue: targetEntry.value
        })
      }
    }
  })

  // 检测多余的 key
  targetFlat.forEach(targetEntry => {
    if (!sourceMap.has(targetEntry.path)) {
      extraKeys.push(targetEntry.path)
      details.push({
        type: 'extra',
        keyPath: targetEntry.path,
        targetValue: targetEntry.value
      })
    }
  })

  const matchRate = sourceFlat.length > 0
    ? Math.round(((sourceFlat.length - missingKeys.length) / sourceFlat.length) * 100)
    : 100

  return {
    stats: {
      orderDiffCount,
      missingKeys,
      extraKeys,
      matchRate
    },
    details
  }
}

/**
 * 按照源文件结构重建目标文件
 *
 * 核心原则:
 * 1. 按照源文件的 key 顺序重新排列
 * 2. 保留目标文件的所有现有值(字符串、数组、对象、数字、布尔值等)
 * 3. 只有目标文件完全缺失某个 key 时,才使用翻译或标记为缺失
 *
 * @param source - 源文件 JSON 对象
 * @param target - 目标文件 JSON 对象
 * @param translations - 翻译结果 (key 路径 -> 翻译值)
 * @param options - 重构选项
 * @returns 重构后的 JSON 对象
 */
export function rebuildJson(
  source: JsonObject,
  target: JsonObject,
  translations: Record<string, string>,
  options: { keepExtraKeys: boolean }
): JsonObject {
  function traverse(
    sourceNode: unknown,
    targetNode: unknown,
    path: string[]
  ): JsonValue {
    const fullPath = path.join('.')

    // 情况1: 目标节点存在且不是 undefined
    // 直接使用目标节点的值,保持其原有类型和内容
    if (targetNode !== undefined && targetNode !== null) {
      // 如果目标节点是对象,需要按照源节点的结构重建
      if (
        sourceNode &&
        typeof sourceNode === 'object' &&
        !Array.isArray(sourceNode) &&
        targetNode &&
        typeof targetNode === 'object' &&
        !Array.isArray(targetNode)
      ) {
        const rebuilt: JsonObject = {}

        // 按源文件顺序遍历 key
        Object.keys(sourceNode).forEach(key => {
          const sourceValue = (sourceNode as JsonObject)[key]
          const targetValue = (targetNode as JsonObject)[key]
          rebuilt[key] = traverse(sourceValue, targetValue, [...path, key])
        })

        // 可选保留目标文件的多余 key
        if (options.keepExtraKeys) {
          Object.keys(targetNode as JsonObject).forEach(key => {
            if (!(key in rebuilt)) {
              rebuilt[key] = (targetNode as JsonObject)[key]
            }
          })
        }

        return rebuilt
      }

      // 对于字符串、数组、数字、布尔值等,直接使用目标节点的值
      // 这确保了目标文件的内容不会被源文件覆盖
      return targetNode as JsonValue
    }

    // 情况2: 目标节点不存在 (undefined 或 null)
    // 这才是真正缺失的 key,需要补全

    // 如果是字符串类型的 key,尝试使用翻译
    if (typeof sourceNode === 'string') {
      if (translations[fullPath]) {
        return translations[fullPath]
      }
      // 翻译失败,标记为缺失
      return `[MISSING: ${fullPath}]`
    }

    // 如果是数组,需要处理数组内容
    if (Array.isArray(sourceNode)) {
      // 检查数组是否全是字符串(可翻译的内容)
      const allStrings = sourceNode.every(item => typeof item === 'string')

      if (allStrings && sourceNode.length > 0) {
        // 尝试从翻译结果中恢复数组
        // 翻译 API 会将数组项逐个翻译,key 格式为: path.0, path.1, path.2...
        const translatedArray: string[] = []
        let hasTranslation = false

        for (let i = 0; i < sourceNode.length; i++) {
          const itemPath = `${fullPath}.${i}`
          if (translations[itemPath]) {
            translatedArray.push(translations[itemPath])
            hasTranslation = true
          } else {
            // 如果某一项没有翻译,标记为缺失
            translatedArray.push(`[MISSING: ${itemPath}]`)
          }
        }

        // 如果有至少一项翻译成功,返回翻译后的数组
        if (hasTranslation) {
          return translatedArray as JsonValue
        }
      }

      // 如果数组不是纯字符串,或者翻译完全失败,标记为缺失
      return `[MISSING_ARRAY: ${fullPath}]` as JsonValue
    }

    // 如果是对象,递归处理
    if (sourceNode && typeof sourceNode === 'object' && !Array.isArray(sourceNode)) {
      const rebuilt: JsonObject = {}
      Object.keys(sourceNode).forEach(key => {
        const sourceValue = (sourceNode as JsonObject)[key]
        rebuilt[key] = traverse(sourceValue, undefined, [...path, key])
      })
      return rebuilt
    }

    // 对于数字、布尔值等,直接使用源值作为兜底
    return sourceNode as JsonValue
  }

  return traverse(source, target, []) as JsonObject
}

/**
 * 从 JSON 对象中提取示例文本用于语种检测
 *
 * @param obj - JSON 对象
 * @param count - 提取的示例数量 (默认 10)
 * @returns 示例文本数组
 */
export function extractSamples(obj: JsonObject, count: number = 10): string[] {
  const flattened = flattenJsonWithOrder(obj)
  return flattened.slice(0, count).map(entry => entry.value)
}

/**
 * 生成修复报告 (Markdown 格式)
 *
 * @param fixTasks - 修复任务记录
 * @param sourceFileName - 源文件名
 * @returns Markdown 格式的报告
 */
export function generateFixReport(
  fixTasks: Array<{
    fileName: string
    status: string
    stats?: DiffStats
    translationStats?: {
      total: number
      completed: number
      failed: string[]
    }
  }>,
  sourceFileName: string
): string {
  const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })

  let report = `# JSON Key 修复报告\n\n`
  report += `**生成时间**: ${timestamp}\n`
  report += `**源文件**: ${sourceFileName}\n`
  report += `**修复文件数**: ${fixTasks.length}\n\n`
  report += `---\n\n`

  report += `## 修复概览\n\n`
  report += `| 文件名 | 状态 | 顺序差异 | 缺失key | 多余key | 匹配率 |\n`
  report += `|--------|------|---------|---------|---------|--------|\n`

  fixTasks.forEach(task => {
    const stats = task.stats
    const status = task.status === 'completed' ? '✅ 完成' : '❌ 失败'
    report += `| ${task.fileName} | ${status} | ${stats?.orderDiffCount || 0} | ${stats?.missingKeys.length || 0} | ${stats?.extraKeys.length || 0} | ${stats?.matchRate || 0}% |\n`
  })

  report += `\n---\n\n`

  // 翻译统计
  const tasksWithTranslation = fixTasks.filter(t => t.translationStats && t.translationStats.total > 0)
  if (tasksWithTranslation.length > 0) {
    report += `## 翻译统计\n\n`
    tasksWithTranslation.forEach(task => {
      const ts = task.translationStats!
      report += `### ${task.fileName}\n\n`
      report += `- **总计**: ${ts.total} 个key\n`
      report += `- **成功**: ${ts.completed} 个\n`
      report += `- **失败**: ${ts.failed.length} 个\n`

      if (ts.failed.length > 0) {
        report += `\n**失败的 key**:\n`
        ts.failed.forEach(key => {
          report += `- \`${key}\`\n`
        })
      }
      report += `\n`
    })
    report += `---\n\n`
  }

  report += `## 使用说明\n\n`
  report += `1. 请仔细检查修复后的文件内容\n`
  report += `2. 如有翻译失败的 key,请手动补充翻译\n`
  report += `3. 建议使用 Git diff 查看具体变更\n`
  report += `4. 确认无误后,替换原文件并提交代码\n\n`
  report += `---\n\n`
  report += `*由 JSON Key 比对修复工具自动生成*\n`

  return report
}
