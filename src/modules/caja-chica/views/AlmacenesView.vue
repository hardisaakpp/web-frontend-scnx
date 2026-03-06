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
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Grupos de almacenes</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Crea grupos y asigna codigos de almacenes</p>
      </div>

      <!-- Formulario -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Nombre del grupo</label>
            <input
              v-model.trim="groupName"
              type="text"
              placeholder="Ej: Tiendas Norte"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Descripcion</label>
            <input
              v-model.trim="groupDescription"
              type="text"
              placeholder="Opcional"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Almacenes</label>
            <input
              v-model.trim="almacenSearch"
              type="text"
              placeholder="Buscar almacen por codigo o nombre"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
            <div class="mt-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 max-h-40 overflow-y-auto">
              <div v-if="almacenesLoading" class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">Cargando almacenes...</div>
              <div v-else-if="almacenesError" class="px-3 py-2 text-xs text-red-600 dark:text-red-400">{{ almacenesError }}</div>
              <button
                v-else
                v-for="almacen in filteredAlmacenes"
                :key="almacen.codAlmacen"
                type="button"
                class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                @click="addAlmacen(almacen)"
              >
                {{ almacen.nombre }} ({{ almacen.codAlmacen }})
              </button>
            </div>
            <div v-if="selectedAlmacenes.length" class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="almacen in selectedAlmacenes"
                :key="almacen.codAlmacen"
                class="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 px-3 py-1 text-xs"
              >
                {{ almacen.codAlmacen }}
                <button type="button" class="text-emerald-700 dark:text-emerald-200" @click="removeAlmacen(almacen.codAlmacen)">x</button>
              </span>
            </div>
          </div>
        </div>
        <div class="mt-4 flex items-center gap-3">
          <button
            type="button"
            class="rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-50"
            :disabled="!canAddGroup"
            @click="addGroup"
          >
            {{ editingGroupId ? 'Guardar cambios' : 'Agregar grupo' }}
          </button>
          <button
            v-if="editingGroupId"
            type="button"
            class="rounded border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-700 dark:text-gray-300"
            @click="resetForm"
          >
            Cancelar
          </button>
          <span v-if="formError" class="text-sm text-red-600 dark:text-red-400">{{ formError }}</span>
        </div>
      </div>

      <!-- Listado -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300">
          Total: <span class="font-semibold text-gray-900 dark:text-white">{{ grupos.length }}</span>
        </div>
        <div v-if="grupos.length === 0" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          Sin grupos registrados.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Grupo</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Descripcion</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Almacenes</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="grupo in grupos" :key="grupo.id">
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">{{ grupo.nombre }}</td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{{ grupo.descripcion || '-' }}</td>
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">
                  {{ grupo.almacenes.join(', ') }}
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    type="button"
                    class="mr-2 rounded border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-xs text-blue-700 dark:text-blue-300 hover:border-blue-300"
                    @click="editGroup(grupo)"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    class="rounded border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-3 py-1 text-xs text-red-700 dark:text-red-300 hover:border-red-300"
                    @click="removeGroup(grupo.id)"
                  >
                    Eliminar
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
import { useRouter } from 'vue-router'

interface GrupoAlmacenForm {
  id: number
  nombre: string
  descripcion: string
  almacenes: string[]
}

interface AlmacenItem {
  codAlmacen: string
  nombre: string
}

const groupName = ref('')
const groupDescription = ref('')
const formError = ref('')
const editingGroupId = ref<number | null>(null)
const grupos = ref<GrupoAlmacenForm[]>([])
const almacenSearch = ref('')
const almacenes = ref<AlmacenItem[]>([])
const selectedAlmacenes = ref<AlmacenItem[]>([])
const almacenesLoading = ref(false)
const almacenesError = ref('')
const router = useRouter()

const volver = () => {
  router.back()
}

const cajaChicaApi = axios.create({
  baseURL: import.meta.env.VITE_CAJA_CHICA_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

const canAddGroup = computed(() => groupName.value.trim() && selectedAlmacenes.value.length > 0)

const resetForm = () => {
  groupName.value = ''
  groupDescription.value = ''
  almacenSearch.value = ''
  selectedAlmacenes.value = []
  editingGroupId.value = null
}

const addGroup = async () => {
  formError.value = ''
  const nombre = groupName.value.trim()
  const almacenes = selectedAlmacenes.value.map(item => item.codAlmacen)

  if (!nombre) {
    formError.value = 'El nombre del grupo es obligatorio.'
    return
  }

  if (almacenes.length === 0) {
    formError.value = 'Debes ingresar al menos un codigo de almacen.'
    return
  }

  try {
    const payloadToSend = {
      Nombre: nombre,
      Descripcion: groupDescription.value.trim(),
      Almacenes: almacenes
    }

    if (editingGroupId.value) {
      const response = await cajaChicaApi.put(`/GrupoAlmacenes/${editingGroupId.value}`, payloadToSend)
      const payload = response.data as any
      grupos.value = grupos.value.map(grupo =>
        grupo.id === editingGroupId.value
          ? {
              id: payload?.id ?? grupo.id,
              nombre: payload?.nombre ?? nombre,
              descripcion: payload?.descripcion ?? groupDescription.value.trim(),
              almacenes: Array.isArray(payload?.almacenes) ? payload.almacenes : almacenes
            }
          : grupo
      )
    } else {
      const response = await cajaChicaApi.post('/GrupoAlmacenes', payloadToSend)
      const payload = response.data as any
      grupos.value.unshift({
        id: payload?.id ?? Date.now(),
        nombre: payload?.nombre ?? nombre,
        descripcion: payload?.descripcion ?? groupDescription.value.trim(),
        almacenes: Array.isArray(payload?.almacenes) ? payload.almacenes : almacenes
      })
    }
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.response?.data
    formError.value = message || 'No se pudo guardar el grupo.'
    return
  }

  resetForm()
}

const removeGroup = async (id: number) => {
  try {
    await cajaChicaApi.delete(`/GrupoAlmacenes/${id}`)
    grupos.value = grupos.value.filter(grupo => grupo.id !== id)
  } catch {
    formError.value = 'No se pudo eliminar el grupo.'
  }
}

const editGroup = (grupo: GrupoAlmacenForm) => {
  editingGroupId.value = grupo.id
  groupName.value = grupo.nombre
  groupDescription.value = grupo.descripcion
  selectedAlmacenes.value = grupo.almacenes.map(cod => ({
    codAlmacen: cod,
    nombre: cod
  }))
}

onMounted(() => {
  loadAlmacenes()
  loadGrupos()
})

const loadAlmacenes = async () => {
  almacenesLoading.value = true
  almacenesError.value = ''
  try {
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

    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    almacenes.value = items
      .map((item: any) => ({
        codAlmacen: String(item.codAlmacen ?? item.CodAlmacen ?? '').trim(),
        nombre: String(item.nombre ?? item.Nombre ?? '').trim()
      }))
      .filter((item: AlmacenItem) => item.codAlmacen)
  } catch {
    almacenesError.value = 'No se pudieron cargar los almacenes.'
  } finally {
    almacenesLoading.value = false
  }
}

const loadGrupos = async () => {
  try {
    const response = await cajaChicaApi.get('/GrupoAlmacenes')
    const payload = response.data as any
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    grupos.value = items.map((item: any) => ({
      id: item.id ?? item.Id ?? 0,
      nombre: item.nombre ?? item.Nombre ?? '',
      descripcion: item.descripcion ?? item.Descripcion ?? '',
      almacenes: Array.isArray(item.almacenes) ? item.almacenes : item.Almacenes ?? []
    }))
  } catch {
    grupos.value = []
  }
}

const addAlmacen = (almacen: AlmacenItem) => {
  if (selectedAlmacenes.value.some(item => item.codAlmacen === almacen.codAlmacen)) {
    return
  }
  selectedAlmacenes.value.push(almacen)
}

const removeAlmacen = (codAlmacen: string) => {
  selectedAlmacenes.value = selectedAlmacenes.value.filter(item => item.codAlmacen !== codAlmacen)
}

const filteredAlmacenes = computed(() => {
  const query = almacenSearch.value.toLowerCase().trim()
  const usedCodes = new Set(grupos.value.flatMap(grupo => grupo.almacenes))
  const selectedCodes = new Set(selectedAlmacenes.value.map(item => item.codAlmacen))

  const baseList = almacenes.value.filter(item => {
    if (selectedCodes.has(item.codAlmacen)) return true
    return !usedCodes.has(item.codAlmacen)
  })

  if (!query) return baseList
  return baseList.filter(item => {
    return item.codAlmacen.toLowerCase().includes(query) || item.nombre.toLowerCase().includes(query)
  })
})
</script>
