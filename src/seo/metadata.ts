import { locales } from '@/i18n/config'

// Parity baseline: 89780012/it-tools-app main, 6437a2904c88123150bf56640b26069be30d50cc.
// Keep upstream's metadata inheritance and exceptions, including its limited alternates.
export const productionUrl = 'https://www.toolkitpub.com'
const siteTitle = 'IT Tools Collection - Developer Toolbox'
const socialDescription = 'All-in-one online developer tools collection with 30+ utilities: JSON formatter/converter/visualizer, Base64/URL encoder-decoder, MD5/SHA256/AES/RSA encryption, QR code generator, UUID generator, Cron parser, Docker run to compose converter, IP lookup, timestamp converter. Completely free, no installation required.'
const pageMetadataTools = new Set(['cron-expression-parser', 'firewall-cheatsheet', 'git-cheatsheet', 'ip-lookup', 'linux-log-helper', 'nginx-cheatsheet', 'time-converter'])
export type HeadTag = { tag: 'meta' | 'link'; attrs: Record<string, string> }
export type SeoHead = { title: string; tags: HeadTag[] }

export function getSeoHead(locale: string, page: string, toolId: string | undefined, t: (key: string) => string, baseUrl = productionUrl): SeoHead {
  const homeUrl = `${productionUrl}${locale === 'en' ? '' : `/${locale}`}`
  const tags: HeadTag[] = []
  const meta = (name: string, content: string, property = false) => tags.push({ tag: 'meta', attrs: { [property ? 'property' : 'name']: name, content } })
  const link = (rel: string, href: string, hreflang?: string) => tags.push({ tag: 'link', attrs: { rel, href, ...(hreflang ? { hreflang } : {}) } })
  const isTool = page === 'tools' && !!toolId
  const isChangelog = page === 'changelog'
  const namespace = isTool ? `tools.${toolId}.meta` : 'changelog.meta'
  const title = isTool || isChangelog ? `${t(`${namespace}.title`)} - IT Tools Collection` : siteTitle
  const rawTitle = isTool || isChangelog ? t(`${namespace}.title`) : siteTitle
  const description = isTool || isChangelog ? t(`${namespace}.description`) : 'Discover 50+ developer tools for JSON processing, text conversion, encryption, network debugging, and image editing. Free, privacy-focused, updated weekly!'
  meta('description', description)
  meta('author', 'ToolkitPub')
  meta('keywords', isTool || isChangelog ? t(`${namespace}.keywords`) : 'developer tools, utilities for developers, format converters, JSON utilities, image processing tools, encryption tools, network debugging tools, high performance tools')
  meta('creator', 'ToolkitPub')
  meta('publisher', 'ToolkitPub')
  meta('robots', 'index, follow')
  meta('googlebot', 'index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1')
  meta('category', 'Technology')
  meta('classification', 'Business')
  meta('google-site-verification', 'ug5B82ON5ecwi32czM2KeTKgiBdpf84aNw93YyYsz68')
  // Upstream emits this as a metadata tag, rather than a JSON-LD script.
  meta('application/ld+json', JSON.stringify({
    '@context': 'https://schema.org', '@type': 'WebApplication', name: 'IT Tools Collection',
    description: 'All-in-one online developer tools collection with 30+ utilities including JSON formatter/converter/visualizer, Base64/URL encoder-decoder, MD5/SHA256/AES/RSA encryption, QR code generator, UUID generator, Cron parser, Docker run to compose converter, IP lookup, and timestamp converter. Completely free with multi-language support.',
    url: homeUrl, applicationCategory: 'DeveloperApplication', operatingSystem: 'All',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, author: { '@type': 'Organization', name: 'ToolkitPub' },
  }))

  const inheritsAlternates = !isTool || toolId === 'linux-log-helper'
  const toolUrl = `${baseUrl.replace(/\/$/, '')}/${locale === 'en' ? '' : `${locale}/`}tools/${toolId}`
  link('canonical', inheritsAlternates ? homeUrl : toolUrl)
  const alternateLocales = inheritsAlternates ? ['en', 'zh', 'hi', 'x-default'] : toolId === 'json-key-fixer' ? ['en', 'zh', 'hi', 'de'] : ['en', ...locales.filter(value => value !== 'en')]
  for (const alternateLocale of alternateLocales) {
    const origin = toolId === 'json-key-fixer' && isTool ? baseUrl.replace(/\/$/, '') : productionUrl
    const prefix = alternateLocale === 'en' || alternateLocale === 'x-default' ? '' : `/${alternateLocale}`
    link('alternate', `${origin}${prefix}${inheritsAlternates ? '' : `/tools/${toolId}`}`, alternateLocale)
  }

  meta('og:title', rawTitle, true)
  meta('og:description', isTool || isChangelog ? description : `${socialDescription}, multi-language support.`.replace('required.,', 'required,'), true)
  if (!isTool && !isChangelog) {
    meta('og:type', 'website', true)
    meta('og:locale', locale === 'zh' ? 'zh_CN' : 'en_US', true)
    meta('og:url', homeUrl, true)
    meta('og:site_name', 'IT Tools Collection', true)
    for (const [file, width, height, alt] of [
      ['og-image.png', '1200', '630', siteTitle],
      ['og-image-small.png', '600', '315', 'IT Tools Collection Tools Preview'],
    ]) {
      meta('og:image', `${baseUrl.replace(/\/$/, '')}/${file}`, true)
      meta('og:image:width', width, true)
      meta('og:image:height', height, true)
      meta('og:image:alt', alt, true)
    }
  } else {
    if (isChangelog || pageMetadataTools.has(toolId!) || toolId === 'docker-cheatsheet' || toolId === 'json-key-fixer') meta('og:type', 'website', true)
    if (isTool && !pageMetadataTools.has(toolId!)) meta('og:url', toolUrl, true)
  }

  meta('twitter:card', 'summary_large_image')
  const inheritsTwitter = !isTool
  meta('twitter:title', inheritsTwitter ? siteTitle : rawTitle)
  meta('twitter:description', inheritsTwitter ? socialDescription : description)
  if (inheritsTwitter) {
    meta('twitter:site', '@ToolkitPub')
    meta('twitter:creator', '@ToolkitPub')
    meta('twitter:image', `${baseUrl.replace(/\/$/, '')}/og-image.png`)
  }
  return { title, tags }
}

export function applySeoHead(head: SeoHead, locale: string) {
  document.title = head.title
  document.documentElement.lang = locale
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  document.head.querySelectorAll('[data-seo], meta[name="description"], meta[name="keywords"], meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"], link[rel="alternate"]').forEach(element => element.remove())
  for (const { tag, attrs } of head.tags) {
    const element = document.createElement(tag)
    element.dataset.seo = 'true'
    for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value)
    document.head.append(element)
  }
}
