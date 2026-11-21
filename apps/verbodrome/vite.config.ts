import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Relative base: the same build works at a domain root and under a GitHub Pages sub-path.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: { include: ['tests/**/*.test.ts'], testTimeout: 30_000 },
});
