import { defineConfig } from '@playwright/test'
import base from './playwright.config'

const previewPort = 14182
const preview = `http://127.0.0.1:${previewPort}`

export default defineConfig({
  ...base,
  testMatch: 'semver-sorter.spec.ts',
  timeout: 60_000,
  outputDir: 'test-results/semver/runs',
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/semver/results.json' }],
    ['html', { outputFolder: 'test-results/semver/report', open: 'never' }],
  ],
  use: { ...base.use, baseURL: preview },
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${previewPort} --strictPort`,
    url: preview,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
