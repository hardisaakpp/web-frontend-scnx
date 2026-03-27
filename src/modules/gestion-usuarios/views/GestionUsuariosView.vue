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
        <div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Gestión Usuarios</h2>
          <p class="text-sm text-gray-600 dark:text-gray-300">CRUD básico de empleados por tienda.</p>
        </div>
        <button
          class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
          @click="resetForm"
        >
          Nuevo empleado
        </button>
      </div>

      <form class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3" @submit.prevent="applyFilters">
        <input
          v-model="filters.q"
          type="text"
          placeholder="Buscar por nombre, cédula o correo"
          class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
        <select
          v-model="filters.codigo_tienda"
          class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">Todas las tiendas</option>
          <option v-for="a in almacenesOptions" :key="a.cod_almacen" :value="a.cod_almacen">
            {{ a.label }} — {{ a.cod_almacen }}
          </option>
        </select>
        <select
          v-model="filters.cargo"
          class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">Todos los cargos</option>
          <option v-for="c in cargoOptions" :key="c" :value="c">{{ c }}</option>
        </select>
        <select
          v-model="filters.estado"
          class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">Todos</option>
          <option value="1">Activos</option>
          <option value="0">Inactivos</option>
        </select>
        <select
          v-model="filters.encargado"
          class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">Encargado (todos)</option>
          <option value="1">Sí</option>
          <option value="0">No</option>
        </select>

        <div class="md:col-span-2 lg:col-span-3 xl:col-span-5 flex gap-2">
          <button type="submit" class="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-sm">
            Filtrar
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm"
            @click="clearFilters"
          >
            Limpiar
          </button>
        </div>
      </form>
    </section>

    <section class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {{ form.id ? 'Editar empleado' : 'Nuevo empleado' }}
      </h3>
      <form class="grid grid-cols-1 md:grid-cols-2 gap-3" @submit.prevent="saveEmployee">
        <input
          v-model="form.cedula_identidad"
          type="text"
          required
          placeholder="Cédula"
          class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
        <input
          v-model="form.correo"
          type="email"
          required
          placeholder="Correo"
          class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
        <input
          v-model="form.nombre"
          type="text"
          required
          placeholder="Nombre completo"
          class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 md:col-span-2"
        />
        <select
          v-model="form.cargo"
          required
          class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="" disabled>Seleccione cargo</option>
          <option v-for="c in cargoOptionsForForm" :key="c" :value="c">{{ c }}</option>
        </select>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500 dark:text-gray-400">Tienda (código almacén)</label>
          <select
            v-model="form.codigo_tienda"
            required
            class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="" disabled>{{ almacenesOptions.length ? 'Seleccione tienda' : 'Cargando tiendas…' }}</option>
            <option v-for="a in tiendaOptionsForForm" :key="a.cod_almacen" :value="a.cod_almacen">
              {{ a.label }} — {{ a.cod_almacen }}
            </option>
          </select>
          <p v-if="!almacenesOptions.length && !catalogsLoading" class="text-xs text-amber-700 dark:text-amber-300">
            No se pudo cargar el catálogo de tiendas. Revisa <code class="text-xs">meta=almacenes</code>.
          </p>
        </div>
        <select
          v-model.number="form.estado"
          class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option :value="1">Activo</option>
          <option :value="0">Inactivo</option>
        </select>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500 dark:text-gray-400">Encargado</label>
          <select
            v-model.number="form.encargado"
            :disabled="form.estado === 0"
            class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option :value="0">No</option>
            <option :value="1">Sí</option>
          </select>
          <p v-if="form.estado === 0" class="text-xs text-gray-500 dark:text-gray-400">Inactivo: no puede ser encargado.</p>
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

      <div v-if="errorMessage" class="mb-3 text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="text-left border-b dark:border-gray-700">
              <th class="py-2 pr-3">Cédula</th>
              <th class="py-2 pr-3">Nombre</th>
              <th class="py-2 pr-3">Correo</th>
              <th class="py-2 pr-3">Cargo</th>
              <th class="py-2 pr-3">Tienda</th>
              <th class="py-2 pr-3">Encargado</th>
              <th class="py-2 pr-3">Estado</th>
              <th class="py-2 pr-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="employee in employees" :key="employee.id" class="border-b dark:border-gray-800">
              <td class="py-2 pr-3">{{ employee.cedula_identidad }}</td>
              <td class="py-2 pr-3">{{ employee.nombre }}</td>
              <td class="py-2 pr-3">{{ employee.correo }}</td>
              <td class="py-2 pr-3">{{ employee.cargo }}</td>
              <td class="py-2 pr-3">{{ employee.codigo_tienda }}</td>
              <td class="py-2 pr-3">
                <span
                  class="inline-flex px-2 py-1 rounded text-xs"
                  :class="
                    employee.encargado === 1 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                  "
                >
                  {{ employee.encargado === 1 ? 'Sí' : 'No' }}
                </span>
              </td>
              <td class="py-2 pr-3">
                <span
                  class="inline-flex px-2 py-1 rounded text-xs"
                  :class="employee.estado === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'"
                >
                  {{ employee.estado === 1 ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="py-2 pr-3">
                <div class="flex gap-2">
                  <button class="text-blue-600 hover:underline" @click="editEmployee(employee)">Editar</button>
                  <button
                    class="text-red-600 hover:underline"
                    :disabled="employee.estado === 0"
                    @click="removeEmployee(employee)"
                  >
                    Inactivar
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!employees.length">
              <td colspan="8" class="py-4 text-center text-gray-500 dark:text-gray-300">
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
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

const authStore = useAuthStore()

const loading = ref(false)
const catalogsLoading = ref(true)
const serverDown = ref(false)
const errorMessage = ref('')
const employees = ref<StoreEmployee[]>([])
const total = ref(0)
/** Opciones de cargo (API `meta=cargos` o fallback local). */
const cargoOptions = ref<StoreEmployeeCargo[]>([...STORE_EMPLOYEE_CARGOS])
/** Combo tiendas: valor = cod_almacen → campo `codigo_tienda`. */
const almacenesOptions = ref<AlmacenOption[]>([])

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
  form.id = null
  form.cedula_identidad = ''
  form.correo = ''
  form.nombre = ''
  form.cargo = cargoOptions.value[0] ?? ''
  form.codigo_tienda = ''
  form.estado = 1
  form.encargado = 0
}

function applyFilters() {
  filters.page = 1
  fetchEmployees()
}

function clearFilters() {
  filters.q = ''
  filters.codigo_tienda = ''
  filters.cargo = ''
  filters.estado = ''
  filters.encargado = ''
  filters.page = 1
  fetchEmployees()
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
  form.id = employee.id
  form.cedula_identidad = employee.cedula_identidad || ''
  form.correo = employee.correo || ''
  form.nombre = employee.nombre || ''
  form.cargo = (employee.cargo || '').trim()
  form.codigo_tienda = employee.codigo_tienda || ''
  form.estado = Number(employee.estado ?? 1)
  form.encargado = normalizeEncargado(employee.encargado)
  if (form.estado === 0) {
    form.encargado = 0
  }
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
    errorMessage.value = 'Seleccione un cargo válido (Administrador de tienda, Jefe de tienda o Asesor de ventas).'
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
  catalogsLoading.value = false
  await fetchEmployees()
})
</script>
