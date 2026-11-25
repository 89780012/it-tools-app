import fs from 'node:fs/promises'
import path from 'node:path'

const dist = path.resolve('dist')
const sourceHtml = await fs.readFile(path.join(dist, 'index.html'), 'utf8')
const localeFiles = (await fs.readdir('src/i18n/messages')).filter((file) => file.endsWith('.json'))
const locales = localeFiles.map((file) => path.basename(file, '.json'))
const defaultLocale = 'en'
const siteUrl = (process.env.SEO_SITE_URL || 'https://www.toolkitpub.com').replace(/\/$/, '')
const xmlEscape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')
const htmlEscape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const urlFor = (locale, route) => `${siteUrl}${locale === defaultLocale ? '' : `/${locale}`}${route || '/'}`

function buildHead(html, locale, route, metadata, fallback) {
  const title = metadata?.title || fallback.title
  const description = metadata?.description || fallback.description
  const keywords = metadata?.keywords || fallback.keywords
  const canonical = urlFor(locale, route)
  const alternates = locales.map((alternateLocale) => `<link rel="alternate" hreflang="${alternateLocale}" href="${urlFor(alternateLocale, route)}" />`).join('\n    ')
    + `\n    <link rel="alternate" hreflang="x-default" href="${urlFor(defaultLocale, route)}" />`
  const tags = `<meta name="description" content="${htmlEscape(description)}" />\n    <meta name="keywords" content="${htmlEscape(keywords)}" />\n    <meta property="og:title" content="${htmlEscape(title)}" />\n    <meta property="og:description" content="${htmlEscape(description)}" />\n    <meta property="og:url" content="${htmlEscape(canonical)}" />\n    <meta name="twitter:card" content="summary_large_image" />\n    <link rel="canonical" href="${htmlEscape(canonical)}" />\n    ${alternates}`
  return html
    .replace(/<html lang="[^"]*">/, `<html lang="${locale}"${locale === 'ar' ? ' dir="rtl"' : ''}>`)
    .replace(/\s*<meta name="description"[^>]*>/, '')
    .replace(/\s*<meta name="keywords"[^>]*>/, '')
    .replace(/\s*<link rel="canonical"[^>]*>/g, '')
    .replace(/\s*<link rel="alternate"[^>]*>/g, '')
    .replace(/\s*<meta property="og:[^"]+"[^>]*>/g, '')
    .replace(/\s*<meta name="twitter:card"[^>]*>/g, '')
    .replace(/<title>[^<]*<\/title>/, `<title>${htmlEscape(title)}</title>`)
    .replace('</head>', `    ${tags}\n  </head>`)
}

async function writeRoute(locale, route, metadata, fallback) {
  const filePath = route === '/' && locale === defaultLocale
    ? path.join(dist, 'index.html')
    : path.join(dist, locale === defaultLocale ? '' : locale, route.replace(/^\//, ''), 'index.html')
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, buildHead(sourceHtml, locale, route, metadata, fallback), 'utf8')
}

const sitemapEntries = new Map()
for (const file of localeFiles) {
  const locale = path.basename(file, '.json')
  const messages = JSON.parse(await fs.readFile(path.join('src/i18n/messages', file), 'utf8'))
  const siteMeta = messages.meta?.site || {}
  const siteFallback = {
    title: siteMeta.title || 'IT Tools Collection - Developer Toolbox',
    description: siteMeta.description || 'Online developer tools for everyday development tasks.',
    keywords: siteMeta.keywords || 'developer tools, online tools, JSON tools, format converters',
  }
  await writeRoute(locale, '/', siteMeta, siteFallback)
  sitemapEntries.set(urlFor(locale, '/'), locale)
  const changelog = messages.changelog || {}
  await writeRoute(locale, '/changelog', {
    title: changelog.title ? `${changelog.title} - ${siteFallback.title}` : siteFallback.title,
    description: changelog.description || siteFallback.description,
    keywords: siteFallback.keywords,
  }, siteFallback)
  sitemapEntries.set(urlFor(locale, '/changelog'), locale)

  for (const [toolId, tool] of Object.entries(messages.tools || {})) {
    if (!tool.meta) continue
    const route = `/tools/${toolId}`
    await writeRoute(locale, route, tool.meta, siteFallback)
    sitemapEntries.set(urlFor(locale, route), locale)
  }
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${Array.from(sitemapEntries.keys()).map((url) => {
  const pathname = new URL(url).pathname.replace(/\/$/, '')
  const localized = locales.map((locale) => {
    const baseRoute = pathname.replace(/^\/(zh|en|es|de|fr|it|pt|ru|ja|ko|ar|hi)(?=\/|$)/, '') || '/'
    return `    <xhtml:link rel="alternate" hreflang="${locale}" href="${xmlEscape(urlFor(locale, baseRoute))}" />`
  }).join('\n')
  return `  <url>\n    <loc>${xmlEscape(url)}</loc>\n${localized}\n    <changefreq>monthly</changefreq>\n    <priority>${pathname === '/' ? '1.0' : pathname.endsWith('/changelog') ? '0.4' : '0.8'}</priority>\n  </url>`
}).join('\n')}\n</urlset>\n`
await fs.writeFile(path.join(dist, 'sitemap.xml'), sitemap, 'utf8')
console.log(`Generated localized SEO pages for ${locales.length} locales (${sitemapEntries.size} URLs).`)
