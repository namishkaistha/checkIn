import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Mirror vite.config.ts so components that read this constant don't
    // explode under jsdom.
    __APP_VERSION__: JSON.stringify('test'),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/atoms/**/*.{ts,tsx}', 'src/hooks/**/*.{ts,tsx}'],
      exclude: ['**/*.stories.tsx', '**/*.test.{ts,tsx}'],
    },
  },
});
