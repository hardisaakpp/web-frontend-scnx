<script setup lang="ts">
import type { StockFaltante } from '../types'

withDefaults(defineProps<{
  mensaje: string
  faltantes: StockFaltante[]
  /**
   * Muestra el stock disponible. Solo para el aprobador (lo necesita para decidir);
   * al solicitante se le indica qué productos fallaron, sin exponer el stock.
   */
  mostrarDisponible?: boolean
}>(), {
  mostrarDisponible: false,
})
</script>

<template>
  <div class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 space-y-3 text-left">
    <p class="text-sm text-red-700 dark:text-red-400 font-medium">{{ mensaje }}</p>

    <div class="rounded-md border border-red-200 dark:border-red-800 overflow-hidden bg-white dark:bg-gray-800">
      <table class="min-w-full divide-y divide-red-100 dark:divide-red-900/40">
        <thead>
          <tr>
            <th
              class="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Producto</th>
            <th
              class="px-3 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Solicitado</th>
            <th v-if="mostrarDisponible"
              class="px-3 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Disponible</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-red-50 dark:divide-red-900/20">
          <tr v-for="f in faltantes" :key="f.itemCode">
            <td class="px-3 py-2 text-sm text-gray-700 dark:text-gray-200">{{ f.itemCode }}</td>
            <td class="px-3 py-2 text-sm text-center text-gray-700 dark:text-gray-200">{{ f.solicitado }}</td>
            <td v-if="mostrarDisponible" class="px-3 py-2 text-sm text-center font-semibold"
              :class="f.disponible === 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'">
              {{ f.disponible }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-xs text-gray-500 dark:text-gray-400">
      Reduce la cantidad de estos productos en la solicitud, o gestiona un ajuste de inventario mediante GLPI.
    </p>
  </div>
</template>
