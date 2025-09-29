'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToolSEOSection } from '@/components/seo/tool-seo-section'

type CronFieldKey = 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek'

interface FieldConfig {
  key: CronFieldKey
  min: number
  max: number
  labelKey: string
  allowNames?: Record<string, number>
  allowQuestionMark?: boolean
}

interface ParsedField {
  values: number[]
  isWildcard: boolean
  raw: string
}

interface CronParseSuccess {
  success: true
  fields: Record<CronFieldKey, ParsedField>
}

interface CronParseFailure {
  success: false
  error: string
}

type CronParseResult = CronParseSuccess | CronParseFailure

const MONTH_NAME_MAP: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
}

const DAY_NAME_MAP: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
}

const FIELD_CONFIGS: FieldConfig[] = [
  { key: 'minute', min: 0, max: 59, labelKey: 'fields.minute' },
  { key: 'hour', min: 0, max: 23, labelKey: 'fields.hour' },
  { key: 'dayOfMonth', min: 1, max: 31, labelKey: 'fields.day_of_month', allowQuestionMark: true },
  { key: 'month', min: 1, max: 12, labelKey: 'fields.month', allowNames: MONTH_NAME_MAP },
  { key: 'dayOfWeek', min: 0, max: 6, labelKey: 'fields.day_of_week', allowNames: DAY_NAME_MAP, allowQuestionMark: true },
]

function normalizeValue(token: string, config: FieldConfig): number | null {
  const { allowNames, min, max } = config
  const upper = token.toUpperCase()

  if (allowNames && allowNames[upper] !== undefined) {
    return allowNames[upper]
  }

  const value = Number(token)
  if (!Number.isFinite(value)) {
    return null
  }

  if (config.key === 'dayOfWeek' && value === 7) {
    return 0
  }

  if (value < min || value > max) {
    return null
  }

  return value
}

function expandSegment(segment: string, config: FieldConfig): number[] | null {
  if (segment === '*') {
    return Array.from({ length: config.max - config.min + 1 }, (_, index) => config.min + index)
  }

  const [rangePart, stepPart] = segment.split('/')
  const step = stepPart ? Number(stepPart) : 1

  if (!Number.isFinite(step) || step <= 0) {
    return null
  }

  if (rangePart === '*') {
    const values: number[] = []
    for (let value = config.min; value <= config.max; value += step) {
      values.push(value)
    }
    return values
  }

  const [startToken, endToken] = rangePart.split('-')

  const start = normalizeValue(startToken, config)
  const end = endToken !== undefined ? normalizeValue(endToken, config) : start

  if (start === null || end === null || start > end) {
    return null
  }

  const values: number[] = []
  for (let value = start; value <= end; value += step) {
    if (value >= config.min && value <= config.max) {
      values.push(value)
    }
  }

  return values
}

function parseField(segment: string, config: FieldConfig): ParsedField | null {
  const raw = segment
  const normalized = segment.trim()

  if (config.allowQuestionMark && normalized === '?') {
    return {
      values: [],
      isWildcard: true,
      raw,
    }
  }

  if (normalized === '*') {
    return {
      values: Array.from({ length: config.max - config.min + 1 }, (_, index) => config.min + index),
      isWildcard: true,
      raw,
    }
  }

  const parts = normalized.split(',')
  const valuesSet = new Set<number>()

  for (const part of parts) {
    const segmentValues = expandSegment(part.trim(), config)
    if (!segmentValues) {
      return null
    }
    segmentValues.forEach((value) => valuesSet.add(value))
  }

  return {
    values: Array.from(valuesSet).sort((a, b) => a - b),
    isWildcard: false,
    raw,
  }
}

function parseCronExpression(expression: string, t: ReturnType<typeof useTranslations>): CronParseResult {
  const trimmed = expression.trim()
  if (!trimmed) {
    return {
      success: false,
      error: t('errors.empty'),
    }
  }

  const parts = trimmed.split(/\s+/)
  if (parts.length !== 5) {
    return {
      success: false,
      error: t('errors.invalid_field_count'),
    }
  }

  const fields: Partial<Record<CronFieldKey, ParsedField>> = {}

  for (let index = 0; index < FIELD_CONFIGS.length; index += 1) {
    const config = FIELD_CONFIGS[index]
    const part = parts[index]
    const parsed = parseField(part, config)
    if (!parsed) {
      return {
        success: false,
        error: t('errors.invalid_field', { field: t(config.labelKey) }),
      }
    }
    fields[config.key] = parsed
  }

  return {
    success: true,
    fields: fields as Record<CronFieldKey, ParsedField>,
  }
}

function matchesValue(field: ParsedField, value: number): boolean {
  if (field.isWildcard) {
    return true
  }
  return field.values.includes(value)
}

function doesDateMatch(date: Date, parsed: CronParseSuccess): boolean {
  const { fields } = parsed

  const minuteMatch = matchesValue(fields.minute, date.getMinutes())
  if (!minuteMatch) return false

  const hourMatch = matchesValue(fields.hour, date.getHours())
  if (!hourMatch) return false

  const monthMatch = matchesValue(fields.month, date.getMonth() + 1)
  if (!monthMatch) return false

  const day = date.getDate()
  const dayOfWeek = date.getDay()

  const domWildcard = fields.dayOfMonth.isWildcard
  const dowWildcard = fields.dayOfWeek.isWildcard

  const dayOfMonthMatch = matchesValue(fields.dayOfMonth, day)
  const dayOfWeekMatch = matchesValue(fields.dayOfWeek, dayOfWeek)

  if (domWildcard && dowWildcard) {
    return true
  }

  if (domWildcard && dayOfWeekMatch) {
    return true
  }

  if (dowWildcard && dayOfMonthMatch) {
    return true
  }

  if (!domWildcard && !dowWildcard) {
    return dayOfMonthMatch || dayOfWeekMatch
  }

  return dayOfMonthMatch || dayOfWeekMatch
}

function generateUpcomingRuns(parsed: CronParseSuccess, count: number): Date[] {
  const results: Date[] = []
  let attempts = 0
  let cursor = new Date()
  cursor.setSeconds(0, 0)
  cursor = new Date(cursor.getTime() + 60_000)

  const limit = 525_600 // roughly one year of minutes

  while (results.length < count && attempts < limit) {
    if (doesDateMatch(cursor, parsed)) {
      results.push(new Date(cursor))
    }
    cursor = new Date(cursor.getTime() + 60_000)
    attempts += 1
  }

  return results
}

function formatFieldPreview(field: ParsedField, t: ReturnType<typeof useTranslations>): string {
  if (field.isWildcard) {
    return t('fields.any')
  }

  return field.values.slice(0, 12).join(', ') + (field.values.length > 12 ? '…' : '')
}

export default function CronExpressionParserTool() {
  const t = useTranslations('tools.cron-expression-parser')
  const common = useTranslations('common')

  const [expression, setExpression] = useState('* * * * *')
  const [previewCount, setPreviewCount] = useState(5)

  const parseResult = useMemo(() => parseCronExpression(expression, t), [expression, t])

  const upcomingRuns = useMemo(() => {
    if (!parseResult.success) {
      return []
    }
    return generateUpcomingRuns(parseResult, Math.min(Math.max(previewCount, 1), 20))
  }, [parseResult, previewCount])

  const now = new Date()

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('input_title')}</CardTitle>
            <CardDescription>{t('input_description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cron-expression">{t('expression_label')}</Label>
              <Textarea
                id="cron-expression"
                value={expression}
                onChange={(event) => setExpression(event.target.value)}
                className="min-h-[100px] font-mono"
                placeholder="*/5 8-18 * * 1-5"
              />
              <p className="text-xs text-muted-foreground">
                {t('expression_hint')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setExpression('0 9 * * MON-FRI')}
              >
                {t('presets.workday_morning')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setExpression('*/15 * * * *')}
              >
                {t('presets.every_fifteen_minutes')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setExpression('* * * * *')}
              >
                {common('clear')}
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="preview-count">{t('preview_count_label')}</Label>
                <Input
                  id="preview-count"
                  type="number"
                  min={1}
                  max={20}
                  value={previewCount}
                  onChange={(event) => setPreviewCount(Number(event.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('current_time_label')}</Label>
                <Input value={now.toLocaleString()} readOnly className="font-mono" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('structure_title')}</CardTitle>
            <CardDescription>{t('structure_description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!parseResult.success ? (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                {parseResult.error}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('table.field')}</TableHead>
                    <TableHead>{t('table.raw')}</TableHead>
                    <TableHead>{t('table.values')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FIELD_CONFIGS.map((config) => {
                    const field = parseResult.fields[config.key]
                    return (
                      <TableRow key={config.key}>
                        <TableCell className="font-medium">
                          {t(config.labelKey)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{field.raw}</TableCell>
                        <TableCell className="text-sm">
                          <Badge variant={field.isWildcard ? 'outline' : 'secondary'}>
                            {formatFieldPreview(field, t)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('upcoming_title')}</CardTitle>
          <CardDescription>{t('upcoming_description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!parseResult.success ? (
            <div className="text-sm text-muted-foreground">
              {t('upcoming_placeholder')}
            </div>
          ) : upcomingRuns.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {t('upcoming_empty')}
            </div>
          ) : (
            <ul className="space-y-2">
              {upcomingRuns.map((run, index) => (
                <li key={run.toISOString()} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="font-medium text-sm">
                    {run.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t('occurrence_index', { index: index + 1 })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ToolSEOSection toolId="cron-expression-parser" />
    </div>
  )
}
