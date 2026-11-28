import { defineConfig } from '@playwright/test'
import base from './playwright.config'
const port = 14222
const preview = `http://127.0.0.1:${port}`
export default defineConfig({
  ...base,
  testMatch: 'css-box-shadow-generator.spec.ts',
  timeout: 60_000,
  outputDir: 'test-results/box-shadow/runs',
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/box-shadow/results.json' }],
    ['html', { outputFolder: 'test-results/box-shadow/report', open: 'never' }],
  ],
  use: { ...base.use, baseURL: preview },
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: preview,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
