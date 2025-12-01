<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Facturas</h1>
        <p class="mt-1 text-sm text-gray-500">Consulta y gestiona facturas desde MBA3</p>
      </div>
      <button 
        @click="refreshFacturas" 
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="facturasStore.loading"
      >
        {{ facturasStore.loading ? 'Cargando...' : 'Actualizar' }}
      </button>
    </div>
    
    <FacturaFilters 
      :filters="facturasStore.filters"
      @update-filters="handleUpdateFilters"
      @reset="handleResetFilters"
    />

    <div v-if="facturasStore.error" class="bg-red-50 border-l-4 border-red-500 p-4 rounded">
      <div class="flex">
        <div class="ml-3">
          <p class="text-sm text-red-700">
            <strong>Error:</strong> {{ facturasStore.error }}
          </p>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="facturasStore.loading" message="Cargando facturas..." />

    <FacturaTable 
      v-else
      :facturas="facturasStore.facturas"
      :metadata="facturasStore.metadata"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useFacturasStore } from '../stores/facturasStore'
import FacturaFilters from '../components/FacturaFilters.vue'
import FacturaTable from '../components/FacturaTable.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import type { FacturaFilters as IFacturaFilters } from '../types'

const facturasStore = useFacturasStore()

onMounted(() => {
  facturasStore.fetchFacturas()
})

function handleUpdateFilters(filters: Partial<IFacturaFilters>) {
  facturasStore.updateFilters(filters)
  facturasStore.fetchFacturas()
}

function handleResetFilters() {
  facturasStore.resetFilters()
  facturasStore.fetchFacturas()
}

function refreshFacturas() {
  facturasStore.fetchFacturas()
}
</script>


