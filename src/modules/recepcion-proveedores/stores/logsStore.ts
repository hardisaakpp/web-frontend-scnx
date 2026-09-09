import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pickingApi } from '../services/pickingApi'
import { mapApiError } from '@/utils/apiErrorMapper'
import { toLocalDayBoundIso } from '../utils/dateRange'
import type { OrdenPickingLogGeneralResponse } from '../types'

export const useLogsStore = defineStore('recepcionProveedoresLogs', () => {
  const logs = ref<OrdenPickingLogGeneralResponse[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function buscar(filtros: { desde: string; hasta: string; docNum?: number | null }): Promise<void> {
    loading.value = true
    error.value = null
    try {
      logs.value = await pickingApi.obtenerLogsGeneral({
        desde: toLocalDayBoundIso(filtros.desde, false),
        hasta: toLocalDayBoundIso(filtros.hasta, true),
        docNum: filtros.docNum ?? undefined,
      })
    } catch (err: unknown) {
      error.value = mapApiError(err, 'No se pudo cargar el registro de eventos.').message
      logs.value = []
    } finally {
      loading.value = false
    }
  }

  function limpiarError(): void {
    error.value = null
  }

  return { logs, loading, error, buscar, limpiarError }
})
