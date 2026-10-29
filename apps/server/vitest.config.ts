import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      '@ksero-se/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
    },
  },
});
