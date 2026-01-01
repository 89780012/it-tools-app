export interface ConfigSnippet {
  config: string
  desc: string
}

export interface ConfigCategory {
  [key: string]: ConfigSnippet
}

export interface AllConfigs {
  [category: string]: ConfigCategory
}

export const CATEGORY_ORDER = [
  'basic',
  'server',
  'location',
  'proxy',
  'ssl',
  'cache',
  'gzip',
  'security',
  'logging',
  'performance',
]

/**
 * Filter configs based on search query and active category
 */
export function filterConfigs(
  allConfigs: AllConfigs,
  searchQuery: string,
  activeCategory: string | null
): AllConfigs {
  const query = searchQuery.toLowerCase().trim()
  const result: AllConfigs = {}

  for (const category of CATEGORY_ORDER) {
    if (activeCategory && activeCategory !== category) continue
    if (!allConfigs[category]) continue

    const categoryConfigs: ConfigCategory = {}
    for (const [key, config] of Object.entries(allConfigs[category])) {
      if (
        !query ||
        config.config.toLowerCase().includes(query) ||
        config.desc.toLowerCase().includes(query)
      ) {
        categoryConfigs[key] = config
      }
    }

    if (Object.keys(categoryConfigs).length > 0) {
      result[category] = categoryConfigs
    }
  }

  return result
}

/**
 * Count total configs in filtered result
 */
export function countConfigs(filteredConfigs: AllConfigs): number {
  let count = 0
  for (const category of Object.values(filteredConfigs)) {
    count += Object.keys(category).length
  }
  return count
}
