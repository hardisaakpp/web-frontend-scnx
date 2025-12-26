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
      '/api': {
        target: 'http://192.168.2.153:5053',
        //target: 'http://172.30.159.208:5053',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  }
})
