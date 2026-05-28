<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-4">
      <VolverButton to="/admin" title="Volver al Panel de Administración" class="shrink-0" />
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Grupos de almacenes</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Crea grupos y asigna códigos de almacenes</p>
      </div>

      <!-- Formulario -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Nombre del grupo</label>
            <input
              v-model.trim="groupName"
              type="text"
              placeholder="Ej: Tiendas Norte"
              class="min-h-[52px] w-full touch-manipulation rounded-2xl border border-slate-200/90 bg-white py-3 pl-4 pr-10 text-sm font-medium text-slate-900 shadow-inner shadow-slate-900/[0.02] ring-1 ring-slate-900/[0.03] transition placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/25"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Descripción</label>
            <input
              v-model.trim="groupDescription"
              type="text"
              placeholder="Opcional"
              class="min-h-[52px] w-full touch-manipulation rounded-2xl border border-slate-200/90 bg-white py-3 pl-4 pr-10 text-sm font-medium text-slate-900 shadow-inner shadow-slate-900/[0.02] ring-1 ring-slate-900/[0.03] transition placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/25"
            />
          </div>
        </div>
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 mt-4">

          <!-- Almacenes dropdown con checkboxes -->
          <div class="relative" ref="almacenDropdownRef">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Almacenes</label>
            <button
              type="button"
              class="min-h-[52px] w-full touch-manipulation rounded-2xl border border-slate-200/90 bg-white py-3 pl-4 pr-4 text-sm font-medium text-slate-900 shadow-inner shadow-slate-900/[0.02] ring-1 ring-slate-900/[0.03] transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950/40 dark:text-slate-100 focus:border-emerald-500 focus:ring-emerald-500/25 flex items-center justify-between text-left"
              :disabled="almacenesLoading"
              @click="showAlmacenDropdown = !showAlmacenDropdown"
            >
              <span v-if="almacenesLoading" class="text-slate-400">Cargando almacenes...</span>
              <span v-else-if="selectedAlmacenes.length === 0" class="text-slate-400">Seleccionar almacenes...</span>
              <span v-else class="text-slate-900 dark:text-slate-100">{{ selectedAlmacenes.length }} almacén(es) seleccionado(s)</span>
              <svg
                class="w-4 h-4 text-slate-400 transition-transform shrink-0 ml-2"
                :class="{ 'rotate-180': showAlmacenDropdown }"
                viewBox="0 0 20 20" fill="currentColor"
              >
                <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
              </svg>
            </button>
            <div
              v-if="showAlmacenDropdown"
              class="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
            >
              <div class="p-2 border-b border-slate-100 dark:border-slate-800">
                <input
                  v-model.trim="almacenSearch"
                  autofocus
                  type="text"
                  placeholder="Buscar por código o nombre..."
                  class="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div class="max-h-52 overflow-y-auto py-1">
                <div v-if="almacenesError" class="px-3 py-2 text-xs text-red-600 dark:text-red-400">{{ almacenesError }}</div>
                <div v-else-if="filteredAlmacenes.length === 0" class="px-3 py-2 text-xs text-slate-400">Sin resultados</div>
                <button
                  v-else
                  v-for="almacen in filteredAlmacenes"
                  :key="almacen.codAlmacen"
                  type="button"
                  class="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  @mousedown.prevent="toggleAlmacen(almacen)"
                >
                  <span
                    class="flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors"
                    :class="isAlmacenSelected(almacen.codAlmacen) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-500'"
                  >
                    <svg v-if="isAlmacenSelected(almacen.codAlmacen)" class="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                  <span>{{ almacen.nombre }} ({{ almacen.codAlmacen }})</span>
                </button>
              </div>
              <div class="flex items-center justify-between px-3 py-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <span>{{ selectedAlmacenes.length }} seleccionado(s)</span>
                <button
                  type="button"
                  class="text-emerald-600 dark:text-emerald-400 hover:underline"
                  @mousedown.prevent="selectedAlmacenes = []"
                >Limpiar</button>
              </div>
            </div>
            <div v-if="selectedAlmacenes.length" class="mt-2 flex flex-wrap gap-1.5">
              <span
                v-for="almacen in selectedAlmacenes"
                :key="almacen.codAlmacen"
                class="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 px-2.5 py-0.5 text-xs font-medium"
              >
                {{ almacen.codAlmacen }}
                <button type="button" class="hover:text-emerald-900 dark:hover:text-white leading-none" @click="removeAlmacen(almacen.codAlmacen)">×</button>
              </span>
            </div>
          </div>

          <!-- Almacenes dropdown 2 con checkboxes -->
          <div class="relative" ref="almacenDropdownRef2">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Almacenes</label>
            <button
              type="button"
              class="min-h-[52px] w-full touch-manipulation rounded-2xl border border-slate-200/90 bg-white py-3 pl-4 pr-4 text-sm font-medium text-slate-900 shadow-inner shadow-slate-900/[0.02] ring-1 ring-slate-900/[0.03] transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950/40 dark:text-slate-100 focus:border-emerald-500 focus:ring-emerald-500/25 flex items-center justify-between text-left"
              :disabled="almacenesLoading"
              @click="showAlmacenDropdown2 = !showAlmacenDropdown2"
            >
              <span v-if="almacenesLoading" class="text-slate-400">Cargando almacenes...</span>
              <span v-else-if="selectedAlmacenes2.length === 0" class="text-slate-400">Seleccionar almacenes...</span>
              <span v-else class="text-slate-900 dark:text-slate-100">{{ selectedAlmacenes2.length }} almacén(es) seleccionado(s)</span>
              <svg
                class="w-4 h-4 text-slate-400 transition-transform shrink-0 ml-2"
                :class="{ 'rotate-180': showAlmacenDropdown2 }"
                viewBox="0 0 20 20" fill="currentColor"
              >
                <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
              </svg>
            </button>
            <div
              v-if="showAlmacenDropdown2"
              class="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
            >
              <div class="p-2 border-b border-slate-100 dark:border-slate-800">
                <input
                  v-model.trim="almacenSearch2"
                  autofocus
                  type="text"
                  placeholder="Buscar por código o nombre..."
                  class="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div class="max-h-52 overflow-y-auto py-1">
                <div v-if="almacenesError" class="px-3 py-2 text-xs text-red-600 dark:text-red-400">{{ almacenesError }}</div>
                <div v-else-if="filteredAlmacenes2.length === 0" class="px-3 py-2 text-xs text-slate-400">Sin resultados</div>
                <button
                  v-else
                  v-for="almacen in filteredAlmacenes2"
                  :key="almacen.codAlmacen"
                  type="button"
                  class="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  @mousedown.prevent="toggleAlmacen2(almacen)"
                >
                  <span
                    class="flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors"
                    :class="isAlmacenSelected2(almacen.codAlmacen) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-500'"
                  >
                    <svg v-if="isAlmacenSelected2(almacen.codAlmacen)" class="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                  <span>{{ almacen.nombre }} ({{ almacen.codAlmacen }})</span>
                </button>
              </div>
              <div class="flex items-center justify-between px-3 py-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <span>{{ selectedAlmacenes2.length }} seleccionado(s)</span>
                <button
                  type="button"
                  class="text-emerald-600 dark:text-emerald-400 hover:underline"
                  @mousedown.prevent="selectedAlmacenes2 = []"
                >Limpiar</button>
              </div>
            </div>
            <div v-if="selectedAlmacenes2.length" class="mt-2 flex flex-wrap gap-1.5">
              <span
                v-for="almacen in selectedAlmacenes2"
                :key="almacen.codAlmacen"
                class="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 px-2.5 py-0.5 text-xs font-medium"
              >
                {{ almacen.codAlmacen }}
                <button type="button" class="hover:text-emerald-900 dark:hover:text-white leading-none" @click="removeAlmacen2(almacen.codAlmacen)">×</button>
              </span>
            </div>
          </div>

        </div>
        <div class="mt-4 flex items-center gap-3">
          <button
            type="button"
            class="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-50"
            :disabled="!canAddGroup"
            @click="addGroup"
          >
            {{ editingGroupId ? 'Guardar cambios' : 'Agregar grupo' }}
          </button>
          <button
            v-if="editingGroupId"
            type="button"
            class="rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-700 dark:text-gray-300"
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
        <div v-if="listLoading" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Cargando...</div>
        <div v-else-if="grupos.length === 0" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          Sin grupos registrados.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Grupo</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Descripción</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Almacenes</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">F. Creación</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">F. Modificación</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Modificado por</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="grupo in grupos" :key="grupo.id">
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">{{ grupo.grupo }}</td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{{ grupo.descripcion || '-' }}</td>
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">{{ grupo.almacenes.join(', ') }}</td>
                <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ formatDate(grupo.fechaCreacion) }}</td>
                <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ formatDate(grupo.fechaModificacion) }}</td>
                <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{{ grupo.modificadoPor || '-' }}</td>
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
import { computed, onMounted, onUnmounted, ref } from 'vue'
import api from '@/services/api'
import axios from 'axios'
import VolverButton from '../components/VolverButton.vue'

interface GrupoAlmacenForm {
  id: string
  grupo: string
  descripcion: string
  almacenes: string[]
  fechaCreacion: string | null
  fechaModificacion: string | null
  modificadoPor: string | null
}

interface AlmacenItem {
  codAlmacen: string
  nombre: string
}

const groupName = ref('')
const groupDescription = ref('')
const formError = ref('')
const editingGroupId = ref<string | null>(null)
const grupos = ref<GrupoAlmacenForm[]>([])
const almacenSearch = ref('')
const almacenSearch2 = ref('')
const almacenes = ref<AlmacenItem[]>([])
const selectedAlmacenes = ref<AlmacenItem[]>([])
const selectedAlmacenes2 = ref<AlmacenItem[]>([])
const almacenesLoading = ref(false)
const almacenesError = ref('')
const listLoading = ref(false)
const showAlmacenDropdown = ref(false)
const showAlmacenDropdown2 = ref(false)
const almacenDropdownRef = ref<HTMLElement | null>(null)
const almacenDropdownRef2 = ref<HTMLElement | null>(null)

const cajaChicaApi = axios.create({
  baseURL: import.meta.env.VITE_CAJA_CHICA_API_URL || '/caja-chica-api',
  headers: { 'Content-Type': 'application/json' }
})

cajaChicaApi.interceptors.request.use(config => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

const canAddGroup = computed(() => groupName.value.trim() && selectedAlmacenes.value.length > 0)

const resetForm = () => {
  groupName.value = ''
  groupDescription.value = ''
  almacenSearch.value = ''
  almacenSearch2.value = ''
  selectedAlmacenes.value = []
  selectedAlmacenes2.value = []
  showAlmacenDropdown.value = false
  showAlmacenDropdown2.value = false
  editingGroupId.value = null
  formError.value = ''
}

const addGroup = async () => {
  formError.value = ''
  const nombre = groupName.value.trim()
  const codsAlmacenes = selectedAlmacenes.value.map(item => item.codAlmacen)

  if (!nombre) { formError.value = 'El nombre del grupo es obligatorio.'; return }
  if (codsAlmacenes.length === 0) { formError.value = 'Debes agregar al menos un almacén.'; return }

  try {
    const payload = { Grupo: nombre, Descripcion: groupDescription.value.trim(), Almacenes: codsAlmacenes }
    if (editingGroupId.value) {
      const response = await api.put(`/WarehouseGroups/${editingGroupId.value}`, payload)
      const data = response.data as any
      grupos.value = grupos.value.map(g =>
        g.id === editingGroupId.value
          ? { id: data?.id ?? g.id, grupo: data?.grupo ?? nombre, descripcion: data?.descripcion ?? groupDescription.value.trim(), almacenes: Array.isArray(data?.almacenes) ? data.almacenes : codsAlmacenes, fechaCreacion: data?.fechaCreacion ?? g.fechaCreacion, fechaModificacion: data?.fechaModificacion ?? null, modificadoPor: data?.modificadoPor ?? null }
          : g
      )
    } else {
      const response = await api.post('/WarehouseGroups', payload)
      const data = response.data as any
      grupos.value.unshift({ id: data?.id ?? crypto.randomUUID(), grupo: data?.grupo ?? nombre, descripcion: data?.descripcion ?? groupDescription.value.trim(), almacenes: Array.isArray(data?.almacenes) ? data.almacenes : codsAlmacenes, fechaCreacion: data?.fechaCreacion ?? null, fechaModificacion: null, modificadoPor: data?.modificadoPor ?? null })
    }
    resetForm()
  } catch (err: any) {
    formError.value = err?.response?.data?.message || err?.response?.data || 'No se pudo guardar el grupo.'
  }
}

const removeGroup = async (id: string) => {
  try {
    await api.delete(`/WarehouseGroups/${id}`)
    grupos.value = grupos.value.filter(g => g.id !== id)
  } catch {
    formError.value = 'No se pudo eliminar el grupo.'
  }
}

const editGroup = (grupo: GrupoAlmacenForm) => {
  editingGroupId.value = grupo.id
  groupName.value = grupo.grupo
  groupDescription.value = grupo.descripcion
  selectedAlmacenes.value = grupo.almacenes.map(cod => {
    const found = almacenes.value.find(a => a.codAlmacen === cod)
    return found ?? { codAlmacen: cod, nombre: cod }
  })
}

const isAlmacenSelected = (codAlmacen: string) =>
  selectedAlmacenes.value.some(item => item.codAlmacen === codAlmacen)

const isAlmacenSelected2 = (codAlmacen: string) =>
  selectedAlmacenes2.value.some(item => item.codAlmacen === codAlmacen)

const toggleAlmacen = (almacen: AlmacenItem) => {
  if (isAlmacenSelected(almacen.codAlmacen)) removeAlmacen(almacen.codAlmacen)
  else selectedAlmacenes.value.push(almacen)
}

const toggleAlmacen2 = (almacen: AlmacenItem) => {
  if (isAlmacenSelected2(almacen.codAlmacen)) removeAlmacen2(almacen.codAlmacen)
  else selectedAlmacenes2.value.push(almacen)
}

const removeAlmacen = (codAlmacen: string) => {
  selectedAlmacenes.value = selectedAlmacenes.value.filter(item => item.codAlmacen !== codAlmacen)
}

const removeAlmacen2 = (codAlmacen: string) => {
  selectedAlmacenes2.value = selectedAlmacenes2.value.filter(item => item.codAlmacen !== codAlmacen)
}

const filteredAlmacenes = computed(() => {
  const query = almacenSearch.value.toLowerCase().trim()
  if (!query) return almacenes.value
  return almacenes.value.filter(item =>
    item.codAlmacen.toLowerCase().includes(query) || item.nombre.toLowerCase().includes(query)
  )
})

const filteredAlmacenes2 = computed(() => {
  const query = almacenSearch2.value.toLowerCase().trim()
  if (!query) return almacenes.value
  return almacenes.value.filter(item =>
    item.codAlmacen.toLowerCase().includes(query) || item.nombre.toLowerCase().includes(query)
  )
})

const handleClickOutside = (e: MouseEvent) => {
  if (almacenDropdownRef.value && !almacenDropdownRef.value.contains(e.target as Node)) {
    showAlmacenDropdown.value = false
    almacenSearch.value = ''
  }
  if (almacenDropdownRef2.value && !almacenDropdownRef2.value.contains(e.target as Node)) {
    showAlmacenDropdown2.value = false
    almacenSearch2.value = ''
  }
}

const loadAlmacenes = async () => {
  almacenesLoading.value = true
  almacenesError.value = ''
  try {
    const response = await cajaChicaApi.get('/Almacenes', { headers: { Accept: 'text/plain' }, responseType: 'text' })
    let payload = response.data as any
    if (typeof payload === 'string') { try { payload = JSON.parse(payload) } catch { payload = [] } }
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    almacenes.value = items
      .map((item: any) => ({ codAlmacen: String(item.codAlmacen ?? item.CodAlmacen ?? '').trim(), nombre: String(item.nombre ?? item.Nombre ?? '').trim() }))
      .filter((item: AlmacenItem) => item.codAlmacen)
  } catch {
    almacenesError.value = 'No se pudieron cargar los almacenes.'
  } finally {
    almacenesLoading.value = false
  }
}

const loadGrupos = async () => {
  listLoading.value = true
  try {
    const response = await api.get('/WarehouseGroups')
    const payload = response.data as any
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    grupos.value = items.map((item: any) => ({
      id: item.id ?? item.Id ?? '',
      grupo: item.grupo ?? item.Grupo ?? '',
      descripcion: item.descripcion ?? item.Descripcion ?? '',
      almacenes: Array.isArray(item.almacenes) ? item.almacenes : item.Almacenes ?? [],
      fechaCreacion: item.fechaCreacion ?? item.FechaCreacion ?? null,
      fechaModificacion: item.fechaModificacion ?? item.FechaModificacion ?? null,
      modificadoPor: item.modificadoPor ?? item.ModificadoPor ?? null
    }))
  } catch {
    grupos.value = []
  } finally {
    listLoading.value = false
  }
}

const formatDate = (value: string | null): string => {
  if (!value) return '-'
  const d = new Date(value)
  return isNaN(d.getTime()) ? '-' : d.toLocaleString('es-PA', { dateStyle: 'short', timeStyle: 'short' })
}

onMounted(() => {
  loadAlmacenes()
  loadGrupos()
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>
