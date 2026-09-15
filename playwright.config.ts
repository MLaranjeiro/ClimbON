import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

config({ path: '.env.test.local', quiet: true });

export default defineConfig({
  testDir: './src/testing/playwright',
  fullyParallel: true,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5175',
    trace: 'on',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --port 5175 --strictPort',
    url: 'http://localhost:5175',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
