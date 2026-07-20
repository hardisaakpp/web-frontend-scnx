<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-4">
      <VolverButton to="/admin" title="Volver al Panel de Administración" class="shrink-0" />
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Datos adicionales</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Accesos a almacenes por usuario</p>
      </div>

      <!-- Formulario nueva asignación -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5">
        <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Nueva asignación</h2>
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end">

          <!-- Combobox Usuario -->
          <div class="flex-1 relative" ref="comboboxRef">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Usuario</label>
            <div class="relative">
              <input
                v-model="userSearch"
                type="text"
                placeholder="Buscar por nombre o email..."
                autocomplete="off"
                class="min-h-[52px] w-full touch-manipulation rounded-2xl border border-slate-200/90 bg-white py-3 pl-4 pr-10 text-sm font-medium text-slate-900 shadow-inner shadow-slate-900/[0.02] ring-1 ring-slate-900/[0.03] transition placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder:text-slate-500 focus:border-sky-500 focus:ring-sky-500/25"
                :disabled="loadingUsuarios"
                @focus="showDropdown = true"
                @input="onUserSearchInput"
                @keydown.escape="closeDropdown"
                @keydown.enter.prevent="selectHighlighted"
                @keydown.arrow-down.prevent="moveHighlight(1)"
                @keydown.arrow-up.prevent="moveHighlight(-1)"
              />
              <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg v-if="loadingUsuarios" class="h-4 w-4 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                <svg v-else class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                </svg>
              </span>

              <!-- Dropdown list -->
              <ul
                v-if="showDropdown && filteredUsuarios.length > 0"
                class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900"
              >
                <li
                  v-for="(u, idx) in filteredUsuarios"
                  :key="String(u.id ?? u.userId)"
                  class="flex flex-col cursor-pointer px-4 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  :class="{
                    'bg-emerald-50 dark:bg-emerald-900/20': idx === highlightedIndex,
                    'bg-emerald-100/60 dark:bg-emerald-800/30': String(u.id ?? u.userId) === newUserId && idx !== highlightedIndex
                  }"
                  @mousedown.prevent="selectUser(u)"
                  @mousemove="highlightedIndex = idx"
                >
                  <span class="font-medium text-slate-900 dark:text-slate-100">
                    {{ String(u.fullName ?? u.userName ?? '') }}
                  </span>
                  <span v-if="u.email" class="text-xs text-slate-500 dark:text-slate-400">
                    {{ String(u.email) }}
                  </span>
                </li>
              </ul>

              <div
                v-else-if="showDropdown && userSearch.trim().length > 0 && filteredUsuarios.length === 0 && !loadingUsuarios"
                class="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white py-3 text-center text-sm text-slate-500 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
              >
                Sin resultados para "{{ userSearch }}"
              </div>
            </div>
          </div>

          <!-- Cód. almacén -->
          <div class="flex-1">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Cód. almacén</label>
            <WarehouseSelect
              v-model="newCodAlmacen"
              :warehouses="almacenesDto"
              :disabled="loadingAlmacenes"
              embedded
            />
          </div>

          <div class="flex-1">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Permiso</label>
            <select
              v-model="newAcceso"
              class="min-h-[52px] w-full touch-manipulation rounded-2xl border border-slate-200/90 bg-white py-3 pl-4 pr-10 text-sm font-medium text-slate-900 shadow-inner shadow-slate-900/[0.02] ring-1 ring-slate-900/[0.03] transition placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder:text-slate-500 focus:border-sky-500 focus:ring-sky-500/25"
            >
              <option value="">Seleccionar permiso</option>
              <option v-for="key in permisos" :key="key" :value="key">{{ key }}</option>
            </select>
          </div>

          <!-- Grupo de almacenes -->
          <div class="flex-1 relative" ref="grupoDropdownRef">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Grupo de almacenes</label>
            <button
              type="button"
              :disabled="loadingGrupos"
              class="min-h-[52px] w-full touch-manipulation rounded-2xl border border-slate-200/90 bg-white py-3 pl-4 pr-4 text-sm font-medium text-slate-900 shadow-inner shadow-slate-900/[0.02] ring-1 ring-slate-900/[0.03] transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950/40 dark:text-slate-100 focus:border-emerald-500 focus:ring-emerald-500/25 flex items-center justify-between text-left"
              @click="toggleGrupoDropdown"
            >
              <span class="truncate" :class="selectedGrupoId.length === 0 ? 'text-slate-400 dark:text-slate-500' : ''">
                {{ selectedGrupoId.length === 0 ? 'Sin grupo' : selectedGrupoLabel }}
              </span>
              <svg class="h-4 w-4 text-slate-400 shrink-0 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
              </svg>
            </button>
            <ul
              v-if="showGrupoDropdown && grupos.length > 0"
              class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900"
            >
              <li
                v-for="g in grupos"
                :key="g.id"
                class="flex items-center gap-2 cursor-pointer px-4 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                :class="{ 'bg-emerald-50 dark:bg-emerald-900/20': selectedGrupoId.includes(g.id) }"
                @mousedown.prevent="toggleGrupo(g.id)"
              >
                <input type="checkbox" :checked="selectedGrupoId.includes(g.id)" class="accent-emerald-500 pointer-events-none" readonly />
                <span class="text-slate-900 dark:text-slate-100">{{ g.grupo }}</span>
              </li>
            </ul>
            <div
              v-else-if="showGrupoDropdown && grupos.length === 0 && !loadingGrupos"
              class="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white py-3 text-center text-sm text-slate-500 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            >
              Sin grupos disponibles
            </div>
          </div>

          <div>
            <button
              type="button"
              class="w-full sm:w-auto rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-50"
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

      <!-- Listado -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <span class="text-sm text-gray-600 dark:text-gray-300">
            Total: <span class="font-semibold text-gray-900 dark:text-white">{{ groupedAsignaciones.length }}</span>
          </span>
          <button
            type="button"
            class="rounded border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            :disabled="loading"
            @click="loadData"
          >
            Recargar
          </button>
        </div>

        <div v-if="loading" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Cargando...</div>
        <div v-else-if="error" class="py-10 text-center text-sm text-red-600 dark:text-red-400">{{ error }}</div>
        <div v-else-if="asignaciones.length === 0" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          Sin asignaciones registradas.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Usuario</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Almacén</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Permiso</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Grupo de almacenes</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Fecha creación</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Fecha modificación</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Modificado por</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="item in groupedAsignaciones" :key="item.key">
                <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  <template v-if="editingId === item.key">
                    <select
                      v-model="editUserId"
                      class="w-full rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-sky-500"
                    >
                      <option v-for="u in usuarios" :key="String(u.id ?? u.userId)" :value="String(u.id ?? u.userId)">
                        {{ String(u.fullName ?? u.userName ?? u.email ?? u.id) }}
                      </option>
                    </select>
                  </template>
                  <template v-else>{{ resolveUserName(item.userId) }}</template>
                </td>
                <td class="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-200">
                  <template v-if="editingId === item.key">
                    <select
                      v-model="editCodAlmacen"
                      class="w-full rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-sky-500"
                    >
                      <option v-for="a in almacenes" :key="a.codAlmacen" :value="a.codAlmacen">
                        {{ a.codAlmacen }}{{ a.nombre ? ` — ${a.nombre}` : '' }}
                      </option>
                    </select>
                  </template>
                  <template v-else>{{ item.codAlmacen }}</template>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">
                  <template v-if="editingId === item.key">
                    <select
                      v-model="editAcceso"
                      class="w-full rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-sky-500"
                    >
                      <option v-for="key in permisos" :key="key" :value="key">{{ key }}</option>
                    </select>
                  </template>
                  <template v-else>{{ item.accesoAlmacen }}</template>
                </td>
                <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  <template v-if="editingId === item.key">
                    <div class="relative" ref="editGrupoDropdownRef">
                      <button
                        type="button"
                        class="w-full rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 flex items-center justify-between gap-1 min-h-[28px]"
                        @click="toggleEditGrupoDropdown"
                      >
                        <span class="truncate" :class="editGrupos.length === 0 ? 'text-slate-400 dark:text-slate-500' : ''">
                          {{ editGrupos.length === 0 ? 'Sin grupo' : editGrupoLabel }}
                        </span>
                        <svg class="h-3 w-3 text-slate-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                        </svg>
                      </button>
                      <ul
                        v-if="showEditGrupoDropdown && grupos.length > 0"
                        class="absolute z-50 mt-1 max-h-48 w-full min-w-[180px] overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900"
                      >
                        <li
                          v-for="g in grupos"
                          :key="g.id"
                          class="flex items-center gap-2 cursor-pointer px-3 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                          :class="{ 'bg-emerald-50 dark:bg-emerald-900/20': editGrupos.includes(g.id) }"
                          @mousedown.prevent="toggleEditGrupo(g.id)"
                        >
                          <input type="checkbox" :checked="editGrupos.includes(g.id)" class="accent-emerald-500 pointer-events-none" readonly />
                          <span class="text-slate-900 dark:text-slate-100">{{ g.grupo }}</span>
                        </li>
                      </ul>
                    </div>
                  </template>
                  <template v-else>
                    <span v-if="item.grupos.length === 0">—</span>
                    <div v-else class="flex flex-wrap gap-1">
                      <span
                        v-for="g in item.grupos"
                        :key="g.id"
                        class="inline-block rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      >{{ g.nombre }}</span>
                    </div>
                  </template>
                </td>
                <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {{ item.fechaCreacion ? new Date(item.fechaCreacion).toLocaleString('es-PA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—' }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {{ item.fechaModificacion ? new Date(item.fechaModificacion).toLocaleString('es-PA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—' }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{{ item.modificadoPor ?? '—' }}</td>
                <td class="px-4 py-3 text-right">
                  <template v-if="editingId === item.key">
                    <div class="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        class="rounded border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 text-xs text-emerald-700 dark:text-emerald-300 hover:border-emerald-300 disabled:opacity-50"
                        :disabled="updateLoadingId === item.key"
                        @click="updateAsignacion(item.key)"
                      >
                        {{ updateLoadingId === item.key ? 'Guardando...' : 'Guardar' }}
                      </button>
                      <button
                        type="button"
                        class="rounded border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        @click="cancelEdit"
                      >
                        Cancelar
                      </button>
                    </div>
                  </template>
                  <template v-else>
                    <div class="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        class="rounded border border-sky-200 dark:border-sky-900/40 bg-sky-50 dark:bg-sky-900/20 px-3 py-1 text-xs text-sky-700 dark:text-sky-300 hover:border-sky-300 disabled:opacity-50"
                        :disabled="!!deleteLoadingId"
                        @click="startEdit(item)"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        class="rounded border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-3 py-1 text-xs text-red-700 dark:text-red-300 hover:border-red-300 disabled:opacity-50"
                        :disabled="deleteLoadingId === item.key"
                        @click="deleteGrouped(item.key)"
                      >
                        {{ deleteLoadingId === item.key ? 'Eliminando...' : 'Eliminar' }}
                      </button>
                    </div>
                  </template>
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
import VolverButton from '@/components/VolverButton.vue'
import WarehouseSelect from '@/components/WarehouseSelect.vue'
import type { WarehouseDto } from '@/modules/articulo-scaner/types'

interface AsignacionRecord {
  id: string
  userId: string
  codAlmacen: string
  accesoAlmacen: string
  grupoId: string | null
  grupoNombre: string | null
  fechaCreacion: string | null
  fechaModificacion: string | null
  modificadoPor: string | null
}

type UserRecord = Record<string, unknown>

interface AlmacenRecord {
  codAlmacen: string
  nombre: string | null
}

interface GrupoRecord {
  id: string
  grupo: string
}

interface GroupedAsignacion {
  key: string
  ids: string[]
  userId: string
  codAlmacen: string
  accesoAlmacen: string
  grupos: { id: string; nombre: string }[]
  fechaCreacion: string | null
  fechaModificacion: string | null
  modificadoPor: string | null
}

const asignaciones = ref<AsignacionRecord[]>([])
const usuarios = ref<UserRecord[]>([])
const almacenes = ref<AlmacenRecord[]>([])
const grupos = ref<GrupoRecord[]>([])
const permisos = ref<string[]>(['Tienda', 'Administrador', 'Supervisor'])
const loading = ref(false)
const loadingUsuarios = ref(false)
const loadingAlmacenes = ref(false)
const loadingGrupos = ref(false)
const error = ref('')

const newUserId = ref('')
const newCodAlmacen = ref<string | null>(null)
const newAcceso = ref('')
const selectedGrupoId = ref<string[]>([])
const assignLoading = ref(false)
const assignError = ref('')
const assignSuccess = ref('')
const deleteLoadingId = ref<string | null>(null)

// Edit inline state
const editingId = ref<string | null>(null)
const editUserId = ref('')
const editCodAlmacen = ref('')
const editAcceso = ref('')
const editGrupos = ref<string[]>([])
const updateLoadingId = ref<string | null>(null)

// Usuario combobox state
const userSearch = ref('')
const showDropdown = ref(false)
const highlightedIndex = ref(-1)
const comboboxRef = ref<HTMLElement | null>(null)

// Grupo de almacenes dropdown state (create form)
const showGrupoDropdown = ref(false)
const grupoDropdownRef = ref<HTMLElement | null>(null)

// Grupo de almacenes dropdown state (edit row)
const showEditGrupoDropdown = ref(false)
const editGrupoDropdownRef = ref<HTMLElement | null>(null)

const editGrupoLabel = computed(() =>
  editGrupos.value
    .map(id => grupos.value.find(g => g.id === id)?.grupo ?? id)
    .join(', ')
)

const toggleEditGrupoDropdown = () => { showEditGrupoDropdown.value = !showEditGrupoDropdown.value }

const toggleEditGrupo = (id: string) => {
  const idx = editGrupos.value.indexOf(id)
  if (idx === -1) {
    editGrupos.value = [...editGrupos.value, id]
  } else {
    editGrupos.value = editGrupos.value.filter(v => v !== id)
  }
}

const selectedGrupoLabel = computed(() =>
  selectedGrupoId.value
    .map(id => grupos.value.find(g => g.id === id)?.grupo ?? id)
    .join(', ')
)

const toggleGrupoDropdown = () => {
  if (!loadingGrupos.value) showGrupoDropdown.value = !showGrupoDropdown.value
}

const toggleGrupo = (id: string) => {
  const idx = selectedGrupoId.value.indexOf(id)
  if (idx === -1) {
    selectedGrupoId.value = [...selectedGrupoId.value, id]
  } else {
    selectedGrupoId.value = selectedGrupoId.value.filter(v => v !== id)
  }
}

const almacenesDto = computed<WarehouseDto[]>(() =>
  almacenes.value.map(a => ({ code: a.codAlmacen, name: a.nombre ?? '' }))
)

const canAssign = computed(() => newUserId.value && newCodAlmacen.value && newAcceso.value)

const groupedAsignaciones = computed<GroupedAsignacion[]>(() => {
  const map = new Map<string, GroupedAsignacion>()
  for (const item of asignaciones.value) {
    const key = `${item.userId}|${item.codAlmacen}|${item.accesoAlmacen}`
    if (!map.has(key)) {
      map.set(key, {
        key,
        ids: [],
        userId: item.userId,
        codAlmacen: item.codAlmacen,
        accesoAlmacen: item.accesoAlmacen,
        grupos: [],
        fechaCreacion: item.fechaCreacion,
        fechaModificacion: item.fechaModificacion,
        modificadoPor: item.modificadoPor,
      })
    }
    const entry = map.get(key)!
    entry.ids.push(String(item.id))
    if (item.grupoId && item.grupoNombre) {
      entry.grupos.push({ id: item.grupoId, nombre: item.grupoNombre })
    }
  }
  return Array.from(map.values())
})

const filteredUsuarios = computed(() => {
  const q = userSearch.value.toLowerCase().trim()
  const list = usuarios.value.filter(u => {
    const name = String(u.fullName ?? '').trim()
    const uname = String(u.userName ?? '').trim()
    const email = String(u.email ?? '').trim()
    if (!name && !uname && !email) return false
    if (!q) return true
    return name.toLowerCase().includes(q) || uname.toLowerCase().includes(q) || email.toLowerCase().includes(q)
  })
  return list
})

const selectUser = (u: UserRecord) => {
  newUserId.value = String(u.id ?? u.userId ?? '')
  userSearch.value = String(u.fullName ?? u.userName ?? u.email ?? '')
  showDropdown.value = false
  highlightedIndex.value = -1
}

const onUserSearchInput = () => {
  newUserId.value = ''
  showDropdown.value = true
  highlightedIndex.value = -1
}

const closeDropdown = () => {
  showDropdown.value = false
  highlightedIndex.value = -1
  if (!newUserId.value) userSearch.value = ''
}

const moveHighlight = (dir: number) => {
  if (!showDropdown.value) {
    showDropdown.value = true
    return
  }
  const max = filteredUsuarios.value.length - 1
  highlightedIndex.value = Math.max(0, Math.min(max, highlightedIndex.value + dir))
}

const selectHighlighted = () => {
  if (highlightedIndex.value >= 0 && filteredUsuarios.value[highlightedIndex.value]) {
    selectUser(filteredUsuarios.value[highlightedIndex.value])
  }
}

const resolveUserName = (userId: string) => {
  const u = usuarios.value.find(u => String(u.id ?? u.userId) === userId)
  if (!u) return userId
  return String(u.fullName ?? u.userName ?? u.email ?? userId)
}

const handleClickOutside = (e: MouseEvent) => {
  if (comboboxRef.value && !comboboxRef.value.contains(e.target as Node)) {
    closeDropdown()
  }
  if (grupoDropdownRef.value && !grupoDropdownRef.value.contains(e.target as Node)) {
    showGrupoDropdown.value = false
  }
  if (editGrupoDropdownRef.value && !editGrupoDropdownRef.value.contains(e.target as Node)) {
    showEditGrupoDropdown.value = false
  }
}

const startEdit = (item: GroupedAsignacion) => {
  editingId.value = item.key
  editUserId.value = item.userId
  editCodAlmacen.value = item.codAlmacen
  editAcceso.value = item.accesoAlmacen
  editGrupos.value = item.grupos.map(g => g.id)
}

const cancelEdit = () => {
  editingId.value = null
  editUserId.value = ''
  editCodAlmacen.value = ''
  editAcceso.value = ''
  editGrupos.value = []
  showEditGrupoDropdown.value = false
}

const updateAsignacion = async (groupKey: string) => {
  if (!editAcceso.value) return
  updateLoadingId.value = groupKey
  const group = groupedAsignaciones.value.find(g => g.key === groupKey)
  if (!group) return
  try {
    const currentGrupoIds = group.grupos.map(g => g.id)
    const newGrupoIds = editGrupos.value
    const toDelete = group.ids.filter(id => {
      const rec = asignaciones.value.find(a => String(a.id) === id)
      return rec?.grupoId && !newGrupoIds.includes(rec.grupoId)
    })
    const toAdd = newGrupoIds.filter(gId => !currentGrupoIds.includes(gId))
    const toUpdate = group.ids.filter(id => !toDelete.includes(id))
    await Promise.all([
      ...toUpdate.map(id => api.put(`/UsuariosAlmacenes/${id}`, {
        userId: editUserId.value,
        codAlmacen: editCodAlmacen.value,
        accesoAlmacen: editAcceso.value,
        warehouseGroupId: asignaciones.value.find(a => String(a.id) === id)?.grupoId || null
      })),
      ...toDelete.map(id => api.delete(`/UsuariosAlmacenes/${id}`)),
      ...toAdd.map(gId => api.post('/UsuariosAlmacenes', {
        userId: editUserId.value,
        codAlmacen: editCodAlmacen.value,
        accesoAlmacen: editAcceso.value,
        warehouseGroupId: gId
      }))
    ])
    const resp = await api.get('/UsuariosAlmacenes')
    asignaciones.value = resp.data as AsignacionRecord[]
    editingId.value = null
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    error.value = e?.response?.data?.message || 'No se pudo actualizar la asignación.'
  } finally {
    updateLoadingId.value = null
  }
}

const deleteGrouped = async (groupKey: string) => {
  const group = groupedAsignaciones.value.find(g => g.key === groupKey)
  if (!group) return
  deleteLoadingId.value = groupKey
  try {
    await Promise.all(group.ids.map(id => api.delete(`/UsuariosAlmacenes/${id}`)))
    asignaciones.value = asignaciones.value.filter(a => !group.ids.includes(String(a.id)))
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    error.value = e?.response?.data?.message || 'No se pudo eliminar la asignación.'
  } finally {
    deleteLoadingId.value = null
  }
}

const loadUsuarios = async () => {
  loadingUsuarios.value = true
  try {
    const resp = await api.get('/Users/list')
    usuarios.value = Array.isArray(resp.data) ? resp.data : []
  } finally {
    loadingUsuarios.value = false
  }
}

const loadAlmacenes = async () => {
  loadingAlmacenes.value = true
  try {
    const resp = await api.get('/UsuariosAlmacenes/almacenes')
    const payload = resp.data as AlmacenRecord[] | { data?: AlmacenRecord[] }
    if (Array.isArray(payload)) {
      almacenes.value = payload
    } else if (Array.isArray((payload as { data?: AlmacenRecord[] }).data)) {
      almacenes.value = (payload as { data: AlmacenRecord[] }).data
    }
  } finally {
    loadingAlmacenes.value = false
  }
}

const loadGrupos = async () => {
  loadingGrupos.value = true
  try {
    const resp = await api.get('/WarehouseGroups')
    grupos.value = Array.isArray(resp.data) ? resp.data as GrupoRecord[] : []
  } catch {
    // no crítico
  } finally {
    loadingGrupos.value = false
  }
}

const loadData = async () => {
  loading.value = true
  error.value = ''
  try {
    const [asignResp] = await Promise.all([
      api.get('/UsuariosAlmacenes'),
      loadUsuarios(),
      loadAlmacenes()
    ])
    asignaciones.value = asignResp.data as AsignacionRecord[]
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    error.value = e?.response?.data?.message || 'No se pudo cargar los datos.'
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
    const gruposToAssign = selectedGrupoId.value.length > 0 ? selectedGrupoId.value : [null]
    for (const grupoId of gruposToAssign) {
      await api.post('/UsuariosAlmacenes', {
        userId: newUserId.value,
        codAlmacen: (newCodAlmacen.value ?? '').toUpperCase(),
        accesoAlmacen: newAcceso.value,
        warehouseGroupId: grupoId || null
      })
    }
    assignSuccess.value = 'Asignación creada correctamente.'
    newUserId.value = ''
    userSearch.value = ''
    newCodAlmacen.value = null
    newAcceso.value = ''
    selectedGrupoId.value = []
    const asignResp = await api.get('/UsuariosAlmacenes')
    asignaciones.value = asignResp.data as AsignacionRecord[]
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    assignError.value = e?.response?.data?.message || 'No se pudo crear la asignación.'
  } finally {
    assignLoading.value = false
  }
}



onMounted(() => {
  loadData()
  loadGrupos()
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>
