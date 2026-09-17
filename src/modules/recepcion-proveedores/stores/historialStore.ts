import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pickingApi } from '../services/pickingApi'
import { mapApiError } from '@/utils/apiErrorMapper'
import { toLocalDayBoundIso } from '../utils/dateRange'
import type { HistorialRecepcionResponse } from '../types'

export const useHistorialStore = defineStore('recepcionProveedoresHistorial', () => {
  const historial = ref<HistorialRecepcionResponse[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function buscar(filtros: {
    desde: string
    hasta: string
    docNum?: number | null
    whsCode?: string | null
    estado?: string | null
  }): Promise<void> {
    loading.value = true
    error.value = null
    try {
      historial.value = await pickingApi.obtenerHistorial({
        desde: toLocalDayBoundIso(filtros.desde, false),
        hasta: toLocalDayBoundIso(filtros.hasta, true),
        docNum: filtros.docNum ?? undefined,
        whsCode: filtros.whsCode ?? undefined,
        estado: filtros.estado ?? undefined,
      })
    } catch (err: unknown) {
      error.value = mapApiError(err, 'No se pudo cargar el historial de recepciones.').message
      historial.value = []
    } finally {
      loading.value = false
    }
  }

  function limpiarError(): void {
    error.value = null
  }

  return { historial, loading, error, buscar, limpiarError }
})
