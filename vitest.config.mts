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
    ],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**/*.ts', 'src/lab/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.casos.ts'],
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      thresholds: { lines: 90, functions: 90, statements: 90, branches: 85 },
    },
  },
})
