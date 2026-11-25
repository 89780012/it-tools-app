export interface EnhancedField {
  name: string
  type: string
  count?: number
  min?: number
  max?: number
  format?: string
}
export const ENHANCED_FIELD_TYPES = [
  'string',
  'number',
  'boolean',
  'date',
  'email',
  'phone',
  'name',
  'address',
  'url',
  'uuid',
  'array',
  'null',
]
export interface GenerationOptions {
  seed: string
  locale: 'en' | 'zh'
  boundary: boolean
  nullRatio: number
}
export function generateEnhancedData(
  fields: EnhancedField[],
  rows: number,
  options: GenerationOptions,
): Record<string, unknown>[] {
  if (
    !Number.isInteger(rows) ||
    rows < 1 ||
    rows > 1000 ||
    fields.length < 1 ||
    fields.length > 50 ||
    options.seed.length > 200 ||
    !Number.isFinite(options.nullRatio) ||
    options.nullRatio < 0 ||
    options.nullRatio > 1
  )
    throw new Error('limits')
  const names = new Set<string>()
  let budget = 0
  for (const field of fields) {
    if (
      !field.name.trim() ||
      field.name.length > 100 ||
      names.has(field.name) ||
      !ENHANCED_FIELD_TYPES.includes(field.type)
    )
      throw new Error('fields')
    names.add(field.name)
    const min = field.min ?? 0,
      max = field.max ?? 100,
      count = field.count ?? 10
    if (
      field.type === 'number' &&
      (!Number.isSafeInteger(min) ||
        !Number.isSafeInteger(max) ||
        min > max ||
        max - min > Number.MAX_SAFE_INTEGER)
    )
      throw new Error('constraints')
    if (
      ['string', 'array'].includes(field.type) &&
      (!Number.isInteger(count) || count < 0 || count > 1000)
    )
      throw new Error('constraints')
    budget +=
      field.type === 'array' ? count * 8 : field.type === 'string' ? count : 100
  }
  if (budget * rows > 2000000) throw new Error('limits')
  let state = 2166136261
  for (const char of options.seed)
    state = Math.imul(state ^ char.charCodeAt(0), 16777619)
  const random = () => {
    state += 0x6d2b79f5
    let n = state
    n = Math.imul(n ^ (n >>> 15), n | 1)
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61)
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296
  }
  const integer = (min: number, max: number) =>
    min + Math.floor(random() * (max - min + 1))
  const pick = <T>(values: T[]) => values[integer(0, values.length - 1)]
  const text = (length: number) =>
    Array.from({ length }, () =>
      pick(
        (options.locale === 'zh'
          ? '天地山水春夏秋冬花草星月'
          : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        ).split(''),
      ),
    ).join('')
  return Array.from({ length: rows }, (_, row) =>
    Object.fromEntries(
      fields.map((field) => {
        let value: unknown
        const count = field.count ?? 10
        const edge = options.boundary && row % 2 === 0
        if (random() < options.nullRatio || field.type === 'null') value = null
        else
          switch (field.type) {
            case 'number':
              value = options.boundary
                ? edge
                  ? (field.min ?? 0)
                  : (field.max ?? 100)
                : integer(field.min ?? 0, field.max ?? 100)
              break
            case 'string':
              value = text(count)
              break
            case 'boolean':
              value = options.boundary ? !edge : random() < 0.5
              break
            case 'date':
              value = new Date(
                options.boundary
                  ? edge
                    ? 1577836800000
                    : 1893456000000
                  : integer(1577836800000, 1893456000000),
              ).toISOString()
              break
            case 'email':
              value = `${Array.from({ length: 8 }, () => pick('abcdefghijklmnopqrstuvwxyz'.split(''))).join('')}@example.com`
              break
            case 'phone':
              value =
                options.locale === 'zh'
                  ? `138${integer(10000000, 99999999)}`
                  : `+1-202-555-${integer(1000, 9999)}`
              break
            case 'name':
              value = pick(
                options.locale === 'zh'
                  ? ['张三', '李明', '王芳', '赵敏']
                  : ['Alice Smith', 'Bob Taylor', 'Carol Brown', 'David Jones'],
              )
              break
            case 'address':
              value = pick(
                options.locale === 'zh'
                  ? [
                      '北京市朝阳区建国路1号',
                      '上海市浦东新区世纪大道100号',
                      '广州市天河区天河路200号',
                    ]
                  : [
                      '123 Main Street, New York',
                      '456 Oak Avenue, London',
                      '789 Pine Road, Sydney',
                    ],
              )
              break
            case 'url':
              value = `https://example.com/${integer(1, 9999)}`
              break
            case 'uuid':
              value = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
                /[xy]/g,
                (c) =>
                  (c === 'x' ? integer(0, 15) : integer(8, 11)).toString(16),
              )
              break
            case 'array':
              value = Array.from({ length: count }, () => text(5))
              break
          }
        return [field.name, value]
      }),
    ),
  )
}
