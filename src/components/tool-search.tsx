import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslations } from '@/i18n/compat'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { allTools } from '@/lib/tools-config'
import { matchesTool } from '@/lib/tool-discovery'
export function ToolSearch() {
  const t = useTranslations(),
    x = useTranslations('expansion')
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState('')
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [])
  const results = allTools
    .filter((tool) => matchesTool(tool, query, t))
    .slice(0, 15)
  return (
    <>
      <Button
        variant="outline"
        aria-label={x('searchTools')}
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">{x('searchTools')}</span>
        <kbd className="hidden text-xs text-muted-foreground lg:inline">
          Ctrl / ⌘ K
        </kbd>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>{x('searchTools')}</DialogTitle>
          <DialogDescription>{x('searchHint')}</DialogDescription>
          <Input
            autoFocus
            aria-label={x('searchTools')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="max-h-[60vh] overflow-auto">
            {results.map((tool) => (
              <Link
                key={tool.id}
                href={tool.path}
                onClick={() => setOpen(false)}
                className="block rounded p-3 hover:bg-muted focus-visible:bg-muted"
              >
                <span className="font-medium">{t(tool.nameKey)}</span>
                <p className="text-sm text-muted-foreground">
                  {t(tool.descriptionKey)}
                </p>
              </Link>
            ))}
            {!results.length && <p role="status">{t('home.no_tools_found')}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
