import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Usuario, CreateUsuarioDto, UpdateUsuarioDto, UsuarioFiltros, AsignarRolDto } from '../types'
import { usuariosService } from '../services/usuariosApi'

export const useUsuariosStore = defineStore('usuarios', () => {
  // State
  const usuarios = ref<Usuario[]>([])
  const selectedUsuario = ref<Usuario | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)

  // Getters
  const usuariosActivos = computed(() => 
    usuarios.value.filter(u => u.isActive)
  )

  const usuariosPorRol = computed(() => {
    const map: Record<string, Usuario[]> = {}
    usuarios.value.forEach(user => {
      user.roles.forEach(role => {
        if (!map[role]) map[role] = []
        map[role].push(user)
      })
    })
    return map
  })

  const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

  // Actions
  async function fetchUsuarios(filtros?: UsuarioFiltros) {
    loading.value = true
    error.value = null
    try {
      const response = await usuariosService.getUsuarios({
        ...filtros,
        page: currentPage.value,
        pageSize: pageSize.value
      })
      usuarios.value = response.data
      total.value = response.total
    } catch (e: any) {
      error.value = e.message || 'Error al cargar usuarios'
      console.error('Error fetching usuarios:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchUsuario(id: string) {
    loading.value = true
    error.value = null
    try {
      selectedUsuario.value = await usuariosService.getUsuario(id)
      return selectedUsuario.value
    } catch (e: any) {
      error.value = e.message || 'Error al cargar usuario'
      console.error('Error fetching usuario:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createUsuario(data: CreateUsuarioDto) {
    loading.value = true
    error.value = null
    try {
      const newUsuario = await usuariosService.createUsuario(data)
      usuarios.value.unshift(newUsuario)
      total.value++
      return newUsuario
    } catch (e: any) {
      error.value = e.message || 'Error al crear usuario'
      console.error('Error creating usuario:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateUsuario(id: string, data: UpdateUsuarioDto) {
    loading.value = true
    error.value = null
    try {
      const updated = await usuariosService.updateUsuario(id, data)
      const index = usuarios.value.findIndex(u => u.id === id)
      if (index !== -1) {
        usuarios.value[index] = updated
      }
      if (selectedUsuario.value?.id === id) {
        selectedUsuario.value = updated
      }
      return updated
    } catch (e: any) {
      error.value = e.message || 'Error al actualizar usuario'
      console.error('Error updating usuario:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteUsuario(id: string) {
    loading.value = true
    error.value = null
    try {
      await usuariosService.deleteUsuario(id)
      usuarios.value = usuarios.value.filter(u => u.id !== id)
      total.value--
      if (selectedUsuario.value?.id === id) {
        selectedUsuario.value = null
      }
    } catch (e: any) {
      error.value = e.message || 'Error al eliminar usuario'
      console.error('Error deleting usuario:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function asignarRol(userId: string, roleName: string) {
    loading.value = true
    error.value = null
    try {
      await usuariosService.asignarRol(userId, { role: roleName })
      // Actualizar usuario local
      const usuario = usuarios.value.find(u => u.id === userId)
      if (usuario && !usuario.roles.includes(roleName)) {
        usuario.roles.push(roleName)
      }
      if (selectedUsuario.value?.id === userId && !selectedUsuario.value.roles.includes(roleName)) {
        selectedUsuario.value.roles.push(roleName)
      }
    } catch (e: any) {
      error.value = e.message || 'Error al asignar rol'
      console.error('Error asignando rol:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function removerRol(userId: string, roleName: string) {
    loading.value = true
    error.value = null
    try {
      await usuariosService.removerRol(userId, roleName)
      // Actualizar usuario local
      const usuario = usuarios.value.find(u => u.id === userId)
      if (usuario) {
        usuario.roles = usuario.roles.filter(r => r !== roleName)
      }
      if (selectedUsuario.value?.id === userId) {
        selectedUsuario.value.roles = selectedUsuario.value.roles.filter(r => r !== roleName)
      }
    } catch (e: any) {
      error.value = e.message || 'Error al remover rol'
      console.error('Error removiendo rol:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  function setPage(page: number) {
    currentPage.value = page
  }

  function clearError() {
    error.value = null
  }

  function clearSelected() {
    selectedUsuario.value = null
  }

  return {
    // State
    usuarios,
    selectedUsuario,
    loading,
    error,
    total,
    currentPage,
    pageSize,
    // Getters
    usuariosActivos,
    usuariosPorRol,
    totalPages,
    // Actions
    fetchUsuarios,
    fetchUsuario,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    asignarRol,
    removerRol,
    setPage,
    clearError,
    clearSelected
  }
})
