import { defineConfig } from '@playwright/test'
import base from './playwright.config'
const port = 14190
const preview = `http://127.0.0.1:${port}`
export default defineConfig({
  ...base,
  testMatch: 'css-clamp-generator.spec.ts',
  timeout: 60_000,
  outputDir: 'test-results/css-clamp/runs',
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/css-clamp/results.json' }],
    ['html', { outputFolder: 'test-results/css-clamp/report', open: 'never' }],
  ],
  use: { ...base.use, baseURL: preview },
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: preview,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
