<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <!-- Header -->
    <div class="mb-4 flex items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <button type="button" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" @click="router.back()">
            <ChevronLeftIcon class="w-5 h-5" />
          </button>
          <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Inventario</p>
        </div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Conteo de Artículos</h1>
        <p v-if="sessionInfo" class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {{ sessionInfo.warehouseCode }} · {{ sessionInfo.status === 'Recount' ? 'Reconteo' : 'Conteo inicial' }}
        </p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button type="button" class="btn-secondary" :disabled="loading" @click="cargar">
          <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
    </div>

    <!-- Stats bar -->
    <div class="grid grid-cols-2 gap-3 mb-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ lines.length }}</div>
        <div class="text-xs text-gray-500 mt-0.5">Total Artículos</div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
        <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ conCuentaCount }}</div>
        <div class="text-xs text-gray-500 mt-0.5">Con Conteo</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4 flex flex-wrap gap-3 items-end">
      <div class="flex-1 min-w-[160px]">
        <label for="filterLevel2" class="block text-xs font-medium text-gray-500 mb-1">Filtrar por Nivel 2</label>
        <select id="filterLevel2" v-model="filterLevel2" class="select-input w-full">
          <option value="">TODOS</option>
          <option v-for="nv2 in nivel2Options" :key="nv2" :value="nv2">{{ nv2 }}</option>
          <option v-if="hasItemsWithoutLevel2" :value="OTROS_SENTINEL">OTROS CÓDIGOS</option>
        </select>
      </div>
      <div class="flex-[2] min-w-[220px]">
        <label for="search" class="block text-xs font-medium text-gray-500 mb-1">Buscar artículo</label>
        <input id="search" v-model="search" type="text" placeholder="Código o nombre..." class="text-input w-full" />
      </div>
    </div>

    <div v-if="actionMsg" class="mb-4">
      <span :class="['text-xs font-medium', actionMsgError ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400']">
        {{ actionMsg }}
      </span>
    </div>

    <div v-if="error" class="mb-4 alert-error">{{ error }}</div>
    <div v-if="loading && lines.length === 0" class="py-20 text-center text-sm text-gray-400">Cargando artículos...</div>

    <!-- Table -->
    <div v-if="lines.length > 0" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/40">
            <tr>
              <th class="th w-10 text-right">#</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('itemCode')">Código{{ sortIndicator('itemCode') }}</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('barcode')">Cód. Barras{{ sortIndicator('barcode') }}</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('itemDescription')">Nombre{{ sortIndicator('itemDescription') }}</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('level2')">Nivel 2{{ sortIndicator('level2') }}</th>
              <th class="th text-right cursor-pointer select-none" @click="toggleSort('scannedQuantity')">Escaneados{{ sortIndicator('scannedQuantity') }}</th>
              <th class="th text-right w-36 cursor-pointer select-none" @click="toggleSort('manualQuantity')">Cant. Manual{{ sortIndicator('manualQuantity') }}</th>
              <th class="th text-right font-semibold cursor-pointer select-none" @click="toggleSort('total')">Total{{ sortIndicator('total') }}</th>
              <th v-if="!isTienda || sessionInfo?.status === 'Recount'" class="th text-right cursor-pointer select-none" @click="toggleSort('systemQuantity')">Stock SAP{{ sortIndicator('systemQuantity') }}</th>
              <th class="th w-28">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50 dark:divide-gray-700/50">
            <tr
              v-for="(line, idx) in sortedLines"
              :key="line.itemCode"
              :class="[
                'hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors',
                line.isSubmitted ? 'opacity-60' : ''
              ]"
            >
              <td class="td text-right text-xs text-gray-400">{{ idx + 1 }}</td>
              <td class="td font-mono font-medium text-sm">{{ line.itemCode }}</td>
              <td class="td text-xs text-gray-500 font-mono">{{ line.barcode ?? '—' }}</td>
              <td class="td text-sm">{{ line.itemDescription ?? '—' }}</td>
              <td class="td text-xs text-gray-500">{{ line.level2 ?? '—' }}</td>
              <td class="td text-right">
                <span v-if="line.scannedQuantity > 0" class="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                  {{ line.scannedQuantity }}
                </span>
                <span v-else class="text-gray-300 dark:text-gray-600 text-xs">0</span>
              </td>
              <td class="td">
                <input
                  v-if="!line.isSubmitted"
                  type="number"
                  min="0"
                  step="1"
                  :value="manualInputs[line.itemCode] ?? line.manualQuantity"
                  @input="onManualInput(line.itemCode, $event)"
                  @blur="onManualBlur(line.itemCode)"
                  class="qty-input"
                  :class="manualInputStateClass(line.itemCode)"
                />
                <span v-else class="text-right block text-sm text-gray-500">{{ line.manualQuantity }}</span>
              </td>
              <td class="td text-right font-semibold">
                <span :class="totalClass(line)">
                  {{ computedTotal(line) }}
                </span>
              </td>
              <td v-if="!isTienda || sessionInfo?.status === 'Recount'" class="td text-right text-sm text-gray-500">{{ line.systemQuantity }}</td>
              <td class="td">
                <span v-if="line.isSubmitted" class="badge badge-green">Confirmado</span>
                <span v-else-if="computedTotal(line) > 0" class="badge badge-blue">Con conteo</span>
                <span v-else class="badge badge-gray">Pendiente</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ChevronLeftIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'
import { inventarioSesionesService } from '../services/inventarioSesionesApi'
import type { ArticleCountLineDto } from '../services/inventarioSesionesApi'
import { useWarehouseAccessType } from '../composables/useWarehouseAccessType'

const router = useRouter()
const route = useRoute()
const sessionId = route.params.sessionId as string

const { isTienda } = useWarehouseAccessType()

const lines = ref<ArticleCountLineDto[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const actionMsg = ref<string | null>(null)
const actionMsgError = ref(false)
const sessionInfo = ref<{ warehouseCode: string; status: string } | null>(null)

const manualInputs = reactive<Record<string, number>>({})
const pendingManual = ref(new Set<string>())
const savingItems = ref(new Set<string>())
const savedFlash = ref(new Set<string>())
const erroredItems = ref(new Set<string>())

const filterLevel2 = ref('')
const search = ref('')

// Sentinel value for the "OTROS CÓDIGOS" filter option — groups items with no Nivel 2
// classification (e.g. counted items that don't exist in the item master catalog).
const OTROS_SENTINEL = '__OTROS__'

const nivel2Options = computed(() =>
  [...new Set(lines.value.map(l => l.level2).filter(Boolean) as string[])].sort()
)

const hasItemsWithoutLevel2 = computed(() => lines.value.some(l => !l.level2))

const filteredLines = computed(() => {
  let result = lines.value
  if (filterLevel2.value === OTROS_SENTINEL) {
    result = result.filter(l => !l.level2)
  } else if (filterLevel2.value) {
    result = result.filter(l => l.level2 === filterLevel2.value)
  }
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    result = result.filter(l =>
      l.itemCode.toLowerCase().includes(q) ||
      (l.itemDescription ?? '').toLowerCase().includes(q) ||
      (l.barcode ?? '').toLowerCase().includes(q)
    )
  }
  return result
})

type SortKey = 'itemCode' | 'barcode' | 'itemDescription' | 'level2' | 'scannedQuantity' | 'manualQuantity' | 'total' | 'systemQuantity'

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

function sortValue(line: ArticleCountLineDto, key: SortKey): string | number {
  switch (key) {
    case 'manualQuantity': return manualInputs[line.itemCode] ?? line.manualQuantity
    case 'total': return computedTotal(line)
    case 'scannedQuantity': return line.scannedQuantity
    case 'systemQuantity': return line.systemQuantity
    case 'barcode': return line.barcode ?? ''
    case 'itemDescription': return line.itemDescription ?? ''
    case 'level2': return line.level2 ?? ''
    default: return line.itemCode
  }
}

const sortedLines = computed(() => {
  const dir = sortDir.value === 'asc' ? 1 : -1
  const key = sortKey.value
  return [...filteredLines.value].sort((a, b) => {
    const av = sortValue(a, key)
    const bv = sortValue(b, key)
    if (typeof av === 'string' || typeof bv === 'string') {
      return String(av).localeCompare(String(bv)) * dir
    }
    return (av - bv) * dir
  })
})

const conCuentaCount = computed(() => lines.value.filter(l => computedTotal(l) > 0).length)

function computedTotal(line: ArticleCountLineDto): number {
  const manual = manualInputs[line.itemCode] ?? line.manualQuantity
  return line.scannedQuantity + manual
}

function totalClass(line: ArticleCountLineDto) {
  const total = computedTotal(line)
  if (total === 0) return 'text-gray-400 dark:text-gray-600'
  if (total > line.systemQuantity) return 'text-blue-600 dark:text-blue-400'
  if (total < line.systemQuantity) return 'text-amber-600 dark:text-amber-400'
  return 'text-green-600 dark:text-green-400'
}

function onManualInput(itemCode: string, event: Event) {
  const val = parseFloat((event.target as HTMLInputElement).value) || 0
  manualInputs[itemCode] = val
  pendingManual.value.add(itemCode)
  savedFlash.value.delete(itemCode)
  erroredItems.value.delete(itemCode)
}

function onManualBlur(itemCode: string) {
  if (!pendingManual.value.has(itemCode)) return

  // Only send if the value actually changed from what's currently shown on screen
  // (the last value loaded/saved for this line). Otherwise two devices on the same
  // user/session can "resend" a stale unchanged number on blur and wipe out a more
  // recent update from the other device.
  const line = lines.value.find(l => l.itemCode === itemCode)
  const currentValue = manualInputs[itemCode] ?? 0
  const originalValue = line?.manualQuantity ?? 0
  if (currentValue === originalValue) {
    pendingManual.value.delete(itemCode)
    delete manualInputs[itemCode]
    return
  }

  guardarLinea(itemCode)
}

function manualInputStateClass(itemCode: string) {
  if (savingItems.value.has(itemCode)) return 'qty-input-saving'
  if (erroredItems.value.has(itemCode)) return 'qty-input-error'
  if (savedFlash.value.has(itemCode)) return 'qty-input-saved'
  if (pendingManual.value.has(itemCode)) return 'qty-input-pending'
  return ''
}

function showMsg(msg: string, isError = false) {
  actionMsg.value = msg
  actionMsgError.value = isError
  setTimeout(() => { actionMsg.value = null }, 4000)
}

async function cargar() {
  loading.value = true
  error.value = null
  try {
    const data = await inventarioSesionesService.getArticleCounts(sessionId)
    lines.value = data
    if (data.length > 0) {
      // Try to get session info from supervisor summary
      try {
        const summary = await inventarioSesionesService.getSupervisorSummary(sessionId)
        sessionInfo.value = { warehouseCode: summary.warehouseCode, status: summary.status }
      } catch { /* non-critical */ }
    }
    // Clear pending manual edits on reload
    pendingManual.value.clear()
  } catch (e: any) {
    error.value = e.message ?? 'Error al cargar los artículos.'
  } finally {
    loading.value = false
  }
}

async function guardarLinea(itemCode: string) {
  const qty = manualInputs[itemCode] ?? 0
  pendingManual.value.delete(itemCode)
  savingItems.value.add(itemCode)
  erroredItems.value.delete(itemCode)
  try {
    const updated = await inventarioSesionesService.setManualCount(sessionId, itemCode, qty)
    const idx = lines.value.findIndex(l => l.itemCode === itemCode)
    if (idx >= 0) lines.value[idx] = updated
    delete manualInputs[itemCode]
    savingItems.value.delete(itemCode)
    savedFlash.value.add(itemCode)
    setTimeout(() => savedFlash.value.delete(itemCode), 1500)
  } catch (e: any) {
    savingItems.value.delete(itemCode)
    erroredItems.value.add(itemCode)
    showMsg(`Error al guardar ${itemCode}: ${e.message ?? 'error desconocido'}`, true)
  }
}

onMounted(cargar)
</script>

<style scoped>
.th { @apply px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400; }
.td { @apply px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300; }
.btn-secondary { @apply inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.badge { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium; }
.badge-green { @apply bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300; }
.badge-blue { @apply bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300; }
.badge-gray { @apply bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400; }
.alert-error { @apply rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300; }
.qty-input { @apply w-28 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm text-right text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-300; }
.qty-input-pending { @apply border-amber-400 dark:border-amber-500; }
.qty-input-saving { @apply border-blue-400 dark:border-blue-500 opacity-70; }
.qty-input-saved { @apply border-green-500 dark:border-green-500 bg-green-50 dark:bg-green-900/20; }
.qty-input-error { @apply border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20; }
.text-input { @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
.select-input { @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
</style>
