import { CronExpressionParser } from 'cron-parser'
export type CronSchedule = 'minutes' | 'hourly' | 'daily' | 'weekly' | 'monthly'
export function buildCron(
  schedule: CronSchedule,
  minute: number,
  hour: number,
  day: number,
  interval: number,
) {
  if (
    ![minute, hour, day, interval].every(Number.isInteger) ||
    minute < 0 ||
    minute > 59 ||
    hour < 0 ||
    hour > 23 ||
    interval < 1 ||
    interval > 59
  )
    throw new Error('invalid')
  if (schedule === 'minutes') return `*/${interval} * * * *`
  if (schedule === 'hourly') return `${minute} * * * *`
  if (schedule === 'daily') return `${minute} ${hour} * * *`
  if (schedule === 'weekly' && day >= 0 && day <= 6)
    return `${minute} ${hour} * * ${day}`
  if (schedule === 'monthly' && day >= 1 && day <= 31)
    return `${minute} ${hour} ${day} * *`
  throw new Error('invalid')
}
export function nextCronRuns(
  expression: string,
  zone: string,
  count = 5,
  now = new Date(),
) {
  if (
    expression.trim().split(/\s+/).length !== 5 ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 20
  )
    throw new Error('invalid')
  new Intl.DateTimeFormat('en', { timeZone: zone }).format(now)
  const cron = CronExpressionParser.parse(expression, {
    tz: zone,
    currentDate: now,
  })
  return Array.from({ length: count }, () => cron.next().toDate())
}
