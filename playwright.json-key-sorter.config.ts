import { defineConfig } from '@playwright/test'
import base from './playwright.config'
const port = 14223
const preview = `http://127.0.0.1:${port}`
export default defineConfig({
  ...base,
  testMatch: 'json-key-sorter.spec.ts',
  timeout: 60_000,
  outputDir: 'test-results/json-key-sorter/runs',
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/json-key-sorter/results.json' }],
    [
      'html',
      { outputFolder: 'test-results/json-key-sorter/report', open: 'never' },
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
