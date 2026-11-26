import fs from 'node:fs/promises'
import path from 'node:path'
import { createServer } from 'vite'

const dist = path.resolve('dist')
const template = await fs.readFile(path.join(dist, 'index.html'), 'utf8')
const htmlEscape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', ssr: { noExternal: ['react-router-dom', 'react-router'], resolve: { conditions: ['module', 'module-sync', 'import'] } } })
try {
  const { render, locales, toolsConfig, getSeoHead, getMessages } = await server.ssrLoadModule('/src/entry-server.tsx')
  const toolIds = toolsConfig.flatMap(category => category.tools.map(tool => tool.id))
  const routes = ['/', '/changelog', ...toolIds.map(id => `/tools/${id}`)]
  let count = 0
  for (const locale of locales) {
    const messages = getMessages(locale)
    const translate = key => {
      const value = key.split('.').reduce((current, name) => current?.[name], messages)
      if (typeof value !== 'string') throw new Error(`Missing SEO translation: ${locale}:${key}`)
      return value
    }
    for (const route of routes) {
      const toolId = route.startsWith('/tools/') ? route.slice(7) : undefined
      const page = toolId ? 'tools' : route === '/changelog' ? 'changelog' : 'home'
      const url = `${locale === 'en' ? '' : `/${locale}`}${route === '/' ? '' : route}` || '/'
      const head = getSeoHead(locale, page, toolId, translate)
      const headHtml = head.tags.map(({ tag, attrs }) => `<${tag} data-seo="true" ${Object.entries(attrs).map(([name, value]) => `${name}="${htmlEscape(value)}"`).join(' ')} />`).join('\n    ')
      const body = render(url, locale, toolId)
      if (body.includes('The server did not finish this Suspense boundary') || body.includes('Switched to client rendering')) throw new Error(`Incomplete prerender: ${url}`)
      const html = template
        .replace(/<html lang="[^"]*">/, `<html lang="${locale}"${locale === 'ar' ? ' dir="rtl"' : ''}>`)
        .replace(/\s*<meta name="(?:description|keywords)"[^>]*>/g, '')
        .replace(/<title>[^<]*<\/title>/, `<title>${htmlEscape(head.title)}</title>`)
        .replace('</head>', `    ${headHtml}\n  </head>`)
        .replace('<div id="root"></div>', () => `<div id="root">${body}</div>`)
      const file = url === '/' ? path.join(dist, 'index.html') : path.join(dist, url, 'index.html')
      await fs.mkdir(path.dirname(file), { recursive: true })
      await fs.writeFile(file, html, 'utf8')
      count++
    }
    console.log(`Prerendered ${locale}: ${routes.length} pages`)
    const entries = routes.map(route => {
      const url = `https://www.toolkitpub.com${locale === 'en' ? '' : `/${locale}`}${route === '/' ? '' : route}`
      return `  <url><loc>${htmlEscape(url)}</loc></url>`
    }).join('\n')
    await fs.writeFile(path.join(dist, `sitemap-${locale}.xml`), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`)
  }
  const sitemapIndex = locales.map(locale => `  <sitemap><loc>https://www.toolkitpub.com/sitemap-${locale}.xml</loc></sitemap>`).join('\n')
  await fs.writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapIndex}\n</sitemapindex>\n`)
  console.log(`Generated ${count} SEO pages with complete HTML and catalog-derived sitemaps.`)
} finally {
  await server.close()
}
