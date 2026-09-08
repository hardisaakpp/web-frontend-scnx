<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Integraciones</h1>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            SAP · HITELL
          </span>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Seguimiento de las integraciones que pasan por el middleware: estado por documento, cola de peticiones a SAP y bitácora de llamadas.
        </p>
      </div>
      <slot name="acciones" />
    </div>

    <nav class="flex gap-1 border-b border-gray-200 dark:border-gray-700" aria-label="Secciones de integraciones">
      <router-link
        v-for="tab in tabs"
        :key="tab.name"
        :to="{ name: tab.name }"
        class="px-4 py-2.5 -mb-px text-sm font-medium border-b-2 transition-colors"
        :class="
          $route.name === tab.name
            ? 'border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300'
            : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
        "
      >
        {{ tab.label }}
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
const tabs = [
  { name: 'integraciones-hitell', label: 'HITELL (WEBPOS)' },
  { name: 'integraciones-cola-sap', label: 'Cola SAP' },
  { name: 'integraciones-bitacora', label: 'Bitácora de peticiones' },
] as const
</script>
