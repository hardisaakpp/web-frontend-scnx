<template>
  <div class="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
    <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
      <h2 class="text-lg font-semibold text-gray-900">Facturas Encontradas</h2>
      <div class="flex items-center gap-3">
        <span class="px-3 py-1 bg-indigo-600 text-white rounded-full text-sm font-medium">
          {{ facturas.length }} facturas
        </span>
        <span v-if="metadata?.save_status" class="text-sm text-gray-500">
          Guardadas: {{ metadata.save_status.facturas_guardadas || 0 }} | 
          Actualizadas: {{ metadata.save_status.facturas_actualizadas || 0 }}
        </span>
      </div>
    </div>

    <div v-if="facturas.length === 0" class="text-center py-12 text-gray-500">
      <p>No se encontraron facturas con los filtros seleccionados</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código Factura</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número Factura</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="factura in facturas" :key="factura.CODIGO_FACTURA" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{{ factura.CODIGO_FACTURA }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ factura.NUMERO_FACTURA }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ factura.EMPRESA }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ factura.CODIGO_CLIENTE }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatDate(factura.FECHA_FACTURA) }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="getStatusClass(factura)">
                {{ getStatusText(factura) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <button 
                @click="openModal(factura)" 
                class="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Ver Detalles
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <FacturaModal 
      v-if="selectedFactura"
      :factura="selectedFactura"
      @close="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Factura } from '../types'
import FacturaModal from './FacturaModal.vue'

defineProps<{
  facturas: Factura[]
  metadata?: any
}>()

const selectedFactura = ref<Factura | null>(null)

function formatDate(dateString: string): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES')
  } catch {
    return dateString
  }
}

function getStatusClass(factura: Factura): string {
  if (factura.ANULADA === 'true') return 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800'
  if (factura.CONFIRMADO === 'true') return 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800'
  return 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800'
}

function getStatusText(factura: Factura): string {
  if (factura.ANULADA === 'true') return 'Anulada'
  if (factura.CONFIRMADO === 'true') return 'Confirmada'
  return 'Pendiente'
}

function openModal(factura: Factura) {
  selectedFactura.value = factura
}

function closeModal() {
  selectedFactura.value = null
}
</script>


