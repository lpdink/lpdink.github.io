import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Site lives at the repo root (lpdink.github.io) → base is '/'
export default defineConfig({
  plugins: [vue()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    port: 5173
  }
})