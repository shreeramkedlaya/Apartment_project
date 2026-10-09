import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'jsdom',
    include: ['perf_tests/**/*.test.tsx'],
    pool: 'forks',
    execArgv: ['--expose-gc'],
    testTimeout: 120000,
    css: false,
  },
});
