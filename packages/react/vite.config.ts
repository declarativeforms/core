import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
      cssFileName: 'styles',
    },
    rollupOptions: {
      external: [
        '@declarativeforms/core',
        'class-variance-authority',
        'clsx',
        'cmdk',
        'leaflet',
        'lucide-react',
        'radix-ui',
        'react',
        'react-dom',
        'react-hook-form',
        'react-leaflet',
        'react/jsx-runtime',
        'tailwind-merge',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
