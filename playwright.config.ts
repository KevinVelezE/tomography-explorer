import { defineConfig } from '@playwright/test';
const base = process.env.BASE_PATH || '/';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1,
  timeout: 30000,
  use: { baseURL: `http://127.0.0.1:4324${base.endsWith('/') ? base : base + '/'}`, headless: true, viewport: { width: 1440, height: 1000 }, trace: 'retain-on-failure' },
  webServer: { command: 'npm run build && npm run preview -- --port 4324', url: `http://127.0.0.1:4324${base}`, reuseExistingServer: false, timeout: 120000 },
});
