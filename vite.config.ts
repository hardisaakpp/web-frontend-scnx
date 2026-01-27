import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'axios', 'jwt-decode']
  },
  server: {
    port: 3000,
    proxy: {
      // /Auth/me → mba3-consultas (capabilities). Debe ir antes que /api.
      '/api/Auth/me': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
      // Login y resto de /api → Core (Apps pruebas).
      '/api': {
        target: 'http://210.17.1.53:5053', // Apps pruebas / Core
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  }
})
