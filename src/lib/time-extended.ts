export type TimeUnit = 'milliseconds' | 'seconds'
export const TIME_ZONES = [
  'local',
  'UTC',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Kolkata',
  'Australia/Sydney',
]
export function resolveZone(zone: string): string {
  const resolved =
    zone === 'local' ? Intl.DateTimeFormat().resolvedOptions().timeZone : zone
  new Intl.DateTimeFormat('en', { timeZone: resolved }).format(0)
  return resolved
}
function partsAt(ms: number, zone: string): number[] {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    era: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(ms)
  const result = ['year', 'month', 'day', 'hour', 'minute', 'second'].map(
    (key) => Number(parts.find((p) => p.type === key)?.value),
  )
  if (parts.find((p) => p.type === 'era')?.value === 'BC')
    result[0] = 1 - result[0]
  return result
}
function utc(parts: number[]): number {
  const date = new Date(0)
  date.setUTCFullYear(parts[0], parts[1] - 1, parts[2])
  date.setUTCHours(parts[3], parts[4], parts[5], parts[6] ?? 0)
  return date.getTime()
}
export function timestampToMs(input: string, unit: TimeUnit): number {
  if (!/^-?\d+$/.test(input.trim())) throw new Error('invalid')
  const ms = Number(input) * (unit === 'seconds' ? 1000 : 1)
  if (!Number.isSafeInteger(ms) || Math.abs(ms) > 8640000000000000)
    throw new Error('invalid')
  return ms
}
export function formatInZone(ms: number, zone: string): string {
  const p = partsAt(ms, resolveZone(zone))
  const year =
    p[0] < 0
      ? `-${String(-p[0]).padStart(6, '0')}`
      : p[0] > 9999
        ? `+${String(p[0]).padStart(6, '0')}`
        : String(p[0]).padStart(4, '0')
  return `${year}-${String(p[1]).padStart(2, '0')}-${String(p[2]).padStart(2, '0')} ${p
    .slice(3)
    .map((n) => String(n).padStart(2, '0'))
    .join(':')}`
}
/** Strict Gregorian input. Offset ISO values identify an instant. Wall times reject gaps and choose the earlier instant in a DST fold. */
export function parseExtendedDate(input: string, zone: string): number {
  const timeZone = resolveZone(zone)
  const match =
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})?$/.exec(
      input.trim(),
    )
  if (!match) throw new Error('invalid')
  const p = match.slice(1, 7).map(Number)
  const milli = Number((match[7] ?? '').padEnd(3, '0'))
  const base = utc([...p, milli])
  const check = new Date(base)
  if (
    p[0] < 1 ||
    p[1] < 1 ||
    p[1] > 12 ||
    p[2] < 1 ||
    p[3] > 23 ||
    p[4] > 59 ||
    p[5] > 59 ||
    check.getUTCFullYear() !== p[0] ||
    check.getUTCMonth() + 1 !== p[1] ||
    check.getUTCDate() !== p[2]
  )
    throw new Error('invalid')
  const offset = match[8]
  if (offset) {
    if (offset === 'Z') return base
    const hours = Number(offset.slice(1, 3)),
      minutes = Number(offset.slice(4))
    if (hours > 23 || minutes > 59) throw new Error('invalid')
    return base - (offset[0] === '+' ? 1 : -1) * (hours * 60 + minutes) * 60000
  }
  const candidates = new Set<number>()
  for (let hour = -48; hour <= 48; hour += 6) {
    const probe = Math.floor(base / 1000) * 1000 + hour * 3600000
    const offsetMs = utc(partsAt(probe, timeZone)) - probe
    const candidate = base - offsetMs
    if (partsAt(candidate, timeZone).every((v, i) => v === p[i]))
      candidates.add(candidate)
  }
  if (!candidates.size) throw new Error('invalid')
  return Math.min(...candidates)
}
