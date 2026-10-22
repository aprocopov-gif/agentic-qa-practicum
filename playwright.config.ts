import dotenv from 'dotenv';
import { defineConfig } from '@playwright/test';
import { AUTH_FILE } from './support/auth.constants';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  globalSetup: './support/global-setup.ts',
  globalTeardown: './support/global-teardown.ts',
  reporter: [['./support/cleanup-reporter.ts'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.APP_URL,
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    locale: 'en-CA',
    timezoneId: 'America/Toronto',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'app',
      testMatch: '**/*.spec.ts',
      testIgnore: '**/*.api.spec.ts',
      use: {
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
    },
    {
      name: 'api',
      testDir: './api',
      testMatch: '**/*.api.spec.ts',
      dependencies: ['setup'],
    },
  ],
});
