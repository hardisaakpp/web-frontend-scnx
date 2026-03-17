import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // En servidor de pruebas: VITE_MBA3_PROXY_TARGET=http://210.17.1.55:8000 (MBA3 en otro host).
  // En local: no definir o localhost:8000.
  const mba3Target = env.VITE_MBA3_PROXY_TARGET || 'http://localhost:8000'
  const maestroTarget = env.VITE_MAESTRO_API_TARGET || 'http://localhost:8004'

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
        // MBA3 Consultas (ODC SAP, plantillas, pedidos, etc.). En servidor de pruebas apuntar a 210.17.1.55:8000.
        '/mba3-api': {
          target: mba3Target,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/mba3-api/, '')
        },
        // /Auth/me → mba3-consultas (capabilities). Debe ir antes que /api.
        '/api/Auth/me': {
          target: mba3Target,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        },
        // Login y resto de /api → Core (Apps pruebas).
        '/api': {
          target: 'http://192.168.2.12:8080', // Core con AD
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        },
        // Archivos estáticos de Caja Chica (ej: /uploads/...) → backend http://localhost:8080
        '/uploads': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        },
        // API del Maestro de Artículos. En servidor de pruebas: VITE_MAESTRO_API_TARGET=http://210.17.1.55:8004/
        '/maestro-api': {
          target: maestroTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/maestro-api/, '')
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
