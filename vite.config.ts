import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const coreProxyTarget = env.VITE_CORE_PROXY_TARGET || 'http://localhost:5053'
  const mba3ProxyTarget = env.VITE_MBA3_PROXY_TARGET || 'http://localhost:8000'
  const authMeProxyTarget = env.VITE_AUTH_ME_PROXY_TARGET || mba3ProxyTarget
  const cajaChicaProxyTarget = env.VITE_CAJA_CHICA_PROXY_TARGET || 'http://localhost:8080'
  const employeesProxyTarget = env.VITE_STORE_EMPLOYEES_PROXY_TARGET || cajaChicaProxyTarget
  /** PYG API (Docker típico: host 5171 → contenedor 8080). Solo afecta al dev server de Vite. */
  const pygProxyTarget = env.VITE_PYG_PROXY_TARGET || 'http://localhost:5171'
  /**
   * Prefijo en el backend tras quitar `/pyg-api`. Por defecto `/api` → `/pyg-api/uploads` → `/api/uploads`.
   * Si el servicio expone rutas en raíz, define `VITE_PYG_PROXY_PREFIX=` vacío en `.env.development`.
   */
  const pygProxyPrefix = 'VITE_PYG_PROXY_PREFIX' in env ? env.VITE_PYG_PROXY_PREFIX : '/api'

  return {
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
        // MBA3 Consultas (ODC SAP, plantillas, pedidos, etc.) → evita CORS en dev.
        '/mba3-api': {
          target: mba3ProxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/mba3-api/, '')
        },
        // /Auth/me → capabilities (microservicio MBA3). Debe ir antes que /api.
        '/api/Auth/me': {
          target: authMeProxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        },
        // Preferencias de usuario (persistencia UI) → mba3-consultas
        '/api/users/preferences': {
          target: mba3ProxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        },
        // Stream SSE de notificaciones → mba3-consultas
        '/notificaciones': {
          target: mba3ProxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        },
        // Login y resto de /api → Core (VITE_CORE_PROXY_TARGET en .env.development)
        '/api': {
          target: coreProxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        },
<<<<<<< HEAD
        // Caja Chica API via mismo host del frontend (evita localhost del navegador cliente remoto)
        '/caja-chica-api': {
          target: cajaChicaProxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/caja-chica-api/, '/api')
        },
        // PYG → VITE_PYG_PROXY_TARGET (evita CORS en dev). Ver `.env.development.example`.
        '/pyg-api': {
          target: pygProxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/pyg-api/, pygProxyPrefix || '')
        },
        // Integracion SAP Slayer -> http://localhost:5110/api (evita CORS en navegador)
        '/slayer-api': {
          target: 'http://localhost:5110',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/slayer-api/, '/api')
        },
        // Archivos estáticos de Caja Chica (ej: /uploads/...)
        // Archivos estáticos de Caja Chica (ej: /uploads/...)
        '/uploads': {
          target: cajaChicaProxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        },
        // Gestión usuarios (store_employees.php): mismo host que Caja Chica; reescribe a /api/... en el target
        '/employees-api': {
          target: employeesProxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/employees-api/, '/api')
        },
        // Conciliación CORS bypass Proxy
        '/conciliacion-api': {
          target: 'http://127.0.0.1:8005',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/conciliacion-api/, '')
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
  }
})
