import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Conciliacion, ConciliacionCreateData, ConciliacionState, ModuleInfo, PermisosResponse, HealthResponse } from '../types'
import { conciliacionService } from '../services/conciliacionApi'

export const useConciliacionStore = defineStore('conciliacion', () => {
  // State
  const conciliaciones = ref<Conciliacion[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const moduleInfo = ref<ModuleInfo | null>(null)
  const permisos = ref<string[]>([])
  const isAdmin = ref(false)

  // Getters
  const conciliacionesBancarias = computed(() => 
    conciliaciones.value.filter(c => c.tipo === 'bancaria')
  )

  const conciliacionesContables = computed(() => 
    conciliaciones.value.filter(c => c.tipo === 'contable')
  )

  const hasData = computed(() => conciliaciones.value.length > 0)

  // Actions
  async function fetchConciliaciones() {
    loading.value = true
    error.value = null
    try {
      conciliaciones.value = await conciliacionService.getConciliaciones()
    } catch (e: any) {
      error.value = e.message || 'Error al cargar conciliaciones'
      console.error('Error fetching conciliaciones:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchConciliacion(id: string) {
    loading.value = true
    error.value = null
    try {
      const conciliacion = await conciliacionService.getConciliacion(id)
      const index = conciliaciones.value.findIndex(c => c.id === id)
      if (index !== -1) {
        conciliaciones.value[index] = conciliacion
      } else {
        conciliaciones.value.push(conciliacion)
      }
      return conciliacion
    } catch (e: any) {
      error.value = e.message || 'Error al cargar conciliación'
      console.error('Error fetching conciliacion:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createConciliacion(data: ConciliacionCreateData) {
    loading.value = true
    error.value = null
    try {
      const newConciliacion = await conciliacionService.createConciliacion(data)
      conciliaciones.value.unshift(newConciliacion)
      return newConciliacion
    } catch (e: any) {
      error.value = e.message || 'Error al crear conciliación'
      console.error('Error creating conciliacion:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateConciliacion(id: string, data: Partial<Conciliacion>) {
    loading.value = true
    error.value = null
    try {
      const updated = await conciliacionService.updateConciliacion(id, data)
      const index = conciliaciones.value.findIndex(c => c.id === id)
      if (index !== -1) {
        conciliaciones.value[index] = updated
      }
      return updated
    } catch (e: any) {
      error.value = e.message || 'Error al actualizar conciliación'
      console.error('Error updating conciliacion:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteConciliacion(id: string) {
    loading.value = true
    error.value = null
    try {
      await conciliacionService.deleteConciliacion(id)
      conciliaciones.value = conciliaciones.value.filter(c => c.id !== id)
    } catch (e: any) {
      error.value = e.message || 'Error al eliminar conciliación'
      console.error('Error deleting conciliacion:', e)
      throw e
    } finally {
      loading.value = false
    }
  }


  // Información del módulo y permisos
  async function fetchModuleInfo() {
    try {
      moduleInfo.value = await conciliacionService.getInfo()
    } catch (e: any) {
      console.error('Error fetching module info:', e)
    }
  }

  async function fetchPermisos() {
    try {
      const response = await conciliacionService.getPermisos()
      permisos.value = response.permisos || []
      isAdmin.value = response.is_admin || false
    } catch (e: any) {
      console.error('Error fetching permisos:', e)
      permisos.value = []
      isAdmin.value = false
    }
  }

  async function checkHealth(): Promise<HealthResponse> {
    try {
      return await conciliacionService.getHealth()
    } catch (e: any) {
      console.error('Error checking health:', e)
      throw e
    }
  }

  // Upload de documentos
  async function uploadDocumento(file: File) {
    loading.value = true
    error.value = null
    try {
      const result = await conciliacionService.uploadDocumento(file)
      return result
    } catch (e: any) {
      error.value = e.message || 'Error al subir documento'
      console.error('Error uploading documento:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // Verificar permisos
  function hasPermission(permission: string): boolean {
    if (isAdmin.value) return true
    return permisos.value.includes(permission)
  }

  function hasAnyPermission(permissions: string[]): boolean {
    if (isAdmin.value) return true
    return permissions.some(p => permisos.value.includes(p))
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    conciliaciones,
    loading,
    error,
    moduleInfo,
    permisos,
    isAdmin,
    // Getters
    conciliacionesBancarias,
    conciliacionesContables,
    hasData,
    // Actions
    fetchConciliaciones,
    fetchConciliacion,
    createConciliacion,
    updateConciliacion,
    deleteConciliacion,
    uploadDocumento,
    fetchModuleInfo,
    fetchPermisos,
    checkHealth,
    hasPermission,
    hasAnyPermission,
    clearError
  }
})

