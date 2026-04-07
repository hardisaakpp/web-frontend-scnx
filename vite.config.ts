import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return ({
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    optimizeDeps: {
      include: ['vue', 'vue-router', 'pinia', 'axios', 'jwt-decode']
    },
    // Configuración del servidor de desarrollo (solo se usa en desarrollo)
    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: {
        // MBA3 Consultas (ODC SAP, plantillas, pedidos, etc.) → backend local :8000 (evita CORS en dev).
        '/mba3-api': {
          target: env.VITE_MBA3_PROXY_TARGET || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/mba3-api/, '')
        },
        // /Auth/me → mba3-consultas (capabilities). Debe ir antes que /api.
        '/api/Auth/me': {
          target: env.VITE_AUTH_ME_PROXY_TARGET || env.VITE_CORE_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '')
        },
        // Preferencias de usuario (persistencia UI) → mba3-consultas
        '/api/users/preferences': {
          target: env.VITE_MBA3_PROXY_TARGET || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        },
        // Gestión de usuarios (store_employees.php) por proxy local.
        '/employees-api': {
          target: env.VITE_STORE_EMPLOYEES_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/employees-api/, '/api')
        },
        // Stream SSE de notificaciones → mba3-consultas
        '/notificaciones': {
          target: env.VITE_MBA3_PROXY_TARGET || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        },
        // Caja Chica API via mismo host del frontend (evita localhost del navegador cliente remoto)
        '/caja-chica-api': {
          target: env.VITE_CAJA_CHICA_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/caja-chica-api/, '/api')
        },
        // Integracion SAP Slayer -> http://localhost:5110/api (evita CORS en navegador)
        '/slayer-api': {
          target: env.VITE_SLAYER_PROXY_TARGET || 'http://localhost:5110',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/slayer-api/, '/api')
        },
        // Archivos estáticos de Caja Chica (ej: /uploads/...) → backend http://localhost:8080
        '/uploads': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        },
        // API del Maestro de Artículos
        '/maestro-api': {
          target: env.VITE_MAESTRO_API_TARGET || 'http://localhost:3100',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/maestro-api/, '')
        },
        // Login y resto de /api → Core local en desarrollo
        '/api': {
          target: env.VITE_CORE_PROXY_TARGET || 'http://localhost:5053',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        }
      }
    },
    // ⚠️ SECURITY: Removed esbuild.drop: ['console'] to preserve console.error() and error logging
    // Development console.logs are now protected by import.meta.env.DEV checks
    // Production build will be smaller because DEV-conditional logs are never reached

    // Configuración de build para producción
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false, // Deshabilitar sourcemaps en producción para seguridad
      minify: 'esbuild', // Usar esbuild (más rápido, viene incluido con Vite)
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
            'ui-vendor': ['@headlessui/vue', '@heroicons/vue'],
            'utils-vendor': ['axios', 'jwt-decode']
          }
        }
      },
      chunkSizeWarningLimit: 500 // Reducido de 1000 para detectar problemas de bundle size más temprano
    }
  })
})
