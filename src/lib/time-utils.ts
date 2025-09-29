const PATTERN = /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/

export function formatDateTimePattern(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, '0')

  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export function parseDateTimePattern(value: string): Date | null {
  if (!value) {
    return null
  }

  const trimmed = value.trim()

  if (!PATTERN.test(trimmed)) {
    return null
  }

  const [datePart, timePart] = trimmed.split(' ')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes, seconds] = timePart.split(':').map(Number)

  const date = new Date(year, month - 1, day, hours, minutes, seconds)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hours ||
    date.getMinutes() !== minutes ||
    date.getSeconds() !== seconds
  ) {
    return null
  }

  return date
}
