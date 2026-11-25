// Usage: node script/check-seo-parity.mjs <upstream checkout> <directory containing Next.js 15.5.2 node_modules>
// Run npm run build first. Reference dependencies are isolated from the application.
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import Module, { createRequire } from 'node:module'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { JSDOM } from 'jsdom'

const [upstream, runtime] = process.argv.slice(2).map(value => path.resolve(value))
if (!upstream || !runtime) throw new Error('Provide upstream checkout and Next.js reference runtime directories')
const referenceRequire = createRequire(path.join(runtime, 'package.json'))
const originalLoad = Module._load
Module._load = function (id, ...args) { return id === 'server-only' ? {} : originalLoad.call(this, id, ...args) }
const { accumulateMetadata } = referenceRequire('next/dist/lib/metadata/resolve-metadata.js')
Module._load = originalLoad
const React = referenceRequire('react')
const { renderToStaticMarkup } = referenceRequire('react-dom/server')
const { BasicMeta, VerificationMeta } = referenceRequire('next/dist/lib/metadata/generate/basic.js')
const { AlternatesMetadata } = referenceRequire('next/dist/lib/metadata/generate/alternate.js')
const { OpenGraphMetadata, TwitterMetadata } = referenceRequire('next/dist/lib/metadata/generate/opengraph.js')
const compiled = new Map()

async function extract(relative, locale, messages) {
  const file = path.join(upstream, relative)
  if (!fs.existsSync(file)) return null
  if (!compiled.has(file)) {
    const source = fs.readFileSync(file, 'utf8')
    const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const declaration = tree.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'generateMetadata')
    compiled.set(file, declaration ? ts.transpileModule(declaration.getText(tree), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText : null)
  }
  const code = compiled.get(file)
  if (!code) return null
  const exports = {}
  vm.runInNewContext(code, {
    exports, URL, process: { env: {} }, getLocale: async () => locale,
    getTranslations: async (options = {}) => {
      const namespace = typeof options === 'string' ? options : options.namespace || ''
      return key => {
        const fullKey = [namespace, key].filter(Boolean).join('.')
        const value = fullKey.split('.').reduce((current, name) => current?.[name], messages)
        if (typeof value !== 'string') throw new Error(`Missing reference translation: ${locale}:${fullKey}`)
        return value
      }
    },
  }, { filename: file })
  return exports.generateMetadata({ params: Promise.resolve({ locale }) })
}
function normalizedTags(document, selector) {
  return [...document.querySelectorAll(selector)].map(element => {
    const attrs = [...element.attributes].filter(attr => attr.name !== 'data-seo').map(attr => [attr.name.toLowerCase(), attr.value]).sort(([a], [b]) => a.localeCompare(b))
    return JSON.stringify([element.tagName.toLowerCase(), attrs])
  }).sort()
}

const locales = fs.readdirSync('src/i18n/messages').filter(file => file.endsWith('.json')).map(file => file.slice(0, -5))
const toolIds = fs.readdirSync('src/app/[locale]/tools', { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name)
let checked = 0
const failures = []
for (const locale of locales) {
  const messages = JSON.parse(fs.readFileSync(path.join(upstream, 'src/i18n/messages', `${locale}.json`), 'utf8'))
  assert.deepEqual(JSON.parse(fs.readFileSync(`src/i18n/messages/${locale}.json`, 'utf8')), messages, `${locale} messages differ`)
  const root = await extract('src/app/[locale]/layout.tsx', locale, messages)
  for (const route of ['/', '/changelog', ...toolIds.map(id => `/tools/${id}`)]) {
    const pathname = `${locale === 'en' ? '' : `/${locale}`}${route === '/' ? '' : route}` || '/'
    const routeDirectory = `src/app/[locale]${route === '/' ? '' : route}`
    const layout = route === '/' ? null : await extract(`${routeDirectory}/layout.tsx`, locale, messages)
    const page = await extract(`${routeDirectory}/page.tsx`, locale, messages)
    const items = [[null, null], [root, null]]
    if (route.startsWith('/tools/')) items.push([null, null])
    if (route !== '/') items.push([layout, null])
    items.push([page, null])
    const resolved = await accumulateMetadata(pathname, items, pathname, { pathname, trailingSlash: false, isStaticMetadataRouteFile: false })
    const expectedHtml = renderToStaticMarkup(React.createElement(React.Fragment, null,
      ...[BasicMeta({ metadata: resolved }), VerificationMeta({ verification: resolved.verification }),
      AlternatesMetadata({ alternates: resolved.alternates }), OpenGraphMetadata({ openGraph: resolved.openGraph }), TwitterMetadata({ twitter: resolved.twitter })]
        .flat().filter(Boolean).map((element, index) => React.cloneElement(element, { key: index })),
    ))
    const expected = new JSDOM(`<html><head>${expectedHtml}</head></html>`)
    const file = pathname === '/' ? 'dist/index.html' : path.join('dist', pathname, 'index.html')
    const actual = new JSDOM(fs.readFileSync(file, 'utf8'))
    try {
      assert.equal(actual.window.document.title, expected.window.document.title, 'title')
      assert.deepEqual(normalizedTags(actual.window.document, '[data-seo]'), normalizedTags(expected.window.document, 'head meta, head link'), 'metadata tags')
      assert.equal(actual.window.document.documentElement.lang, locale, 'html lang')
      assert.ok((actual.window.document.querySelector('main main')?.textContent?.trim().length || 0) > 100, 'prerendered page content')
      assert.equal(actual.window.document.querySelectorAll('link[rel="canonical"]').length, 1, 'one canonical')
      assert.ok(actual.window.document.querySelectorAll('#root a[href]').length > 10, 'crawlable links')
    } catch (error) { failures.push({ pathname, error: error.message }) }
    actual.window.close()
    expected.window.close()
    checked++
  }
  console.log(`Checked ${locale}`)
}
for (const file of fs.readdirSync(path.join(upstream, 'public')).filter(name => /^sitemap.*\.xml$/.test(name) || name === 'robots.txt')) {
  const normalize = file => fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n')
  assert.equal(normalize(path.join('dist', file)), normalize(path.join(upstream, 'public', file)), file)
}
if (failures.length) {
  fs.writeFileSync(path.join(runtime, 'seo-parity-failures.json'), JSON.stringify(failures, null, 2))
  console.error(`${failures.length}/${checked} routes differ. First failure:\n${failures[0].pathname}\n${failures[0].error}`)
  process.exitCode = 1
} else console.log(`SEO parity passed: ${checked} routes, all localized dictionaries, robots and 13 sitemap files.`)
