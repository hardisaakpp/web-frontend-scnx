import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Permiso, CreatePermisoDto, UpdatePermisoDto } from '../types'
import { permisosService } from '../services/usuariosApi'
import { mensajeDeError } from '../utils/roles'

export const usePermisosStore = defineStore('permisos', () => {
  // State
  const permisos = ref<Permiso[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const permisosPorModulo = computed(() => {
    const map: Record<string, Permiso[]> = {}
    permisos.value.forEach(permiso => {
      if (!map[permiso.module]) {
        map[permiso.module] = []
      }
      map[permiso.module].push(permiso)
    })
    return map
  })

  const modulos = computed(() => 
    Array.from(new Set(permisos.value.map(p => p.module))).sort()
  )

  const permisosOrdenados = computed(() => 
    [...permisos.value].sort((a, b) => {
      if (a.module !== b.module) {
        return a.module.localeCompare(b.module)
      }
      return a.key.localeCompare(b.key)
    })
  )

  // Actions
  async function fetchPermisos() {
    loading.value = true
    error.value = null
    try {
      permisos.value = await permisosService.getPermisos()
    } catch (e: any) {
      error.value = mensajeDeError(e, 'Error al cargar permisos')
      console.error('Error fetching permisos:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchPermiso(id: number) {
    loading.value = true
    error.value = null
    try {
      const permiso = await permisosService.getPermiso(id)
      return permiso
    } catch (e: any) {
      error.value = mensajeDeError(e, 'Error al cargar permiso')
      console.error('Error fetching permiso:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchPermisosPorModulo(module: string) {
    loading.value = true
    error.value = null
    try {
      const permisosModulo = await permisosService.getPermisosPorModulo(module)
      return permisosModulo
    } catch (e: any) {
      error.value = mensajeDeError(e, 'Error al cargar permisos del módulo')
      console.error('Error fetching permisos por modulo:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createPermiso(data: CreatePermisoDto) {
    loading.value = true
    error.value = null
    try {
      const newPermiso = await permisosService.createPermiso(data)
      permisos.value.push(newPermiso)
      return newPermiso
    } catch (e: any) {
      error.value = mensajeDeError(e, 'Error al crear permiso')
      console.error('Error creating permiso:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updatePermiso(id: number, data: UpdatePermisoDto) {
    loading.value = true
    error.value = null
    try {
      const updated = await permisosService.updatePermiso(id, data)
      const index = permisos.value.findIndex(p => p.id === id)
      if (index !== -1) {
        permisos.value[index] = updated
      }
      return updated
    } catch (e: any) {
      error.value = mensajeDeError(e, 'Error al actualizar permiso')
      console.error('Error updating permiso:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deletePermiso(id: number) {
    loading.value = true
    error.value = null
    try {
      await permisosService.deletePermiso(id)
      permisos.value = permisos.value.filter(p => p.id !== id)
    } catch (e: any) {
      error.value = mensajeDeError(e, 'Error al eliminar permiso')
      console.error('Error deleting permiso:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    permisos,
    loading,
    error,
    // Getters
    permisosPorModulo,
    modulos,
    permisosOrdenados,
    // Actions
    fetchPermisos,
    fetchPermiso,
    fetchPermisosPorModulo,
    createPermiso,
    updatePermiso,
    deletePermiso,
    clearError
  }
})
