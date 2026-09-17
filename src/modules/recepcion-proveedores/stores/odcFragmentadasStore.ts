import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pickingApi } from '../services/pickingApi'
import { mapApiError } from '@/utils/apiErrorMapper'
import type { OrdenPickingFragmentadaResponse } from '../types'

export const useOdcFragmentadasStore = defineStore('recepcionProveedoresOdcFragmentadas', () => {
  const fragmentadas = ref<OrdenPickingFragmentadaResponse[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function buscar(filtros: { docNum?: number | null; whsCode?: string | null }): Promise<void> {
    loading.value = true
    error.value = null
    try {
      fragmentadas.value = await pickingApi.obtenerFragmentadas({
        docNum: filtros.docNum ?? undefined,
        whsCode: filtros.whsCode ?? undefined,
      })
    } catch (err: unknown) {
      error.value = mapApiError(err, 'No se pudo cargar el listado de recepción parcial.').message
      fragmentadas.value = []
    } finally {
      loading.value = false
    }
  }

  function limpiarError(): void {
    error.value = null
  }

  return { fragmentadas, loading, error, buscar, limpiarError }
})
