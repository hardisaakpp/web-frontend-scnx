<template>
  <div class="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
    <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
      <h2 class="text-lg font-semibold text-gray-900">Órdenes de Compra</h2>
      <div class="flex items-center gap-3">
        <span class="px-3 py-1 bg-indigo-600 text-white rounded-full text-sm font-medium">
          {{ ordenesCompra.length }} órdenes
        </span>
      </div>
    </div>

    <div v-if="ordenesCompra.length === 0" class="text-center py-12 text-gray-500">
      <p>No se encontraron órdenes de compra</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OC ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referencia Despacho</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Generación</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número OC SAP</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr 
            v-for="oc in ordenesCompra" 
            :key="oc.oc_id" 
            class="hover:bg-gray-50"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{{ oc.oc_id.substring(0, 8) }}...</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ oc.proveedor }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ oc.referencia_despacho }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatDate(oc.fecha_generacion) }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="getEstadoClass(oc.estado)">
                {{ oc.estado }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ oc.numero_oc_sap || '-' }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <button 
                v-if="oc.estado === 'PENDIENTE'"
                @click="handleIntegrar(oc.referencia_despacho)" 
                class="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                :disabled="loading"
              >
                {{ loading ? 'Enviando...' : 'Enviar a SAP' }}
              </button>
              <span v-else class="text-gray-400 italic">-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OrdenCompra } from '../types'

defineProps<{
  ordenesCompra: OrdenCompra[]
  loading?: boolean
}>()

const emit = defineEmits<{
  integrar: [referenciaDespacho: string]
}>()

function formatDate(dateString: string): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES')
  } catch {
    return dateString
  }
}

function getEstadoClass(estado: string): string {
  const classes: Record<string, string> = {
    'PENDIENTE': 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800',
    'ENVIADA': 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800',
    'ERROR': 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800',
  }
  return classes[estado] || 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'
}

function handleIntegrar(referenciaDespacho: string) {
  emit('integrar', referenciaDespacho)
}
</script>


