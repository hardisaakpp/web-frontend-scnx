<template>
  <div class="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Filtros de Búsqueda</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
      <div class="flex flex-col">
        <label class="text-sm font-medium text-gray-700 mb-2">Anulada</label>
        <select 
          v-model="localFilters.anulada" 
          class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          @change="emitUpdate"
        >
          <option :value="null">Todas</option>
          <option :value="false">No anuladas</option>
          <option :value="true">Anuladas</option>
        </select>
      </div>

      <div class="flex flex-col">
        <label class="text-sm font-medium text-gray-700 mb-2">Confirmado</label>
        <select 
          v-model="localFilters.confirmado" 
          class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          @change="emitUpdate"
        >
          <option :value="null">Todas</option>
          <option :value="true">Confirmadas</option>
          <option :value="false">No confirmadas</option>
        </select>
      </div>

      <div class="flex flex-col">
        <label class="text-sm font-medium text-gray-700 mb-2">Remisión Facturada</label>
        <select 
          v-model="localFilters.remision_facturada" 
          class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          @change="emitUpdate"
        >
          <option :value="null">Todas</option>
          <option :value="false">Sin remisión</option>
          <option :value="true">Con remisión</option>
        </select>
      </div>

      <div class="flex items-center">
        <label class="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            v-model="localFilters.include_obj_datos"
            @change="emitUpdate"
            class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <span class="text-sm text-gray-700">Incluir solo con ObjDatosFactura</span>
        </label>
      </div>

      <div class="flex items-center">
        <label class="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            v-model="localFilters.save_to_db"
            @change="emitUpdate"
            class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <span class="text-sm text-gray-700">Guardar en base de datos</span>
        </label>
      </div>
    </div>

    <div class="flex gap-3 justify-end pt-4 border-t border-gray-200">
      <button 
        @click="handleReset" 
        class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
      >
        Resetear
      </button>
      <button 
        @click="handleApply" 
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
      >
        Aplicar Filtros
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { FacturaFilters } from '../types'

const props = defineProps<{
  filters: FacturaFilters
}>()

const emit = defineEmits<{
  'update-filters': [filters: Partial<FacturaFilters>]
  'reset': []
}>()

const localFilters = reactive<FacturaFilters>({ ...props.filters })

watch(() => props.filters, (newFilters) => {
  Object.assign(localFilters, newFilters)
}, { deep: true })

function emitUpdate() {
  emit('update-filters', { ...localFilters })
}

function handleApply() {
  emit('update-filters', { ...localFilters })
}

function handleReset() {
  emit('reset')
}
</script>


