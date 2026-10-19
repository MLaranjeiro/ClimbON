import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

config({ path: '.env.test.local', quiet: true });

// Set BASE_URL (e.g. the Vercel deployment) to run the suite against a deployed build
// instead of the local dev server.
const baseURL = process.env.BASE_URL ?? 'http://localhost:5175';

export default defineConfig({
  testDir: './src/testing/playwright',
  fullyParallel: true,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'npm run dev -- --port 5175 --strictPort',
        url: 'http://localhost:5175',
        reuseExistingServer: !process.env.CI,
        timeout: 30000,
      },
});
