import { defineConfig } from '@playwright/test'
import base from './playwright.config'

const previewPort = 14188
const preview = `http://127.0.0.1:${previewPort}`
export default defineConfig({
  ...base,
  testMatch: 'ipv4-cidr-aggregator.spec.ts',
  timeout: 60_000,
  outputDir: 'test-results/cidr-aggregator/runs',
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/cidr-aggregator/results.json' }],
    [
      'html',
      { outputFolder: 'test-results/cidr-aggregator/report', open: 'never' },
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
