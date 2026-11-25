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
