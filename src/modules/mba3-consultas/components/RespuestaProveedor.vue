<template>
  <div v-if="pedido.respuesta_proveedor" class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Respuesta del Proveedor</h2>
      <span class="px-3 py-1 text-xs font-medium rounded-full" :class="getEstadoBadgeClass(pedido.respuesta_proveedor.cabecera.estado)">
        {{ pedido.respuesta_proveedor.cabecera.estado }}
      </span>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div>
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Versión</label>
        <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ pedido.respuesta_proveedor.cabecera.version }}</p>
      </div>
      <div>
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha de Respuesta</label>
        <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatDate(pedido.respuesta_proveedor.cabecera.fecha_respuesta) }}</p>
      </div>
      <div>
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Creado por</label>
        <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ pedido.respuesta_proveedor.cabecera.creado_por }}</p>
      </div>
    </div>

    <!-- Tabla comparativa: Solicitado vs Confirmado -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Producto</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Solicitado</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Confirmado</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Precio Original</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Precio Ajustado</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Observaciones</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="detalle in pedido.respuesta_proveedor.detalles" :key="detalle.codigo_producto">
            <td class="px-4 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900 dark:text-white">{{ detalle.codigo_producto }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">{{ detalle.descripcion }}</div>
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
              {{ formatNumber(detalle.cantidad_solicitada_total) }}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-right text-sm" :class="getCantidadClass(detalle.cantidad_solicitada_total, detalle.cantidad_confirmada_total)">
              {{ formatNumber(detalle.cantidad_confirmada_total) }}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
              {{ formatCurrency(detalle.costo_doc_sin_iva_original) }}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-right text-sm" :class="getPrecioClass(detalle.costo_doc_sin_iva_original, detalle.costo_doc_sin_iva_ajustado)">
              {{ formatCurrency(detalle.costo_doc_sin_iva_ajustado) }}
            </td>
            <td class="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
              {{ detalle.observaciones || '-' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PedidoCompleto } from '../types'
import { formatDate, formatNumber, formatCurrency } from '../utils/formatters'
import { getEstadoBadgeClass, getCantidadClass, getPrecioClass } from '../utils/styleHelpers'

defineProps<{
  pedido: PedidoCompleto
}>()
</script>
