<template>
  <div v-if="reporteDiferencias" data-reporte-diferencias class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Reporte de Diferencias</h2>
      <button
        @click="$emit('exportar')"
        class="px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 border border-purple-300 dark:border-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors flex items-center gap-1"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Exportar Excel
      </button>
    </div>

    <!-- Resumen -->
    <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6 transition-colors duration-300">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Productos</label>
          <p class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{{ reporteDiferencias.resumen.total_productos }}</p>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Solicitado</label>
          <p class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{{ formatNumber(reporteDiferencias.resumen.total_solicitado) }}</p>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Confirmado</label>
          <p class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{{ formatNumber(reporteDiferencias.resumen.total_confirmado) }}</p>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Diferencia</label>
          <p class="mt-1 text-lg font-semibold" :class="getDiferenciaClass(reporteDiferencias.resumen.total_diferencia)">
            {{ formatNumber(reporteDiferencias.resumen.total_diferencia) }}
          </p>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">% Confirmación</label>
          <p class="mt-1 text-lg font-semibold" :class="getPorcentajeClass(reporteDiferencias.resumen.porcentaje_confirmacion)">
            {{ formatPorcentaje(reporteDiferencias.resumen.porcentaje_confirmacion) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Tabla de diferencias -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Producto</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Solicitado</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Confirmado</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Diferencia</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">% Diferencia</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Costo Original</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Costo Ajustado</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cambio Precio</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="item in reporteDiferencias.detalle" :key="item.codigo_producto" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <td class="px-4 py-4">
              <div class="text-sm font-medium text-gray-900 dark:text-white">{{ item.codigo_producto }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">{{ item.descripcion }}</div>
              <div v-if="item.observaciones" class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                <span class="italic">{{ item.observaciones }}</span>
              </div>
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
              {{ formatNumber(item.cantidad_solicitada) }}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
              {{ formatNumber(item.cantidad_confirmada) }}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium" :class="getDiferenciaClass(item.diferencia)">
              {{ formatNumber(item.diferencia) }}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-right text-sm" :class="getPorcentajeDiferenciaClass(item.porcentaje_diferencia)">
              {{ formatPorcentaje(item.porcentaje_diferencia) }}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
              {{ formatCurrency(item.costo_original) }}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-right text-sm" :class="item.cambio_precio ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-gray-900 dark:text-white'">
              {{ formatCurrency(item.costo_ajustado) }}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-center">
              <span v-if="item.cambio_precio" class="px-2 py-1 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full">
                Sí
              </span>
              <span v-else class="text-xs text-gray-400 dark:text-gray-500">-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Distribución por tienda (expandible) -->
    <div v-if="tieneDistribucionPorTienda" class="mt-6">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Distribución por Tienda</h3>
      <div class="space-y-4">
        <details v-for="item in detalleConDistribucion" :key="item.codigo_producto" class="border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-300">
          <summary class="px-4 py-3 bg-gray-50 dark:bg-gray-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white transition-colors">
            {{ item.codigo_producto }} - {{ item.descripcion }}
          </summary>
          <div class="p-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div v-for="tienda in item.distribucion_tiendas" :key="tienda.tienda_codigo" class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-3 transition-colors duration-300">
                <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{{ tienda.tienda_codigo }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-300 mt-1">{{ tienda.tienda_nombre }}</div>
                <div class="text-lg font-semibold text-gray-900 dark:text-white mt-2">{{ formatNumber(tienda.cantidad) }}</div>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from '@vue/reactivity'
import type { ReporteDiferenciasResponse, DiferenciaReporte } from '../types'
import { formatNumber, formatCurrency, formatPorcentaje } from '../utils/formatters'
import { getDiferenciaClass, getPorcentajeClass, getPorcentajeDiferenciaClass } from '../utils/styleHelpers'

const props = defineProps<{
  reporteDiferencias: ReporteDiferenciasResponse | null
}>()

const tieneDistribucionPorTienda = computed(() =>
  (props.reporteDiferencias?.detalle.some((item: DiferenciaReporte) => item.distribucion_tiendas && item.distribucion_tiendas.length > 0) ?? false)
)

const detalleConDistribucion = computed(() =>
  (props.reporteDiferencias?.detalle.filter((i: DiferenciaReporte) => i.distribucion_tiendas && i.distribucion_tiendas.length > 0) ?? [])
)

defineEmits<{
  exportar: []
}>()
</script>
