import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { Prefactura, PrefacturaFilters } from '../types'

export const usePrefacturasStore = defineStore('mba3Prefacturas', () => {
  const prefacturas = ref<Prefactura[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<PrefacturaFilters>({
    anulada: false,
    confirmado: true,
    remision_facturada: false,
    include_obj_datos: true,
    save_to_db: true,
  })
  const metadata = ref<any>(null)

  const count = computed(() => prefacturas.value.length)

  async function fetchPrefacturas(customFilters?: PrefacturaFilters) {
    loading.value = true
    error.value = null
    try {
      const response = await mba3ConsultasService.getPrefacturas(customFilters || filters.value)
      prefacturas.value = response.data
      metadata.value = response.metadata
    } catch (err: any) {
      error.value = err.message || 'Error al obtener prefacturas'
      console.error('Error fetching prefacturas:', err)
    } finally {
      loading.value = false
    }
  }

  function updateFilters(newFilters: Partial<PrefacturaFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters() {
    filters.value = {
      anulada: false,
      confirmado: true,
      remision_facturada: false,
      include_obj_datos: true,
      save_to_db: true,
    }
  }

  return {
    prefacturas,
    loading,
    error,
    filters,
    metadata,
    count,
    fetchPrefacturas,
    updateFilters,
    resetFilters,
  }
})



