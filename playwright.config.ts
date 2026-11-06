import { defineConfig, devices } from '@playwright/test';
import { appPath, previewOrigin } from './tests/urls';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 2,
  reporter: 'list',
  use: { baseURL: previewOrigin, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port 4322${process.env.TEST_BASE === '/' ? ' --base /' : ''}`,
    url: `${previewOrigin}${appPath('/')}`,
    reuseExistingServer: false,
  },
});
