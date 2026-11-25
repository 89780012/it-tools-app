import { format } from 'prettier/standalone'
import postcss from 'prettier/plugins/postcss'

export async function formatFrontendCss(
  source: string,
  indent: '2' | '4' | 'tab' = '2',
): Promise<string> {
  return format(source, {
    parser: 'css',
    plugins: [postcss],
    tabWidth: indent === '4' ? 4 : 2,
    useTabs: indent === 'tab',
  })
}
