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
      '/api': {
        target: 'https://frameitapp.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/outside/web'),
      },
    },
  },
})
