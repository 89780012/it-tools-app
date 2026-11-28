import { defineConfig } from '@playwright/test'
import base from './playwright.config'
const port = 14221
const preview = `http://127.0.0.1:${port}`
export default defineConfig({
  ...base,
  testMatch: 'base32-encoder-decoder.spec.ts',
  timeout: 60_000,
  outputDir: 'test-results/base32/runs',
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/base32/results.json' }],
    ['html', { outputFolder: 'test-results/base32/report', open: 'never' }],
  ],
  use: { ...base.use, baseURL: preview },
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: preview,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
