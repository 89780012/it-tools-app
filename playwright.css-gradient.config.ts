import { defineConfig } from '@playwright/test'
import base from './playwright.config'
const port = 14224
const preview = `http://127.0.0.1:${port}`
export default defineConfig({
  ...base,
  testMatch: 'css-gradient-generator.spec.ts',
  timeout: 60_000,
  outputDir: 'test-results/css-gradient-generator/runs',
  reporter: [
    ['list'],
    [
      'json',
      { outputFile: 'test-results/css-gradient-generator/results.json' },
    ],
    [
      'html',
      {
        outputFolder: 'test-results/css-gradient-generator/report',
        open: 'never',
      },
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
