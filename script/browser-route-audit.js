// Run in a browser on the Vite development server:
// await (await import('/script/browser-route-audit.js')).auditRoutes(['zh'])
// This checks the real application shell, lazy modules and browser runtime.
const pageModules = import.meta.glob('/src/app/[locale]/tools/*/page.tsx')
const toolIds = Object.keys(pageModules).map(path => path.split('/').at(-2)).sort()
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))

export async function auditRoutes(locales = ['zh']) {
  if (!toolIds.length) throw new Error('No tool routes discovered')
  const results = []
  let errors = []
  const onError = event => errors.push(event.message || String(event.reason))
  window.addEventListener('error', onError)
  window.addEventListener('unhandledrejection', onError)
  try {
    for (const locale of locales) {
      for (const suffix of ['', '/changelog', ...toolIds.map(id => `/tools/${id}`)]) {
        const path = `${locale === 'en' ? '' : `/${locale}`}${suffix}` || '/'
        errors = []
        history.pushState(null, '', path)
        window.dispatchEvent(new PopStateEvent('popstate'))
        await pause(300)
        let main
        for (let attempt = 0; attempt < 80; attempt++) {
          main = document.querySelector('main main')
          if (!document.getElementById('root')?.childElementCount) break
          if (main?.innerText.trim().length > 30 && !main.innerText.includes('Loading tool…') && document.documentElement.lang === locale) break
          await pause(100)
        }
        const heading = main?.querySelector('h1')?.textContent?.trim() || main?.innerText.trim().split('\n')[0] || ''
        const textLength = main?.innerText.trim().length || 0
        const result = {
          path, title: document.title, heading, textLength,
          controls: main?.querySelectorAll('input, textarea, button, select').length || 0,
          errors: [...errors],
          passed: textLength > 30 && !main?.innerText.includes('Loading tool…') && errors.length === 0 && document.documentElement.lang === locale,
        }
        results.push(result)
        if (!document.getElementById('root')?.childElementCount) return results
      }
    }
    return results
  } finally {
    window.removeEventListener('error', onError)
    window.removeEventListener('unhandledrejection', onError)
  }
}

// Start on JSON-to-TOML. Results survive the language menu's full reload.
export async function auditLocaleInteraction(nextLocale) {
  const locales = ['zh', 'en', 'es', 'de', 'fr', 'it', 'pt', 'ru', 'ja', 'ko', 'ar', 'hi']
  const locale = document.documentElement.lang
  const prefix = locale === 'en' ? '' : `/${locale}`
  if (location.pathname !== `${prefix}/tools/json-to-toml`) throw new Error('Open JSON-to-TOML first')
  const sample = { title: '多语言测试 café', port: 8080, enabled: false, database: { host: 'localhost', max_connections: 100 } }
  const errors = []
  const onError = event => errors.push(event.message || String(event.reason))
  window.addEventListener('error', onError)
  window.addEventListener('unhandledrejection', onError)
  const input = value => {
    const textarea = document.querySelector('main main textarea')
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(textarea, value)
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  }
  const convert = async () => {
    await pause(50)
    document.querySelector('main main button').click()
    await pause(100)
    return document.querySelectorAll('main main textarea')[1]?.value
  }
  const go = async tool => {
    const link = [...document.querySelectorAll('a')].find(element => element.getAttribute('href') === `${prefix}/tools/${tool}`)
    if (!link) throw new Error(`Missing tool link: ${tool}`)
    link.click()
    await pause(400)
  }
  try {
    const messages = (await import(`/src/i18n/messages/${locale}.json`)).default
    const title = document.title
    const heading = document.querySelector('main main h1')?.textContent
    const localizedTitle = title === `${messages.tools['json-to-toml'].meta.title} - IT Tools Collection`
    input(JSON.stringify(sample))
    const toml = await convert()
    await go('toml-to-json')
    input(toml)
    const json = await convert()
    const roundTrip = JSON.stringify(JSON.parse(json)) === JSON.stringify(sample)
    await go('json-to-toml')
    const pending = JSON.parse(sessionStorage.getItem('locale-switch-pending') || 'null')
    const menuSwitch = pending?.locale === locale && location.pathname === pending.path
    const sidebar = document.querySelector('[data-slot="sidebar-container"]')?.getBoundingClientRect()
    const main = document.querySelector('main main').getBoundingClientRect()
    const overlap = sidebar ? Math.max(0, Math.min(sidebar.right, main.right) - Math.max(sidebar.left, main.left)) : 0
    const result = { locale, title, heading, localizedTitle, roundTrip, menuSwitch, direction: document.documentElement.dir, sidebarOverlap: overlap, errors }
    result.passed = localizedTitle && roundTrip && overlap <= 1 && errors.length === 0 && (!pending || menuSwitch)
    const results = JSON.parse(sessionStorage.getItem('locale-interaction-results') || '[]')
    results.push(result)
    sessionStorage.setItem('locale-interaction-results', JSON.stringify(results))
    if (nextLocale) {
      const button = [...document.querySelectorAll('button')].find(element => element.textContent.includes('Toggle language'))
      button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse', ctrlKey: false }))
      await pause(100)
      const item = document.querySelectorAll('[role=menuitem]')[locales.indexOf(nextLocale)]
      if (!item) throw new Error(`Missing language option: ${nextLocale}`)
      sessionStorage.setItem('locale-switch-pending', JSON.stringify({ locale: nextLocale, path: `${nextLocale === 'en' ? '' : `/${nextLocale}`}/tools/json-to-toml` }))
      setTimeout(() => item.click(), 100)
    }
    return result
  } finally {
    window.removeEventListener('error', onError)
    window.removeEventListener('unhandledrejection', onError)
  }
}
