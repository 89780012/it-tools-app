import { useState, type ReactNode } from 'react'
import { Copy, Download } from 'lucide-react'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function Workbench({
  toolId,
  children,
}: {
  toolId: string
  children: ReactNode
}) {
  const t = useTranslations()
  return (
    <section
      className="container mx-auto max-w-7xl space-y-6 p-2 md:p-6"
      data-tool={toolId}
    >
      <header className="space-y-2 border-b pb-5">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {t(`tools.${toolId}.name`)}
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {t(`tools.${toolId}.description`)}
        </p>
        <p className="text-xs text-muted-foreground">{t('workbench.local')}</p>
      </header>
      {children}
    </section>
  )
}

export function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
  hint?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function Panel({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <Card className="min-w-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

export function ErrorMessage({ children }: { children: ReactNode }) {
  return children ? (
    <p
      role="alert"
      className="break-words rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
    >
      {children}
    </p>
  ) : null
}

export function downloadText(
  text: string,
  filename: string,
  type = 'text/plain;charset=utf-8',
) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function Output({
  value,
  filename = 'result.txt',
  label,
}: {
  value: string
  filename?: string
  label?: string
}) {
  const t = useTranslations('workbench')
  const [notice, setNotice] = useState('')
  const outputLabel = label ?? t('output')
  return (
    <div className="space-y-3">
      <label className="block space-y-2">
        <span className="text-sm font-medium">{outputLabel}</span>
        <Textarea
          aria-label={outputLabel}
          data-testid="tool-output"
          readOnly
          value={value}
          className="min-h-64 font-mono text-sm"
          dir="ltr"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!value}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value)
              setNotice(t('copied'))
            } catch {
              setNotice(t('copyError'))
            }
          }}
        >
          <Copy className="me-2 size-4" />
          {t('copy')}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!value}
          onClick={() => downloadText(value, filename)}
        >
          <Download className="me-2 size-4" />
          {t('download')}
        </Button>
        <span
          role="status"
          className="self-center text-xs text-muted-foreground"
        >
          {notice}
        </span>
      </div>
    </div>
  )
}
