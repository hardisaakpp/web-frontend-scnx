<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-4">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Usuarios</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Vista de usuarios para gestión básica.</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div class="text-sm text-gray-600 dark:text-gray-300">
            Total: <span class="font-semibold text-gray-900 dark:text-white">{{ totalCount }}</span>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              class="rounded bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-50 flex items-center gap-2 justify-center"
              :disabled="syncLoading"
              @click="syncLdap"
            >
              <svg v-if="syncLoading" class="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{{ syncLoading ? 'Sincronizando...' : 'Sincronizar AD' }}</span>
            </button>
            <input
              v-model.trim="searchQuery"
              type="text"
              placeholder="Buscar por usuario, nombre o email"
              class="w-full sm:w-64 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
            />
            <select
              v-model.number="pageSize"
              class="w-full sm:w-32 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
          </div>
        </div>
        <div v-if="syncSuccess" class="mb-4 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded">{{ syncSuccess }}</div>
        <div v-if="syncError" class="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded">{{ syncError }}</div>
        
        <!-- Búsqueda e importación de usuario específico -->
        <div class="mb-4 p-4 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Buscar e importar usuario específico de AD</div>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              v-model.trim="searchUserTerm"
              type="text"
              placeholder="Buscar por usuario, email o nombre"
              class="w-full sm:flex-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
              @keyup.enter="searchAndImportUser"
            />
            <button
              type="button"
              class="rounded bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-50 flex items-center gap-2 justify-center"
              :disabled="searchUserLoading"
              @click="searchAndImportUser"
            >
              <svg v-if="searchUserLoading" class="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{{ searchUserLoading ? 'Buscando...' : 'Importar' }}</span>
            </button>
          </div>
          <div v-if="searchUserError" class="mt-2 text-sm text-red-600 dark:text-red-400">{{ searchUserError }}</div>
          <div v-if="searchUserSuccess" class="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{{ searchUserSuccess }}</div>
        </div>
        <div v-if="loading" class="text-sm text-gray-600 dark:text-gray-300">Cargando usuarios...</div>
        <div v-else-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</div>
        <div v-else-if="users.length === 0" class="text-sm text-gray-600 dark:text-gray-300">Sin usuarios.</div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">ID</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Usuario</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Email</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="user in pagedUsers" :key="getValue(user, ['id', 'userId'])">
                <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ getValue(user, ['id', 'userId']) }}</td>
                <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ getValue(user, ['userName', 'username']) }}</td>
                <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ getValue(user, ['fullName', 'name']) }}</td>
                <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ getValue(user, ['email', 'mail']) }}</td>
                <td class="px-4 py-2 text-sm">
                  <button
                    type="button"
                    class="rounded border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs text-blue-700 dark:text-blue-300 hover:border-blue-300 dark:hover:border-blue-700"
                    @click="openRoles(user)"
                  >
                    Ver roles
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="filteredUsers.length > 0" class="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div class="text-xs text-gray-500 dark:text-gray-400">
            Mostrando {{ pageStart }} - {{ pageEnd }} de {{ filteredUsers.length }}
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs text-gray-700 dark:text-gray-300 disabled:opacity-50"
              :disabled="page === 1"
              @click="page--"
            >
              Anterior
            </button>
            <div class="text-xs text-gray-600 dark:text-gray-300">{{ page }} / {{ totalPages }}</div>
            <button
              type="button"
              class="rounded border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs text-gray-700 dark:text-gray-300 disabled:opacity-50"
              :disabled="page === totalPages"
              @click="page++"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="rolesOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Roles del usuario</h2>
          <button
            type="button"
            class="text-gray-500 dark:text-gray-400 hover:text-gray-700"
            @click="closeRoles"
          >
            Cerrar
          </button>
        </div>
        <div class="mt-4 space-y-4">
          <div class="rounded border border-gray-200 dark:border-gray-700 p-3">
            <div class="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Asignar rol</div>
            <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                v-model.trim="roleToAssign"
                type="text"
                placeholder="Nombre del rol"
                class="w-full sm:flex-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
              />
              <button
                type="button"
                class="rounded border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300 hover:border-emerald-300 dark:hover:border-emerald-700 disabled:opacity-50"
                :disabled="assignLoading || !roleToAssign"
                @click="assignRole"
              >
                Asignar
              </button>
            </div>
            <div v-if="assignError" class="mt-2 text-xs text-red-600 dark:text-red-400">{{ assignError }}</div>
            <div v-else-if="assignSuccess" class="mt-2 text-xs text-emerald-600 dark:text-emerald-400">{{ assignSuccess }}</div>
          </div>
          <div v-if="rolesLoading" class="text-sm text-gray-600 dark:text-gray-300">Cargando roles...</div>
          <div v-else-if="rolesError" class="text-sm text-red-600 dark:text-red-400">{{ rolesError }}</div>
          <ul v-else class="space-y-2">
            <li v-if="roles.length === 0" class="text-sm text-gray-600 dark:text-gray-300">Sin roles asignados.</li>
            <li
              v-for="role in roles"
              :key="role"
              class="flex items-center justify-between gap-2 text-sm text-gray-800 dark:text-gray-200"
            >
              <span>{{ role }}</span>
              <button
                type="button"
                class="rounded border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 text-xs text-rose-700 dark:text-rose-300 hover:border-rose-300 dark:hover:border-rose-700 disabled:opacity-50"
                :disabled="removeLoading"
                @click="removeRole(role)"
              >
                Quitar
              </button>
            </li>
          </ul>
          <div v-if="removeError" class="text-xs text-red-600 dark:text-red-400">{{ removeError }}</div>
          <div v-else-if="removeSuccess" class="text-xs text-emerald-600 dark:text-emerald-400">{{ removeSuccess }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import api from '@/services/api'

type UserRecord = Record<string, unknown>

const users = ref<UserRecord[]>([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const page = ref(1)
const pageSize = ref(10)
const rolesOpen = ref(false)
const rolesLoading = ref(false)
const rolesError = ref('')
const roles = ref<string[]>([])
const roleToAssign = ref('')
const assignLoading = ref(false)
const assignError = ref('')
const assignSuccess = ref('')
const removeLoading = ref(false)
const removeError = ref('')
const removeSuccess = ref('')
const selectedUserId = ref('')
const syncLoading = ref(false)
const syncError = ref('')
const syncSuccess = ref('')
const searchUserTerm = ref('')
const searchUserLoading = ref(false)
const searchUserError = ref('')
const searchUserSuccess = ref('')

const getValue = (user: UserRecord, keys: string[]) => {
  for (const key of keys) {
    if (user[key] !== undefined && user[key] !== null && user[key] !== '') {
      return String(user[key])
    }
  }
  return '-'
}

const totalCount = computed(() => users.value.length)

const filteredUsers = computed(() => {
  const query = searchQuery.value.toLowerCase()
  if (!query) {
    return users.value
  }
  return users.value.filter(user => {
    const values = [
      getValue(user, ['userName', 'username']),
      getValue(user, ['fullName', 'name']),
      getValue(user, ['email', 'mail'])
    ]
    return values.some(value => value.toLowerCase().includes(query))
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / pageSize.value)))

const pagedUsers = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredUsers.value.slice(start, start + pageSize.value)
})

const pageStart = computed(() => {
  if (filteredUsers.value.length === 0) {
    return 0
  }
  return (page.value - 1) * pageSize.value + 1
})

const pageEnd = computed(() => {
  const end = page.value * pageSize.value
  return Math.min(end, filteredUsers.value.length)
})

const loadUsers = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/Users')
    const payload = response.data as UserRecord[] | { data?: UserRecord[]; users?: UserRecord[] }
    if (Array.isArray(payload)) {
      users.value = payload
    } else if (Array.isArray(payload?.data)) {
      users.value = payload.data
    } else if (Array.isArray(payload?.users)) {
      users.value = payload.users
    } else {
      users.value = []
    }
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    error.value = message || 'No se pudo cargar la lista de usuarios.'
  } finally {
    loading.value = false
  }
}

const normalizeRole = (role: unknown) => {
  if (role === null || role === undefined) {
    return ''
  }
  if (typeof role === 'string' || typeof role === 'number') {
    return String(role)
  }
  if (typeof role === 'object') {
    const record = role as Record<string, unknown>
    const candidates = [record.name, record.roleName, record.title, record.code]
    const found = candidates.find(value => value !== undefined && value !== null && value !== '')
    return found ? String(found) : ''
  }
  return ''
}

const openRoles = async (user: UserRecord) => {
  const id = getValue(user, ['id', 'userId'])
  if (id === '-') {
    rolesError.value = 'No se encontro el identificador del usuario.'
    roles.value = []
    rolesOpen.value = true
    return
  }

  selectedUserId.value = id
  rolesOpen.value = true
  rolesLoading.value = true
  rolesError.value = ''
  roles.value = []
  roleToAssign.value = ''
  assignError.value = ''
  assignSuccess.value = ''
  removeError.value = ''
  removeSuccess.value = ''
  try {
    const response = await api.get(`/Users/${id}/roles`)
    const payload = response.data as unknown[] | { data?: unknown[]; roles?: unknown[] }
    if (Array.isArray(payload)) {
      roles.value = payload.map(normalizeRole).filter(Boolean)
    } else if (Array.isArray(payload?.data)) {
      roles.value = payload.data.map(normalizeRole).filter(Boolean)
    } else if (Array.isArray(payload?.roles)) {
      roles.value = payload.roles.map(normalizeRole).filter(Boolean)
    }
  } catch (err: unknown) {
    const axiosError = err as { response?: { status?: number; data?: { message?: string } } }
    const status = axiosError?.response?.status
    const message = axiosError?.response?.data?.message
    
    console.error('Error al cargar roles:', {
      status,
      message,
      userId: id,
      endpoint: `/Users/${id}/roles`
    })
    
    if (status === 403) {
      rolesError.value = 'No tienes permisos para ver roles de usuarios. Se requiere el rol "Admin".'
    } else if (status === 401) {
      rolesError.value = 'No estás autenticado. Por favor, inicia sesión nuevamente.'
    } else if (status === 404) {
      rolesError.value = 'Usuario no encontrado.'
    } else {
      rolesError.value = message || `No se pudo cargar los roles del usuario (código ${status || 'desconocido'})`
    }
  } finally {
    rolesLoading.value = false
  }
}

const assignRole = async () => {
  if (!selectedUserId.value) {
    assignError.value = 'Selecciona un usuario valido.'
    return
  }
  if (!roleToAssign.value) {
    assignError.value = 'Ingresa el nombre del rol.'
    return
  }

  assignLoading.value = true
  assignError.value = ''
  assignSuccess.value = ''
  try {
    await api.post(`/Users/${selectedUserId.value}/roles`, {
      role: roleToAssign.value
    })
    assignSuccess.value = 'Rol asignado correctamente.'
    roleToAssign.value = ''
    await openRoles({ id: selectedUserId.value })
  } catch (err: unknown) {
    const axiosError = err as { response?: { status?: number; data?: { message?: string; errors?: unknown[] } } }
    const status = axiosError?.response?.status
    const message = axiosError?.response?.data?.message
    const errors = axiosError?.response?.data?.errors
    
    console.error('Error al asignar rol:', {
      status,
      message,
      errors,
      userId: selectedUserId.value,
      role: roleToAssign.value,
      endpoint: `/Users/${selectedUserId.value}/roles`
    })
    
    if (status === 403) {
      assignError.value = 'No tienes permisos para asignar roles. Se requiere el rol "Admin".'
    } else if (status === 401) {
      assignError.value = 'No estás autenticado. Por favor, inicia sesión nuevamente.'
    } else if (status === 400) {
      if (errors && Array.isArray(errors)) {
        assignError.value = `Error: ${errors.map((e: any) => e.description || e).join(', ')}`
      } else {
        assignError.value = message || 'Datos inválidos. Verifica que el rol existe.'
      }
    } else if (status === 404) {
      assignError.value = 'Usuario no encontrado.'
    } else {
      assignError.value = message || `Error al asignar el rol (código ${status || 'desconocido'})`
    }
  } finally {
    assignLoading.value = false
  }
}

const removeRole = async (role: string) => {
  if (!selectedUserId.value) {
    removeError.value = 'Selecciona un usuario valido.'
    return
  }
  if (!role) {
    removeError.value = 'Selecciona un rol valido.'
    return
  }

  removeLoading.value = true
  removeError.value = ''
  removeSuccess.value = ''
  try {
    await api.delete(`/Users/${selectedUserId.value}/roles/${encodeURIComponent(role)}`)
    removeSuccess.value = 'Rol eliminado correctamente.'
    await openRoles({ id: selectedUserId.value })
  } catch (err: unknown) {
    const axiosError = err as { response?: { status?: number; data?: { message?: string; errors?: unknown[] } } }
    const status = axiosError?.response?.status
    const message = axiosError?.response?.data?.message
    const errors = axiosError?.response?.data?.errors
    
    console.error('Error al remover rol:', {
      status,
      message,
      errors,
      userId: selectedUserId.value,
      role,
      endpoint: `/Users/${selectedUserId.value}/roles/${encodeURIComponent(role)}`
    })
    
    if (status === 403) {
      removeError.value = 'No tienes permisos para quitar roles. Se requiere el rol "Admin".'
    } else if (status === 401) {
      removeError.value = 'No estás autenticado. Por favor, inicia sesión nuevamente.'
    } else if (status === 400) {
      if (errors && Array.isArray(errors)) {
        removeError.value = `Error: ${errors.map((e: any) => e.description || e).join(', ')}`
      } else {
        removeError.value = message || 'Datos inválidos. Verifica que el rol existe y está asignado al usuario.'
      }
    } else if (status === 404) {
      removeError.value = 'Usuario o rol no encontrado.'
    } else {
      removeError.value = message || `Error al quitar el rol (código ${status || 'desconocido'})`
    }
  } finally {
    removeLoading.value = false
  }
}

const closeRoles = () => {
  rolesOpen.value = false
  assignError.value = ''
  assignSuccess.value = ''
  roleToAssign.value = ''
  removeError.value = ''
  removeSuccess.value = ''
}

const syncLdap = async () => {
  syncLoading.value = true
  syncError.value = ''
  syncSuccess.value = ''
  try {
    await api.post('/Admin/sync-ldap')
    syncSuccess.value = 'Sincronización completada. Los usuarios de AD han sido sincronizados.'
    await loadUsers()
  } catch (err: unknown) {
    const axiosError = err as { response?: { status?: number; data?: { message?: string } } }
    const message = axiosError?.response?.data?.message
    syncError.value = message || 'No se pudo sincronizar los usuarios de AD.'
  } finally {
    syncLoading.value = false
  }
}

const searchAndImportUser = async () => {
  if (!searchUserTerm.value.trim()) {
    searchUserError.value = 'Ingresa un nombre de usuario para buscar'
    return
  }

  searchUserLoading.value = true
  searchUserError.value = ''
  searchUserSuccess.value = ''
  try {
    const response = await api.post('/Admin/search-and-import-user', {
      searchTerm: searchUserTerm.value.trim()
    })
    const payload = response.data as { message?: unknown } | null | undefined
    searchUserSuccess.value =
      typeof payload?.message === 'string' && payload.message.trim()
        ? payload.message
        : 'Usuario importado correctamente.'
    searchUserTerm.value = ''
    await loadUsers()
  } catch (err: unknown) {
    const axiosError = err as { response?: { status?: number; data?: { message?: string } } }
    const message = axiosError?.response?.data?.message
    searchUserError.value = message || 'No se pudo importar el usuario.'
  } finally {
    searchUserLoading.value = false
  }
}

watch([searchQuery, pageSize], () => {
  page.value = 1
})

watch(filteredUsers, () => {
  if (page.value > totalPages.value) {
    page.value = totalPages.value
  }
})

onMounted(loadUsers)
</script>
