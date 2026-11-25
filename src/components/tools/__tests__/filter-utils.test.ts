import { describe, expect, it } from 'vitest'
import { CATEGORY_ORDER as DOCKER_ORDER, countCommands as countDocker, filterCommands as filterDocker } from '../docker-cheatsheet/filter-utils'
import { CATEGORY_ORDER as FIREWALL_ORDER, countCommands as countFirewall, filterCommands as filterFirewall } from '../firewall-cheatsheet/filter-utils'
import { CATEGORY_ORDER as NGINX_ORDER, countConfigs, filterConfigs } from '../nginx-cheatsheet/filter-utils'

type FilterCase = {
  name: string
  order: string[]
  filter: (data: any, query: string, activeCategory: string | null) => any
  count: (data: any) => number
  field: 'cmd' | 'config'
}

describe.each<FilterCase>([
  { name: 'Docker commands', order: DOCKER_ORDER, filter: filterDocker, count: countDocker, field: 'cmd' },
  { name: 'firewall commands', order: FIREWALL_ORDER, filter: filterFirewall, count: countFirewall, field: 'cmd' },
  { name: 'Nginx snippets', order: NGINX_ORDER, filter: filterConfigs, count: countConfigs, field: 'config' },
])('$name filtering', ({ order, filter, count, field }) => {
  const data = {
    [order[0]]: {
      alpha: { [field]: 'listen 80', desc: 'Start public server' },
      beta: { [field]: 'deny private', desc: 'Block traffic' },
    },
    [order[1]]: {
      gamma: { [field]: 'proxy_pass backend', desc: 'Forward requests' },
    },
  }

  it('matches query case-insensitively in command/config text and descriptions', () => {
    expect(count(filter(data, 'LISTEN', null))).toBe(1)
    expect(count(filter(data, 'forward', null))).toBe(1)
    expect(count(filter(data, '  ', null))).toBe(3)
  })

  it('restricts categories, omits empty results, and preserves category order', () => {
    expect(Object.keys(filter(data, '', order[1]))).toEqual([order[1]])
    expect(filter(data, 'not found', null)).toEqual({})
    expect(Object.keys(filter(data, '', null))).toEqual(order.slice(0, 2))
    expect(filter(data, '', 'unknown')).toEqual({})
  })

  it('counts all filtered entries and does not mutate the input', () => {
    const before = structuredClone(data)
    const result = filter(data, '', null)
    expect(count(result)).toBe(3)
    expect(data).toEqual(before)
  })
})
