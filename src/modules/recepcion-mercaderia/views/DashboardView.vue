<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div>
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Recepción Mercadería</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Recepción de transferencias entre almacenes: pendientes, picking e historial
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      <router-link
        v-if="authStore.isAdmin || authStore.hasPermission('recepcion.reception.view')"
        to="/recepcion-mercaderia/pendientes"
        class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
      >
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
            <svg class="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4m0 0l6-6m-6 6l6 6" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 dark:text-white text-sm">Transferencias Pendientes</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Recepción de traslados desde SAP</div>
          </div>
        </div>
      </router-link>

      <router-link
        v-if="authStore.isAdmin || authStore.hasPermission('recepcion.reception.view')"
        to="/recepcion-mercaderia/en-curso"
        class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
      >
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <svg class="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 dark:text-white text-sm">En Curso / Picking</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Escanear, confirmar y registrar diferencias</div>
          </div>
        </div>
      </router-link>

      <router-link
        v-if="authStore.isAdmin || authStore.hasPermission('recepcion.history.view') || authStore.hasPermission('recepcion.history.viewall')"
        to="/recepcion-mercaderia/historial"
        class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
      >
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded bg-green-50 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
            <svg class="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 dark:text-white text-sm">Historial</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Transferencias recibidas de mi almacén</div>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>
