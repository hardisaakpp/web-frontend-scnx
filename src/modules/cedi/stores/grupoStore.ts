import { defineStore } from 'pinia'
import { ref } from 'vue'
import grupoApi from '../services/grupoApi'
import type { CrearGrupoRequest, GrupoDetailDto, GrupoDto, IntegrarStockTransferResultDto } from '../types'

export const useGrupoStore = defineStore('cediGrupo', () => {
  const items = ref<GrupoDto[]>([])
  const totalCount = ref(0)
  const page = ref(1)
  const pageSize = ref(20)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const current = ref<GrupoDetailDto | null>(null)
  const loadingCurrent = ref(false)

  const creating = ref(false)
  const starting = ref(false)
  const integrating = ref(false)
  const lastIntegracion = ref<IntegrarStockTransferResultDto | null>(null)

  async function fetchGrupos() {
    loading.value = true
    error.value = null
    try {
      const result = await grupoApi.getGrupos(page.value, pageSize.value)
      items.value = result.data
      totalCount.value = result.totalCount
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'Error al cargar grupos'
    } finally {
      loading.value = false
    }
  }

  function setPage(newPage: number) {
    page.value = newPage
    fetchGrupos()
  }

  async function fetchGrupo(id: string) {
    loadingCurrent.value = true
    error.value = null
    current.value = null
    try {
      current.value = await grupoApi.getGrupo(id)
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'Error al cargar el grupo'
      throw e
    } finally {
      loadingCurrent.value = false
    }
  }

  async function crearGrupo(request: CrearGrupoRequest) {
    creating.value = true
    error.value = null
    try {
      return await grupoApi.crearGrupo(request)
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'Error al crear el grupo'
      throw e
    } finally {
      creating.value = false
    }
  }

  async function startPickingSession(grupoId: string) {
    starting.value = true
    error.value = null
    try {
      return await grupoApi.startPickingSession(grupoId)
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'No se pudo iniciar el picking'
      throw e
    } finally {
      starting.value = false
    }
  }

  async function integrarStockTransfer(grupoId: string) {
    integrating.value = true
    error.value = null
    try {
      lastIntegracion.value = await grupoApi.integrarStockTransfer(grupoId)
      await fetchGrupo(grupoId)
      return lastIntegracion.value
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'No se pudo integrar a SAP'
      throw e
    } finally {
      integrating.value = false
    }
  }

  return {
    items, totalCount, page, pageSize, loading, error,
    current, loadingCurrent,
    creating, starting, integrating, lastIntegracion,
    fetchGrupos, setPage, fetchGrupo, crearGrupo, startPickingSession, integrarStockTransfer,
  }
})
