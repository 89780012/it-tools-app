import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import DiffViewer, { DiffMethod } from 'react-diff-viewer-continued'
import { useTheme } from 'next-themes'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Workbench,
  Field,
  Panel,
  ErrorMessage,
  downloadText,
} from '@/components/tools/workbench'
import { compareTexts } from '@/lib/developer-diff'

export default function TextDiffPage() {
  const t = useTranslations('tools.text-diff')
  const w = useTranslations('workbench')
  const { resolvedTheme } = useTheme()
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')
  const [split, setSplit] = useState(true)
  const [words, setWords] = useState(true)
  const [ignore, setIgnore] = useState(false)
  const [fileError, setFileError] = useState('')
  const versions = useRef({ left: 0, right: 0 })
  const result = useMemo(() => {
    try {
      return { data: compareTexts(left, right, ignore), error: '' }
    } catch {
      return { data: null, error: 'tooLarge' }
    }
  }, [left, right, ignore])
  const importFile = async (
    event: ChangeEvent<HTMLInputElement>,
    side: 'left' | 'right',
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const version = ++versions.current[side]
    setFileError('')
    if (file.size > 100_000) {
      setFileError('tooLarge')
      return
    }
    try {
      const content = await file.text()
      if (versions.current[side] === version)
        (side === 'left' ? setLeft : setRight)(content)
    } catch {
      if (versions.current[side] === version) setFileError('fileError')
    }
  }
  return (
    <Workbench toolId="text-diff">
      <Panel title={w('input')}>
        <div className="grid gap-4 lg:grid-cols-2">
          {(['left', 'right'] as const).map((side) => (
            <div key={side} className="space-y-3">
              <Field label={t(side)} htmlFor={`diff-${side}`}>
                <Textarea
                  id={`diff-${side}`}
                  data-testid={`diff-${side}`}
                  dir="ltr"
                  className="min-h-48 font-mono"
                  value={side === 'left' ? left : right}
                  onChange={(event) => {
                    versions.current[side]++
                    setFileError('')
                    ;(side === 'left' ? setLeft : setRight)(event.target.value)
                  }}
                />
              </Field>
              <Field
                label={t(side === 'left' ? 'importLeft' : 'importRight')}
                htmlFor={`diff-file-${side}`}
              >
                <input
                  id={`diff-file-${side}`}
                  data-testid={`diff-file-${side}`}
                  type="file"
                  accept="text/*,.json,.csv,.md,.js,.ts,.go,.xml,.yaml,.yml"
                  className="block w-full rounded border p-2 text-sm"
                  onChange={(event) => void importFile(event, side)}
                />
              </Field>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            data-testid="diff-example"
            onClick={() => {
              versions.current.left++
              versions.current.right++
              setFileError('')
              setLeft('const count = 1;\nconst name = "Ada";\n')
              setRight('const count = 2;\nconst name = "Ada Lovelace";\n')
            }}
          >
            {w('example')}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              versions.current.left++
              versions.current.right++
              setFileError('')
              setLeft('')
              setRight('')
            }}
          >
            {w('clear')}
          </Button>
        </div>
      </Panel>
      <Panel title={w('options')}>
        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              data-testid="diff-split"
              checked={split}
              onChange={(event) => setSplit(event.target.checked)}
            />
            {t('sideBySide')}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              data-testid="diff-words"
              checked={words}
              onChange={(event) => setWords(event.target.checked)}
            />
            {t('wordChanges')}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              data-testid="diff-ignore"
              checked={ignore}
              onChange={(event) => setIgnore(event.target.checked)}
            />
            {t('ignoreWhitespace')}
          </label>
        </div>
        <p className="text-sm text-muted-foreground">{t('whitespaceHint')}</p>
        <ErrorMessage>
          {(fileError || result.error) && t(fileError || result.error)}
        </ErrorMessage>
      </Panel>
      {result.data && (
        <Panel title={split ? t('sideBySide') : t('unified')}>
          <p role="status" data-testid="diff-status">
            {t(result.data.equal ? 'identical' : 'different')}
          </p>
          <div data-testid="diff-view" dir="ltr" className="overflow-auto">
            <DiffViewer
              oldValue={result.data.left}
              newValue={result.data.right}
              splitView={split}
              disableWordDiff={!words}
              compareMethod={DiffMethod.WORDS_WITH_SPACE}
              showDiffOnly={false}
              useDarkTheme={resolvedTheme === 'dark'}
              hideSummary
              disableWorker
              leftTitle={t('left')}
              rightTitle={t('right')}
            />
          </div>
          <Button
            data-testid="diff-download"
            disabled={result.data.equal}
            variant="outline"
            onClick={() => downloadText(result.data!.unified, 'changes.diff')}
          >
            {t('downloadDiff')}
          </Button>
          <pre
            data-testid="diff-patch"
            dir="ltr"
            className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded border p-3 text-xs"
          >
            {result.data.unified}
          </pre>
        </Panel>
      )}
    </Workbench>
  )
}
