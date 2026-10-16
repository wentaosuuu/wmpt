import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-expect-error shared Vite middleware without type declarations
import { cuisineApiPlugin } from '../../scripts/vite-cuisine-api.mjs'

const rootDir = dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cuisineApiPlugin()],
  resolve: {
    alias: {
      '@wmpt/shared': resolve(rootDir, '../shared/src/index.ts'),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: false,
  },
})