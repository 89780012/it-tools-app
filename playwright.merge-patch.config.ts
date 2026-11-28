import { defineConfig } from '@playwright/test'
import base from './playwright.config'

const previewPort = 14184
const preview = `http://127.0.0.1:${previewPort}`

export default defineConfig({
  ...base,
  testMatch: 'json-merge-patch.spec.ts',
  timeout: 60_000,
  outputDir: 'test-results/merge-patch/runs',
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/merge-patch/results.json' }],
    [
      'html',
      { outputFolder: 'test-results/merge-patch/report', open: 'never' },
    ],
  ],
  use: { ...base.use, baseURL: preview },
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${previewPort} --strictPort`,
    url: preview,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
