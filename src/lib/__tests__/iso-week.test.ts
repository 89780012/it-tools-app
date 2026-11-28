import { describe, expect, it } from 'vitest'
import { convertIsoWeek, IsoWeekError } from '../iso-week'

describe('ISO week conversion', () => {
  it.each([
    ['2021-01-01', '2020-W53-5'],
    ['2021-01-03', '2020-W53-7'],
    ['2021-01-04', '2021-W01-1'],
    ['2018-12-31', '2019-W01-1'],
    ['2016-01-01', '2015-W53-5'],
    ['2015-12-31', '2015-W53-4'],
    ['2024-02-29', '2024-W09-4'],
    ['2000-01-01', '1999-W52-6'],
    ['1900-03-01', '1900-W09-4'],
    ['2026-11-28', '2026-W48-6'],
    ['0001-01-01', '0001-W01-1'],
    ['0099-12-31', '0099-W53-4'],
    ['9999-12-31', '9999-W52-5'],
  ])('converts the independent reference pair %s ↔ %s', (date, weekDate) => {
    expect(convertIsoWeek(date, 'date').weekDate).toBe(weekDate)
    expect(convertIsoWeek(weekDate, 'week').date).toBe(date)
  })

  it('reports ISO year, weekday, exact week boundaries and year length', () => {
    expect(convertIsoWeek(' 2021-01-01 ', 'date')).toEqual({
      date: '2021-01-01',
      weekDate: '2020-W53-5',
      weekYear: 2020,
      week: 53,
      weekday: 5,
      monday: '2020-12-28',
      sunday: '2021-01-03',
      weeksInYear: 53,
    })
    expect(convertIsoWeek('\n2021-W01-1\t', 'week')).toMatchObject({
      monday: '2021-01-04',
      sunday: '2021-01-10',
      weeksInYear: 52,
    })
    expect(convertIsoWeek('9999-12-31', 'date')).toMatchObject({
      monday: '9999-12-27',
      sunday: '+010000-01-02',
    })
  })

  it.each([
    '',
    '0000-01-01',
    '10000-01-01',
    '2021-02-29',
    '1900-02-29',
    '2026-04-31',
    '2026-00-01',
    '2026-13-01',
    '2026-01-00',
    '2026-1-01',
    '26-01-01',
    '2026-01-01T00:00:00Z',
    '２０２６-01-01',
    'x'.repeat(65),
  ])('rejects invalid calendar input %j', (text) => {
    expect(() => convertIsoWeek(text, 'date')).toThrow(
      expect.objectContaining({ code: 'invalidDate' }),
    )
  })
  it.each([
    '',
    '0000-W01-1',
    '10000-W01-1',
    '2026-W00-1',
    '2026-W54-1',
    '2026-W01-0',
    '2026-W01-8',
    '2026-W1-1',
    '2026-w01-1',
    '2026-W01',
    '2026-W01-01',
    '2026-W01-1abc',
    '2026-W01-1\n2026-W02-1',
    'x'.repeat(65),
  ])('rejects invalid week input %j', (text) => {
    expect(() => convertIsoWeek(text, 'week')).toThrow(
      expect.objectContaining({ code: 'invalidWeek' }),
    )
  })
  it('rejects nonexistent week 53 and converted dates beyond the supported range', () => {
    for (const year of [2014, 2016, 2019, 2021, 9999]) {
      expect(() => convertIsoWeek(`${year}-W53-1`, 'week')).toThrow(
        expect.objectContaining({ code: 'missingWeek' }),
      )
    }
    for (const weekday of [6, 7])
      expect(() => convertIsoWeek(`9999-W52-${weekday}`, 'week')).toThrow(
        expect.objectContaining({ code: 'outOfRange' }),
      )
    expect(() => convertIsoWeek('bad', 'date')).toThrow(IsoWeekError)
  })

  it('matches a separately enumerated 400-year Gregorian cycle in both directions', () => {
    // Gregorian patterns repeat every 400 years. Derive expected week years
    // from year lengths and January 1, without using the implementation's
    // Thursday/January-4 method. There are 71 long ISO years per cycle.
    const DAY = 86_400_000
    let longYears = 0
    for (let year = 2000; year < 2400; year++) {
      const jan1 = new Date(Date.UTC(year, 0, 1))
      const janDay = jan1.getUTCDay() || 7
      const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
      const weeks = janDay === 4 || (janDay === 3 && leap) ? 53 : 52
      if (weeks === 53) longYears++
      const start =
        jan1.getTime() / DAY + (janDay <= 4 ? 1 - janDay : 8 - janDay)
      for (let offset = 0; offset < weeks * 7; offset++) {
        const date = new Date((start + offset) * DAY).toISOString().slice(0, 10)
        const weekDate = `${year}-W${String(Math.floor(offset / 7) + 1).padStart(2, '0')}-${(offset % 7) + 1}`
        const result = convertIsoWeek(date, 'date')
        // Use direct comparisons inside the exhaustive loop to keep it cheap.
        if (
          result.weekDate !== weekDate ||
          result.weeksInYear !== weeks ||
          convertIsoWeek(weekDate, 'week').date !== date
        )
          throw new Error(`Conversion mismatch at ${date} ↔ ${weekDate}`)
      }
    }
    expect(longYears).toBe(71)
  })
})
