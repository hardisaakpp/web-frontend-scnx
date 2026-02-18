<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-4">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Caja Chica</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión de liquidaciones y gastos menores</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <router-link
           to="/caja-chica/liquidaciones"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Crear liquidación</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Registrar una nueva liquidación</div>
            </div>
          </div>
        </router-link>

        <router-link
           to="/caja-chica/liquidaciones-pendientes"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Liquidaciones pendientes</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Revisar solicitudes por aprobar</div>
            </div>
          </div>
        </router-link>

        <router-link
          to="/caja-chica/liquidaciones-aprobadas"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-green-50 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Liquidaciones aprobadas</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Historial de liquidaciones aprobadas</div>
            </div>
          </div>
        </router-link>

        <router-link
          to="/caja-chica/aprobadores"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Configuración de aprobadores</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Administrar aprobadores por tienda</div>
            </div>
          </div>
        </router-link>

        <router-link
          to="/caja-chica/aprobaciones-pendientes"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Aprobaciones pendientes</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Pendientes por aprobar</div>
            </div>
          </div>
        </router-link>

        <router-link
          to="/caja-chica/aprobaciones-contabilidad"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m-6 4h6m-6 4h6M7 7a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2H7z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Aprobaciones contabilidad</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Validar montos finales</div>
            </div>
          </div>
        </router-link>

        <router-link
          to="/caja-chica/almacenes"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Grupos almacenes</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Configurar grupos y tiendas</div>
            </div>
          </div>
        </router-link>

        <router-link
          to="/caja-chica/asignacion-almacenes"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9l-6 6-6-6" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Asignacion almacenes</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Vincular usuarios con almacenes</div>
            </div>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Dashboard principal de Caja Chica
</script>
