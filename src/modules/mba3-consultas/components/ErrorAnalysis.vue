<template>
  <div class="w-full">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">Análisis de Errores</h3>
      <span v-if="totalErrors > 0" class="text-sm text-red-600 font-medium">{{ totalErrors }} error(es)</span>
    </div>
    
    <div v-if="totalErrors === 0" class="text-center py-8">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
        <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p class="text-gray-500">No hay órdenes con errores</p>
    </div>
    
    <div v-else class="space-y-4">
      <!-- Resumen de errores -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="text-sm text-red-600 font-medium mb-1">Total Errores</div>
          <div class="text-2xl font-bold text-red-700">{{ totalErrors }}</div>
        </div>
        <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div class="text-sm text-orange-600 font-medium mb-1">Proveedores Afectados</div>
          <div class="text-2xl font-bold text-orange-700">{{ uniqueProveedores }}</div>
        </div>
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="text-sm text-yellow-600 font-medium mb-1">Tasa de Error</div>
          <div class="text-2xl font-bold text-yellow-700">{{ errorRate }}%</div>
        </div>
      </div>
      
      <!-- Top proveedores con errores -->
      <div v-if="topProveedores.length > 0" class="bg-white border border-gray-200 rounded-lg p-4">
        <h4 class="text-sm font-semibold text-gray-700 mb-3">Proveedores con más errores</h4>
        <div class="space-y-2">
          <div 
            v-for="(proveedor, index) in topProveedores" 
            :key="proveedor.nombre"
            class="flex items-center justify-between p-2 rounded hover:bg-gray-50"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-500">#{{ index + 1 }}</span>
              <span class="text-sm text-gray-900">{{ proveedor.nombre }}</span>
            </div>
            <span class="text-sm font-semibold text-red-600">{{ proveedor.count }} error(es)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { OrdenCompra } from '../types'

interface Props {
  ordenes: OrdenCompra[]
}

const props = defineProps<Props>()

const ordenesConError = computed(() => {
  return props.ordenes.filter(oc => oc.estado === 'ERROR')
})

const totalErrors = computed(() => ordenesConError.value.length)

const uniqueProveedores = computed(() => {
  const proveedores = new Set(ordenesConError.value.map(oc => oc.proveedor))
  return proveedores.size
})

const errorRate = computed(() => {
  if (props.ordenes.length === 0) return 0
  return Math.round((totalErrors.value / props.ordenes.length) * 100)
})

const topProveedores = computed(() => {
  const proveedorCounts: Record<string, number> = {}
  
  ordenesConError.value.forEach(oc => {
    proveedorCounts[oc.proveedor] = (proveedorCounts[oc.proveedor] || 0) + 1
  })
  
  return Object.entries(proveedorCounts)
    .map(([nombre, count]) => ({ nombre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
})
</script>

