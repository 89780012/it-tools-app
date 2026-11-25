'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Copy, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ToolSEOSection } from '@/components/seo/tool-seo-section'
import { formatInZone, parseExtendedDate, timestampToMs, TIME_ZONES, type TimeUnit } from '@/lib/time-extended'

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

  const [millisecondsInput, setMillisecondsInput] = useState('1700000000000')
  const [stringInput, setStringInput] = useState('2025-01-01 12:30:00')
  const [copyTarget, setCopyTarget] = useState<string | null>(null)
  const [unit, setUnit] = useState<TimeUnit>('milliseconds')
  const [zone, setZone] = useState('local')
  const [endInput, setEndInput] = useState('2025-01-02 12:30:00')
  const difference = useMemo(() => {
    try { return String(parseExtendedDate(endInput, zone) - parseExtendedDate(stringInput, zone)) }
    catch { return null }
  }, [endInput, stringInput, zone])

  const millisecondsResult = useMemo<MillisecondsResult>(() => {
    const trimmed = millisecondsInput.trim()

    if (!trimmed) {
      return { success: false }
    }

    if (!/^[-]?\d+$/.test(trimmed)) {
      return { success: false, message: `${common('error')}: ${t('milliseconds_hint')}` }
    }

    try {
      const value = timestampToMs(trimmed, unit)
      return { success: true, formatted: formatInZone(value, zone), value }
    } catch { return { success: false, message: `${common('error')}: ${t('milliseconds_hint')}` } }
  }, [millisecondsInput, unit, zone, t, common])

  const stringResult = useMemo<StringResult>(() => {
    const trimmed = stringInput.trim()

    if (!trimmed) {
      return { success: false }
    }

    try {
      const milliseconds = parseExtendedDate(trimmed, zone)
      return { success: true, milliseconds, normalized: formatInZone(milliseconds, zone) }
    } catch { return { success: false, message: t('invalid_string') } }
  }, [stringInput, zone, t])

  const now = new Date()
  const nowMilliseconds = now.getTime()
  let nowFormatted = ''
  try { nowFormatted = formatInZone(nowMilliseconds, zone) } catch { /* Invalid zones are shown by the conversion panels. */ }

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
      <header className="space-y-2"><h1 className="text-3xl font-semibold">{t('name')}</h1><p className="text-sm text-muted-foreground">{t('description')}</p></header>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">{t('extraUnit')}<select data-testid="time-unit" className="block w-full rounded border bg-background p-2" value={unit} onChange={e => setUnit(e.target.value as TimeUnit)}><option value="milliseconds">{t('extraMilliseconds')}</option><option value="seconds">{t('extraSeconds')}</option></select></label>
        <label className="space-y-2">{t('extraZone')}<Input data-testid="time-zone" list="time-zones" value={zone} onChange={e => setZone(e.target.value)} /><datalist id="time-zones">{TIME_ZONES.map(z => <option key={z} value={z}>{z === 'local' ? t('extraLocal') : z}</option>)}</datalist></label>
      </div>
      {!nowFormatted && <p role="alert" className="text-destructive">{common('error')}: {t('extraZone')}</p>}
      <p className="text-sm text-muted-foreground">{t('extraDst')}</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('extraTimestampTitle')}</CardTitle>
            <CardDescription>{t('extraExplicit')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="milliseconds-input">{t('extraUnit')}: {unit === 'seconds' ? t('extraSeconds') : t('extraMilliseconds')}</Label>
              <Input
                id="milliseconds-input"
                data-testid="time-timestamp"
                inputMode="numeric"
                value={millisecondsInput}
                onChange={(event) => setMillisecondsInput(event.target.value)}
                placeholder={unit === 'seconds' ? '1700000000' : '1700000000000'}
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
                onClick={() => setMillisecondsInput(String(unit === 'seconds' ? Math.floor(Date.now() / 1000) : Date.now()))}
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
                  <div data-testid="time-iso" className="text-sm">{t('extraIso')}: {new Date(millisecondsResult.value!).toISOString()}</div>
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
            <CardTitle>{t('formatted_time_label')} → {unit === 'seconds' ? t('extraSeconds') : t('extraMilliseconds')}</CardTitle>
            <CardDescription>{t('extraInputHint')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="string-input">{t('string_input_label')}</Label>
              <Input
                id="string-input"
                data-testid="time-date"
                value={stringInput}
                onChange={(event) => setStringInput(event.target.value)}
                placeholder="2025-01-01 12:30:00"
              />
              <p className="text-xs text-muted-foreground">
                {t('extraInputHint')}
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
                    {t('extraUnit')}: {unit === 'seconds' ? t('extraSeconds') : t('extraMilliseconds')}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(String(stringResult.milliseconds! / (unit === 'seconds' ? 1000 : 1)), 'milliseconds-copy')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {common('copy')}
                  </Button>
                </div>
                <div data-testid="time-result" className="font-mono text-lg">
                  {stringResult.milliseconds / (unit === 'seconds' ? 1000 : 1)}
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
      <Card><CardHeader><CardTitle>{t('extraDifference')}</CardTitle></CardHeader><CardContent className="space-y-3"><label>{t('extraEnd')}<Input data-testid="time-end" value={endInput} onChange={e => setEndInput(e.target.value)} /></label>{difference !== null ? <output data-testid="time-difference">{difference} {t('extraMilliseconds')} / {Number(difference) / 1000} {t('extraSeconds')} / {Number(difference) / 86400000} {t('extraDays')}</output> : <p role="alert">{t('invalid_string')}</p>}</CardContent></Card>

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
                setMillisecondsInput(String(unit === 'seconds' ? Math.floor(updatedNow.getTime() / 1000) : updatedNow.getTime()))
                setStringInput(nowFormatted)
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
