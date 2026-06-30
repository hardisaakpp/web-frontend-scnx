<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <section class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Toma Física / Detalle</h1>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Crear toma física, registrar conteos/reconteos, monitorear progreso y cerrar con snapshot.
      </p>

      <div v-if="error" class="mt-4 alert-error">{{ error }}</div>
      <div v-if="success" class="mt-4 alert-success">{{ success }}</div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <label class="block md:col-span-2">
          <span class="label">Bodega para nueva sesión</span>
          <select v-model="newSession.warehouseCode" class="input">
            <option value="">Seleccione bodega</option>
            <option v-for="warehouse in warehouses" :key="warehouse.warehouseCode" :value="warehouse.warehouseCode">
              {{ warehouse.warehouseCode }} - {{ warehouse.name }}
            </option>
          </select>
        </label>
        <label class="block md:col-span-2">
          <span class="label">Descripción</span>
          <input v-model="newSession.description" class="input" placeholder="Toma piloto LP-REC" />
        </label>
      </div>
      <div class="mt-3 flex gap-2">
        <button class="btn-primary" type="button" :disabled="creatingSession || !newSession.warehouseCode" @click="createSession">
          {{ creatingSession ? 'Creando...' : 'Crear Toma' }}
        </button>
      </div>
    </section>

    <section class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-4">
      <div class="flex flex-wrap items-end gap-3">
        <label class="block w-full md:w-[420px]">
          <span class="label">SessionId</span>
          <input v-model="sessionId" class="input font-mono text-xs" placeholder="GUID de la sesión" />
        </label>
        <button class="btn-secondary" type="button" :disabled="!sessionId" @click="loadStatus">Ver Estado</button>
      </div>

      <div v-if="status" class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="card-mini"><span class="muted">Bodega</span><strong>{{ status.warehouseCode }}</strong></div>
        <div class="card-mini"><span class="muted">Estado</span><strong>{{ status.status }}</strong></div>
        <div class="card-mini"><span class="muted">Balance</span><strong>{{ status.balanceStatus }}</strong></div>
      </div>

      <div v-if="status" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <form class="rounded-lg border border-gray-200 dark:border-gray-700 p-4" @submit.prevent="addCount">
          <h3 class="font-semibold text-gray-900 dark:text-white">Conteo / Reconteo</h3>
          <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <label class="block md:col-span-2">
              <span class="label">ItemCode</span>
              <input v-model="countForm.itemCode" class="input" required />
            </label>
            <label class="block">
              <span class="label">Cantidad</span>
              <input v-model.number="countForm.quantity" class="input" type="number" min="0.0001" step="0.0001" required />
            </label>
            <label class="block">
              <span class="label">Fuente</span>
              <select v-model="countForm.source" class="input">
                <option value="Manual">Manual</option>
                <option value="Scan">Scan</option>
                <option value="Adjustment">Adjustment</option>
              </select>
            </label>
            <label class="block md:col-span-2">
              <span class="label">ScanCode (opcional)</span>
              <input v-model="countForm.scanCode" class="input" />
            </label>
          </div>
          <button class="btn-primary mt-3" type="submit" :disabled="addingCount">{{ addingCount ? 'Guardando...' : 'Registrar Conteo' }}</button>
        </form>

        <form class="rounded-lg border border-gray-200 dark:border-gray-700 p-4" @submit.prevent="closeSession">
          <h3 class="font-semibold text-gray-900 dark:text-white">Cerrar Toma Física (snapshot)</h3>
          <label class="block mt-3">
            <span class="label">Nota de cierre</span>
            <textarea v-model="closeNote" class="input min-h-[100px]" placeholder="Observaciones de cierre" />
          </label>
          <div class="mt-3 flex gap-2">
            <button class="btn-danger" type="submit" :disabled="closingSession">{{ closingSession ? 'Cerrando...' : 'Cerrar Toma' }}</button>
            <button class="btn-secondary" type="button" :disabled="loadingResults" @click="loadResults">Ver Snapshot</button>
          </div>
        </form>
      </div>

      <div v-if="status" class="overflow-x-auto max-h-[360px]">
        <h3 class="mb-2 font-semibold text-gray-900 dark:text-white">Estado en Tiempo Real (GET /status)</h3>
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/60 sticky top-0">
            <tr>
              <th class="th">Item</th>
              <th class="th">Descripción</th>
              <th class="th text-right">Sistema</th>
              <th class="th text-right">Contado</th>
              <th class="th text-right">Diferencia</th>
              <th class="th">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="line in status.lines" :key="line.itemCode">
              <td class="td">{{ line.itemCode }}</td>
              <td class="td">{{ line.itemDescription || '-' }}</td>
              <td class="td text-right">{{ fmt(line.systemQuantity) }}</td>
              <td class="td text-right">{{ fmt(line.countedQuantity) }}</td>
              <td class="td text-right" :class="line.difference === 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'">
                {{ fmt(line.difference) }}
              </td>
              <td class="td">{{ line.balanceStatus }}</td>
            </tr>
            <tr v-if="status.lines.length === 0">
              <td class="td text-center" colspan="6">Sin líneas aún.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="results.length" class="overflow-x-auto max-h-[300px]">
        <h3 class="mb-2 font-semibold text-gray-900 dark:text-white">Snapshot Cerrado (GET /results)</h3>
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/60 sticky top-0">
            <tr>
              <th class="th">Item</th>
              <th class="th">Descripción</th>
              <th class="th text-right">Sistema</th>
              <th class="th text-right">Contado</th>
              <th class="th text-right">Diferencia</th>
              <th class="th">Balance</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="row in results" :key="row.resultId">
              <td class="td">{{ row.itemCode }}</td>
              <td class="td">{{ row.itemDescription || '-' }}</td>
              <td class="td text-right">{{ fmt(row.systemQuantity) }}</td>
              <td class="td text-right">{{ fmt(row.countedQuantity) }}</td>
              <td class="td text-right">{{ fmt(row.difference) }}</td>
              <td class="td">{{ row.balanceStatus }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  type InventorySessionStatusDto,
  type SessionResultLineDto,
  type WarehouseDto,
  scnexusInventoryApi
} from '../services/scnexusInventoryApi'

const route = useRoute()
const numberFmt = new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 })

const warehouses = ref<WarehouseDto[]>([])
const sessionId = ref('')
const status = ref<InventorySessionStatusDto | null>(null)
const results = ref<SessionResultLineDto[]>([])
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const creatingSession = ref(false)
const addingCount = ref(false)
const closingSession = ref(false)
const loadingResults = ref(false)

const newSession = reactive({
  warehouseCode: '',
  description: ''
})

const countForm = reactive({
  itemCode: '',
  quantity: 1,
  source: 'Manual' as 'Manual' | 'Scan' | 'Adjustment',
  scanCode: ''
})

const closeNote = ref('')

function fmt(value: number) {
  return numberFmt.format(value || 0)
}

async function loadWarehouses() {
  warehouses.value = await scnexusInventoryApi.getWarehouses()
}

async function createSession() {
  creatingSession.value = true
  error.value = null
  success.value = null
  try {
    const created = await scnexusInventoryApi.createSession(newSession.warehouseCode, newSession.description)
    sessionId.value = created.sessionId
    success.value = `Toma física creada: ${created.sessionId}`
    await loadStatus()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo crear la sesión.'
  } finally {
    creatingSession.value = false
  }
}

async function loadStatus() {
  if (!sessionId.value) return
  error.value = null
  try {
    status.value = await scnexusInventoryApi.getSessionStatus(sessionId.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo cargar el estado de sesión.'
  }
}

async function addCount() {
  if (!sessionId.value) return
  addingCount.value = true
  error.value = null
  success.value = null
  try {
    status.value = await scnexusInventoryApi.addCount(sessionId.value, {
      itemCode: countForm.itemCode,
      quantity: countForm.quantity,
      source: countForm.source,
      scanCode: countForm.scanCode || null
    })
    success.value = `Conteo registrado para item ${countForm.itemCode}.`
    countForm.itemCode = ''
    countForm.quantity = 1
    countForm.scanCode = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo registrar el conteo.'
  } finally {
    addingCount.value = false
  }
}

async function closeSession() {
  if (!sessionId.value) return
  if (!window.confirm('Se cerrará la sesión y se congelará el snapshot. ¿Continuar?')) return

  closingSession.value = true
  error.value = null
  success.value = null
  try {
    status.value = await scnexusInventoryApi.closeSession(sessionId.value, closeNote.value)
    success.value = 'Toma física cerrada. Snapshot generado.'
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo cerrar la sesión.'
  } finally {
    closingSession.value = false
  }
}

async function loadResults() {
  if (!sessionId.value) return
  loadingResults.value = true
  error.value = null
  try {
    results.value = await scnexusInventoryApi.getSessionResults(sessionId.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo cargar el snapshot.'
  } finally {
    loadingResults.value = false
  }
}

onMounted(async () => {
  await loadWarehouses()
  const paramSession = String(route.params.sessionId || route.query.sessionId || '')
  if (paramSession) {
    sessionId.value = paramSession
    await loadStatus()
  }
})
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
.btn-danger {
  @apply inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50;
}
.card-mini {
  @apply rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3;
}
.muted {
  @apply block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400;
}
.th {
  @apply px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400;
}
.td {
  @apply px-3 py-2 text-sm text-gray-700 dark:text-gray-300 align-top;
}
.alert-error {
  @apply rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300;
}
.alert-success {
  @apply rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 py-2 text-sm text-green-700 dark:text-green-300;
}
</style>
