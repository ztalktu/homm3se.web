import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte()],
  // Relative base so the built site works from any folder, including GitHub Pages.
  base: './',
  server: {
    port: 5173,
    strictPort: true,
    // File events from a host folder mounted into Docker can be lost; poll there instead.
    watch: process.env['VITE_WATCH_POLLING'] ? { usePolling: true, interval: 300 } : null,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  build: {
    target: 'es2022',
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
  },
});
