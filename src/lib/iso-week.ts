import { parseCalendarDay } from './date-duration'

const DAY_MS = 86_400_000
export type IsoWeekMode = 'date' | 'week'
export class IsoWeekError extends Error {
  constructor(
    public code: 'invalidDate' | 'invalidWeek' | 'missingWeek' | 'outOfRange',
  ) {
    super(code)
  }
}

export type IsoWeekResult = {
  date: string
  weekDate: string
  weekYear: number
  week: number
  weekday: number
  monday: string
  sunday: string
  weeksInYear: number
}

// UTC is only a Gregorian day index, so host time zones and DST cannot affect it.
function january4(year: number): number {
  const date = new Date(0)
  date.setUTCFullYear(year, 0, 4)
  return date.getTime() / DAY_MS
}
const weekdayOf = (day: number) => ((((day + 3) % 7) + 7) % 7) + 1
const firstMonday = (year: number) => {
  const day = january4(year)
  return day - weekdayOf(day) + 1
}
const formatDay = (day: number) =>
  new Date(day * DAY_MS).toISOString().split('T')[0]
const yearOf = (day: number) => new Date(day * DAY_MS).getUTCFullYear()
const weekCount = (year: number) =>
  (firstMonday(year + 1) - firstMonday(year)) / 7

export function convertIsoWeek(
  value: string,
  mode: IsoWeekMode,
): IsoWeekResult {
  // Both forms are 10 characters. Bound work before trimming untrusted input.
  if (value.length > 64)
    throw new IsoWeekError(mode === 'date' ? 'invalidDate' : 'invalidWeek')
  const text = value.trim()
  let day: number
  if (mode === 'date') {
    const parsed = parseCalendarDay(text)
    if (parsed === undefined) throw new IsoWeekError('invalidDate')
    day = parsed
  } else {
    const match = /^(\d{4})-W(\d{2})-([1-7])$/.exec(text)
    if (
      !match ||
      Number(match[1]) === 0 ||
      Number(match[2]) < 1 ||
      Number(match[2]) > 53
    )
      throw new IsoWeekError('invalidWeek')
    const [year, week, weekday] = match.slice(1).map(Number)
    if (week > weekCount(year)) throw new IsoWeekError('missingWeek')
    day = firstMonday(year) + (week - 1) * 7 + weekday - 1
    if (yearOf(day) < 1 || yearOf(day) > 9999)
      throw new IsoWeekError('outOfRange')
  }
  const weekday = weekdayOf(day)
  const monday = day - weekday + 1
  // An ISO week belongs to the year containing its Thursday.
  const weekYear = yearOf(monday + 3)
  const week = (monday - firstMonday(weekYear)) / 7 + 1
  return {
    date: formatDay(day),
    weekDate: `${String(weekYear).padStart(4, '0')}-W${String(week).padStart(2, '0')}-${weekday}`,
    weekYear,
    week,
    weekday,
    monday: formatDay(monday),
    sunday: formatDay(monday + 6),
    weeksInYear: weekCount(weekYear),
  }
}
