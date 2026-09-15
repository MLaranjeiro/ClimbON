import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/testing/vitest/**/*.test.ts'],
  },
});
