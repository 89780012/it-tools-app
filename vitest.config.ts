import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^next-intl\/server$/, replacement: path.resolve(__dirname, './src/compat/next-intl-server.ts') },
      { find: /^next-intl$/, replacement: path.resolve(__dirname, './src/compat/next-intl.ts') },
      { find: /^next\/image$/, replacement: path.resolve(__dirname, './src/compat/next-image.tsx') },
      { find: /^next\/link$/, replacement: path.resolve(__dirname, './src/compat/next-link.tsx') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
})
