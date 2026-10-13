import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-expect-error shared Vite middleware without type declarations
import { cuisineApiPlugin } from '../../scripts/vite-cuisine-api.mjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cuisineApiPlugin()],
  server: {
    host: true,
    port: 5174,
    strictPort: false,
  },
})
