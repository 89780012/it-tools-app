import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  // @iarna/toml uses global.Date; browsers expose it through globalThis.
  define: { global: 'globalThis' },
  resolve: {
    alias: [
      { find: /^next-intl\/server$/, replacement: path.resolve(__dirname, './src/compat/next-intl-server.ts') },
      { find: /^next-intl$/, replacement: path.resolve(__dirname, './src/compat/next-intl.ts') },
      { find: /^next\/image$/, replacement: path.resolve(__dirname, './src/compat/next-image.tsx') },
      { find: /^next\/link$/, replacement: path.resolve(__dirname, './src/compat/next-link.tsx') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
  preview: {
    port: 4173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
