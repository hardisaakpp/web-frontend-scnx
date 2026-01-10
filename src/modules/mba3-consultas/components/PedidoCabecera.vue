<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Información del Pedido</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Número de Pedido</label>
        <div class="flex items-center gap-2 mt-1">
          <p class="text-sm text-gray-900 dark:text-white">{{ pedido.cabecera.numero_pedido || 'N/A' }}</p>
          <button
            v-if="pedido.cabecera.numero_pedido"
            @click="$emit('copy-to-clipboard', pedido.cabecera.numero_pedido)"
            :title="copyFeedback ? 'Copiado!' : 'Copiar número de pedido'"
            class="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors duration-200"
            :class="{ 'text-green-600 dark:text-green-400': copyFeedback }"
          >
            <svg v-if="!copyFeedback" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
      <div>
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha de Pedido</label>
        <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatDate(pedido.cabecera.fecha_pedido) }}</p>
      </div>
      <div>
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha de Entrega</label>
        <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatDate(pedido.cabecera.fecha_entrega) }}</p>
      </div>
      <div>
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Proveedor</label>
        <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ pedido.cabecera.proveedor_nombre || 'N/A' }}</p>
      </div>
      <div>
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Comprador</label>
        <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ pedido.cabecera.comprador_nombre || 'N/A' }}</p>
      </div>
      <div>
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Forma de Pago</label>
        <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ pedido.cabecera.forma_pago || 'N/A' }}</p>
      </div>
      <div v-if="pedido.cabecera.estado">
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado del Pedido</label>
        <p class="mt-1">
          <span class="px-2 py-1 text-xs font-medium rounded-full" :class="getEstadoPedidoBadgeClass(pedido.cabecera.estado)">
            {{ formatEstadoPedido(pedido.cabecera.estado) }}
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PedidoCompleto } from '../types'
import { formatDate, formatEstadoPedido } from '../utils/formatters'
import { getEstadoPedidoBadgeClass } from '../utils/styleHelpers'

defineProps<{
  pedido: PedidoCompleto
  copyFeedback: boolean
}>()

defineEmits<{
  'copy-to-clipboard': [text: string]
}>()
</script>
