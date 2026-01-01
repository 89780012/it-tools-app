export interface Command {
  cmd: string
  desc: string
}

export interface CommandCategory {
  [key: string]: Command
}

export interface AllCommands {
  [category: string]: CommandCategory
}

export const CATEGORY_ORDER = [
  'iptables_basic',
  'iptables_whitelist',
  'iptables_rules',
  'firewalld_basic',
  'firewalld_rules',
  'ufw_basic',
  'ufw_rules',
  'nftables',
]

/**
 * Filter commands based on search query and active category
 */
export function filterCommands(
  allCommands: AllCommands,
  searchQuery: string,
  activeCategory: string | null
): AllCommands {
  const query = searchQuery.toLowerCase().trim()
  const result: AllCommands = {}

  for (const category of CATEGORY_ORDER) {
    if (activeCategory && activeCategory !== category) continue
    if (!allCommands[category]) continue

    const categoryCommands: CommandCategory = {}
    for (const [key, command] of Object.entries(allCommands[category])) {
      if (
        !query ||
        command.cmd.toLowerCase().includes(query) ||
        command.desc.toLowerCase().includes(query)
      ) {
        categoryCommands[key] = command
      }
    }

    if (Object.keys(categoryCommands).length > 0) {
      result[category] = categoryCommands
    }
  }

  return result
}

/**
 * Count total commands in filtered result
 */
export function countCommands(filteredCommands: AllCommands): number {
  let count = 0
  for (const category of Object.values(filteredCommands)) {
    count += Object.keys(category).length
  }
  return count
}
