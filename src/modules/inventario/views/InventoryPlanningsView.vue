<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-4 mb-6">
      <VolverButton
        to="/inventario"
        title="Volver al módulo Inventario"
        class="shrink-0 self-start"
      />
      <div>
        <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Inventario</p>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Planificación de Inventario</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Planifica, ejecuta e importa configuraciones. Almacenes y listados filtrados por su marca y bodegas asignadas.
        </p>
      </div>
      <div class="flex w-full flex-wrap items-center justify-end gap-2">
        <button class="btn-secondary" type="button" @click="loadAll">Refrescar</button>
        <button v-if="canEdit" class="btn-primary" type="button" @click="resetForm">Nueva planificación</button>
      </div>
    </div>

    <div v-if="canEdit && !canExecute" class="mb-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200">
      Puede editar planificaciones, pero no ejecutarlas: su usuario no tiene activo «Realiza conteo» en configuración legacy (los administradores sí pueden ejecutar).
    </div>

    <div v-if="message" class="mb-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-300">
      {{ message }}
    </div>
    <div v-if="error" class="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
      {{ error }}
    </div>

    <section v-if="canEdit" class="mb-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ form.id ? 'Editar planificación' : 'Nueva planificación' }}</h2>
        <label class="btn-secondary cursor-pointer">
          Importar CSV
          <input class="hidden" type="file" accept=".csv,text/csv" @change="importCsv" />
        </label>
      </div>

      <form class="space-y-4" @submit.prevent="save">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <label class="block xl:col-span-2">
            <span class="label">Nombre</span>
            <input v-model="form.name" class="input" required maxlength="150" />
          </label>
          <label class="block">
            <span class="label">Fecha generación</span>
            <input v-model="form.generationDate" class="input" type="date" required />
          </label>
          <label class="block">
            <span class="label">Fecha finalización</span>
            <input v-model="form.finalizationDate" class="input" type="date" />
          </label>
        </div>

        <label class="block">
          <span class="label">Descripción</span>
          <textarea v-model="form.description" class="input min-h-[72px]" />
        </label>

        <div class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <label class="block">
            <span class="label">Tipo</span>
            <select v-model="form.inventoryType" class="input">
              <option :value="INVENTORY_TYPE_TOTAL">Total (TT) — todo el stock SAP</option>
              <option :value="INVENTORY_TYPE_PARTIAL">Parcial — por categoría/subcategoría</option>
            </select>
            <span class="hint">{{ isTotalType ? 'Sin categorías ni subcategorías.' : 'Requiere al menos una categoría o subcategoría.' }}</span>
          </label>
          <label class="block">
            <span class="label">Frecuencia</span>
            <select v-model="form.frequency" class="input">
              <option value="">Sin frecuencia</option>
              <option value="DIARIO">Diario</option>
              <option value="SEMANAL">Semanal</option>
              <option value="MENSUAL">Mensual</option>
              <option value="TRIMESTRAL">Trimestral</option>
              <option value="ANUAL">Anual</option>
            </select>
          </label>
          <label class="block">
            <span class="label">Día mes</span>
            <input v-model.number="form.dayOfMonth" class="input" type="number" min="1" max="31" />
          </label>
          <label class="block">
            <span class="label">Día semana</span>
            <input v-model.number="form.dayOfWeek" class="input" type="number" min="1" max="7" />
          </label>
          <label class="flex items-center gap-2 pt-6">
            <input v-model="form.recurring" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600" />
            <span class="text-sm text-gray-700 dark:text-gray-300">Recurrente</span>
          </label>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <label class="block">
            <span class="label">Almacenes (su alcance)</span>
            <select v-model="form.warehouseIds" class="input min-h-[160px]" multiple required>
              <option v-for="warehouse in catalog.warehouses" :key="warehouse.id" :value="warehouse.id">
                {{ warehouse.display_name || `${warehouse.code} ${warehouse.name}` }}
              </option>
            </select>
            <span class="hint">{{ form.warehouseIds.length }} seleccionados · solo almacenes de su marca/bodegas</span>
          </label>
          <label class="block" :class="{ 'opacity-60': isTotalType }">
            <span class="label">Categorías</span>
            <select
              v-model="form.categories"
              class="input min-h-[160px]"
              multiple
              :disabled="isTotalType"
            >
              <option v-for="category in catalog.categories" :key="category" :value="category">{{ category }}</option>
            </select>
            <span v-if="isTotalType" class="hint">No aplica en inventario total (TT)</span>
          </label>
          <label class="block" :class="{ 'opacity-60': isTotalType }">
            <span class="label">Subcategorías</span>
            <select
              v-model="form.subcategories"
              class="input min-h-[160px]"
              multiple
              :disabled="isTotalType"
            >
              <option v-for="subcategory in catalog.subcategories" :key="subcategory" :value="subcategory">{{ subcategory }}</option>
            </select>
            <span v-if="isTotalType" class="hint">No aplica en inventario total (TT)</span>
          </label>
        </div>

        <div class="flex justify-end gap-2">
          <button class="btn-secondary" type="button" @click="resetForm">Limpiar</button>
          <button class="btn-primary" type="submit" :disabled="saving">{{ saving ? 'Guardando...' : 'Guardar' }}</button>
        </div>
      </form>
    </section>

    <section class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Planificaciones activas</h2>
        <input
          v-model="search"
          type="search"
          placeholder="Buscar nombre, tipo, estado..."
          class="search-input w-56"
        />
      </div>
      <div v-if="loading" class="p-6 text-gray-600 dark:text-gray-300">Cargando planificaciones...</div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/60">
            <tr>
              <th class="th cursor-pointer select-none" @click="toggleSort('name')">Nombre{{ sortIndicator('name') }}</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('inventory_type')">Tipo{{ sortIndicator('inventory_type') }}</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('generation_date')">Generación{{ sortIndicator('generation_date') }}</th>
              <th class="th">Almacenes</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('status')">Estado{{ sortIndicator('status') }}</th>
              <th class="th text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="planning in sortedPlannings" :key="planning.id">
              <td class="td">
                <div class="font-medium text-gray-900 dark:text-white">{{ planning.name }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{{ planning.description || 'Sin descripción' }}</div>
              </td>
              <td class="td">{{ inventoryTypeLabel(planning.inventory_type) }}</td>
              <td class="td">{{ formatDate(planning.generation_date) }}</td>
              <td class="td">{{ planning.total_warehouses }} <span class="text-xs text-gray-500">{{ planning.warehouses }}</span></td>
              <td class="td">
                <span class="rounded-full px-2 py-1 text-xs font-medium" :class="planning.status === 'ACTIVO' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'">
                  {{ planning.status }}
                </span>
              </td>
              <td class="td">
                <div class="flex flex-wrap justify-end gap-2">
                  <button v-if="canEdit" class="link" type="button" @click="edit(planning.id)">Editar</button>
                  <button
                    v-if="canExecute"
                    class="link"
                    type="button"
                    :title="executeHint"
                    @click="execute(planning.id)"
                  >
                    Ejecutar
                  </button>
                  <button v-if="canEdit" class="link" type="button" @click="toggle(planning)">Estado</button>
                  <button v-if="canEdit" class="link-danger" type="button" @click="remove(planning.id)">Eliminar</button>
                </div>
              </td>
            </tr>
            <tr v-if="plannings.length === 0">
              <td class="td text-center" colspan="6">No hay planificaciones registradas en su alcance.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import VolverButton from '@/components/navegacion/VolverButton.vue'
import { inventarioService } from '../services/inventarioApi'
import { useInventarioPermissions } from '../composables/useInventarioPermissions'
import type { CatalogDataDto, InventoryPlanningSummaryDto, SaveInventoryPlanningRequest } from '../types'
import {
  INVENTORY_TYPE_PARTIAL,
  INVENTORY_TYPE_TOTAL,
  inventoryTypeLabel,
  isTotalInventoryType,
  normalizePlanningFormForType,
  validatePlanningForm
} from '../utils/planningRules'

const { canEdit, canExecute } = useInventarioPermissions()

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const message = ref<string | null>(null)
const plannings = ref<InventoryPlanningSummaryDto[]>([])

const search = ref('')

type PlanningSortKey = 'name' | 'inventory_type' | 'generation_date' | 'status'
const sortKey = ref<PlanningSortKey>('name')
const sortDir = ref<'asc' | 'desc'>('asc')

function toggleSort(key: PlanningSortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

function sortIndicator(key: PlanningSortKey) {
  if (sortKey.value !== key) return ''
  return sortDir.value === 'asc' ? ' ▲' : ' ▼'
}

const filteredPlannings = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return plannings.value
  return plannings.value.filter(p =>
    p.name.toLowerCase().includes(q) ||
    inventoryTypeLabel(p.inventory_type).toLowerCase().includes(q) ||
    p.status.toLowerCase().includes(q)
  )
})

const sortedPlannings = computed(() => {
  const dir = sortDir.value === 'asc' ? 1 : -1
  const key = sortKey.value
  return [...filteredPlannings.value].sort((a, b) => {
    const av = a[key] ?? ''
    const bv = b[key] ?? ''
    return String(av).localeCompare(String(bv)) * dir
  })
})
const catalog = reactive<CatalogDataDto>({ warehouses: [], categories: [], subcategories: [] })

const executeHint =
  'Genera inventarios; requiere que todos los almacenes de la planificación estén en su alcance y permiso de ejecución.'

const form = reactive<SaveInventoryPlanningRequest>({
  id: null,
  name: '',
  description: '',
  generationDate: new Date().toISOString().slice(0, 10),
  finalizationDate: '',
  inventoryType: INVENTORY_TYPE_TOTAL,
  recurring: false,
  frequency: '',
  dayOfMonth: null,
  dayOfWeek: null,
  monthOfYear: null,
  warehouseIds: [],
  categories: [],
  subcategories: []
})

const isTotalType = computed(() => isTotalInventoryType(form.inventoryType))

watch(
  () => form.inventoryType,
  () => {
    normalizePlanningFormForType(form)
  }
)

async function loadAll() {
  loading.value = true
  error.value = null
  try {
    const [catalogData, planningData] = await Promise.all([
      inventarioService.getPlanningCatalog(),
      inventarioService.getPlannings()
    ])
    Object.assign(catalog, catalogData)
    plannings.value = planningData
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'No se pudo cargar planificación.'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.id = null
  form.name = ''
  form.description = ''
  form.generationDate = new Date().toISOString().slice(0, 10)
  form.finalizationDate = ''
  form.inventoryType = INVENTORY_TYPE_TOTAL
  form.recurring = false
  form.frequency = ''
  form.dayOfMonth = null
  form.dayOfWeek = null
  form.monthOfYear = null
  form.warehouseIds = []
  form.categories = []
  form.subcategories = []
  message.value = null
}

async function edit(id: number) {
  error.value = null
  try {
    const detail = await inventarioService.getPlanning(id)
    form.id = detail.id
    form.name = detail.name
    form.description = detail.description || ''
    form.generationDate = toDateInput(detail.generation_date)
    form.finalizationDate = toDateInput(detail.finalization_date)
    form.inventoryType = detail.inventory_type
    form.recurring = detail.recurring
    form.frequency = detail.frequency || ''
    form.dayOfMonth = detail.day_of_month
    form.dayOfWeek = detail.day_of_week
    form.monthOfYear = detail.month_of_year
    form.warehouseIds = [...detail.warehouse_ids]
    form.categories = [...detail.categories]
    form.subcategories = [...detail.subcategories]
    normalizePlanningFormForType(form)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'No se pudo cargar el detalle de planificación.'
  }
}

async function save() {
  normalizePlanningFormForType(form)
  const validationError = validatePlanningForm(form)
  if (validationError) {
    error.value = validationError
    return
  }

  saving.value = true
  error.value = null
  message.value = null
  try {
    await inventarioService.savePlanning({
      ...form,
      finalizationDate: form.finalizationDate || null,
      frequency: form.frequency || null,
      dayOfMonth: form.dayOfMonth || null,
      dayOfWeek: form.dayOfWeek || null,
      monthOfYear: form.monthOfYear || null
    })
    message.value = 'Planificación guardada correctamente.'
    resetForm()
    await loadAll()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'No se pudo guardar la planificación.'
  } finally {
    saving.value = false
  }
}

async function execute(id: number) {
  if (!window.confirm('¿Ejecutar esta planificación y generar inventarios?')) return
  error.value = null
  message.value = null
  try {
    const result = await inventarioService.executePlanning(id)
    const errorSummary = result.errors?.length ? ` Errores: ${result.errors.slice(0, 3).join(' | ')}` : ''
    message.value = `Ejecución finalizada. Inventarios generados: ${result.generated_count}.${errorSummary}`
    await loadAll()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'No se pudo ejecutar la planificación.'
  }
}

async function toggle(planning: InventoryPlanningSummaryDto) {
  const nextStatus = planning.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
  error.value = null
  try {
    await inventarioService.togglePlanningStatus(planning.id, nextStatus)
    message.value = `Estado actualizado a ${nextStatus}.`
    await loadAll()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'No se pudo actualizar el estado.'
  }
}

async function remove(id: number) {
  if (!window.confirm('¿Eliminar esta planificación? Se registrará historial de auditoría (ELIMINADO).')) return
  error.value = null
  try {
    await inventarioService.deletePlanning(id)
    message.value = 'Planificación eliminada correctamente.'
    await loadAll()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'No se pudo eliminar la planificación.'
  }
}

async function importCsv(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  error.value = null
  message.value = null
  try {
    const result = await inventarioService.importPlannings(file)
    message.value = `CSV procesado. Importadas: ${result.imported}. Errores: ${result.errors.length}.`
    if (result.errors.length > 0) {
      error.value = result.errors.slice(0, 5).join(' | ')
    }
    await loadAll()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'No se pudo importar el CSV.'
  } finally {
    input.value = ''
  }
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}

function toDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : ''
}

onMounted(loadAll)
</script>

<style scoped>
.label {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}
.hint {
  @apply mt-1 block text-xs text-gray-500 dark:text-gray-400;
}
.input {
  @apply mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500;
}
.search-input {
  @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500;
}
.btn-primary {
  @apply inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed;
}
.btn-secondary {
  @apply inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700;
}
.th {
  @apply px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400;
}
.td {
  @apply px-4 py-3 text-sm text-gray-700 dark:text-gray-300 align-top;
}
.link {
  @apply text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300;
}
.link-danger {
  @apply text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300;
}
</style>
