<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Inventario</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Flujo operativo completo: planificar, ejecutar toma, monitorear estado y cerrar snapshot.
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <!-- Mis Inventarios -->
      <router-link
        to="/inventario/mis-inventarios"
        class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
      >
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 dark:text-white text-sm">Mis Inventarios</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Ver sesiones de conteo abiertas asignadas a tu bodega o a tu usuario</div>
          </div>
        </div>
      </router-link>

      <!-- Planes de inventario -->
      <router-link
        to="/inventario/planes"
        class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
      >
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 dark:text-white text-sm">Planes de inventario</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Crear y ejecutar planificaciones por bodega con filtros de género, nivel y material</div>
          </div>
        </div>
      </router-link>

      <!-- Toma Física -->
      <router-link
        to="/inventario/sesiones"
        class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
      >
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded bg-green-50 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 dark:text-white text-sm">Toma Física</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Ejecutar planes pendientes o crear tomas físicas sin necesidad de plan previo</div>
          </div>
        </div>
      </router-link>

      <!-- Bandeja de Ajustes -->
      <router-link
        v-if="canVerBandejaAjustes"
        to="/inventario/ajustes"
        class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
      >
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 dark:text-white text-sm">Bandeja de Ajustes</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Revisar snapshots cerrados, editar diferencias, aprobar y enviar el ajuste a SAP</div>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInventarioModulePermissions } from '../composables/useInventarioModulePermissions'

const { canVerBandejaAjustes } = useInventarioModulePermissions()
</script>
