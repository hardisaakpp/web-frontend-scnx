<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <button
      type="button"
      class="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:underline"
      @click="volver"
    >
      <span aria-hidden="true">←</span> Volver
    </button>
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Asignacion de almacenes</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Vincular usuarios con almacenes autorizados</p>
      </div>

      <!-- Formulario de asignacion -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div class="w-full lg:w-1/3">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Usuario</label>
            <input
              v-model.trim="userSearch"
              type="text"
              placeholder="Buscar usuario"
              class="mb-2 w-full px-3 py-2 pr-9 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
            <select
              v-model="selectedUserId"
              class="w-full px-3 py-2 pr-9 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">Seleccionar usuario</option>
              <option v-for="user in filteredUsuarios" :key="getUserIdValue(user)" :value="getUserIdValue(user)">
                {{ getUserLabel(user) }}
              </option>
            </select>
          </div>
          <div class="w-full lg:w-1/3">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Cod. almacen</label>
            <input
              v-model.trim="selectedCodAlmacen"
              type="text"
              placeholder="Ej: BYL-NUO"
              class="w-full px-3 py-2 pr-9 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
          <div class="w-full lg:w-auto">
            <button
              type="button"
              class="w-full lg:w-auto rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-50"
              :disabled="assignLoading || !canAssign"
              @click="createAsignacion"
            >
              {{ assignLoading ? 'Asignando...' : 'Asignar' }}
            </button>
          </div>
        </div>
        <div v-if="assignError" class="mt-3 text-sm text-red-600 dark:text-red-400">{{ assignError }}</div>
        <div v-else-if="assignSuccess" class="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{{ assignSuccess }}</div>
      </div>

      <!-- Listado de asignaciones -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="flex flex-col gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
          <div class="text-sm text-gray-600 dark:text-gray-300">
            Total: <span class="font-semibold text-gray-900 dark:text-white">{{ filteredAsignaciones.length }}</span>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              v-model="filterUserId"
              class="w-full sm:w-64 px-3 py-2 pr-9 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">Todos los usuarios</option>
              <option v-for="user in filteredUsuarios" :key="getUserIdValue(user)" :value="getUserIdValue(user)">
                {{ getUserLabel(user) }}
              </option>
            </select>
            <button
              type="button"
              class="w-full sm:w-auto rounded border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs text-gray-700 dark:text-gray-300"
              :disabled="loading"
              @click="loadData"
            >
              Recargar
            </button>
          </div>
        </div>

        <div v-if="loading" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          Cargando asignaciones...
        </div>
        <div v-else-if="error" class="py-10 text-center text-sm text-red-600 dark:text-red-400">
          {{ error }}
        </div>
        <div v-else-if="filteredAsignaciones.length === 0" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          Sin asignaciones registradas.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Usuario</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Almacen</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="item in filteredAsignaciones" :key="item.Id">
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">
                  {{ getUserNameById(item.IdUsuario) }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">
                  {{ getAlmacenNameByCod(item.CodAlmacen) }}
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    type="button"
                    class="rounded border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-3 py-1 text-xs text-red-700 dark:text-red-300 hover:border-red-300"
                    :disabled="deleteLoadingId === item.Id"
                    @click="deleteAsignacion(item.Id)"
                  >
                    {{ deleteLoadingId === item.Id ? 'Eliminando...' : 'Eliminar' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from '@vue/runtime-core'
import axios from 'axios'
import api from '@/services/api'
import { useRouter } from 'vue-router'

type UserRecord = Record<string, unknown>
type AlmacenRecord = Record<string, unknown>

interface UsuarioAlmacenRecord {
  Id: number
  IdUsuario: string
  CodAlmacen: string
}

const usuarios = ref<UserRecord[]>([])
const almacenes = ref<AlmacenRecord[]>([])
const asignaciones = ref<UsuarioAlmacenRecord[]>([])
const loading = ref(false)
const error = ref('')
const assignLoading = ref(false)
const assignError = ref('')
const assignSuccess = ref('')
const deleteLoadingId = ref<number | null>(null)

const selectedUserId = ref('')
const selectedCodAlmacen = ref('')
const filterUserId = ref('')
const userSearch = ref('')
const router = useRouter()

const volver = () => {
  router.back()
}

const getUserIdValue = (user: UserRecord): string => {
  const id = user.IdUsuario ?? user.idUsuario ?? user.id ?? ''
  return String(id)
}

const getUserLabel = (user: UserRecord): string => {
  const userName = String(user.UsuarioNombre ?? user.userName ?? user.username ?? '').trim()
  const fullName = String(user.Nombre ?? user.fullName ?? user.name ?? '').trim()
  const email = String(user.Correo ?? user.email ?? user.mail ?? '').trim()
  const base = fullName || userName || email || 'Usuario'
  return email && base !== email ? `${base} (${email})` : base
}

const getAlmacenCod = (almacen: AlmacenRecord): string => {
  return String(almacen.CodAlmacen ?? almacen.codAlmacen ?? almacen.codigo ?? '').trim()
}

const getAlmacenLabel = (almacen: AlmacenRecord): string => {
  const cod = getAlmacenCod(almacen)
  const nombre = String(almacen.Nombre ?? almacen.nombre ?? '').trim()
  return nombre ? `${nombre} (${cod})` : cod
}

const getUserNameById = (idUsuario: string): string => {
  if (!idUsuario) return 'Usuario'

  const found = usuarios.value.find(u => getUserIdValue(u) === idUsuario)
  if (found) {
    return getUserLabel(found)
  }

  return idUsuario
}

const getAlmacenNameByCod = (codAlmacen: string): string => {
  const found = almacenes.value.find(a => getAlmacenCod(a) === codAlmacen)
  return found ? getAlmacenLabel(found) : codAlmacen
}

const canAssign = computed(() => selectedUserId.value.trim() && selectedCodAlmacen.value.trim())

const filteredUsuarios = computed(() => {
  const query = userSearch.value.toLowerCase().trim()
  if (!query) return usuarios.value

  return usuarios.value.filter(user => {
    const label = getUserLabel(user).toLowerCase()
    return label.includes(query)
  })
})

const filteredAsignaciones = computed(() => {
  if (!filterUserId.value) return asignaciones.value
  return asignaciones.value.filter(item => item.IdUsuario === filterUserId.value)
})

const cajaChicaApi = axios.create({
  baseURL: import.meta.env.VITE_CAJA_CHICA_API_URL || '/caja-chica-api',
  headers: {
    'Content-Type': 'application/json'
  }
})

cajaChicaApi.interceptors.request.use(config => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

const loadUsuarios = async () => {
  const response = await api.get('/Users')
  const payload = response.data as any
  if (Array.isArray(payload)) {
    usuarios.value = payload
  } else if (Array.isArray(payload?.data)) {
    usuarios.value = payload.data
  } else {
    usuarios.value = []
  }
}


const loadAlmacenes = async () => {
  const response = await cajaChicaApi.get('/Almacenes', {
    headers: {
      Accept: 'text/plain'
    },
    responseType: 'text'
  })
  let payload = response.data as any
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload)
    } catch {
      payload = []
    }
  }
  if (Array.isArray(payload)) {
    almacenes.value = payload
  } else if (Array.isArray(payload?.data)) {
    almacenes.value = payload.data
  } else {
    almacenes.value = []
  }
  almacenes.value = almacenes.value
    .map(item => ({
      CodAlmacen: item.CodAlmacen ?? item.cod_almacen ?? item.codAlmacen,
      Nombre: item.Nombre ?? item.nombre
    }))
    .filter(item => item.CodAlmacen)
    .slice(0, 1000)
}

const loadAsignaciones = async () => {
  const response = await cajaChicaApi.get('/UsuariosAlmacenes')
  const payload = response.data as any
  let items: any[] = []
  if (Array.isArray(payload)) {
    items = payload
  } else if (Array.isArray(payload?.data)) {
    items = payload.data
  }

  asignaciones.value = items.map(item => ({
    Id: item.Id ?? item.id ?? 0,
    IdUsuario: String(item.IdUsuario ?? item.idUsuario ?? ''),
    CodAlmacen: String(item.CodAlmacen ?? item.codAlmacen ?? '')
  }))
}

const loadData = async () => {
  loading.value = true
  error.value = ''
  try {
    await Promise.all([loadUsuarios(), loadAlmacenes(), loadAsignaciones()])
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    error.value = message || 'No se pudo cargar la informacion.'
  } finally {
    loading.value = false
  }
}

const createAsignacion = async () => {
  if (!canAssign.value) return
  assignLoading.value = true
  assignError.value = ''
  assignSuccess.value = ''
  try {
    await cajaChicaApi.post('/UsuariosAlmacenes', {
      IdUsuario: selectedUserId.value,
      CodAlmacen: selectedCodAlmacen.value
    })
    assignSuccess.value = 'Asignacion creada correctamente.'
    selectedCodAlmacen.value = ''
    await loadAsignaciones()
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    assignError.value = message || 'No se pudo crear la asignacion.'
  } finally {
    assignLoading.value = false
  }
}

const deleteAsignacion = async (id: number) => {
  deleteLoadingId.value = id
  try {
    await cajaChicaApi.delete(`/UsuariosAlmacenes/${id}`)
    asignaciones.value = asignaciones.value.filter(item => item.Id !== id)
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    error.value = message || 'No se pudo eliminar la asignacion.'
  } finally {
    deleteLoadingId.value = null
  }
}

onMounted(() => {
  loadData()
})
</script>
