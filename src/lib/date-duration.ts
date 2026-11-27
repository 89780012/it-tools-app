export const MAX_HOLIDAY_LINES = 10_000
export const MAX_HOLIDAY_CHARACTERS = 120_000
export type DateDurationField = 'start' | 'end' | 'holidays'
export type DateDurationInput = {
  start: string
  end: string
  includeEnd: boolean
  holidays: string
}
export type DateDurationResult = {
  calendarDays: number
  weeks: number
  remainingDays: number
  weekdays: number
  weekendDays: number
  excludedHolidays: number
  businessDays: number
}

export class DateDurationError extends Error {
  constructor(
    public code: 'invalidDate' | 'reversed' | 'invalidHoliday' | 'holidayLimit',
    public field: DateDurationField,
    public line = 1,
  ) {
    super(code)
  }
}

// UTC is used only as a Gregorian day index: no local times or DST transitions.
export function parseCalendarDay(value: string): number | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const [year, month, day] = value.split('-').map(Number)
  if (year < 1 || year > 9999) return undefined
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return undefined
  return date.getTime() / 86_400_000
}

const weekday = (day: number) => (((day + 4) % 7) + 7) % 7
const isWeekday = (day: number) => weekday(day) !== 0 && weekday(day) !== 6

export function calculateDateDuration(
  input: DateDurationInput,
): DateDurationResult {
  const start = parseCalendarDay(input.start.trim())
  const end = parseCalendarDay(input.end.trim())
  if (start === undefined) throw new DateDurationError('invalidDate', 'start')
  if (end === undefined) throw new DateDurationError('invalidDate', 'end')
  if (end < start) throw new DateDurationError('reversed', 'end')
  if (input.holidays.length > MAX_HOLIDAY_CHARACTERS)
    throw new DateDurationError('holidayLimit', 'holidays')
  const lines = input.holidays.split(/\r\n|\n|\r/)
  if (lines.length > MAX_HOLIDAY_LINES)
    throw new DateDurationError('holidayLimit', 'holidays')
  const holidays = new Set<number>()
  lines.forEach((line, index) => {
    if (!line.trim()) return
    const day = parseCalendarDay(line.trim())
    if (day === undefined)
      throw new DateDurationError('invalidHoliday', 'holidays', index + 1)
    holidays.add(day)
  })

  const stop = end + (input.includeEnd ? 1 : 0)
  const calendarDays = stop - start
  const weeks = Math.floor(calendarDays / 7)
  const remainingDays = calendarDays % 7
  let weekdays = weeks * 5
  for (let offset = 0; offset < remainingDays; offset++) {
    if (isWeekday(start + offset)) weekdays++
  }
  const excludedHolidays = [...holidays].filter(
    (day) => day >= start && day < stop && isWeekday(day),
  ).length
  return {
    calendarDays,
    weeks,
    remainingDays,
    weekdays,
    weekendDays: calendarDays - weekdays,
    excludedHolidays,
    businessDays: weekdays - excludedHolidays,
  }
}
