import { defineConfig, devices } from '@playwright/test'

// Testes ponta a ponta (doc 05, seção 4). Rodam contra o build de produção,
// num banco próprio (simi_e2e) preparado por tests/e2e/preparar.ts.
const porta = 3100
const DATABASE_URL =
  process.env.DATABASE_URL_E2E ?? 'postgresql://simi_app:simi_app_dev@localhost:5432/simi_e2e'

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  globalSetup: './tests/e2e/preparar.ts',
  use: {
    baseURL: `http://localhost:${porta}`,
    trace: 'retain-on-failure',
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  projects: [
    { name: 'celular', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: `npx next start -p ${porta}`,
    port: porta,
    reuseExistingServer: false,
    env: {
      DATABASE_URL,
      APP_URL: `http://localhost:${porta}`,
      SMTP_HOST: '',
      CRON_SECRET: 'e2e-segredo',
    },
  },
})
