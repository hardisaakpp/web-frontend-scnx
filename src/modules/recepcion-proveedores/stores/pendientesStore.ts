import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ordenesCompraApi } from '../services/ordenesCompraApi'
import { mapApiError } from '@/utils/apiErrorMapper'
import { toLocalDayBoundIso } from '../utils/dateRange'
import type { OrdenCompraPendienteResponse } from '../types'

export const usePendientesStore = defineStore('recepcionProveedoresPendientes', () => {
  const pendientes = ref<OrdenCompraPendienteResponse[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function buscar(filtros: { desde: string; hasta: string }): Promise<void> {
    loading.value = true
    error.value = null
    try {
      pendientes.value = await ordenesCompraApi.obtenerPendientes({
        desde: toLocalDayBoundIso(filtros.desde, false),
        hasta: toLocalDayBoundIso(filtros.hasta, true),
      })
    } catch (err: unknown) {
      error.value = mapApiError(err, 'No se pudo cargar el listado de órdenes pendientes.').message
      pendientes.value = []
    } finally {
      loading.value = false
    }
  }

  function limpiarError(): void {
    error.value = null
  }

  return { pendientes, loading, error, buscar, limpiarError }
})
