import { defineConfig } from '@playwright/test'
import base from './playwright.config'

const port = 14280
const preview = `http://127.0.0.1:${port}`
export default defineConfig({
  ...base,
  testMatch: 'json-patch.spec.ts',
  timeout: 60_000,
  outputDir: 'test-results/json-patch/runs',
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/json-patch/results.json' }],
    ['html', { outputFolder: 'test-results/json-patch/report', open: 'never' }],
  ],
  use: { ...base.use, baseURL: preview },
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: preview,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
