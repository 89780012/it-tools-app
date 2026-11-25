import { describe, expect, it } from 'vitest'
import { formatDateTimePattern, parseDateTimePattern } from '../time-utils'

describe('date/time utilities', () => {
  it('formats local date/time fields with zero padding', () => {
    expect(formatDateTimePattern(new Date(2024, 0, 2, 3, 4, 5))).toBe('2024-01-02 03:04:05')
  })

  it('parses valid local date/time input and accepts surrounding whitespace', () => {
    const parsed = parseDateTimePattern(' 2024-02-29 23:59:58 ')
    expect(parsed).toBeInstanceOf(Date)
    expect(formatDateTimePattern(parsed!)).toBe('2024-02-29 23:59:58')
  })

  it.each(['', '2024-2-01 12:00:00', '2023-02-29 12:00:00', '2024-04-31 12:00:00', '2024-01-01 24:00:00', 'nope'])(
    'returns null for invalid date/time input %s',
    (input) => expect(parseDateTimePattern(input)).toBeNull(),
  )

  it('round-trips valid local dates including leap day and midnight', () => {
    for (const date of [new Date(2000, 1, 29, 0, 0, 0), new Date(2025, 11, 31, 23, 59, 59)]) {
      expect(parseDateTimePattern(formatDateTimePattern(date))?.getTime()).toBe(date.getTime())
    }
  })
})
