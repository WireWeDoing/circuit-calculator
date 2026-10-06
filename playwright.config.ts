import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests run against the PRODUCTION build served by `vite preview`
 * (that is what ships: service worker, manifest, hashed assets).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://localhost:4173', trace: 'on-first-retry' },
  webServer: { command: 'pnpm build && pnpm preview --port 4173 --strictPort', url: 'http://localhost:4173', reuseExistingServer: !process.env.CI, timeout: 180_000 },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'android-chrome', use: { ...devices['Pixel 7'] } },
    // iOS Safari engine. Opt in with E2E_WEBKIT=1 (needs `pnpm exec playwright install --with-deps webkit`, which requires root on Linux)
    ...(process.env.E2E_WEBKIT === '1' ? [{ name: 'ios-safari', use: { ...devices['iPhone 14'] } }] : []),
  ],
})
