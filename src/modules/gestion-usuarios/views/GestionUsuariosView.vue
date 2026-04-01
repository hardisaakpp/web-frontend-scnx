<template>
  <div class="space-y-6">
    <div
      v-if="serverDown"
      class="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-700 px-4 py-3 text-sm text-amber-900 dark:text-amber-100"
      role="status"
    >
      Servidor de empleados no disponible (health check falló). Revisa el backend o el proxy
      <code class="text-xs bg-white/50 dark:bg-black/20 px-1 rounded">/employees-api</code>
      y vuelve a intentar.
    </div>

    <section class="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {{ form.id ? 'Editar empleado' : 'Nuevo empleado' }}
        </h3>
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm"
          :aria-expanded="!isNewEmployeeCollapsed"
          @click="toggleNewEmployeeCollapse"
        >
          {{ isNewEmployeeCollapsed ? 'Mostrar' : 'Ocultar' }}
        </button>
      </div>

      <form
        v-show="!isNewEmployeeCollapsed"
        class="grid grid-cols-1 md:grid-cols-2 gap-3"
        @submit.prevent="saveEmployee"
      >
        <input
          v-model="form.cedula_identidad"
          type="text"
          required
          placeholder="Cédula"
          class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
        <input
          v-model="form.nombre"
          type="text"
          required
          placeholder="Nombre completo"
          class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
        <div class="flex flex-col gap-1">
          <div class="relative">
            <input
              ref="storeInputRef"
              v-model="storeSearchText"
              list="store-options"
              type="text"
              required
              placeholder="Buscar tienda por nombre o código"
              class="w-full px-3 py-2 pr-9 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              @input="onStoreSearchInput"
              @change="onStoreSearchChange"
            />
            <button
              v-if="storeSearchText"
              type="button"
              class="absolute inset-y-0 right-2 my-auto h-6 w-6 rounded text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              title="Limpiar tienda"
              aria-label="Limpiar tienda"
              @click="clearStoreSelection"
            >
              x
            </button>
          </div>
          <datalist id="store-options">
            <option v-for="a in tiendaOptionsForForm" :key="a.cod_almacen" :value="a.cod_almacen">
              {{ a.label }}
            </option>
          </datalist>
          <p v-if="!almacenesOptions.length && !catalogsLoading" class="text-xs text-amber-700 dark:text-amber-300">
            No se pudo cargar el catálogo de tiendas. Revisa <code class="text-xs">meta=almacenes</code>.
          </p>
        </div>
        <div class="flex flex-col gap-1">
          <select
            v-model="form.cargo"
            required
            class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="" disabled>Seleccione cargo</option>
            <option v-for="c in cargoOptionsForForm" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <input
          v-model="form.correo"
          type="email"
          required
          placeholder="Correo"
          class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
        <div class="flex flex-col gap-1">
          <button
            type="button"
            role="switch"
            :aria-checked="form.encargado === 1"
            :disabled="form.estado === 0"
            class="w-full px-3 py-2 rounded-lg border transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            :class="
              form.encargado === 1
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100'
            "
            @click="toggleEncargado"
          >
            Encargado: {{ form.encargado === 1 ? 'Sí' : 'No' }}
          </button>
          <p v-if="form.estado === 0" class="text-xs text-gray-500 dark:text-gray-400">Inactivo: no puede ser encargado.</p>
        </div>
        <div class="flex flex-col gap-1">
          <button
            type="button"
            role="switch"
            :aria-checked="form.estado === 1"
            class="w-full px-3 py-2 rounded-lg border transition-colors"
            :class="
              form.estado === 1
                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100'
            "
            @click="toggleEstado"
          >
            Estado: {{ form.estado === 1 ? 'Activo' : 'Inactivo' }}
          </button>
        </div>

        <div class="md:col-span-2 flex gap-2">
          <button
            type="submit"
            class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
            :disabled="loading"
          >
            {{ loading ? 'Guardando...' : form.id ? 'Actualizar' : 'Crear' }}
          </button>
          <button type="button" class="px-4 py-2 rounded-lg border text-sm" @click="resetForm">Cancelar</button>
        </div>
      </form>
    </section>

    <section class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Empleados</h3>
        <p class="text-sm text-gray-500 dark:text-gray-300">Total: {{ total }}</p>
      </div>

      <form
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 mb-3"
        @submit.prevent="applyFilters"
      >
        <div class="relative w-full">
          <div
            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
            aria-hidden="true"
          >
            <MagnifyingGlassIcon class="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            v-model="filters.q"
            type="search"
            autocomplete="off"
            placeholder="Buscar nombre, cédula o correo"
            class="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            @input="onQueryInput"
          />
        </div>
        <select
          v-model="filters.codigo_tienda"
          class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">Tiendas</option>
          <option v-for="a in almacenesOptions" :key="a.cod_almacen" :value="a.cod_almacen">
            {{ a.label }} — {{ a.cod_almacen }}
          </option>
        </select>
        <select
          v-model="filters.cargo"
          class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">Cargos</option>
          <option v-for="c in cargoOptions" :key="c" :value="c">{{ c }}</option>
        </select>
        <select
          v-model="filters.encargado"
          class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">Encargado</option>
          <option value="1">Sí</option>
          <option value="0">No</option>
        </select>
        <select
          v-model="filters.estado"
          class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">Estado</option>
          <option value="1">Activos</option>
          <option value="0">Inactivos</option>
        </select>
        <div class="xl:col-span-5 flex gap-2">
          <button type="submit" class="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">
            Filtrar
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm"
            @click="clearFilters"
          >
            Limpiar
          </button>
        </div>
      </form>

      <div v-if="errorMessage" class="mb-3 text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="text-left border-b dark:border-gray-700">
              <th class="py-2 pr-3">Cédula</th>
              <th class="py-2 pr-3">Nombre</th>
              <th class="py-2 pr-3">Tienda</th>
              <th class="py-2 pr-3">Cargo</th>
              <th class="py-2 pr-3">Correo</th>
              <th class="py-2 pr-3">Encargado</th>
              <th class="py-2 pr-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="employee in employees"
              :key="employee.id"
              class="border-b dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-slate-900/30"
            >
              <td class="py-2 pr-3 cursor-pointer" title="Doble clic para editar" @dblclick="startInlineEdit(employee, 'cedula_identidad')">
                <input
                  v-if="isInlineEditing(employee, 'cedula_identidad')"
                  v-model="inlineEdit.value"
                  class="w-full px-2 py-1 rounded border border-blue-400 dark:border-blue-500 bg-white dark:bg-gray-900"
                  @keydown.enter.prevent="saveInlineEdit(employee)"
                  @keydown.esc.prevent="cancelInlineEdit"
                  @blur="saveInlineEdit(employee)"
                />
                <span v-else>{{ employee.cedula_identidad }}</span>
              </td>
              <td class="py-2 pr-3 cursor-pointer" title="Doble clic para editar" @dblclick="startInlineEdit(employee, 'nombre')">
                <input
                  v-if="isInlineEditing(employee, 'nombre')"
                  v-model="inlineEdit.value"
                  class="w-full px-2 py-1 rounded border border-blue-400 dark:border-blue-500 bg-white dark:bg-gray-900"
                  @keydown.enter.prevent="saveInlineEdit(employee)"
                  @keydown.esc.prevent="cancelInlineEdit"
                  @blur="saveInlineEdit(employee)"
                />
                <span v-else>{{ employee.nombre }}</span>
              </td>
              <td class="py-2 pr-3 cursor-pointer" title="Doble clic para editar" @dblclick="startInlineEdit(employee, 'codigo_tienda')">
                <select
                  v-if="isInlineEditing(employee, 'codigo_tienda')"
                  v-model="inlineEdit.value"
                  class="w-full px-2 py-1 rounded border border-blue-400 dark:border-blue-500 bg-white dark:bg-gray-900"
                  @change="saveInlineEdit(employee)"
                  @blur="saveInlineEdit(employee)"
                >
                  <option v-for="a in almacenesOptions" :key="a.cod_almacen" :value="a.cod_almacen">
                    {{ a.label }} — {{ a.cod_almacen }}
                  </option>
                </select>
                <span v-else>{{ tiendaLabel(employee.codigo_tienda) }}</span>
              </td>
              <td class="py-2 pr-3 cursor-pointer" title="Doble clic para editar" @dblclick="startInlineEdit(employee, 'cargo')">
                <select
                  v-if="isInlineEditing(employee, 'cargo')"
                  v-model="inlineEdit.value"
                  class="w-full px-2 py-1 rounded border border-blue-400 dark:border-blue-500 bg-white dark:bg-gray-900"
                  @change="saveInlineEdit(employee)"
                  @blur="saveInlineEdit(employee)"
                >
                  <option v-for="c in cargoOptions" :key="c" :value="c">{{ c }}</option>
                </select>
                <span v-else>{{ employee.cargo }}</span>
              </td>
              <td class="py-2 pr-3 cursor-pointer" title="Doble clic para editar" @dblclick="startInlineEdit(employee, 'correo')">
                <input
                  v-if="isInlineEditing(employee, 'correo')"
                  v-model="inlineEdit.value"
                  type="email"
                  class="w-full px-2 py-1 rounded border border-blue-400 dark:border-blue-500 bg-white dark:bg-gray-900"
                  @keydown.enter.prevent="saveInlineEdit(employee)"
                  @keydown.esc.prevent="cancelInlineEdit"
                  @blur="saveInlineEdit(employee)"
                />
                <span v-else>{{ employee.correo }}</span>
              </td>
              <td class="py-2 pr-3">
                <button
                  type="button"
                  role="switch"
                  :aria-checked="employee.encargado === 1"
                  :disabled="loading || employee.estado === 0"
                  class="inline-flex items-center justify-center min-w-14 px-3 py-1.5 rounded-full text-xs font-medium border"
                  :class="
                    employee.encargado === 1
                      ? 'border-amber-400 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                      : 'border-gray-300 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'
                  "
                  @click="toggleEmployeeEncargado(employee)"
                  @dblclick.stop
                >
                  {{ employee.encargado === 1 ? 'Sí' : 'No' }}
                </button>
              </td>
              <td class="py-2 pr-3">
                <button
                  type="button"
                  role="switch"
                  :aria-checked="employee.estado === 1"
                  :disabled="loading"
                  class="inline-flex items-center justify-center min-w-16 px-3 py-1.5 rounded-full text-xs font-medium border"
                  :class="
                    employee.estado === 1
                      ? 'border-emerald-400 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'border-gray-300 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'
                  "
                  @click="toggleEmployeeEstado(employee)"
                  @dblclick.stop
                >
                  {{ employee.estado === 1 ? 'Activo' : 'Inactivo' }}
                </button>
              </td>
            </tr>
            <tr v-if="!employees.length">
              <td colspan="7" class="py-4 text-center text-gray-500 dark:text-gray-300">
                No hay empleados para mostrar.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 flex items-center gap-2">
        <button
          class="px-3 py-1 rounded border text-sm"
          :disabled="loading || filters.page <= 1"
          @click="goToPage(filters.page - 1)"
        >
          Anterior
        </button>
        <span class="text-sm text-gray-600 dark:text-gray-300">
          Página {{ filters.page }} / {{ totalPages }}
        </span>
        <button
          class="px-3 py-1 rounded border text-sm"
          :disabled="loading || filters.page >= totalPages"
          @click="goToPage(filters.page + 1)"
        >
          Siguiente
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  checkStoreEmployeesHealth,
  createStoreEmployee,
  fetchStoreAlmacenes,
  fetchStoreEmployeeCargos,
  inactivateStoreEmployee,
  listStoreEmployees,
  normalizeEncargado,
  updateStoreEmployee,
  type AlmacenOption,
  type StoreEmployee
} from '../services/storeEmployeesApi'
import { STORE_EMPLOYEE_CARGOS, isValidCargo, type StoreEmployeeCargo } from '../types/cargo'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'

const authStore = useAuthStore()

const loading = ref(false)
const catalogsLoading = ref(true)
const serverDown = ref(false)
const errorMessage = ref('')
const isNewEmployeeCollapsed = ref(false)
const employees = ref<StoreEmployee[]>([])
const total = ref(0)
/** Opciones de cargo (API `meta=cargos` o fallback local). */
const cargoOptions = ref<StoreEmployeeCargo[]>([...STORE_EMPLOYEE_CARGOS])
/** Combo tiendas: valor = cod_almacen → campo `codigo_tienda`. */
const almacenesOptions = ref<AlmacenOption[]>([])
/** Texto del input de búsqueda para tienda (puede ser nombre o código). */
const storeSearchText = ref('')
const storeInputRef = ref<HTMLInputElement | null>(null)
const QUERY_DEBOUNCE_MS = 300
let queryDebounceTimer: number | null = null
type InlineField = 'cedula_identidad' | 'nombre' | 'correo' | 'cargo' | 'codigo_tienda'
const inlineEdit = reactive<{
  id: number | null
  field: InlineField | ''
  value: string
}>({
  id: null,
  field: '',
  value: ''
})

const filters = reactive({
  page: 1,
  page_size: 10,
  q: '',
  codigo_tienda: '',
  cargo: '',
  estado: '',
  encargado: ''
})

const form = reactive<{
  id: number | null
  cedula_identidad: string
  correo: string
  nombre: string
  /** Debe ser uno de `STORE_EMPLOYEE_CARGOS` al guardar; puede ser legado al cargar edición. */
  cargo: string
  codigo_tienda: string
  estado: number
  encargado: 0 | 1
}>({
  id: null,
  cedula_identidad: '',
  correo: '',
  nombre: '',
  cargo: '',
  codigo_tienda: '',
  estado: 1,
  encargado: 0
})

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / filters.page_size)))

const currentUser = computed(() => authStore.userName || 'frontend.user')

/** Incluye el cargo actual si es legado (no está en el catálogo) para poder editarlo y corregirlo. */
const cargoOptionsForForm = computed(() => {
  const base = cargoOptions.value
  const current = form.cargo.trim()
  if (current && !base.includes(current as StoreEmployeeCargo)) {
    return [current, ...base]
  }
  return base
})

/** Incluye código guardado si aún no está en el catálogo (datos legados). */
const tiendaOptionsForForm = computed((): AlmacenOption[] => {
  const base = almacenesOptions.value
  const c = form.codigo_tienda.trim()
  if (c && !base.some((x) => x.cod_almacen === c)) {
    return [{ cod_almacen: c, label: 'Valor guardado (revisar)' }, ...base]
  }
  return base
})

function tiendaLabel(cod: string): string {
  const c = (cod || '').trim()
  if (!c) return '—'
  const found = almacenesOptions.value.find((a) => a.cod_almacen === c)
  return found ? `${found.label} (${c})` : c
}

function resetForm() {
  isNewEmployeeCollapsed.value = false
  form.id = null
  form.cedula_identidad = ''
  form.correo = ''
  form.nombre = ''
  form.cargo = cargoOptions.value[0] ?? ''
  form.codigo_tienda = ''
  form.estado = 1
  form.encargado = 0
  storeSearchText.value = ''
}

function applyFilters() {
  clearQueryDebounce()
  filters.page = 1
  fetchEmployees()
}

function clearFilters() {
  clearQueryDebounce()
  filters.q = ''
  filters.codigo_tienda = ''
  filters.cargo = ''
  filters.estado = ''
  filters.encargado = ''
  filters.page = 1
  fetchEmployees()
}

function onQueryInput() {
  clearQueryDebounce()
  filters.page = 1
  queryDebounceTimer = window.setTimeout(() => {
    fetchEmployees()
  }, QUERY_DEBOUNCE_MS)
}

function clearQueryDebounce() {
  if (queryDebounceTimer != null) {
    window.clearTimeout(queryDebounceTimer)
    queryDebounceTimer = null
  }
}

function goToPage(page: number) {
  filters.page = page
  fetchEmployees()
}

function parseApiError(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: Record<string, unknown> } }
  const d = err?.response?.data
  if (!d || typeof d !== 'object') return fallback
  const e = d.error
  if (typeof e === 'string') return e
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message?: string }).message === 'string') {
    return (e as { message: string }).message
  }
  if (typeof d.message === 'string') return d.message
  return fallback
}

async function fetchEmployees() {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await listStoreEmployees(filters)
    employees.value = response.items
    total.value = response.total
  } catch (error: unknown) {
    errorMessage.value = parseApiError(error, 'No se pudo cargar el listado de empleados.')
  } finally {
    loading.value = false
  }
}

function editEmployee(employee: StoreEmployee) {
  isNewEmployeeCollapsed.value = false
  form.id = employee.id
  form.cedula_identidad = employee.cedula_identidad || ''
  form.correo = employee.correo || ''
  form.nombre = employee.nombre || ''
  form.cargo = (employee.cargo || '').trim()
  form.codigo_tienda = employee.codigo_tienda || ''
  storeSearchText.value = form.codigo_tienda
  form.estado = Number(employee.estado ?? 1)
  form.encargado = normalizeEncargado(employee.encargado)
  if (form.estado === 0) {
    form.encargado = 0
  }
}

function isInlineEditing(employee: StoreEmployee, field: InlineField): boolean {
  return inlineEdit.id === employee.id && inlineEdit.field === field
}

function startInlineEdit(employee: StoreEmployee, field: InlineField) {
  if (loading.value) return
  inlineEdit.id = employee.id
  inlineEdit.field = field
  inlineEdit.value = String(employee[field] ?? '')
}

function cancelInlineEdit() {
  inlineEdit.id = null
  inlineEdit.field = ''
  inlineEdit.value = ''
}

async function saveInlineEdit(employee: StoreEmployee) {
  if (!isInlineEditing(employee, inlineEdit.field as InlineField)) return
  const field = inlineEdit.field as InlineField
  let value = inlineEdit.value.trim()
  if (field === 'cargo' && !isValidCargo(value)) {
    errorMessage.value = 'Cargo inválido.'
    cancelInlineEdit()
    return
  }
  if (!value) {
    errorMessage.value = 'El valor no puede estar vacío.'
    cancelInlineEdit()
    return
  }
  const current = String(employee[field] ?? '').trim()
  if (current === value) {
    cancelInlineEdit()
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const payload = {
      [field]: value,
      usuario_actual: currentUser.value
    } as Record<string, string>
    await updateStoreEmployee(employee.id, payload)
    ;(employee as unknown as Record<string, unknown>)[field] = value
    cancelInlineEdit()
  } catch (error: unknown) {
    errorMessage.value = parseApiError(error, 'No se pudo guardar la edición inline.')
    cancelInlineEdit()
  } finally {
    loading.value = false
  }
}

/**
 * Permite buscar por letras (nombre) o código y guardar siempre `codigo_tienda`.
 */
function onStoreSearchChange() {
  const raw = storeSearchText.value.trim().toLowerCase()
  if (!raw) {
    form.codigo_tienda = ''
    return
  }
  const byCode = almacenesOptions.value.find((a) => a.cod_almacen.toLowerCase() === raw)
  if (byCode) {
    form.codigo_tienda = byCode.cod_almacen
    storeSearchText.value = byCode.cod_almacen
    return
  }
  const byLabel = almacenesOptions.value.find((a) => a.label.toLowerCase().includes(raw))
  if (byLabel) {
    form.codigo_tienda = byLabel.cod_almacen
    storeSearchText.value = byLabel.cod_almacen
    return
  }
  // Si no hay match en catálogo, se mantiene lo escrito como código manual.
  form.codigo_tienda = storeSearchText.value.trim()
}

/**
 * Si el usuario selecciona una opción exacta (por código), cerrar popup inmediatamente.
 */
function onStoreSearchInput() {
  const raw = storeSearchText.value.trim().toLowerCase()
  if (!raw) return
  const byCode = almacenesOptions.value.find((a) => a.cod_almacen.toLowerCase() === raw)
  if (!byCode) return
  form.codigo_tienda = byCode.cod_almacen
  nextTick(() => {
    storeInputRef.value?.blur()
  })
}

function clearStoreSelection() {
  storeSearchText.value = ''
  form.codigo_tienda = ''
}

function toggleEstado() {
  form.estado = form.estado === 1 ? 0 : 1
}

function toggleEncargado() {
  if (form.estado === 0) return
  form.encargado = form.encargado === 1 ? 0 : 1
}

function toggleNewEmployeeCollapse() {
  isNewEmployeeCollapsed.value = !isNewEmployeeCollapsed.value
}

watch(
  () => form.estado,
  (v) => {
    if (v === 0) {
      form.encargado = 0
    }
  }
)

async function saveEmployee() {
  if (!isValidCargo(form.cargo)) {
    errorMessage.value = 'Seleccione un cargo válido (Administrador de tienda, Jefe de tienda, Director de tienda o Asesor de ventas).'
    return
  }
  if (!form.codigo_tienda.trim()) {
    errorMessage.value = 'Seleccione una tienda (código almacén).'
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const payload = {
      cedula_identidad: form.cedula_identidad,
      correo: form.correo,
      nombre: form.nombre,
      cargo: form.cargo,
      codigo_tienda: form.codigo_tienda,
      estado: form.estado,
      encargado: form.estado === 0 ? 0 : form.encargado,
      usuario_actual: currentUser.value
    }

    if (form.id) {
      await updateStoreEmployee(form.id, payload)
    } else {
      await createStoreEmployee(payload)
    }

    resetForm()
    await fetchEmployees()
  } catch (error: unknown) {
    errorMessage.value = parseApiError(error, 'No se pudo guardar el empleado.')
  } finally {
    loading.value = false
  }
}

async function removeEmployee(employee: StoreEmployee) {
  if (!employee.id || employee.estado === 0) return
  const confirmed = window.confirm(`Se inactivará a ${employee.nombre}. ¿Deseas continuar?`)
  if (!confirmed) return

  loading.value = true
  errorMessage.value = ''
  try {
    await inactivateStoreEmployee(employee.id, currentUser.value)
    await fetchEmployees()
  } catch (error: unknown) {
    errorMessage.value = parseApiError(error, 'No se pudo inactivar el empleado.')
  } finally {
    loading.value = false
  }
}

async function toggleEmployeeEncargado(employee: StoreEmployee) {
  if (!employee.id || employee.estado === 0 || loading.value) return

  loading.value = true
  errorMessage.value = ''
  try {
    const nextEncargado = employee.encargado === 1 ? 0 : 1
    await updateStoreEmployee(employee.id, {
      encargado: nextEncargado,
      usuario_actual: currentUser.value
    })
    employee.encargado = nextEncargado
  } catch (error: unknown) {
    errorMessage.value = parseApiError(error, 'No se pudo actualizar el estado de encargado.')
  } finally {
    loading.value = false
  }
}

async function toggleEmployeeEstado(employee: StoreEmployee) {
  if (!employee.id || loading.value) return

  loading.value = true
  errorMessage.value = ''
  try {
    const nextEstado = employee.estado === 1 ? 0 : 1
    // Regla de negocio: si pasa a inactivo, encargado debe quedar en 0.
    const nextEncargado = nextEstado === 0 ? 0 : employee.encargado
    await updateStoreEmployee(employee.id, {
      estado: nextEstado,
      encargado: nextEncargado,
      usuario_actual: currentUser.value
    })
    employee.estado = nextEstado
    employee.encargado = nextEncargado
  } catch (error: unknown) {
    errorMessage.value = parseApiError(error, 'No se pudo actualizar el estado del empleado.')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  catalogsLoading.value = true
  try {
    serverDown.value = !(await checkStoreEmployeesHealth())
  } catch {
    serverDown.value = true
  }

  try {
    cargoOptions.value = await fetchStoreEmployeeCargos()
  } catch {
    cargoOptions.value = [...STORE_EMPLOYEE_CARGOS]
  }
  try {
    almacenesOptions.value = await fetchStoreAlmacenes()
  } catch {
    almacenesOptions.value = []
  }

  if (!form.cargo && cargoOptions.value.length) {
    form.cargo = cargoOptions.value[0]
  }
  if (!storeSearchText.value && form.codigo_tienda) {
    storeSearchText.value = form.codigo_tienda
  }
  catalogsLoading.value = false
  await fetchEmployees()
})

onBeforeUnmount(() => {
  clearQueryDebounce()
})
</script>
