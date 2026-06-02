import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  plugins: [react()],

  server: {
    host: 'localhost',
    port: 5173,

    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
  },
});