<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="mb-6 flex items-start justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Inventario</p>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Consultar Stock</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Stock por bodega según sc_maestros, con la fecha de su última actualización.
        </p>
      </div>
      <router-link to="/inventario/planes" class="btn-secondary flex-shrink-0">Volver</router-link>
    </div>

    <div class="mb-4 flex items-end gap-3 flex-wrap">
      <div>
        <label class="lbl" for="bodega">Bodega</label>
        <select id="bodega" v-model="bodega" class="select-input w-72" @change="consultar">
          <option value="" disabled>Seleccione una bodega</option>
          <option v-for="w in bodegas" :key="w.code" :value="w.code">{{ w.code }} — {{ w.name }}</option>
        </select>
      </div>
      <button type="button" class="btn-primary" :disabled="!bodega || loading || sincronizando" @click="consultar">
        {{ loading ? 'Consultando...' : 'Consultar' }}
      </button>
      <button type="button" class="btn-secondary" :disabled="!bodega || loading || sincronizando" @click="actualizarStock">
        {{ sincronizando ? 'Actualizando...' : 'Actualizar stock' }}
      </button>
    </div>

    <div v-if="error" class="mb-4 alert-error">{{ error }}</div>

    <template v-if="consultado">
      <div class="mb-4 flex items-center gap-x-6 gap-y-2 flex-wrap text-sm text-gray-700 dark:text-gray-300">
        <span><strong class="text-lg">{{ totalStock.toLocaleString('es') }}</strong> stock total</span>
        <span><strong class="text-lg">{{ filas.length.toLocaleString('es') }}</strong> ítems</span>
        <span class="text-gray-500 dark:text-gray-400">Actualizado: {{ lastSync ? formatDateTime(lastSync) : 'sin registro' }}</span>
      </div>

      <div class="mb-4 flex items-center gap-3 flex-wrap">
        <input
          v-model="search"
          type="search"
          placeholder="Buscar ítem, descripción..."
          class="search-input w-64"
        />
        <select v-model="fLevel1" class="select-input">
          <option value="">Level 1 (todos)</option>
          <option v-for="v in opcionesLevel1" :key="v" :value="v">{{ v }}</option>
        </select>
        <select v-model="fLevel2" class="select-input">
          <option value="">Level 2 (todos)</option>
          <option v-for="v in opcionesLevel2" :key="v" :value="v">{{ v }}</option>
        </select>
        <select v-model="fLevel3" class="select-input">
          <option value="">Level 3 (todos)</option>
          <option v-for="v in opcionesLevel3" :key="v" :value="v">{{ v }}</option>
        </select>
        <span v-if="filtroActivo" class="text-xs text-gray-500 dark:text-gray-400">
          {{ filasFiltradas.length.toLocaleString('es') }} ítems / {{ stockFiltrado.toLocaleString('es') }} stock con el filtro
        </span>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div v-if="loading" class="py-16 text-center text-sm text-gray-500 dark:text-gray-400">Cargando...</div>
        <div v-else-if="filasFiltradas.length === 0" class="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
          Sin stock para la bodega y filtros seleccionados.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900/60">
              <tr>
                <th class="th cursor-pointer select-none" @click="toggleSort('itemCode')">Ítem{{ sortIndicator('itemCode') }}</th>
                <th class="th cursor-pointer select-none" @click="toggleSort('itemDescription')">Descripción{{ sortIndicator('itemDescription') }}</th>
                <th class="th cursor-pointer select-none" @click="toggleSort('level1')">Level 1{{ sortIndicator('level1') }}</th>
                <th class="th cursor-pointer select-none" @click="toggleSort('level2')">Level 2{{ sortIndicator('level2') }}</th>
                <th class="th cursor-pointer select-none" @click="toggleSort('level3')">Level 3{{ sortIndicator('level3') }}</th>
                <th class="th text-right cursor-pointer select-none" @click="toggleSort('systemQuantity')">Stock{{ sortIndicator('systemQuantity') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="row in filasOrdenadas" :key="row.itemCode">
                <td class="td font-mono text-xs">{{ row.itemCode }}</td>
                <td class="td">{{ row.itemDescription || '—' }}</td>
                <td class="td text-xs">{{ row.level1 || '—' }}</td>
                <td class="td text-xs">{{ row.level2 || '—' }}</td>
                <td class="td text-xs">{{ row.level3 || '—' }}</td>
                <td class="td text-right font-medium">{{ row.systemQuantity.toLocaleString('es') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { inventarioSesionesService } from '../services/inventarioSesionesApi'
import { scnexusInventoryApi, type ItemStockDto } from '../services/scnexusInventoryApi'
import type { WarehouseSimpleDto } from '../types'

const bodegas = ref<WarehouseSimpleDto[]>([])
const bodega = ref('')
const filas = ref<ItemStockDto[]>([])
const lastSync = ref<string | null>(null)
const loading = ref(false)
const sincronizando = ref(false)
const consultado = ref(false)
const error = ref<string | null>(null)

const search = ref('')
const fLevel1 = ref('')
const fLevel2 = ref('')
const fLevel3 = ref('')

type SortKey = 'itemCode' | 'itemDescription' | 'level1' | 'level2' | 'level3' | 'systemQuantity'
const sortKey = ref<SortKey>('itemCode')
const sortDir = ref<'asc' | 'desc'>('asc')

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

function sortIndicator(key: SortKey) {
  if (sortKey.value !== key) return ''
  return sortDir.value === 'asc' ? ' ▲' : ' ▼'
}

const opciones = (selector: (r: ItemStockDto) => string | null | undefined) =>
  [...new Set(filas.value.map(selector).filter((v): v is string => !!v))].sort((a, b) => a.localeCompare(b))

const opcionesLevel1 = computed(() => opciones(r => r.level1))
const opcionesLevel2 = computed(() => opciones(r => r.level2))
const opcionesLevel3 = computed(() => opciones(r => r.level3))

const filtroActivo = computed(() => !!(search.value.trim() || fLevel1.value || fLevel2.value || fLevel3.value))

const filasFiltradas = computed(() => {
  const q = search.value.trim().toLowerCase()
  return filas.value.filter(r =>
    (!q || r.itemCode.toLowerCase().includes(q) || (r.itemDescription ?? '').toLowerCase().includes(q)) &&
    (!fLevel1.value || r.level1 === fLevel1.value) &&
    (!fLevel2.value || r.level2 === fLevel2.value) &&
    (!fLevel3.value || r.level3 === fLevel3.value)
  )
})

const filasOrdenadas = computed(() => {
  const dir = sortDir.value === 'asc' ? 1 : -1
  const key = sortKey.value
  return [...filasFiltradas.value].sort((a, b) => {
    if (key === 'systemQuantity') return (a.systemQuantity - b.systemQuantity) * dir
    return String(a[key] ?? '').localeCompare(String(b[key] ?? '')) * dir
  })
})

const totalStock = computed(() => filas.value.reduce((acc, r) => acc + r.systemQuantity, 0))
const stockFiltrado = computed(() => filasFiltradas.value.reduce((acc, r) => acc + r.systemQuantity, 0))

function formatDateTime(value: string): string {
  const d = new Date(value)
  return d.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: '2-digit' })
    + ' ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

async function consultar() {
  if (!bodega.value) return
  loading.value = true
  error.value = null
  search.value = ''
  fLevel1.value = ''
  fLevel2.value = ''
  fLevel3.value = ''
  try {
    const [stock, sync] = await Promise.all([
      scnexusInventoryApi.getStock(bodega.value),
      inventarioSesionesService.getWarehouseLastSync(bodega.value).catch(() => ({ lastSyncAt: null }))
    ])
    filas.value = stock
    lastSync.value = sync.lastSyncAt
    consultado.value = true
  } catch (e: any) {
    error.value = e.message ?? 'Error al consultar el stock.'
  } finally {
    loading.value = false
  }
}

// Ejecuta el SP de sincronización SAP → sc_maestros (sp_sync_stock_sap_warehouse) para la
// bodega elegida y reconsulta stock + fecha, así el usuario ve el dato recién actualizado.
async function actualizarStock() {
  if (!bodega.value) return
  sincronizando.value = true
  error.value = null
  try {
    await inventarioSesionesService.syncWarehouseStock(bodega.value)
    await consultar()
  } catch (e: any) {
    error.value = e.message ?? 'Error al actualizar el stock.'
  } finally {
    sincronizando.value = false
  }
}

onMounted(async () => {
  try {
    bodegas.value = await inventarioSesionesService.getWarehouses()
  } catch (e: any) {
    error.value = e.message ?? 'Error al cargar bodegas.'
  }
})
</script>

<style scoped>
.btn-primary { @apply inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed; }
.btn-secondary { @apply inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.lbl { @apply block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1; }
.alert-error { @apply rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300; }
.th { @apply px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400; }
.td { @apply px-3 py-2 text-sm text-gray-700 dark:text-gray-300; }
.select-input { @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-2 text-sm text-gray-700 dark:text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
.search-input { @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
</style>
