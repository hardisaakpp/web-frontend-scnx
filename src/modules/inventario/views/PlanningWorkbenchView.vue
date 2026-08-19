<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <section class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Inventario</p>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Generar / Planificar Inventario</h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Seleccione bodega, revise stock base con filtros y cree la planificación.
          </p>
        </div>
        <button class="btn-secondary" type="button" @click="loadInitial">Refrescar</button>
      </div>

      <div v-if="error" class="mt-4 alert-error">{{ error }}</div>
      <div v-if="success" class="mt-4 alert-success">{{ success }}</div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <label class="block md:col-span-2">
          <span class="label">Bodega</span>
          <select v-model="selectedWarehouse" class="input">
            <option value="">Seleccione una bodega</option>
            <option v-for="warehouse in warehouses" :key="warehouse.warehouseCode" :value="warehouse.warehouseCode">
              {{ warehouse.warehouseCode }} - {{ warehouse.name }}
            </option>
          </select>
        </label>
        <label class="block">
          <span class="label">Filtro Level 1</span>
          <input v-model="stockLevel1" class="input" placeholder="Ej: ROPA" />
        </label>
        <label class="block">
          <span class="label">Filtro Level 2</span>
          <input v-model="stockLevel2" class="input" placeholder="Ej: DEPORTIVAS" />
        </label>
      </div>
      <div class="mt-3 flex gap-2">
        <button class="btn-primary" type="button" :disabled="!selectedWarehouse || loadingStock" @click="loadStock">
          {{ loadingStock ? 'Consultando...' : 'Consultar Stock' }}
        </button>
      </div>
    </section>

    <section class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Stock Base Por Bodega</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">GET /api/stock/{warehouseCode}?level1=&level2=</p>
      <div class="mt-4 overflow-x-auto max-h-[300px]">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/60 sticky top-0">
            <tr>
              <th class="th">Item</th>
              <th class="th">Descripción</th>
              <th class="th">Level 1</th>
              <th class="th">Level 2</th>
              <th class="th">Level 3</th>
              <th class="th text-right">Stock</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="row in stockRows" :key="`${row.itemCode}-${row.level1}-${row.level2}`">
              <td class="td">{{ row.itemCode }}</td>
              <td class="td">{{ row.itemDescription || '-' }}</td>
              <td class="td">{{ row.level1 || '-' }}</td>
              <td class="td">{{ row.level2 || '-' }}</td>
              <td class="td">{{ row.level3 || '-' }}</td>
              <td class="td text-right">{{ numberFmt.format(row.systemQuantity || 0) }}</td>
            </tr>
            <tr v-if="stockRows.length === 0">
              <td class="td text-center" colspan="6">Sin datos de stock para los filtros seleccionados.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Crear Planificación</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">POST /api/inventory-plans</p>
      <form class="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" @submit.prevent="createPlan">
        <label class="block md:col-span-2">
          <span class="label">Bodega</span>
          <select v-model="planForm.warehouseCode" class="input" required>
            <option value="">Seleccione una bodega</option>
            <option v-for="warehouse in warehouses" :key="warehouse.warehouseCode" :value="warehouse.warehouseCode">
              {{ warehouse.warehouseCode }} - {{ warehouse.name }}
            </option>
          </select>
        </label>
        <label class="block">
          <span class="label">Fecha Open</span>
          <input v-model="planForm.plannedOpenDate" class="input" type="date" required />
        </label>
        <label class="block">
          <span class="label">Fecha Close</span>
          <input v-model="planForm.plannedCloseDate" class="input" type="date" required />
        </label>
        <label class="block xl:col-span-4">
          <span class="label">Descripción</span>
          <input v-model="planForm.description" class="input" placeholder="Plan piloto recreo" />
        </label>
        <label class="block">
          <span class="label">Level1 (coma)</span>
          <input v-model="planForm.level1Csv" class="input" placeholder="ROPA,CALZADO" />
        </label>
        <label class="block">
          <span class="label">Level2 (coma)</span>
          <input v-model="planForm.level2Csv" class="input" placeholder="DEPORTIVAS,INTERIOR" />
        </label>
        <label class="block">
          <span class="label">Level3 (coma)</span>
          <input v-model="planForm.level3Csv" class="input" placeholder="BOXER" />
        </label>
        <div class="flex items-end">
          <button class="btn-primary w-full" type="submit" :disabled="creatingPlan">
            {{ creatingPlan ? 'Creando...' : 'Crear Plan' }}
          </button>
        </div>
      </form>
    </section>

    <section class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Bandeja de Planificaciones</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">GET /api/inventory-plans</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <select v-model="statusFilter" class="input !w-auto">
            <option value="">Todos los estados</option>
            <option value="Planned">Planned</option>
            <option value="Executed">Executed</option>
          </select>
          <select v-model="warehouseFilter" class="input !w-auto">
            <option value="">Todas las bodegas</option>
            <option v-for="warehouse in warehouses" :key="warehouse.warehouseCode" :value="warehouse.warehouseCode">
              {{ warehouse.warehouseCode }}
            </option>
          </select>
          <button class="btn-secondary" type="button" @click="loadPlans">Filtrar</button>
        </div>
      </div>

      <div class="mt-4 overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/60">
            <tr>
              <th class="th">PlanId</th>
              <th class="th">Bodega</th>
              <th class="th">Descripción</th>
              <th class="th">Ventana</th>
              <th class="th">Estado</th>
              <th class="th">Sesión</th>
              <th class="th text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="plan in plans" :key="plan.planId">
              <td class="td font-mono text-xs">{{ plan.planId }}</td>
              <td class="td">{{ plan.warehouseCode }}</td>
              <td class="td">{{ plan.description || '-' }}</td>
              <td class="td">{{ dateOnly(plan.plannedOpenDate) }} → {{ dateOnly(plan.plannedCloseDate) }}</td>
              <td class="td">{{ plan.status }}</td>
              <td class="td font-mono text-xs">{{ plan.inventorySessionId || '-' }}</td>
              <td class="td text-right">
                <div class="flex justify-end gap-2">
                  <button class="link" type="button" @click="router.push(`/inventario/planificaciones/${plan.planId}`)">Detalle</button>
                  <button v-if="plan.status === 'Planned'" class="link" type="button" @click="executePlan(plan.planId)">
                    Ejecutar
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="plans.length === 0">
              <td class="td text-center" colspan="7">No hay planificaciones para el filtro.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  type CreateInventoryPlanRequest,
  type InventoryPlanDto,
  type ItemStockDto,
  type WarehouseDto,
  scnexusInventoryApi
} from '../services/scnexusInventoryApi'
import { NUMBER_LOCALE } from '@/plugins/locale'

const router = useRouter()
const numberFmt = new Intl.NumberFormat(NUMBER_LOCALE, { maximumFractionDigits: 2 })

const warehouses = ref<WarehouseDto[]>([])
const stockRows = ref<ItemStockDto[]>([])
const plans = ref<InventoryPlanDto[]>([])

const loadingStock = ref(false)
const creatingPlan = ref(false)
const statusFilter = ref('')
const warehouseFilter = ref('')
const selectedWarehouse = ref('')
const stockLevel1 = ref('')
const stockLevel2 = ref('')
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const planForm = reactive({
  warehouseCode: '',
  description: '',
  plannedOpenDate: new Date().toISOString().slice(0, 10),
  plannedCloseDate: new Date().toISOString().slice(0, 10),
  level1Csv: '',
  level2Csv: '',
  level3Csv: ''
})

function csvToList(value: string): string[] | null {
  const parts = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return parts.length ? parts : null
}

function dateOnly(value: string) {
  return value?.slice(0, 10) || '-'
}

async function loadInitial() {
  error.value = null
  success.value = null
  try {
    const [warehouseData, planData] = await Promise.all([
      scnexusInventoryApi.getWarehouses(),
      scnexusInventoryApi.getPlans()
    ])
    warehouses.value = warehouseData
    plans.value = planData
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo cargar la información inicial.'
  }
}

async function loadStock() {
  if (!selectedWarehouse.value) return
  loadingStock.value = true
  error.value = null
  try {
    stockRows.value = await scnexusInventoryApi.getStock(
      selectedWarehouse.value,
      stockLevel1.value,
      stockLevel2.value
    )
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo consultar stock.'
  } finally {
    loadingStock.value = false
  }
}

async function createPlan() {
  creatingPlan.value = true
  error.value = null
  success.value = null
  try {
    const payload: CreateInventoryPlanRequest = {
      warehouseCode: planForm.warehouseCode,
      description: planForm.description || null,
      plannedOpenDate: planForm.plannedOpenDate,
      plannedCloseDate: planForm.plannedCloseDate,
      level1Values: csvToList(planForm.level1Csv),
      level2Values: csvToList(planForm.level2Csv),
      level3Values: csvToList(planForm.level3Csv)
    }

    const created = await scnexusInventoryApi.createPlan(payload)
    success.value = `Plan creado: ${created.planId}`
    planForm.description = ''
    planForm.level1Csv = ''
    planForm.level2Csv = ''
    planForm.level3Csv = ''
    await loadPlans()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo crear la planificación.'
  } finally {
    creatingPlan.value = false
  }
}

async function loadPlans() {
  error.value = null
  try {
    plans.value = await scnexusInventoryApi.getPlans(
      (statusFilter.value || undefined) as 'Planned' | 'Executed' | undefined,
      warehouseFilter.value || undefined
    )
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo cargar la bandeja.'
  }
}

async function executePlan(planId: string) {
  if (!window.confirm('Esta acción ejecutará la planificación y creará una sesión. ¿Continuar?')) return

  error.value = null
  success.value = null
  try {
    const updated = await scnexusInventoryApi.executePlan(planId)
    success.value = `Plan ejecutado. Sesión vinculada: ${updated.inventorySessionId || 'sin sesión'}`
    await loadPlans()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo ejecutar la planificación.'
  }
}

onMounted(loadInitial)
</script>

<style scoped>
.label {
  @apply text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400;
}
.input {
  @apply mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100;
}
.btn-primary {
  @apply inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50;
}
.btn-secondary {
  @apply inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700;
}
.th {
  @apply px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400;
}
.td {
  @apply px-3 py-2 text-sm text-gray-700 dark:text-gray-300 align-top;
}
.link {
  @apply text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300;
}
.alert-error {
  @apply rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300;
}
.alert-success {
  @apply rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 py-2 text-sm text-green-700 dark:text-green-300;
}
</style>
