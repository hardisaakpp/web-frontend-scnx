import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Rol, CreateRolDto, UpdateRolDto, Permiso, AsignarPermisoDto } from '../types'
import { rolesService, permisosService } from '../services/usuariosApi'
import { usePermisosStore } from './permisosStore'
import { mensajeDeError } from '../utils/roles'

export const useRolesStore = defineStore('roles', () => {
  // State
  const roles = ref<Rol[]>([])
  const selectedRol = ref<Rol | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const permisosStore = usePermisosStore()

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
      // El Core devuelve el rol sin permisos: se normaliza para que el resto de la app pueda leer `permissions` siempre.
      const creado = await rolesService.createRol(data)
      const newRol: Rol = { ...creado, permissions: creado.permissions ?? [] }
      roles.value.push(newRol)
      return newRol
    } catch (e: any) {
      error.value = mensajeDeError(e, 'Error al crear rol')
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
        // Se conservan los permisos ya cargados: la respuesta de actualizar no los incluye.
        roles.value[index] = { ...roles.value[index], ...updated, permissions: roles.value[index].permissions }
      }
      if (selectedRol.value?.id === id) {
        selectedRol.value = updated
      }
      return updated
    } catch (e: any) {
      error.value = mensajeDeError(e, 'Error al actualizar rol')
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
      error.value = mensajeDeError(e, 'Error al eliminar rol')
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
        rol.permissionsCount = permisos.length
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
      error.value = mensajeDeError(e, 'Error al asignar permiso')
      console.error('Error asignando permiso:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Asigna varios permisos a un rol y recarga sus permisos una sola vez. No se detiene ante un fallo: devuelve
   * cuántos se asignaron y cuáles no, para que la pantalla informe con precisión.
   */
  async function asignarPermisos(roleName: string, permissionIds: number[]) {
    loading.value = true
    error.value = null
    const fallidos: { id: number; motivo: string }[] = []
    try {
      for (const id of permissionIds) {
        try {
          await permisosService.asignarPermiso({ roleName, permissionId: id })
        } catch (e) {
          fallidos.push({ id, motivo: mensajeDeError(e, 'No se pudo asignar') })
        }
      }
      await fetchPermisosRol(roleName)
      return { asignados: permissionIds.length - fallidos.length, fallidos }
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
        rol.permissionsCount = rol.permissions.length
      }
      if (selectedRol.value?.name === roleName) {
        selectedRol.value.permissions = selectedRol.value.permissions.filter(p => p.id !== permissionId)
      }
    } catch (e: any) {
      error.value = mensajeDeError(e, 'Error al remover permiso')
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
    asignarPermisos,
    removerPermiso,
    clearError,
    clearSelected
  }
})
