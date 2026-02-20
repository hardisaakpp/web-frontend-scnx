<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Aprobadores por Tienda</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Configura aprobadores por grupo de almacenes</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Grupo de almacenes</label>
            <select
              v-model.number="selectedGroupId"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
              @change="loadAprobadores"
            >
              <option :value="0">Seleccionar grupo</option>
              <option v-for="grupo in grupos" :key="grupo.id" :value="grupo.id">
                {{ grupo.nombre }}
              </option>
            </select>
          </div>
          <div class="lg:col-span-2">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Buscar usuario</label>
            <input
              v-model.trim="userSearch"
              type="text"
              placeholder="Buscar por nombre, usuario o email"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5">
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Supervisores (todos aprueban)</h2>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ supervisores.length }}</span>
          </div>
          <div class="space-y-2">
            <div class="rounded border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
              <button
                v-for="user in filteredUsuarios"
                :key="user.id"
                type="button"
                class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                @click="addSupervisor(user)"
              >
                {{ user.label }}
              </button>
            </div>
            <div v-if="supervisores.length" class="flex flex-wrap gap-2">
              <span
                v-for="user in supervisores"
                :key="user.id"
                class="inline-flex items-center gap-2 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 px-3 py-1 text-xs"
              >
                {{ user.label }}
                <button type="button" @click="removeSupervisor(user.id)">x</button>
              </span>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5">
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Contabilidad (aprueba al menos uno)</h2>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ contabilidad.length }}</span>
          </div>
          <div class="space-y-2">
            <div class="rounded border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
              <button
                v-for="user in filteredUsuarios"
                :key="user.id"
                type="button"
                class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                @click="addContabilidad(user)"
              >
                {{ user.label }}
              </button>
            </div>
            <div v-if="contabilidad.length" class="flex flex-wrap gap-2">
              <span
                v-for="user in contabilidad"
                :key="user.id"
                class="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 px-3 py-1 text-xs"
              >
                {{ user.label }}
                <button type="button" @click="removeContabilidad(user.id)">x</button>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          class="rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-50"
          :disabled="!canSave"
          @click="saveAprobadores"
        >
          Guardar configuracion
        </button>
        <span v-if="formError" class="text-sm text-red-600 dark:text-red-400">{{ formError }}</span>
        <span v-else-if="formSuccess" class="text-sm text-emerald-600 dark:text-emerald-400">{{ formSuccess }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from '@vue/runtime-core'
import axios from 'axios'
import api from '@/services/api'

interface GrupoItem {
  id: number
  nombre: string
}

interface UserOption {
  id: string
  label: string
}

const grupos = ref<GrupoItem[]>([])
const usuarios = ref<UserOption[]>([])
const supervisores = ref<UserOption[]>([])
const contabilidad = ref<UserOption[]>([])
const selectedGroupId = ref(0)
const userSearch = ref('')
const formError = ref('')
const formSuccess = ref('')

const cajaChicaApi = axios.create({
  baseURL: import.meta.env.VITE_CAJA_CHICA_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

const filteredUsuarios = computed(() => {
  const query = userSearch.value.toLowerCase().trim()
  if (!query) return usuarios.value
  return usuarios.value.filter(user => user.label.toLowerCase().includes(query))
})

const canSave = computed(() =>
  selectedGroupId.value > 0 && supervisores.value.length > 0 && contabilidad.value.length > 0
)

const normalizeUser = (user: any): UserOption => {
  const id = String(user.id ?? user.Id ?? user.idUsuario ?? user.IdUsuario ?? '')
  const userName = String(user.userName ?? user.UsuarioNombre ?? user.username ?? '').trim()
  const fullName = String(user.fullName ?? user.Nombre ?? user.name ?? '').trim()
  const email = String(user.email ?? user.Correo ?? user.mail ?? '').trim()
  const base = fullName || userName || email || id
  const label = email && base !== email ? `${base} (${email})` : base
  return { id, label }
}

const addSupervisor = (user: UserOption) => {
  if (supervisores.value.some(item => item.id === user.id)) return
  supervisores.value.push(user)
}

const removeSupervisor = (id: string) => {
  supervisores.value = supervisores.value.filter(item => item.id !== id)
}

const addContabilidad = (user: UserOption) => {
  if (contabilidad.value.some(item => item.id === user.id)) return
  contabilidad.value.push(user)
}

const removeContabilidad = (id: string) => {
  contabilidad.value = contabilidad.value.filter(item => item.id !== id)
}

const loadGrupos = async () => {
  const response = await cajaChicaApi.get('/GrupoAlmacenes')
  const payload = response.data as any
  const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
  grupos.value = items.map((item: any) => ({
    id: item.id ?? item.Id ?? 0,
    nombre: item.nombre ?? item.Nombre ?? ''
  }))
}

const loadUsuarios = async () => {
  try {
    const response = await api.get('/Users')
    const payload = response.data as any
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    usuarios.value = items.map(normalizeUser)
  } catch (err: any) {
    const status = err?.response?.status
    formError.value = status === 401
      ? 'No autorizado. Inicia sesion para cargar usuarios.'
      : 'No se pudieron cargar los usuarios.'
    usuarios.value = []
  }
}

const loadAprobadores = async () => {
  formError.value = ''
  formSuccess.value = ''
  supervisores.value = []
  contabilidad.value = []

  if (!selectedGroupId.value) return

  try {
    const response = await cajaChicaApi.get(`/GrupoAlmacenes/${selectedGroupId.value}/aprobadores`)
    const payload = response.data as any
    const supIds = Array.isArray(payload?.supervisores) ? payload.supervisores : []
    const contIds = Array.isArray(payload?.contabilidad) ? payload.contabilidad : []

    supervisores.value = usuarios.value.filter(user => supIds.includes(user.id))
    contabilidad.value = usuarios.value.filter(user => contIds.includes(user.id))
  } catch {
    formError.value = 'No se pudieron cargar los aprobadores.'
  }
}

const saveAprobadores = async () => {
  if (!canSave.value) return
  formError.value = ''
  formSuccess.value = ''

  try {
    await cajaChicaApi.put(`/GrupoAlmacenes/${selectedGroupId.value}/aprobadores`, {
      Supervisores: supervisores.value.map(user => user.id),
      Contabilidad: contabilidad.value.map(user => user.id)
    })
    formSuccess.value = 'Configuracion guardada.'
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.response?.data
    formError.value = message || 'No se pudo guardar la configuracion.'
  }
}

onMounted(() => {
  loadGrupos()
  loadUsuarios()
})
</script>
