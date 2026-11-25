import { useEffect, useState } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Workbench,
  Field,
  Panel,
  downloadText,
} from '@/components/tools/workbench'
import {
  frontendMarkdownTable,
  renderFrontendMarkdown,
} from '@/lib/frontend-markdown'

export default function MarkdownPreview() {
  const t = useTranslations('tools.markdown-preview'),
    w = useTranslations('workbench')
  const [source, setSource] = useState(''),
    [html, setHtml] = useState(''),
    [notice, setNotice] = useState('')
  const [cells, setCells] = useState<string[][]>([
    ['', ''],
    ['', ''],
  ])
  useEffect(() => {
    setHtml(renderFrontendMarkdown(source))
  }, [source])
  const resize = (rows: number, columns: number) => {
    if (
      !Number.isInteger(rows) ||
      !Number.isInteger(columns) ||
      rows < 1 ||
      rows > 20 ||
      columns < 1 ||
      columns > 12
    )
      return
    setCells((previous) =>
      Array.from({ length: rows }, (_, row) =>
        Array.from(
          { length: columns },
          (_, column) => previous[row]?.[column] ?? '',
        ),
      ),
    )
  }
  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setNotice(w('copied'))
    } catch {
      setNotice(w('copyError'))
    }
  }
  return (
    <Workbench toolId="markdown-preview">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={w('input')}>
          <Field label={t('markdown')} htmlFor="markdown-source">
            <Textarea
              id="markdown-source"
              data-testid="markdown-input"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              className="min-h-80 font-mono"
              dir="ltr"
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button
              data-testid="markdown-copy"
              disabled={!source}
              onClick={() => copy(source)}
            >
              {t('copyMarkdown')}
            </Button>
            <Button
              data-testid="markdown-download"
              disabled={!source}
              onClick={() =>
                downloadText(
                  source,
                  'document.md',
                  'text/markdown;charset=utf-8',
                )
              }
            >
              {t('downloadMarkdown')}
            </Button>
            <Button
              variant="outline"
              data-testid="markdown-clear"
              onClick={() => setSource('')}
            >
              {w('clear')}
            </Button>
          </div>
        </Panel>
        <Panel title={t('preview')}>
          <div
            data-testid="markdown-preview"
            className="min-h-80 overflow-auto break-words rounded border p-4 [&_table]:border-collapse [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2 [&_pre]:overflow-auto [&_pre]:bg-muted [&_pre]:p-3 [&_a]:underline [&_h1]:text-3xl [&_h2]:text-2xl [&_ul]:list-inside [&_ul]:list-disc"
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <p className="text-xs text-muted-foreground">{t('safeHint')}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              data-testid="markdown-copy-html"
              disabled={!html}
              onClick={() => copy(html)}
            >
              {t('copyHtml')}
            </Button>
            <Button
              data-testid="markdown-download-html"
              disabled={!html}
              onClick={() =>
                downloadText(html, 'document.html', 'text/html;charset=utf-8')
              }
            >
              {t('downloadHtml')}
            </Button>
          </div>
        </Panel>
      </div>
      <Panel title={t('table')}>
        <p className="text-sm text-muted-foreground">{t('tableHint')}</p>
        <div className="flex gap-4">
          <Field label={t('rows')} htmlFor="markdown-rows">
            <Input
              id="markdown-rows"
              data-testid="markdown-rows"
              type="number"
              min={1}
              max={20}
              value={cells.length}
              onChange={(e) => resize(Number(e.target.value), cells[0].length)}
            />
          </Field>
          <Field label={t('columns')} htmlFor="markdown-columns">
            <Input
              id="markdown-columns"
              data-testid="markdown-columns"
              type="number"
              min={1}
              max={12}
              value={cells[0].length}
              onChange={(e) => resize(cells.length, Number(e.target.value))}
            />
          </Field>
        </div>
        <div className="overflow-x-auto">
          <table>
            <tbody>
              {cells.map((row, r) => (
                <tr key={r}>
                  {row.map((value, c) => (
                    <td key={c} className="p-1">
                      <Input
                        className="min-w-32"
                        data-testid={`markdown-cell-${r}-${c}`}
                        aria-label={t('cell', { row: r + 1, column: c + 1 })}
                        value={value}
                        onChange={(e) =>
                          setCells((previous) =>
                            previous.map((line, i) =>
                              line.map((cell, j) =>
                                i === r && j === c ? e.target.value : cell,
                              ),
                            ),
                          )
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button
          data-testid="markdown-insert-table"
          onClick={() =>
            setSource(
              (previous) =>
                `${previous}${previous ? '\n\n' : ''}${frontendMarkdownTable(cells)}`,
            )
          }
        >
          {t('insertTable')}
        </Button>
      </Panel>
      <span role="status">{notice}</span>
    </Workbench>
  )
}
