import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { starsApiPlugin } from './vite-plugin-stars-api.js'

export default defineConfig({
  plugins: [react(), tailwindcss(), starsApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1600,
  },
})
