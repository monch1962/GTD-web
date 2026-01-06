import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for GTD-web
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/journeys',

  // Fully parallel with individual workers
  fullyParallel: true,
  // Fail on first error by default
  failFast: false,
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  // Limit parallel workers to avoid overwhelming localStorage
  workers: process.env.CI ? 2 : 3,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],

  // Shared settings for all tests
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:8080',

    // Collect trace when retrying the test
    trace: 'retain-on-failure',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Action timeout
    actionTimeout: 10 * 1000,

    // Navigation timeout
    navigationTimeout: 30 * 1000,

    // Locale
    locale: 'en-US',

    // Viewport size
    viewport: { width: 1280, height: 720 },

    // Ignore HTTPS errors (for local testing)
    ignoreHTTPSErrors: true,
  },

  // Projects define different test configurations
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npx http-server . -p 8080 --cors -c-1 --silent',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
