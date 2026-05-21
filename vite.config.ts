import { defineConfig, loadEnv } from 'vite'

import vue from '@vitejs/plugin-vue'

import { fileURLToPath, URL } from 'node:url'

import { mergeViteDevEnv, upstreamUrl } from './deploy/loadEnv.mjs'

/** bundle + active.env + .env.development (VITE_*_PROXY_TARGET → UPSTREAM si no hay active.env) */
function viteEnv(mode: string): Record<string, string> {
  return mergeViteDevEnv(mode, loadEnv(mode, process.cwd(), ''))
}



// https://vitejs.dev/config/

export default defineConfig(({ mode }) => {

  const env = viteEnv(mode)

  const rawAppBasePath = env.VITE_APP_BASE_PATH || '/'

  const normalizedAppBasePath = rawAppBasePath.startsWith('/') ? rawAppBasePath : `/${rawAppBasePath}`

  const appBasePath = normalizedAppBasePath.endsWith('/') ? normalizedAppBasePath : `${normalizedAppBasePath}/`



  const coreProxyTarget = upstreamUrl(env, 'CORE')

  const mba3ProxyTarget = upstreamUrl(env, 'MBA3')

  const authMeProxyTarget = upstreamUrl(env, 'MBA3_AUTH')

  const cajaChicaProxyTarget = upstreamUrl(env, 'CAJA_CHICA')

  const employeesProxyTarget = upstreamUrl(env, 'EMPLOYEES')

  const pygProxyTarget = upstreamUrl(env, 'PYG')

  const maestroProxyTarget = upstreamUrl(env, 'MAESTRO')

  const conciliacionProxyTarget = upstreamUrl(env, 'CONCILIACION')

  const articuloScanProxyTarget = upstreamUrl(env, 'SCAN')

  const inventarioProxyTarget = upstreamUrl(env, 'INVENTARIO')

  const promocionSobresProxyTarget = upstreamUrl(env, 'PROMOCION_SOBRES')

  const slayerProxyTarget = upstreamUrl(env, 'SLAYER')

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

      port: 3000,

      proxy: {

        '/mba3-api': {

          target: mba3ProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path) => path.replace(/^\/mba3-api/, '')

        },

        '/api/Auth/me': {

          target: authMeProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path) => path

        },

        '/api/auth/me': {

          target: authMeProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path) => path

        },

        '/api/users/preferences': {

          target: mba3ProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path) => path

        },

        '/notificaciones': {

          target: mba3ProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path) => path

        },

        '/api/mba3': {

          target: mba3ProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path) => path.replace(/^\/api\/mba3/, '')

        },

        '/api': {

          target: coreProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path) => path

        },

        '/caja-chica-api': {

          target: cajaChicaProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path) => path.replace(/^\/caja-chica-api/, '/api')

        },

        '/pyg-api': {

          target: pygProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path) => path.replace(/^\/pyg-api/, pygProxyPrefix || '')

        },

        '/slayer-api': {

          target: slayerProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path) => path.replace(/^\/slayer-api/, '/api')

        },

        '/uploads': {

          target: cajaChicaProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path) => path

        },

        '/employees-api': {

          target: employeesProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path) => path.replace(/^\/employees-api/, '/api')

        },

        '/conciliacion-api': {

          target: conciliacionProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path) => path.replace(/^\/conciliacion-api/, '')

        },

        '/maestro-api': {

          target: maestroProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path) => path.replace(/^\/maestro-api/, '')

        },

        '/scan-api': {

          target: articuloScanProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path) => path.replace(/^\/scan-api/, '')

        },

        '/inventario-api': {

          target: inventarioProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path) => path.replace(/^\/inventario-api/, '')

        },

        '/promocion-sobres-api': {

          target: promocionSobresProxyTarget,

          changeOrigin: true,

          secure: false,

          rewrite: (path) => path.replace(/^\/promocion-sobres-api/, '')

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


