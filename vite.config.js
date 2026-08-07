import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// The app source lives under src/ (with src/index.html as the dev entry).
// The built site is emitted to ../dist at the repo root, and CI publishes it
// to the repo root so GitHub Pages works whether the source is "branch root"
// or "GitHub Actions". Site is served at lpdink.github.io → base '/'.
export default defineConfig({
  root: 'src',
  plugins: [vue()],
  base: '/',
  publicDir: 'public', // src/public
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    assetsDir: 'assets'
  },
  server: {
    port: 5173
  }
})