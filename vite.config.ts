import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
   server: {
    allowedHosts: ['clever-bees-exist.loca.lt'],
    proxy: {
      // Our own backend (frames CRUD + asset serving). Configured before
      // the frameit proxy so the more-specific path wins.
      '/cretix-api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cretix-api/, '/api/v1'),
      },
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Legacy frameit proxy — still used for Interiors / Scenery / Mat /
      // Effects. The frames section now reads from our own backend.
      '/api': {
        target: 'https://frameitapp.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/outside/web'),
      },
    },
  },
})
