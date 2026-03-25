import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Test Configuration
 *
 * Configures headless Chromium for automated screenshot capture and visual
 * verification of all implemented Slack Clone screens.
 *
 * Key settings:
 * - Viewport: 1440×900 (standard Slack desktop web dimensions)
 * - Browser: Chromium (headless)
 * - Screenshot output: screenshots/output/
 * - Web server: Auto-starts Next.js dev server on port 3000
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  /* Directory containing test specification files */
  testDir: './tests',

  /* Run tests sequentially — screenshots must be captured one at a time
     to avoid port conflicts and ensure deterministic output */
  fullyParallel: false,

  /* Fail CI builds if test.only is accidentally left in source code */
  forbidOnly: !!process.env.CI,

  /* No retries — screenshot capture should be deterministic */
  retries: 0,

  /* Single worker for sequential, deterministic screenshot capture */
  workers: 1,

  /* Generate an HTML report for visual review of test results */
  reporter: 'html',

  /* Shared settings applied to all test projects */
  use: {
    /* Base URL for all navigation calls — Next.js dev server */
    baseURL: 'http://localhost:3000',

    /* Viewport matching Slack desktop web dimensions (1440×900) per AAP */
    viewport: { width: 1440, height: 900 },

    /* Capture a screenshot after each test for visual verification */
    screenshot: 'on',

    /* Record trace on first retry to aid debugging */
    trace: 'on-first-retry',

    /* Run in headless mode — no visible browser window */
    headless: true,
  },

  /* Output directory for test artifacts (screenshots, traces, etc.) */
  outputDir: 'screenshots/output/',

  /* Browser projects — Chromium only, matching Slack's desktop Chrome target.
     The viewport is explicitly set after the device spread to ensure the AAP-required
     1440×900 dimensions take precedence over Desktop Chrome's default 1280×720. */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],

  /* Automatically start the Next.js dev server before running tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
