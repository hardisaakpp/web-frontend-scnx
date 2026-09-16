<script setup lang="ts">
import { MagnifyingGlassIcon, ClockIcon } from '@heroicons/vue/24/outline'
</script>

<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div>
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Recepción ODC de Proveedores</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Búsqueda de órdenes de compra e historial de eventos de picking
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      <router-link
        to="/recepcion-proveedores/buscar"
        class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
      >
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <MagnifyingGlassIcon class="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 dark:text-white text-sm">Buscar Orden de Compra</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Busca una ODC por su número (DocNum)</div>
          </div>
        </div>
      </router-link>

      <router-link
        to="/recepcion-proveedores/logs"
        class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
      >
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded bg-green-50 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
            <ClockIcon class="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 dark:text-white text-sm">Historial</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Registro de eventos de picking de tus almacenes</div>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>
