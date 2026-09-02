import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// The `@/` alias is declared here and in tsconfig.json, and the two must agree.
// Vite does not read tsconfig `paths`, and `__dirname` is undefined because this
// package is `type: module`, so the config itself loads as ESM.
//
// `/api` is proxied so development uses the same relative URLs as production,
// where nginx reverse-proxies it. The timeouts are raised well past the API's
// own generation timeout: http-proxy's defaults would cut a 60s generation off
// at the moment it succeeds.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        changeOrigin: false,
        proxyTimeout: 180_000,
        target: process.env.API_DEV_ORIGIN ?? 'http://127.0.0.1:8080',
        timeout: 180_000,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
