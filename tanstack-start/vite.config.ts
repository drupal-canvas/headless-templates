import { fileURLToPath } from 'node:url'
import { canvas } from '@drupal-canvas/headless-tanstack-start/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [canvas(), tailwindcss(), tanstackStart(), viteReact()],
})
