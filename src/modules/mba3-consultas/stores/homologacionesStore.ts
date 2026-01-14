import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { SkuHomologacion, SkuHomologacionUpdateRequest, SkuHomologacionCreateRequest } from '../types'

export const useHomologacionesStore = defineStore('mba3Homologaciones', () => {
  // Estado
  const loading = ref(false)
  const error = ref<string | null>(null)
  const homologaciones = ref<SkuHomologacion[]>([])
  const currentPage = ref(1)
  const pageSize = ref(20)
  const total = ref(0)
  const totalPages = ref(0)

  // Filtros
  const estadoFilter = ref<string>('')
  const tieneDiferenciasFilter = ref<boolean | null>(null)
  const tieneDatosSapFilter = ref<boolean | null>(null)
  const skuSearchFilter = ref<string>('')

  // Estadísticas
  const estadisticas = ref({
    total_pendientes: 0,
    total_homologados: 0,
    total_errores: 0,
  })

  // Computed - Los datos ya vienen filtrados del servidor, pero mantenemos esto para referencia local
  const filteredHomologaciones = computed(() => {
    // Los filtros se aplican en el servidor, pero podemos hacer filtrado adicional local si es necesario
    return homologaciones.value
  })

  // Acciones
  async function fetchHomologaciones(page: number = 1) {
    loading.value = true
    error.value = null
    currentPage.value = page

    try {
      const filters: any = {}
      if (estadoFilter.value) filters.estado = estadoFilter.value
      if (tieneDiferenciasFilter.value !== null) filters.tiene_diferencias = tieneDiferenciasFilter.value
      if (tieneDatosSapFilter.value !== null) filters.tiene_datos_sap = tieneDatosSapFilter.value
      if (skuSearchFilter.value) filters.sku = skuSearchFilter.value

      const response = await mba3ConsultasService.getSkuHomologaciones(
        page,
        pageSize.value,
        filters
      )

      homologaciones.value = response.data || []
      total.value = response.total || 0
      totalPages.value = response.totalPages || 0

      if (response.metadata) {
        estadisticas.value = {
          total_pendientes: response.metadata.total_pendientes || 0,
          total_homologados: response.metadata.total_homologados || 0,
          total_errores: response.metadata.total_errores || 0,
        }
      }

      return response
    } catch (err: any) {
      error.value = err.message || 'Error al cargar homologaciones'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateHomologacion(
    homologacionId: string,
    updateData: SkuHomologacionUpdateRequest
  ) {
    loading.value = true
    error.value = null

    try {
      const response = await mba3ConsultasService.updateSkuHomologacion(
        homologacionId,
        updateData
      )

      // Actualizar la homologación en el array local
      const index = homologaciones.value.findIndex(
        h => h.homologacion_id === homologacionId
      )
      if (index !== -1) {
        homologaciones.value[index] = { ...homologaciones.value[index], ...updateData }
      }

      return response
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar homologación'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function bulkUpdateHomologaciones(
    updates: Array<{ homologacion_id: string; data: SkuHomologacionUpdateRequest }>
  ) {
    loading.value = true
    error.value = null

    try {
      const response = await mba3ConsultasService.bulkUpdateSkuHomologaciones(updates)

      // Recargar las homologaciones después de la actualización masiva
      await fetchHomologaciones(currentPage.value)

      return response
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar homologaciones'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function sincronizarHomologaciones() {
    loading.value = true
    error.value = null

    try {
      const response = await mba3ConsultasService.sincronizarHomologaciones()
      
      // Recargar las homologaciones después de la sincronización
      await fetchHomologaciones(1)

      return response
    } catch (err: any) {
      error.value = err.message || 'Error al sincronizar homologaciones'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createHomologacion(
    createData: SkuHomologacionCreateRequest
  ) {
    loading.value = true
    error.value = null

    try {
      const response = await mba3ConsultasService.createSkuHomologacion(createData)
      
      // Recargar las homologaciones después de crear
      await fetchHomologaciones(1)

      return response
    } catch (err: any) {
      error.value = err.message || 'Error al crear homologación'
      throw err
    } finally {
      loading.value = false
    }
  }

  function setEstadoFilter(estado: string) {
    estadoFilter.value = estado
  }

  function setTieneDiferenciasFilter(value: boolean | null) {
    tieneDiferenciasFilter.value = value
  }

  function setTieneDatosSapFilter(value: boolean | null) {
    tieneDatosSapFilter.value = value
  }

  function setSkuSearchFilter(sku: string) {
    skuSearchFilter.value = sku
  }

  function clearFilters() {
    estadoFilter.value = ''
    tieneDiferenciasFilter.value = null
    tieneDatosSapFilter.value = null
    skuSearchFilter.value = ''
  }

  return {
    // Estado
    loading,
    error,
    homologaciones,
    currentPage,
    pageSize,
    total,
    totalPages,
    estadisticas,

    // Filtros
    estadoFilter,
    tieneDiferenciasFilter,
    tieneDatosSapFilter,
    skuSearchFilter,

    // Computed
    filteredHomologaciones,

    // Acciones
    fetchHomologaciones,
    updateHomologacion,
    bulkUpdateHomologaciones,
    sincronizarHomologaciones,
    createHomologacion,
    setEstadoFilter,
    setTieneDiferenciasFilter,
    setTieneDatosSapFilter,
    setSkuSearchFilter,
    clearFilters,
  }
})

