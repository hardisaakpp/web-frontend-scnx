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
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Aprobadores por Tienda</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Selecciona un grupo de almacenes para configurar sus aprobadores</p>
      </div>

      <!-- Selector de grupo -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Grupo de almacenes</label>
            <select
              v-model="selectedGroupId"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option value="">Seleccionar grupo</option>
              <option v-for="grupo in grupos" :key="grupo.id" :value="grupo.id">
                {{ grupo.nombre }}
              </option>
            </select>
          </div>
          <button
            type="button"
            class="rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-50"
            :disabled="!selectedGroupId || loadingAprobadores"
            @click="loadAprobadores"
          >
            {{ loadingAprobadores ? 'Buscando...' : 'Buscar' }}
          </button>
        </div>
      </div>

      <div v-if="searchedGroupId" class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <!-- Supervisores -->
        <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Supervisores (todos aprueban)</h2>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ supervisores.length }}</span>
          </div>

          <div v-if="supervisores.length" class="flex flex-wrap gap-2 mb-3">
            <span
              v-for="user in supervisores"
              :key="user.id"
              class="inline-flex items-center gap-2 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 px-3 py-1 text-xs"
            >
              {{ user.label }}
              <button type="button" @click="removeSupervisor(user.id)">x</button>
            </span>
          </div>

          <div class="relative">
            <input
              v-model.trim="supervisorQuery"
              type="text"
              placeholder="Agregar supervisor por nombre, usuario o email"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
              @focus="supervisorDropdownOpen = true"
              @blur="handleSupervisorBlur"
            />
            <div
              v-if="supervisorDropdownOpen && supervisorQuery.length >= 1"
              class="absolute z-10 mt-1 w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 max-h-48 overflow-y-auto shadow-lg"
            >
              <div v-if="!supervisorSuggestions.length" class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">Sin coincidencias.</div>
              <button
                v-else
                v-for="user in supervisorSuggestions"
                :key="user.id"
                type="button"
                class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                @click="pickSupervisor(user)"
              >
                {{ user.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Contabilidad -->
        <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Contabilidad (aprueba al menos uno)</h2>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ contabilidad.length }}</span>
          </div>

          <div v-if="contabilidad.length" class="flex flex-wrap gap-2 mb-3">
            <span
              v-for="user in contabilidad"
              :key="user.id"
              class="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 px-3 py-1 text-xs"
            >
              {{ user.label }}
              <button type="button" @click="removeContabilidad(user.id)">x</button>
            </span>
          </div>

          <div class="relative">
            <input
              v-model.trim="contabilidadQuery"
              type="text"
              placeholder="Agregar usuario de contabilidad por nombre, usuario o email"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
              @focus="contabilidadDropdownOpen = true"
              @blur="handleContabilidadBlur"
            />
            <div
              v-if="contabilidadDropdownOpen && contabilidadQuery.length >= 1"
              class="absolute z-10 mt-1 w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 max-h-48 overflow-y-auto shadow-lg"
            >
              <div v-if="!contabilidadSuggestions.length" class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">Sin coincidencias.</div>
              <button
                v-else
                v-for="user in contabilidadSuggestions"
                :key="user.id"
                type="button"
                class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                @click="pickContabilidad(user)"
              >
                {{ user.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="searchedGroupId" class="flex items-center gap-3">
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
import { cajaChicaApi } from '../services/cajaChicaApi'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()

const volver = () => {
  router.back()
}

interface GrupoItem {
  id: string
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
const selectedGroupId = ref('')
const searchedGroupId = ref('')
const loadingAprobadores = ref(false)
const formError = ref('')
const formSuccess = ref('')

const supervisorQuery = ref('')
const supervisorDropdownOpen = ref(false)
const contabilidadQuery = ref('')
const contabilidadDropdownOpen = ref(false)

// Límite de sugerencias renderizadas: evita pintar cientos de filas mientras se escribe.
const SUGGESTIONS_LIMIT = 8

const canSave = computed(() =>
  !!searchedGroupId.value && supervisores.value.length > 0 && contabilidad.value.length > 0
)

const supervisorSuggestions = computed(() => {
  const query = supervisorQuery.value.toLowerCase().trim()
  if (!query) return []
  const currentIds = new Set(supervisores.value.map(user => user.id))
  return usuarios.value
    .filter(user => !currentIds.has(user.id) && user.label.toLowerCase().includes(query))
    .slice(0, SUGGESTIONS_LIMIT)
})

const contabilidadSuggestions = computed(() => {
  const query = contabilidadQuery.value.toLowerCase().trim()
  if (!query) return []
  const currentIds = new Set(contabilidad.value.map(user => user.id))
  return usuarios.value
    .filter(user => !currentIds.has(user.id) && user.label.toLowerCase().includes(query))
    .slice(0, SUGGESTIONS_LIMIT)
})

const normalizeUser = (user: any): UserOption => {
  const id = String(user.id ?? user.Id ?? user.idUsuario ?? user.IdUsuario ?? '')
  const userName = String(user.userName ?? user.UsuarioNombre ?? user.username ?? '').trim()
  const fullName = String(user.fullName ?? user.Nombre ?? user.name ?? '').trim()
  const email = String(user.email ?? user.Correo ?? user.mail ?? '').trim()
  const base = fullName || userName || email || id
  const label = email && base !== email ? `${base} (${email})` : base
  return { id, label }
}

const removeSupervisor = (id: string) => {
  supervisores.value = supervisores.value.filter(item => item.id !== id)
}

const removeContabilidad = (id: string) => {
  contabilidad.value = contabilidad.value.filter(item => item.id !== id)
}

const pickSupervisor = (user: UserOption) => {
  supervisores.value.push(user)
  supervisorQuery.value = ''
  supervisorDropdownOpen.value = false
}

const pickContabilidad = (user: UserOption) => {
  contabilidad.value.push(user)
  contabilidadQuery.value = ''
  contabilidadDropdownOpen.value = false
}

const handleSupervisorBlur = () => {
  // Retraso para permitir que el @click de una sugerencia se registre antes de cerrar el dropdown.
  setTimeout(() => {
    supervisorDropdownOpen.value = false
  }, 150)
}

const handleContabilidadBlur = () => {
  setTimeout(() => {
    contabilidadDropdownOpen.value = false
  }, 150)
}

const loadGrupos = async () => {
  const response = await api.get('/WarehouseGroups')
  const payload = response.data as any
  const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
  grupos.value = items.map((item: any) => ({
    id: String(item.id ?? item.Id ?? ''),
    nombre: item.grupo ?? item.Grupo ?? ''
  }))
}

const loadUsuarios = async () => {
  try {
    const response = await api.get('/Users/list')
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
  if (!selectedGroupId.value) return

  formError.value = ''
  formSuccess.value = ''
  supervisores.value = []
  contabilidad.value = []
  supervisorQuery.value = ''
  contabilidadQuery.value = ''
  loadingAprobadores.value = true

  try {
    const response = await cajaChicaApi.get(`/GrupoAlmacenes/${selectedGroupId.value}/aprobadores`)
    const payload = response.data as any
    const supIds = Array.isArray(payload?.supervisores) ? payload.supervisores : []
    const contIds = Array.isArray(payload?.contabilidad) ? payload.contabilidad : []

    supervisores.value = usuarios.value.filter(user => supIds.includes(user.id))
    contabilidad.value = usuarios.value.filter(user => contIds.includes(user.id))
    searchedGroupId.value = selectedGroupId.value
  } catch {
    formError.value = 'No se pudieron cargar los aprobadores.'
  } finally {
    loadingAprobadores.value = false
  }
}

const saveAprobadores = async () => {
  if (!canSave.value) return
  formError.value = ''
  formSuccess.value = ''

  try {
    await cajaChicaApi.put(`/GrupoAlmacenes/${searchedGroupId.value}/aprobadores`, {
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
