import { defineConfig } from '@playwright/test'
import base from './playwright.config'

const previewPort = 14180
const preview = `http://127.0.0.1:${previewPort}`

export default defineConfig({
  ...base,
  metadata: { checkPrerender: true },
  testMatch: 'aspect-ratio.spec.ts',
  timeout: 60_000,
  outputDir: 'test-results/aspect-ratio/runs',
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/aspect-ratio/results.json' }],
    ['html', { outputFolder: 'test-results/aspect-ratio/report', open: 'never' }],
  ],
  use: { ...base.use, baseURL: preview },
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${previewPort} --strictPort`,
    url: preview,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
