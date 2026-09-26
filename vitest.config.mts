import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unidade',
          include: ['src/**/*.test.{ts,tsx}'],
          environment: 'node',
          setupFiles: ['./vitest.setup.ts'],
        },
      },
      {
        extends: true,
        resolve: {
          alias: { 'server-only': path.resolve(import.meta.dirname, 'tests/vazio.ts') },
        },
        test: {
          name: 'integracao',
          include: ['tests/integracao/**/*.test.ts'],
          environment: 'node',
          globalSetup: ['./tests/integracao/preparar.ts'],
          fileParallelism: false,
          testTimeout: 60_000,
          hookTimeout: 120_000,
          env: {
            DATABASE_URL:
              process.env.DATABASE_URL_TESTE ??
              'postgresql://simi_app:simi_app_dev@localhost:5432/simi_teste',
            SMTP_HOST: '',
          },
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**/*.ts', 'src/lab/**/*.ts', 'src/lib/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.casos.ts'],
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      thresholds: { lines: 90, functions: 90, statements: 90, branches: 85 },
    },
  },
})
