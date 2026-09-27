import { defineConfig, devices } from '@playwright/test'

// Testes ponta a ponta (doc 05, seção 4). Rodam contra o build de produção,
// num banco próprio (sicei_e2e) preparado por tests/e2e/preparar.ts.
const porta = 3100
const DATABASE_URL =
  process.env.DATABASE_URL_E2E ??
  'postgresql://sicei_dev_app:sicei_dev_app_senha@localhost:5432/sicei_e2e'

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
    {
      name: 'celular',
      testIgnore: /computador\.spec\.ts/,
      use: { ...devices['Pixel 7'], viewport: { width: 360, height: 780 } },
    },
    {
      // depende do celular: o primeiro teste de lá troca a senha provisória do Admin
      name: 'computador',
      testMatch: /computador\.spec\.ts/,
      dependencies: ['celular'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 } },
    },
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
