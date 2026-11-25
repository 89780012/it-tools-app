import { marked } from 'marked'
import DOMPurify from 'dompurify'

/** Browser-only sanitization keeps server rendering deterministic and never emits raw HTML. */
export function renderFrontendMarkdown(source: string): string {
  if (typeof window === 'undefined' || !DOMPurify.sanitize) return ''
  const html = marked.parse(source, {
    gfm: true,
    breaks: false,
    async: false,
  }) as string
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'hr',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'strong',
      'em',
      'del',
      'blockquote',
      'pre',
      'code',
      'ul',
      'ol',
      'li',
      'a',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'input',
    ],
    ALLOWED_ATTR: ['href', 'title', 'align', 'type', 'checked', 'disabled'],
    ALLOWED_URI_REGEXP: /^(?:https?:\/\/|mailto:|#)/i,
    FORBID_TAGS: ['script', 'style', 'svg', 'math', 'iframe', 'form'],
  })
}

export function frontendMarkdownTable(cells: string[][]): string {
  if (!cells.length || !cells[0].length) return ''
  const escape = (value: string) =>
    value
      .replace(/\\/g, '\\\\')
      .replace(/\|/g, '\\|')
      .replace(/\r\n|\r|\n/g, '<br>')
  const row = (values: string[]) => `| ${values.map(escape).join(' | ')} |`
  return [
    row(cells[0]),
    row(cells[0].map(() => '---')),
    ...cells.slice(1).map(row),
  ].join('\n')
}
