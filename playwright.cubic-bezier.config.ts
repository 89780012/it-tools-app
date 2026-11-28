import { defineConfig } from '@playwright/test'
import base from './playwright.config'
const port = 14220
const preview = `http://127.0.0.1:${port}`
export default defineConfig({
  ...base,
  testMatch: 'css-cubic-bezier.spec.ts',
  timeout: 60_000,
  outputDir: 'test-results/cubic-bezier/runs',
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/cubic-bezier/results.json' }],
    [
      'html',
      { outputFolder: 'test-results/cubic-bezier/report', open: 'never' },
    ],
  ],
  use: { ...base.use, baseURL: preview },
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: preview,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
