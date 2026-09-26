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
    outputFile: { html: './public/relatorio-testes/index.html' },
    coverage: {
      provider: 'v8',
      include: ['src/domain/**/*.ts'],
      exclude: ['src/domain/**/*.test.ts', 'src/domain/**/*.casos.ts', 'src/domain/index.ts'],
      reporter: ['text', 'html'],
      reportsDirectory: './public/relatorio-testes/cobertura',
      thresholds: { lines: 90, functions: 90, statements: 90, branches: 85 },
    },
  },
})
