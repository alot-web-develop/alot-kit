import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts', 'src/**/*.test.ts', 'checks/**/*.check.ts'],
    hookTimeout: 120_000,
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/test',
      BETTER_AUTH_SECRET: 'test-only-secret-never-used-outside-vitest',
      BETTER_AUTH_URL: 'http://localhost:4000',
    },
  },
});
