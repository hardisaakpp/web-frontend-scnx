<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <!-- Header -->
    <div class="mb-5 flex items-start justify-between gap-4 flex-wrap">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <button type="button" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" @click="router.back()">
            <ChevronLeftIcon class="w-5 h-5" />
          </button>
          <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Inventario</p>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-wide uppercase">
          TOMA FÍSICA{{ stats ? ' · ' + stats.total.toLocaleString() + ' SKUs' : '' }}
        </h1>
        <p v-if="warehouseName" class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{{ warehouseName }}</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <router-link
          v-if="canGestionarScans"
          :to="`/inventario/sesiones/${sessionId}/gestion-scans`"
          class="btn-secondary"
        >
          <ShieldExclamationIcon class="w-4 h-4 mr-1" />
          Gestión de Scans
        </router-link>
        <button type="button" class="btn-secondary" :disabled="loadingStats" @click="cargarStats">
          <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': loadingStats }" />
        </button>
      </div>
    </div>

    <div v-if="error" class="mb-4 alert-error">{{ error }}</div>
    <div v-if="loadingStats && !stats" class="py-20 text-center text-sm text-gray-500 dark:text-gray-400">Cargando estadísticas...</div>

    <template v-if="stats">
      <!-- Stat cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <!-- Consolidado: download-only -->
        <button
          type="button"
          :class="['stat-card', downloadingAll ? 'opacity-60 cursor-wait' : 'hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600']"
          :disabled="downloadingAll"
          @click="descargarConsolidado"
        >
          <ArrowDownTrayIcon class="w-8 h-8 mb-1 text-blue-500" />
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ stats.total.toLocaleString() }}</div>
          <div class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-0.5">
            {{ downloadingAll ? 'Descargando...' : 'Consolidado ↓' }}
          </div>
        </button>

        <button
          v-for="card in FILTER_CARDS"
          :key="card.filter"
          type="button"
          :class="['stat-card', activeFilter === card.filter ? 'ring-2 ring-blue-500 dark:ring-blue-400' : 'hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600']"
          @click="setFilter(card.filter)"
        >
          <ShoppingCartIcon class="w-8 h-8 mb-1" :class="card.iconClass" />
          <div class="text-2xl font-bold" :class="card.numClass">{{ card.count.toLocaleString() }}</div>
          <div class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-0.5">{{ card.label }}</div>
        </button>
      </div>

      <!-- Lines section: only shown when a filter tab has been selected -->
      <div v-if="activeFilter" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
        <!-- Toolbar -->
        <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-3">
          <!-- Filter chips -->
          <div class="flex gap-1.5 flex-wrap">
            <button
              v-for="card in FILTER_CARDS"
              :key="card.filter"
              type="button"
              :class="['px-3 py-1 rounded-full text-xs font-semibold border transition-colors',
                activeFilter === card.filter
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400']"
              @click="setFilter(card.filter)"
            >{{ card.label }} ({{ card.count.toLocaleString() }})</button>
          </div>

          <div class="flex-1" />

          <!-- Search -->
          <input
            v-model="search"
            type="search"
            placeholder="Buscar código, descripción..."
            class="search-input w-52"
          />

          <!-- Download filtered -->
          <button type="button" class="btn-secondary text-xs py-1.5" :disabled="loadingLines || lines.length === 0" @click="descargarFiltrado">
            <ArrowDownTrayIcon class="w-3.5 h-3.5 mr-1" />
            Descargar {{ activeLabelShort }}
          </button>
        </div>

        <!-- Loading indicator for lines -->
        <div v-if="loadingLines" class="py-16 text-center text-sm text-gray-400 dark:text-gray-600">
          Cargando {{ activeLabelShort }}...
        </div>

        <template v-else>
          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              <thead class="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                <tr>
                  <th class="th cursor-pointer select-none" @click="toggleSort('nivel1')">Nivel 1{{ sortIndicator('nivel1') }}</th>
                  <th class="th cursor-pointer select-none" @click="toggleSort('nivel2')">Nivel 2{{ sortIndicator('nivel2') }}</th>
                  <th class="th cursor-pointer select-none" @click="toggleSort('nivel3')">Nivel 3{{ sortIndicator('nivel3') }}</th>
                  <th class="th cursor-pointer select-none" @click="toggleSort('familia')">Género{{ sortIndicator('familia') }}</th>
                  <th class="th cursor-pointer select-none" @click="toggleSort('barcode')">Cód. Barras{{ sortIndicator('barcode') }}</th>
                  <th class="th cursor-pointer select-none" @click="toggleSort('itemCode')">Item Code{{ sortIndicator('itemCode') }}</th>
                  <th class="th cursor-pointer select-none" @click="toggleSort('description')">Descripción{{ sortIndicator('description') }}</th>
                  <th class="th text-right cursor-pointer select-none" @click="toggleSort('systemQuantity')">Stock{{ sortIndicator('systemQuantity') }}</th>
                  <th class="th text-right cursor-pointer select-none" @click="toggleSort('countedQuantity')">Scan{{ sortIndicator('countedQuantity') }}</th>
                  <th class="th text-right cursor-pointer select-none" @click="toggleSort('difference')">Diferencia{{ sortIndicator('difference') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50 dark:divide-gray-700/50">
                <tr v-if="pagedLines.length === 0">
                  <td colspan="10" class="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-600">Sin resultados.</td>
                </tr>
                <tr
                  v-for="row in pagedLines"
                  :key="row.itemCode"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700/20"
                  :class="rowClass(row.status)"
                >
                  <td class="td text-xs">{{ row.nivel1 ?? '—' }}</td>
                  <td class="td text-xs">{{ row.nivel2 ?? '—' }}</td>
                  <td class="td text-xs font-medium">{{ row.nivel3 ?? '—' }}</td>
                  <td class="td text-xs">{{ row.familia ?? '—' }}</td>
                  <td class="td font-mono text-xs">{{ row.barcode ?? '—' }}</td>
                  <td class="td font-mono text-xs font-semibold">{{ row.itemCode }}</td>
                  <td class="td max-w-xs truncate">{{ row.description ?? '—' }}</td>
                  <td class="td text-right font-mono">{{ fmtQty(row.systemQuantity) }}</td>
                  <td class="td text-right font-mono whitespace-nowrap" :class="row.countedQuantity > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'">
                    <span
                      v-if="row.notCounted"
                      class="mr-1.5 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-sans font-semibold uppercase tracking-wide bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      title="Nadie registró esta referencia: se toma como faltante completo"
                    >Sin conteo</span>{{ fmtQty(row.countedQuantity) }}
                  </td>
                  <td class="td text-right font-mono font-semibold" :class="diffClass(row.difference)">
                    {{ row.difference === 0 ? '—' : (row.difference > 0 ? '+' : '') + fmtQty(row.difference) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>Mostrando {{ pageStart + 1 }}–{{ Math.min(pageStart + pageSize, filteredLines.length) }} de {{ filteredLines.length.toLocaleString() }}</span>
            <div class="flex items-center gap-2">
              <select v-model="pageSize" class="date-input text-xs py-1">
                <option :value="50">50</option>
                <option :value="100">100</option>
                <option :value="200">200</option>
              </select>
              <button class="pag-btn" :disabled="page === 0" @click="page--">‹</button>
              <span>{{ page + 1 }} / {{ totalPages }}</span>
              <button class="pag-btn" :disabled="page >= totalPages - 1" @click="page++">›</button>
            </div>
          </div>
        </template>
      </div>

      <!-- Empty state when no tab selected yet -->
      <div v-else class="mb-6 py-10 text-center text-sm text-gray-400 dark:text-gray-600 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        Selecciona una categoría para ver el detalle, o haz clic en <strong>Consolidado ↓</strong> para descargar todos los artículos.
      </div>

      <!-- Scans por usuario -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Scans por usuario
            <button type="button" class="ml-3 text-blue-600 dark:text-blue-400 normal-case font-normal text-xs hover:underline" @click="cargarScans">
              {{ scansData ? 'Actualizar' : 'Cargar' }}
            </button>
          </h2>
          <div v-if="scansData" class="flex items-center gap-2 flex-wrap">
            <select v-model="scanRound" class="search-input text-xs py-1 w-40" title="Conteo inicial (ronda 1) o reconteo (ronda 2)">
              <option :value="0">Conteo + reconteo</option>
              <option :value="1">Solo conteo (ronda 1)</option>
              <option :value="2">Solo reconteo (ronda 2)</option>
            </select>
            <button
              type="button"
              :class="['px-3 py-1 rounded-full text-xs font-semibold border transition-colors', scanTab === 'summary' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300']"
              @click="scanTab = 'summary'"
            >Resumen</button>
            <button
              type="button"
              :class="['px-3 py-1 rounded-full text-xs font-semibold border transition-colors', scanTab === 'detail' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300']"
              @click="scanTab = 'detail'"
            >Detalle</button>
            <button type="button" class="btn-secondary text-xs py-1.5 ml-2" @click="descargarScans">
              <ArrowDownTrayIcon class="w-3.5 h-3.5 mr-1" />
              Descargar {{ scanTab === 'summary' ? 'resumen' : 'detalle' }}
            </button>
          </div>
        </div>

        <div v-if="!scansData && !loadingScans" class="py-10 text-center text-sm text-gray-400 dark:text-gray-600">
          Haz clic en "Cargar" para ver los scans por usuario.
        </div>
        <div v-if="loadingScans" class="py-10 text-center text-sm text-gray-400 dark:text-gray-600">Cargando...</div>

        <!-- Summary table -->
        <div v-if="scansData && scanTab === 'summary'" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700 text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th class="th">Usuario</th>
                <th class="th text-right">Scans</th>
                <th class="th text-right">Artículos únicos</th>
                <th class="th">Primer scan</th>
                <th class="th">Último scan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50 dark:divide-gray-700/50">
              <tr v-for="u in scanSummary" :key="u.userId" class="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                <td class="td font-semibold">{{ userLabel(u.userId) }}</td>
                <td class="td text-right">
                  <span class="inline-flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 text-xs font-bold">{{ u.totalScans.toLocaleString() }}</span>
                </td>
                <td class="td text-right text-gray-600 dark:text-gray-400">{{ u.uniqueItems.toLocaleString() }}</td>
                <td class="td text-xs text-gray-500 dark:text-gray-400">{{ fmtDt(u.firstScan) }}</td>
                <td class="td text-xs text-gray-500 dark:text-gray-400">{{ fmtDt(u.lastScan) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Detail table -->
        <div v-if="scansData && scanTab === 'detail'">
          <div class="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <input v-model="scanSearch" type="search" placeholder="Buscar usuario, código..." class="search-input w-52" />
            <span class="text-xs text-gray-400">{{ filteredScanDetail.length.toLocaleString() }} registros</span>
          </div>
          <div class="overflow-x-auto max-h-96">
            <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              <thead class="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                <tr>
                  <th class="th">Fecha/Hora</th>
                  <th class="th">Usuario</th>
                  <th class="th">Cód. Barras</th>
                  <th class="th">Item Code</th>
                  <th class="th">Descripción</th>
                  <th class="th text-right">Cantidad</th>
                  <th class="th">Grupo</th>
                  <th class="th text-right">Ronda</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50 dark:divide-gray-700/50">
                <tr v-for="(d, i) in pagedScanDetail" :key="i" class="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                  <td class="td text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">{{ fmtDt(d.scannedAt) }}</td>
                  <td class="td text-xs font-semibold">{{ userLabel(d.userId) }}</td>
                  <td class="td font-mono text-xs">{{ d.barcode ?? '—' }}</td>
                  <td class="td font-mono text-xs font-semibold">{{ d.itemCode }}</td>
                  <td class="td text-xs max-w-xs truncate">{{ d.description ?? '—' }}</td>
                  <td class="td text-right font-mono text-xs">{{ fmtQty(d.quantity) }}</td>
                  <td class="td text-xs">{{ d.nivel3 ?? '—' }}</td>
                  <td class="td text-right text-xs text-gray-400">{{ d.round }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
            <span>Mostrando {{ scanPageStart + 1 }}–{{ Math.min(scanPageStart + 100, filteredScanDetail.length) }} de {{ filteredScanDetail.length.toLocaleString() }}</span>
            <div class="flex items-center gap-2">
              <button class="pag-btn" :disabled="scanPage === 0" @click="scanPage--">‹</button>
              <span>{{ scanPage + 1 }} / {{ scanTotalPages }}</span>
              <button class="pag-btn" :disabled="scanPage >= scanTotalPages - 1" @click="scanPage++">›</button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChevronLeftIcon, ArrowPathIcon, ArrowDownTrayIcon, ShoppingCartIcon, ShieldExclamationIcon } from '@heroicons/vue/24/outline'
import { inventarioSesionesService } from '../services/inventarioSesionesApi'
import { useInventarioModulePermissions } from '../composables/useInventarioModulePermissions'
import { resolveUserNames } from '@/utils/resolveUserNames'
import { downloadExcel, type ExcelColumn } from '@/utils/exportExcel'
import type { SessionDetailLineDto, SessionDetailStatsDto, SessionScansByUserDto, UserScanSummaryDto, UserScanDetailEntryDto } from '../types'

const router = useRouter()
const route = useRoute()
const sessionId = route.params.sessionId as string
const { canGestionarScans } = useInventarioModulePermissions()

const stats = ref<SessionDetailStatsDto | null>(null)
const lines = ref<SessionDetailLineDto[]>([])
const loadingStats = ref(false)
const loadingLines = ref(false)
const downloadingAll = ref(false)
const error = ref<string | null>(null)
const warehouseName = ref<string | null>(null)

const scansData = ref<SessionScansByUserDto | null>(null)
const loadingScans = ref(false)
const scanTab = ref<'summary' | 'detail'>('summary')
/** 0 = ambas rondas; 1 = conteo inicial; 2 = reconteo. Aplica al resumen, al detalle y a las descargas. */
const scanRound = ref<0 | 1 | 2>(0)
const scanSearch = ref('')
const SUFIJO_RONDA: Record<0 | 1 | 2, string> = { 0: '', 1: '_conteo', 2: '_reconteo' }
const sufijoRonda = computed(() => SUFIJO_RONDA[scanRound.value])
const scanPage = ref(0)
const userNames = ref<Record<string, string>>({})

function userLabel(userId: string): string {
  return userNames.value[userId] || userId
}

type FilterKey = 'Balanced' | 'Difference' | 'New'
const activeFilter = ref<FilterKey | null>(null)
const search = ref('')
const page = ref(0)
const pageSize = ref(100)

type LineSortKey = 'nivel1' | 'nivel2' | 'nivel3' | 'familia' | 'barcode' | 'itemCode' | 'description' | 'systemQuantity' | 'countedQuantity' | 'difference'
const sortKey = ref<LineSortKey>('itemCode')
const sortDir = ref<'asc' | 'desc'>('asc')

function toggleSort(key: LineSortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

function sortIndicator(key: LineSortKey) {
  if (sortKey.value !== key) return ''
  return sortDir.value === 'asc' ? ' ▲' : ' ▼'
}

watch([activeFilter, search, pageSize, sortKey, sortDir], () => { page.value = 0 })
watch([scanSearch, scanRound], () => { scanPage.value = 0 })

/** Resumen por usuario recalculado en el front para respetar el filtro de ronda (el backend lo trae sumado). */
const scanSummary = computed<UserScanSummaryDto[]>(() => {
  if (!scansData.value) return []
  if (scanRound.value === 0) return scansData.value.summary
  const porUsuario = new Map<string, UserScanSummaryDto & { items: Set<string> }>()
  for (const d of scansData.value.detail) {
    if (d.round !== scanRound.value) continue
    const actual = porUsuario.get(d.userId)
    if (!actual) {
      porUsuario.set(d.userId, { userId: d.userId, userName: d.userName ?? null, totalScans: 1, uniqueItems: 1, firstScan: d.scannedAt, lastScan: d.scannedAt, items: new Set([d.itemCode]) })
    } else {
      actual.totalScans++
      actual.items.add(d.itemCode)
      actual.uniqueItems = actual.items.size
      if (d.scannedAt < actual.firstScan) actual.firstScan = d.scannedAt
      if (d.scannedAt > actual.lastScan) actual.lastScan = d.scannedAt
    }
  }
  return [...porUsuario.values()].map(({ items: _items, ...u }) => u).sort((a, b) => b.totalScans - a.totalScans)
})

const FILTER_CARDS = computed(() => [
  { filter: 'Balanced' as FilterKey, label: 'Cerrados', count: stats.value?.balanced ?? 0, iconClass: 'text-green-500', numClass: 'text-green-600 dark:text-green-400' },
  { filter: 'Difference' as FilterKey, label: 'Diferencias', count: stats.value?.difference ?? 0, iconClass: 'text-red-500', numClass: 'text-red-600 dark:text-red-400' },
  { filter: 'New' as FilterKey, label: 'Otros Códigos', count: stats.value?.newItems ?? 0, iconClass: 'text-amber-500', numClass: 'text-amber-600 dark:text-amber-400' },
  // "No contados" dejó de ser categoría: una referencia con stock que nadie contó es una Diferencia
  // (faltante completo, se cobra en el ajuste), igual que en StoreControl; la fila lleva la marca "Sin conteo".
])

const activeLabelShort = computed(() => FILTER_CARDS.value.find(c => c.filter === activeFilter.value)?.label ?? 'vista')

async function setFilter(f: FilterKey) {
  if (activeFilter.value === f && lines.value.length > 0) return  // already loaded
  activeFilter.value = f
  page.value = 0
  search.value = ''
  lines.value = []
  loadingLines.value = true
  error.value = null
  try {
    lines.value = await inventarioSesionesService.getDetailLines(sessionId, f)
  } catch (e: any) {
    error.value = e.message ?? 'Error al cargar detalle.'
  } finally {
    loadingLines.value = false
  }
}

const filteredLines = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return lines.value
  return lines.value.filter(l =>
    l.itemCode.toLowerCase().includes(q) ||
    (l.description ?? '').toLowerCase().includes(q) ||
    (l.barcode ?? '').toLowerCase().includes(q) ||
    (l.nivel3 ?? '').toLowerCase().includes(q)
  )
})

const sortedLines = computed(() => {
  const dir = sortDir.value === 'asc' ? 1 : -1
  const key = sortKey.value
  return [...filteredLines.value].sort((a, b) => {
    const av = a[key] ?? (typeof a[key] === 'number' ? 0 : '')
    const bv = b[key] ?? (typeof b[key] === 'number' ? 0 : '')
    if (typeof av === 'string' || typeof bv === 'string') {
      return String(av).localeCompare(String(bv)) * dir
    }
    return ((av as number) - (bv as number)) * dir
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredLines.value.length / pageSize.value)))
const pageStart = computed(() => page.value * pageSize.value)
const pagedLines = computed(() => sortedLines.value.slice(pageStart.value, pageStart.value + pageSize.value))

const filteredScanDetail = computed(() => {
  if (!scansData.value) return []
  const porRonda = scanRound.value === 0 ? scansData.value.detail : scansData.value.detail.filter(d => d.round === scanRound.value)
  const q = scanSearch.value.trim().toLowerCase()
  if (!q) return porRonda
  return porRonda.filter(d =>
    d.userId.toLowerCase().includes(q) ||
    userLabel(d.userId).toLowerCase().includes(q) ||
    d.itemCode.toLowerCase().includes(q) ||
    (d.barcode ?? '').toLowerCase().includes(q) ||
    (d.description ?? '').toLowerCase().includes(q)
  )
})
const scanTotalPages = computed(() => Math.max(1, Math.ceil(filteredScanDetail.value.length / 100)))
const scanPageStart = computed(() => scanPage.value * 100)
const pagedScanDetail = computed(() => filteredScanDetail.value.slice(scanPageStart.value, scanPageStart.value + 100))

function fmtQty(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

function fmtDt(v: string): string {
  const d = new Date(v)
  return d.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
    ' ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function rowClass(status: string): string {
  return {
    Balanced: '',
    Difference: 'bg-red-50/40 dark:bg-red-900/5',
    New: 'bg-amber-50/40 dark:bg-amber-900/5',
  }[status] ?? ''
}

function diffClass(diff: number): string {
  if (diff === 0) return 'text-gray-400 dark:text-gray-600'
  return diff > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
}

const LINE_COLUMNS: ExcelColumn<SessionDetailLineDto>[] = [
  { header: 'Nivel1', key: r => r.nivel1 ?? '' },
  { header: 'Nivel2', key: r => r.nivel2 ?? '' },
  { header: 'Nivel3', key: r => r.nivel3 ?? '' },
  { header: 'Género', key: r => r.familia ?? '' },
  { header: 'CodigoBarras', key: r => r.barcode ?? '', text: true },
  { header: 'ItemCode', key: 'itemCode', text: true },
  { header: 'Descripcion', key: r => r.description ?? '' },
  { header: 'Stock', key: 'systemQuantity' },
  { header: 'Scan', key: 'countedQuantity' },
  { header: 'Diferencia', key: 'difference' },
  { header: 'Estado', key: 'status' },
  { header: 'SinConteo', key: r => (r.notCounted ? 'SI' : '') },
]

const SCAN_SUMMARY_COLUMNS: ExcelColumn<UserScanSummaryDto>[] = [
  { header: 'Usuario', key: u => userLabel(u.userId) },
  { header: 'TotalScans', key: 'totalScans' },
  { header: 'ArticulosUnicos', key: 'uniqueItems' },
  { header: 'PrimerScan', key: u => fmtDt(u.firstScan) },
  { header: 'UltimoScan', key: u => fmtDt(u.lastScan) },
]

const SCAN_DETAIL_COLUMNS: ExcelColumn<UserScanDetailEntryDto>[] = [
  { header: 'FechaScan', key: d => fmtDt(d.scannedAt) },
  { header: 'Usuario', key: d => userLabel(d.userId) },
  { header: 'CodigoBarras', key: d => d.barcode ?? '', text: true },
  { header: 'ItemCode', key: 'itemCode', text: true },
  { header: 'Descripcion', key: d => d.description ?? '' },
  { header: 'Cantidad', key: 'quantity' },
  { header: 'Grupo', key: d => d.nivel3 ?? '' },
  { header: 'Ronda', key: 'round' },
]

function descargarFiltrado() {
  downloadExcel(`toma_${sessionId.slice(0, 8)}_${activeLabelShort.value.toLowerCase()}.xlsx`, LINE_COLUMNS, sortedLines.value)
}

async function descargarConsolidado() {
  downloadingAll.value = true
  error.value = null
  try {
    const allLines = await inventarioSesionesService.getDetailLines(sessionId)
    downloadExcel(`toma_${sessionId.slice(0, 8)}_consolidado.xlsx`, LINE_COLUMNS, allLines)
  } catch (e: any) {
    error.value = e.message ?? 'Error al descargar consolidado.'
  } finally {
    downloadingAll.value = false
  }
}

function descargarScans() {
  if (!scansData.value) return
  if (scanTab.value === 'summary') {
    downloadExcel(`toma_${sessionId.slice(0, 8)}_scans_resumen${sufijoRonda.value}.xlsx`, SCAN_SUMMARY_COLUMNS, scanSummary.value)
  } else {
    downloadExcel(`toma_${sessionId.slice(0, 8)}_scans_detalle${sufijoRonda.value}.xlsx`, SCAN_DETAIL_COLUMNS, filteredScanDetail.value)
  }
}

async function cargarStats() {
  loadingStats.value = true
  error.value = null
  lines.value = []
  activeFilter.value = null
  try {
    const [statsData, status] = await Promise.all([
      inventarioSesionesService.getDetailStats(sessionId),
      inventarioSesionesService.getSessionStatus(sessionId),
    ])
    stats.value = statsData
    warehouseName.value = status.warehouseName
  } catch (e: any) {
    error.value = e.message ?? 'Error al cargar estadísticas.'
  } finally {
    loadingStats.value = false
  }
}

async function cargarScans() {
  loadingScans.value = true
  try {
    scansData.value = await inventarioSesionesService.getScansByUser(sessionId)
    if (scansData.value) {
      const ids = [
        ...scansData.value.summary.map(u => u.userId),
        ...scansData.value.detail.map(d => d.userId),
      ]
      userNames.value = await resolveUserNames(ids)
    }
  } catch (e: any) {
    error.value = e.message ?? 'Error al cargar scans.'
  } finally {
    loadingScans.value = false
  }
}

onMounted(cargarStats)
</script>

<style scoped>
.th { @apply px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap; }
.td { @apply px-3 py-2 text-sm text-gray-700 dark:text-gray-300; }
.stat-card { @apply flex flex-col items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 cursor-pointer transition-all; }
.btn-secondary { @apply inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.search-input { @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
.date-input { @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs text-gray-700 dark:text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
.pag-btn { @apply px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700; }
.alert-error { @apply rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300; }
</style>
