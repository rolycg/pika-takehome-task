import { defineConfig, devices } from '@playwright/test'
import { API_PORT, API_URL, FRONTEND_DIR, MOCK_ENV, WEB_PORT, WEB_URL } from './support/env.ts'

/**
 * Runs the real stack: FastAPI backend (fresh DATA_DIR) + Vite dev server proxying /api to it.
 * Serial on purpose: the product allows only one active generation at a time.
 * Browser: bundled Chromium (`npm --prefix e2e run install-browser`), or set
 * E2E_BROWSER_CHANNEL=chrome to use an installed Google Chrome instead.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  outputDir: 'test-results',
  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        channel: process.env.E2E_BROWSER_CHANNEL || undefined,
      },
    },
  ],
  webServer: [
    {
      command: 'node scripts/serve-api.mjs',
      url: `${API_URL}/api/health`,
      env: { ...MOCK_ENV, API_PORT: String(API_PORT) },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npm --prefix "${FRONTEND_DIR}" run dev -- --port ${WEB_PORT} --host 127.0.0.1`,
      url: WEB_URL,
      env: { API_URL },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
