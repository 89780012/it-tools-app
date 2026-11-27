import { describe, expect, it } from 'vitest'
import {
  calculateDateDuration,
  DateDurationError,
  MAX_HOLIDAY_LINES,
  MAX_HOLIDAY_CHARACTERS,
  parseCalendarDay,
  type DateDurationInput,
} from '../date-duration'

const calculate = (
  start: string,
  end: string,
  options: Partial<DateDurationInput> = {},
) =>
  calculateDateDuration({
    start,
    end,
    holidays: '',
    includeEnd: false,
    ...options,
  })

describe('date duration', () => {
  it('calculates the example and deducts only unique weekday holidays within the range', () => {
    expect(
      calculate('2026-11-23', '2026-11-30', {
        holidays:
          '2026-11-26\r\n2026-11-26\n\n2026-11-28\n2026-11-30\n2026-11-20',
      }),
    ).toEqual({
      calendarDays: 7,
      weeks: 1,
      remainingDays: 0,
      weekdays: 5,
      weekendDays: 2,
      excludedHolidays: 1,
      businessDays: 4,
    })
    expect(
      calculate('2026-11-23', '2026-11-30', {
        includeEnd: true,
        holidays: '2026-11-30',
      }),
    ).toMatchObject({
      calendarDays: 8,
      weekdays: 6,
      excludedHolidays: 1,
      businessDays: 5,
    })
  })

  it('distinguishes empty, inclusive weekday and inclusive weekend intervals', () => {
    expect(calculate('2026-11-27', '2026-11-27')).toMatchObject({
      calendarDays: 0,
      businessDays: 0,
    })
    expect(
      calculate('2026-11-27', '2026-11-27', { includeEnd: true }),
    ).toMatchObject({ calendarDays: 1, businessDays: 1 })
    expect(
      calculate('2026-11-28', '2026-11-28', { includeEnd: true }),
    ).toMatchObject({ calendarDays: 1, businessDays: 0, weekendDays: 1 })
    expect(
      calculate('2026-11-27', '2026-11-27', {
        includeEnd: true,
        holidays: '2026-11-27',
      }),
    ).toMatchObject({ businessDays: 0, excludedHolidays: 1 })
  })

  it('handles Gregorian leap rules and spans across DST dates without changing day lengths', () => {
    expect(calculate('2024-02-28', '2024-03-01').calendarDays).toBe(2)
    expect(calculate('1900-02-28', '1900-03-01').calendarDays).toBe(1)
    expect(calculate('2000-02-28', '2000-03-01').calendarDays).toBe(2)
    expect(calculate('2026-03-07', '2026-03-10')).toMatchObject({
      calendarDays: 3,
      weekdays: 1,
      weekendDays: 2,
    })
    expect(calculate('2026-10-31', '2026-11-03').calendarDays).toBe(3)
  })

  it('supports the full range without remapping years 0001–0099 to the twentieth century', () => {
    expect(
      calculate('0001-01-01', '9999-12-31', { includeEnd: true }),
    ).toMatchObject({
      calendarDays: 3652059,
      weekdays: 2608615,
      weekendDays: 1043444,
    })
    expect(calculate('0001-01-01', '0001-01-02')).toMatchObject({
      weekdays: 1,
    })
    expect(calculate('0099-12-31', '0100-01-01').calendarDays).toBe(1)
    expect(
      calculate('9999-12-31', '9999-12-31', { includeEnd: true }).businessDays,
    ).toBe(1)
  })

  it.each([
    '',
    '0000-01-01',
    '10000-01-01',
    '2026-2-03',
    '2026-02-29',
    '1900-02-29',
    '2026-04-31',
    '2026-00-01',
    '2026-13-01',
    '2026-01-00',
    '2026-11-28T00:00:00Z',
    'not a date',
  ])('rejects invalid calendar date %j without silent rollover', (value) => {
    expect(parseCalendarDay(value)).toBeUndefined()
    expect(() => calculate(value, '2026-11-30')).toThrow(DateDurationError)
    expect(() => calculate('2026-01-01', value)).toThrow(
      expect.objectContaining({ code: 'invalidDate', field: 'end' }),
    )
  })

  it('rejects reversed ranges and identifies the original holiday line including blank lines', () => {
    expect(() => calculate('2026-11-30', '2026-11-23')).toThrow(
      expect.objectContaining({ code: 'reversed', field: 'end' }),
    )
    expect(() =>
      calculate('2026-11-23', '2026-11-30', {
        holidays: '\n2026-11-26\r\nbad',
      }),
    ).toThrow(
      expect.objectContaining({
        code: 'invalidHoliday',
        field: 'holidays',
        line: 3,
      }),
    )
    // Invalid dates outside the range must still be reported.
    expect(() =>
      calculate('2026-11-23', '2026-11-30', { holidays: '2025-02-29' }),
    ).toThrow(DateDurationError)
  })

  it('enforces holiday limits and accepts the exact boundaries', () => {
    expect(
      calculate('2026-11-23', '2026-11-30', {
        holidays: Array(MAX_HOLIDAY_LINES).fill('2026-11-26').join('\n'),
      }).excludedHolidays,
    ).toBe(1)
    expect(
      calculate('2026-11-23', '2026-11-30', {
        holidays: ' '.repeat(MAX_HOLIDAY_CHARACTERS),
      }).businessDays,
    ).toBe(5)
    for (const holidays of [
      '\n'.repeat(MAX_HOLIDAY_LINES),
      ' '.repeat(MAX_HOLIDAY_CHARACTERS + 1),
    ]) {
      expect(() => calculate('2026-11-23', '2026-11-30', { holidays })).toThrow(
        expect.objectContaining({ code: 'holidayLimit' }),
      )
    }
  })

  it('matches daily enumeration for every start weekday, partial week and inclusion mode', () => {
    for (let startOffset = 0; startOffset < 7; startOffset++) {
      const start = `2026-11-${String(1 + startOffset).padStart(2, '0')}`
      for (let length = 0; length < 20; length++) {
        const end = `2026-11-${String(1 + startOffset + length).padStart(2, '0')}`
        for (const includeEnd of [false, true]) {
          const days = length + Number(includeEnd)
          let weekdays = 0
          for (let offset = 0; offset < days; offset++) {
            const day = new Date(
              Date.UTC(2026, 10, 1 + startOffset + offset),
            ).getUTCDay()
            if (day >= 1 && day <= 5) weekdays++
          }
          expect(calculate(start, end, { includeEnd })).toMatchObject({
            calendarDays: days,
            weekdays,
            weekendDays: days - weekdays,
            businessDays: weekdays,
          })
        }
      }
    }
  })
})
