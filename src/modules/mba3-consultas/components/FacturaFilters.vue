<template>
  <div class="filters-card">
    <h3 class="filters-title">Filtros de Búsqueda</h3>
    <div class="filters-grid">
      <div class="filter-group">
        <label class="filter-label">Anulada</label>
        <select 
          v-model="localFilters.anulada" 
          class="filter-select"
          @change="emitUpdate"
        >
          <option :value="null">Todas</option>
          <option :value="false">No anuladas</option>
          <option :value="true">Anuladas</option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">Confirmado</label>
        <select 
          v-model="localFilters.confirmado" 
          class="filter-select"
          @change="emitUpdate"
        >
          <option :value="null">Todas</option>
          <option :value="true">Confirmadas</option>
          <option :value="false">No confirmadas</option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">Remisión Facturada</label>
        <select 
          v-model="localFilters.remision_facturada" 
          class="filter-select"
          @change="emitUpdate"
        >
          <option :value="null">Todas</option>
          <option :value="false">Sin remisión</option>
          <option :value="true">Con remisión</option>
        </select>
      </div>

      <div class="filter-group checkbox-group">
        <label class="checkbox-label">
          <input 
            type="checkbox" 
            v-model="localFilters.include_obj_datos"
            @change="emitUpdate"
            class="checkbox-input"
          />
          <span>Incluir solo con ObjDatosFactura</span>
        </label>
      </div>

      <div class="filter-group checkbox-group">
        <label class="checkbox-label">
          <input 
            type="checkbox" 
            v-model="localFilters.save_to_db"
            @change="emitUpdate"
            class="checkbox-input"
          />
          <span>Guardar en base de datos</span>
        </label>
      </div>
    </div>

    <div class="filters-actions">
      <button @click="handleReset" class="btn btn-secondary">Resetear</button>
      <button @click="handleApply" class="btn btn-primary">Aplicar Filtros</button>
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

<style scoped>
.filters-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  border: 1px solid #e5e7eb;
}

.filters-title {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.filter-select {
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  color: #111827;
  cursor: pointer;
  transition: border-color 0.2s;
}

.filter-select:hover {
  border-color: #3498db;
}

.filter-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.checkbox-group {
  justify-content: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #6b7280;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.filters-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}
</style>

