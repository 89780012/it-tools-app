import { defineConfig } from '@playwright/test'
import base from './playwright.config'

const previewPort = 14186
const preview = `http://127.0.0.1:${previewPort}`

export default defineConfig({
  ...base,
  testMatch: 'totp-generator.spec.ts',
  timeout: 60_000,
  outputDir: 'test-results/totp/runs',
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/totp/results.json' }],
    ['html', { outputFolder: 'test-results/totp/report', open: 'never' }],
  ],
  use: { ...base.use, baseURL: preview },
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${previewPort} --strictPort`,
    url: preview,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
