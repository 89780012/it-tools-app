import { defineConfig } from '@playwright/test'
import base from './playwright.config'
const port = 14191
const preview = `http://127.0.0.1:${port}`
export default defineConfig({
  ...base,
  testMatch: 'iso-week-calculator.spec.ts',
  timeout: 60_000,
  outputDir: 'test-results/iso-week/runs',
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/iso-week/results.json' }],
    ['html', { outputFolder: 'test-results/iso-week/report', open: 'never' }],
  ],
  use: { ...base.use, baseURL: preview },
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: preview,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
