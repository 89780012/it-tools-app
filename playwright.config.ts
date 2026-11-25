import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'

const artifacts = process.env.PI_SCRATCH_DIR
  ? path.join(process.env.PI_SCRATCH_DIR, 'browser-artifacts')
  : 'test-results'
const baseURL = process.env.BROWSER_BASE_URL ?? 'http://localhost:5173'

export default defineConfig({
  testDir: './e2e',
  timeout: 600_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  outputDir: path.join(artifacts, 'runs'),
  reporter: [
    ['list'],
    ['json', { outputFile: path.join(artifacts, 'results.json') }],
    ['html', { outputFolder: path.join(artifacts, 'report'), open: 'never' }],
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    acceptDownloads: true,
    permissions: ['clipboard-read', 'clipboard-write'],
  },
  webServer: [
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'npm run dev:api',
      url: 'http://localhost:8080/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
})
