import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ThemeProvider } from '@/components/theme-provider'
import { isLocale, loadLocaleMessages } from '@/i18n/compat'
import { defaultLocale } from '@/i18n/config'
import './app/globals.css'

async function bootstrap() {
  const prefix = window.location.pathname.split('/').filter(Boolean)[0]
  await loadLocaleMessages(isLocale(prefix) ? prefix : defaultLocale)
  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <App />
      </ThemeProvider>
    </React.StrictMode>,
  )
}
void bootstrap()
