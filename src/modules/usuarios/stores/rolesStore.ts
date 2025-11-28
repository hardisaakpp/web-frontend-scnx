import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Rol, CreateRolDto, UpdateRolDto, Permiso, AsignarPermisoDto } from '../types'
import { rolesService, permisosService } from '../services/usuariosApi'

export const useRolesStore = defineStore('roles', () => {
  // State
  const roles = ref<Rol[]>([])
  const selectedRol = ref<Rol | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const rolesOrdenados = computed(() => 
    [...roles.value].sort((a, b) => a.name.localeCompare(b.name))
  )

  const rolesConPermisos = computed(() => 
    roles.value.filter(r => r.permissions && r.permissions.length > 0)
  )

  // Actions
  async function fetchRoles() {
    loading.value = true
    error.value = null
    try {
      roles.value = await rolesService.getRoles()
    } catch (e: any) {
      error.value = e.message || 'Error al cargar roles'
      console.error('Error fetching roles:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchRol(id: string) {
    loading.value = true
    error.value = null
    try {
      selectedRol.value = await rolesService.getRol(id)
      return selectedRol.value
    } catch (e: any) {
      error.value = e.message || 'Error al cargar rol'
      console.error('Error fetching rol:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchRolByName(name: string) {
    loading.value = true
    error.value = null
    try {
      selectedRol.value = await rolesService.getRolByName(name)
      return selectedRol.value
    } catch (e: any) {
      error.value = e.message || 'Error al cargar rol'
      console.error('Error fetching rol by name:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createRol(data: CreateRolDto) {
    loading.value = true
    error.value = null
    try {
      const newRol = await rolesService.createRol(data)
      roles.value.push(newRol)
      return newRol
    } catch (e: any) {
      error.value = e.message || 'Error al crear rol'
      console.error('Error creating rol:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateRol(id: string, data: UpdateRolDto) {
    loading.value = true
    error.value = null
    try {
      const updated = await rolesService.updateRol(id, data)
      const index = roles.value.findIndex(r => r.id === id)
      if (index !== -1) {
        roles.value[index] = updated
      }
      if (selectedRol.value?.id === id) {
        selectedRol.value = updated
      }
      return updated
    } catch (e: any) {
      error.value = e.message || 'Error al actualizar rol'
      console.error('Error updating rol:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteRol(id: string) {
    loading.value = true
    error.value = null
    try {
      await rolesService.deleteRol(id)
      roles.value = roles.value.filter(r => r.id !== id)
      if (selectedRol.value?.id === id) {
        selectedRol.value = null
      }
    } catch (e: any) {
      error.value = e.message || 'Error al eliminar rol'
      console.error('Error deleting rol:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchPermisosRol(roleName: string) {
    loading.value = true
    error.value = null
    try {
      const permisos = await rolesService.getPermisosRol(roleName)
      // Actualizar rol con permisos
      const rol = roles.value.find(r => r.name === roleName)
      if (rol) {
        rol.permissions = permisos
      }
      if (selectedRol.value?.name === roleName) {
        selectedRol.value.permissions = permisos
      }
      return permisos
    } catch (e: any) {
      error.value = e.message || 'Error al cargar permisos del rol'
      console.error('Error fetching permisos rol:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function asignarPermiso(roleName: string, permissionId: number) {
    loading.value = true
    error.value = null
    try {
      await permisosService.asignarPermiso({ roleName, permissionId })
      // Recargar permisos del rol
      await fetchPermisosRol(roleName)
    } catch (e: any) {
      error.value = e.message || 'Error al asignar permiso'
      console.error('Error asignando permiso:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function removerPermiso(roleName: string, permissionId: number) {
    loading.value = true
    error.value = null
    try {
      await permisosService.removerPermiso({ roleName, permissionId })
      // Actualizar localmente
      const rol = roles.value.find(r => r.name === roleName)
      if (rol) {
        rol.permissions = rol.permissions.filter(p => p.id !== permissionId)
      }
      if (selectedRol.value?.name === roleName) {
        selectedRol.value.permissions = selectedRol.value.permissions.filter(p => p.id !== permissionId)
      }
    } catch (e: any) {
      error.value = e.message || 'Error al remover permiso'
      console.error('Error removiendo permiso:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  function clearSelected() {
    selectedRol.value = null
  }

  return {
    // State
    roles,
    selectedRol,
    loading,
    error,
    // Getters
    rolesOrdenados,
    rolesConPermisos,
    // Actions
    fetchRoles,
    fetchRol,
    fetchRolByName,
    createRol,
    updateRol,
    deleteRol,
    fetchPermisosRol,
    asignarPermiso,
    removerPermiso,
    clearError,
    clearSelected
  }
})
