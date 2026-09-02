import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// The `@/` alias is declared here and in tsconfig.json, and the two must agree.
// Vite does not read tsconfig `paths`, and `__dirname` is undefined because this
// package is `type: module`, so the config itself loads as ESM.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
