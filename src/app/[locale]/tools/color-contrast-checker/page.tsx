import { useState } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Workbench,
  Field,
  Panel,
  ErrorMessage,
} from '@/components/tools/workbench'
import {
  frontendContrast,
  frontendContrastLevels,
  frontendHex,
} from '@/lib/frontend-contrast'

export default function ColorContrastChecker() {
  const t = useTranslations('tools.color-contrast-checker')
  const [foreground, setForeground] = useState('#000000'),
    [background, setBackground] = useState('#ffffff')
  const fg = frontendHex(foreground),
    bg = frontendHex(background)
  const ratio = fg && bg ? frontendContrast(fg, bg) : null
  const levels = ratio === null ? null : frontendContrastLevels(ratio)
  return (
    <Workbench toolId="color-contrast-checker">
      <Panel title={t('colors')}>
        <div className="grid gap-4 sm:grid-cols-2">
          {(['foreground', 'background'] as const).map((key) => {
            const value = key === 'foreground' ? foreground : background,
              normalized = key === 'foreground' ? fg : bg
            const set = key === 'foreground' ? setForeground : setBackground
            return (
              <Field key={key} label={t(key)} htmlFor={`contrast-${key}`}>
                <div className="flex gap-2">
                  <Input
                    id={`contrast-${key}`}
                    data-testid={`contrast-${key}`}
                    dir="ltr"
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    aria-invalid={!normalized}
                  />
                  <input
                    type="color"
                    data-testid={`contrast-${key}-picker`}
                    aria-label={t('picker', { color: t(key) })}
                    value={normalized ?? '#000000'}
                    onChange={(e) => set(e.target.value)}
                    className="h-10 w-14 shrink-0 rounded border"
                  />
                </div>
              </Field>
            )
          })}
        </div>
        <Button
          data-testid="contrast-swap"
          onClick={() => {
            setForeground(background)
            setBackground(foreground)
          }}
        >
          {t('swap')}
        </Button>
        <ErrorMessage>{ratio === null ? t('invalidColor') : null}</ErrorMessage>
      </Panel>
      {ratio !== null && levels && (
        <Panel title={t('result')}>
          <p
            data-testid="contrast-ratio"
            className="text-3xl font-semibold"
            dir="ltr"
          >
            {ratio.toFixed(2)}:1
          </p>
          <div
            data-testid="contrast-preview"
            style={{ color: fg!, backgroundColor: bg! }}
            className="space-y-2 rounded border p-6"
          >
            <p className="text-2xl">{t('sampleLarge')}</p>
            <p className="text-base">{t('sample')}</p>
          </div>
          <p className="text-sm text-muted-foreground">{t('largeHint')}</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(levels) as (keyof typeof levels)[]).map((key) => (
              <li
                key={key}
                data-testid={`contrast-${key}`}
                className="rounded border p-3"
              >
                {t(key)}: <strong>{t(levels[key] ? 'pass' : 'fail')}</strong>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </Workbench>
  )
}
