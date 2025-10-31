'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Copy, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ToolSEOSection } from '@/components/seo/tool-seo-section'
import { formatDateTimePattern, parseDateTimePattern } from '@/lib/time-utils'

interface MillisecondsResult {
  success: boolean
  message?: string
  formatted?: string
  value?: number
}

interface StringResult {
  success: boolean
  message?: string
  milliseconds?: number
  normalized?: string
}

export default function TimeConverterTool() {
  const t = useTranslations('tools.time-converter')
  const common = useTranslations('common')

  const [millisecondsInput, setMillisecondsInput] = useState('')
  const [stringInput, setStringInput] = useState('')
  const [copyTarget, setCopyTarget] = useState<string | null>(null)

  const millisecondsResult = useMemo<MillisecondsResult>(() => {
    const trimmed = millisecondsInput.trim()

    if (!trimmed) {
      return { success: false }
    }

    if (!/^[-]?\d+$/.test(trimmed)) {
      return { success: false, message: t('invalid_milliseconds') }
    }

    const value = Number(trimmed)

    if (!Number.isFinite(value)) {
      return { success: false, message: t('invalid_milliseconds') }
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return { success: false, message: t('invalid_milliseconds') }
    }

    return {
      success: true,
      formatted: formatDateTimePattern(date),
      value
    }
  }, [millisecondsInput, t])

  const stringResult = useMemo<StringResult>(() => {
    const trimmed = stringInput.trim()

    if (!trimmed) {
      return { success: false }
    }

    const date = parseDateTimePattern(trimmed)

    if (!date) {
      return { success: false, message: t('invalid_string') }
    }

    return {
      success: true,
      milliseconds: date.getTime(),
      normalized: formatDateTimePattern(date)
    }
  }, [stringInput, t])

  const now = new Date()
  const nowMilliseconds = now.getTime()
  const nowFormatted = formatDateTimePattern(now)

  const handleCopy = async (value: string, target: string) => {
    if (!value) return

    try {
      await navigator.clipboard.writeText(value)
      setCopyTarget(target)
      setTimeout(() => setCopyTarget(null), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('from_milliseconds_title')}</CardTitle>
            <CardDescription>{t('from_milliseconds_description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="milliseconds-input">{t('milliseconds_input_label')}</Label>
              <Input
                id="milliseconds-input"
                inputMode="numeric"
                value={millisecondsInput}
                onChange={(event) => setMillisecondsInput(event.target.value)}
                placeholder={t('milliseconds_placeholder')}
              />
              <p className="text-xs text-muted-foreground">
                {t('milliseconds_hint')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setMillisecondsInput(String(Date.now()))}
              >
                {t('use_current_milliseconds')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setMillisecondsInput('')}
              >
                {common('clear')}
              </Button>
            </div>

            {millisecondsResult.message && (
              <div className="text-sm text-destructive">
                {millisecondsResult.message}
              </div>
            )}

            {millisecondsResult.success && millisecondsResult.formatted && (
              <div className="rounded-lg border p-4 space-y-3 bg-muted/40">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t('formatted_time_label')}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(millisecondsResult.formatted!, 'formatted-copy')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {common('copy')}
                  </Button>
                </div>
                <div className="font-mono text-lg">
                  {millisecondsResult.formatted}
                </div>
                {copyTarget === 'formatted-copy' && (
                  <Badge variant="secondary" className="text-xs">
                    {common('copied')}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('from_string_title')}</CardTitle>
            <CardDescription>{t('from_string_description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="string-input">{t('string_input_label')}</Label>
              <Input
                id="string-input"
                value={stringInput}
                onChange={(event) => setStringInput(event.target.value)}
                placeholder="2025-01-01 12:30:00"
              />
              <p className="text-xs text-muted-foreground">
                {t('string_hint')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStringInput(nowFormatted)}
              >
                {t('use_current_string')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStringInput('')}
              >
                {common('clear')}
              </Button>
            </div>

            {stringResult.message && (
              <div className="text-sm text-destructive">
                {stringResult.message}
              </div>
            )}

            {stringResult.success && typeof stringResult.milliseconds === 'number' && (
              <div className="rounded-lg border p-4 space-y-3 bg-muted/40">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t('milliseconds_output_label')}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(String(stringResult.milliseconds), 'milliseconds-copy')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {common('copy')}
                  </Button>
                </div>
                <div className="font-mono text-lg">
                  {stringResult.milliseconds}
                </div>
                {stringResult.normalized && (
                  <div className="text-xs text-muted-foreground">
                    {t('normalized_label')}: {stringResult.normalized}
                  </div>
                )}
                {copyTarget === 'milliseconds-copy' && (
                  <Badge variant="secondary" className="text-xs">
                    {common('copied')}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/40">
        <CardHeader>
          <CardTitle>{t('quick_reference_title')}</CardTitle>
          <CardDescription>{t('quick_reference_description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm text-muted-foreground">
              {t('current_time_label')}
            </div>
            <div className="font-mono text-lg">
              {nowFormatted}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('current_milliseconds_label')}: {nowMilliseconds}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleCopy(nowFormatted, 'now-string-copy')}
            >
              <Copy className="h-4 w-4 mr-2" />
              {t('copy_current_string')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleCopy(String(nowMilliseconds), 'now-milliseconds-copy')}
            >
              <Copy className="h-4 w-4 mr-2" />
              {t('copy_current_milliseconds')}
            </Button>
            <Button
              type="button"
              onClick={() => {
                const updatedNow = new Date()
                setMillisecondsInput(String(updatedNow.getTime()))
                setStringInput(formatDateTimePattern(updatedNow))
              }}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              {t('fill_with_latest')}
            </Button>
          </div>
          {(copyTarget === 'now-string-copy' || copyTarget === 'now-milliseconds-copy') && (
            <Badge variant="secondary" className="text-xs">
              {common('copied')}
            </Badge>
          )}
        </CardContent>
      </Card>

      <ToolSEOSection toolId="time-converter" />
    </div>
  )
}
