import { defineConfig } from '@playwright/test'
import base from './playwright.config'

// This local-only tool can be checked against the production build without Go.
export default defineConfig({
  ...base,
  testMatch: 'json-lines.spec.ts',
  timeout: 60_000,
  outputDir: 'test-results/json-lines/runs',
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/json-lines/results.json' }],
    ['html', { outputFolder: 'test-results/json-lines/report', open: 'never' }],
  ],
  use: { ...base.use, baseURL: 'http://127.0.0.1:4179' },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4179 --strictPort',
    url: 'http://127.0.0.1:4179',
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
