import { defineConfig, loadEnv, type UserConfig } from 'vite'

import vue from '@vitejs/plugin-vue'

import { fileURLToPath, URL } from 'node:url'

import { mergeViteDevEnv, upstreamUrl } from './deploy/loadEnv.mjs'

/** bundle + active.env + .env.development (VITE_*_PROXY_TARGET → UPSTREAM si no hay active.env) */
function viteEnv(mode: string): Record<string, string> {
  return mergeViteDevEnv(mode, loadEnv(mode, process.cwd(), ''))
}

async function resolveActiveBackend(primary: string, fallback: string): Promise<string> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 1500)
    await fetch(`${primary}/api/Roles`, { signal: controller.signal, headers: { Accept: 'application/json' } })
    clearTimeout(timeout)
    console.log(`\x1b[32m[proxy]\x1b[0m Core → ${primary} (nativo)`)
    return primary
  } catch {
    console.log(`\x1b[33m[proxy]\x1b[0m Core → ${fallback} (Docker, nativo no disponible)`)
    return fallback
  }
}

// https://vitejs.dev/config/

export default defineConfig(async ({ mode }): Promise<UserConfig> => {

  const env = viteEnv(mode)

  const rawAppBasePath = env.VITE_APP_BASE_PATH || '/'

  const normalizedAppBasePath = rawAppBasePath.startsWith('/') ? rawAppBasePath : `/${rawAppBasePath}`

  const appBasePath = normalizedAppBasePath.endsWith('/') ? normalizedAppBasePath : `${normalizedAppBasePath}/`

  const corePrimary = upstreamUrl(env, 'CORE')
  const coreFallback = env.VITE_CORE_FALLBACK_PROXY_TARGET || corePrimary
  const coreProxyTarget = mode === 'development'
    ? await resolveActiveBackend(corePrimary, coreFallback)
    : corePrimary
  const mba3ProxyTarget = upstreamUrl(env, 'MBA3')
  const transaccionesProxyTarget = upstreamUrl(env, 'TRANSACCIONES')
  const authMeProxyTarget = upstreamUrl(env, 'MBA3_AUTH')
  const cajaChicaProxyTarget = upstreamUrl(env, 'CAJA_CHICA')
  const employeesProxyTarget = upstreamUrl(env, 'EMPLOYEES')
  const pygProxyTarget = upstreamUrl(env, 'PYG')
  const maestroProxyTarget = upstreamUrl(env, 'MAESTRO')
  const conciliacionProxyTarget = upstreamUrl(env, 'CONCILIACION')
  const articuloScanProxyTarget = upstreamUrl(env, 'SCAN')
  const inventarioProxyTarget = upstreamUrl(env, 'INVENTARIO')
  const invPlanesProxyTarget = upstreamUrl(env, 'INV_PLANES') || upstreamUrl(env, 'INVENTARIO')
  const promocionSobresProxyTarget = upstreamUrl(env, 'PROMOCION_SOBRES')
  const slayerProxyTarget = upstreamUrl(env, 'SLAYER')
  // mIAApi (asistente SCNEXUS AI): sin fallback a defaults genéricos — servicio propio
  const miaProxyTarget = env.UPSTREAM_MIA || 'http://172.30.152.246:8896'
  const reposicionProxyTarget = upstreamUrl(env, 'REPOSICION')
  const transferenciasDirectasProxyTarget = upstreamUrl(env, 'TRANSFERENCIAS_DIRECTAS')

  console.log(`\x1b[35m[proxy]\x1b[0m Reposiciones → ${reposicionProxyTarget}`)
  const recepcionProxyTarget = upstreamUrl(env, 'RECEPCION')
  console.log(`\x1b[35m[proxy]\x1b[0m Recepción Mercadería → ${recepcionProxyTarget}`)

  const recepcionProveedoresProxyTarget = upstreamUrl(env, 'RECEPCION_PROVEEDORES')
  console.log(`\x1b[35m[proxy]\x1b[0m Recepción Proveedores → ${recepcionProveedoresProxyTarget}`)

  const demandaOtbProxyTarget = upstreamUrl(env, 'DEMANDA_OTB')
  console.log(`\x1b[35m[proxy]\x1b[0m Demanda OTB → ${demandaOtbProxyTarget}`)

  const ruletaProxyTarget = upstreamUrl(env, 'RULETA')
  const cediProxyTarget = upstreamUrl(env, 'CEDI')
  const pygProxyPrefix =
    'UPSTREAM_PYG_PREFIX' in env
      ? env.UPSTREAM_PYG_PREFIX
      : 'VITE_PYG_PROXY_PREFIX' in env
        ? env.VITE_PYG_PROXY_PREFIX
        : '/api'

  return {

    base: appBasePath,

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

      host: '0.0.0.0',

      port: 3001,

      proxy: {

        '/mba3-api': {

          target: mba3ProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path: string) => path.replace(/^\/mba3-api/, '')

        },

        '/api/Auth/me': {

          target: authMeProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path: string) => path

        },

        '/api/auth/me': {

          target: authMeProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path: string) => path

        },

        '/api/users/preferences': {

          target: mba3ProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path: string) => path

        },

        '/notificaciones': {

          target: mba3ProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path: string) => path

        },

        '/api/mba3': {

          target: mba3ProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path: string) => path.replace(/^\/api\/mba3/, '')

        },

        '/api/reposicion-api': {
          target: reposicionProxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/reposicion-api/, '/api')
        },
        '/api/transferencias-directas-api': {
          target: transferenciasDirectasProxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/transferencias-directas-api/, '/api')
        },


        '/api/recepcion-api': {
          target: recepcionProxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/recepcion-api/, '/api')
        },

        '/api/recepcion-proveedores-api': {
          target: recepcionProveedoresProxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/recepcion-proveedores-api/, '/api/v1')
        },

        '/api/demanda-otb-api': {
          target: demandaOtbProxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/demanda-otb-api/, '/api/v1')
        },

        '/api': {

          target: coreProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path: string) => path

        },

        '/caja-chica-api': {

          target: cajaChicaProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path: string) => path.replace(/^\/caja-chica-api/, '/api')

        },

        '/pyg-api': {

          target: pygProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path: string) => path.replace(/^\/pyg-api/, pygProxyPrefix || '')

        },

        '/slayer-api': {

          target: slayerProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path: string) => path.replace(/^\/slayer-api/, '/api')

        },

        '/uploads': {

          target: cajaChicaProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path: string) => path

        },

        '/employees-api': {

          target: employeesProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path: string) => path.replace(/^\/employees-api/, '')

        },

        '/conciliacion-api': {

          target: conciliacionProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path: string) => path.replace(/^\/conciliacion-api/, '')

        },

        '/maestro-api': {

          target: maestroProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path: string) => path.replace(/^\/maestro-api/, '')

        },

        '/mia-api': {

          target: miaProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path: string) => path.replace(/^\/mia-api/, '')

        },

        '/scan-api': {

          target: articuloScanProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path: string) => path.replace(/^\/scan-api/, '')

        },

        '/inventario-api': {

          target: inventarioProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path: string) => path.replace(/^\/inventario-api/, '')

        },

        '/inv-planes-api': {

          target: invPlanesProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path: string) => path.replace(/^\/inv-planes-api/, '')

        },

        '/promocion-sobres-api': {

          target: promocionSobresProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path: string) => path.replace(/^\/promocion-sobres-api/, '')

        },

        '/transacciones-api': {

          target: transaccionesProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path: string) => path.replace(/^\/transacciones-api/, '')

        },

        '/ruleta-api': {

          target: ruletaProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path) => path.replace(/^\/ruleta-api/, '')

        },

        '/cedi-api': {

          target: cediProxyTarget,

          changeOrigin: true,

          secure: false,

          // El backend de CEDI (SCNexus.Cedi.API) usa el mismo patrón de rutas
          // "api/[controller]" que el Core, por eso se reescribe a /api (igual que caja-chica).
          rewrite: (path: string) => path.replace(/^\/cedi-api/, '/api')

        }


      }

    },

    build: {

      outDir: 'dist',

      assetsDir: 'assets',

      sourcemap: false,

      minify: 'esbuild',

      rollupOptions: {

        output: {

          manualChunks: {

            'vue-vendor': ['vue', 'vue-router', 'pinia'],

            'ui-vendor': ['@headlessui/vue', '@heroicons/vue'],

            'utils-vendor': ['axios', 'jwt-decode']

          }

        }

      },

      chunkSizeWarningLimit: 500

    }

  }

})


