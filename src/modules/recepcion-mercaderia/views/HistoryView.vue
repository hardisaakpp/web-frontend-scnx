<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useHistoryStore } from '../stores/historyStore'
import { useAuthStore } from '@/stores/auth'
import { CalendarIcon, ArrowDownTrayIcon, PencilIcon, ArrowLeftIcon, EyeIcon } from '@heroicons/vue/24/outline'
import type { HistoryRow } from '../types'
import { triggerBlobDownload } from '../utils/downloadBlob'
import PageJumpInput from '../components/PageJumpInput.vue'
import HistoryDetailModal from '../components/HistoryDetailModal.vue'

const store = useHistoryStore()
const authStore = useAuthStore()

// Client-side aggregates from the real Lines array on ReceptionTransferResponse — same
// "computed in frontend, not from API" pattern already established for TransferDetailView.
// Lines is optional on HistoryRow (older test fixtures omit it), default to empty.
function requestedTotal(row: HistoryRow): number {
  return (row.lines ?? []).reduce((sum, l) => sum + l.quantity, 0)
}
function scannedTotal(row: HistoryRow): number {
  return (row.lines ?? []).reduce((sum, l) => sum + l.scanned, 0)
}
function quantityDifference(row: HistoryRow): number {
  return requestedTotal(row) - scannedTotal(row)
}

// `recepcion.history.viewall` decides which single view a user gets — an admin/supervisor
// always sees the consolidated view, a store user always sees their own warehouse's. This
// is fixed for the session (derived from the permission, not user-toggleable), so there's no
// runtime mode swap and therefore no abrupt layout jump between the two filter forms.
const canViewAll = computed(() => authStore.isAdmin || authStore.hasPermission('recepcion.history.viewall'))
const mode = computed<'own' | 'all'>(() => (canViewAll.value ? 'all' : 'own'))

// Local date (not UTC) so the default matches what the user sees on their clock, same
// timezone-correctness concern as toLocalDateBound in historyStore.
function todayLocalDateString(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Both modes filter by a real Desde/Hasta range — the backend's getHistory (own warehouse) and
// getAllHistory (consolidado) accept the same dateFrom/dateTo params, so one shared pair of
// inputs covers both; only the endpoint each mode hits differs (see activeScope below). "Mis
// almacenes" additionally skips N° transferencia/export, which stay consolidado-only. Both
// default to today so the view opens already scoped to "today's picking", matching the reference
// UI — applied on mount below, not just a placeholder value.
const dateFromInput = ref(todayLocalDateString())
const dateToInput = ref(todayLocalDateString())

function applyOwnFilters(): void {
  store.setDateRange(dateFromInput.value || null, dateToInput.value || null)
}

function applyAllFilters(): void {
  store.setAllDateRange(dateFromInput.value || null, dateToInput.value || null)
}

// Single source of truth for "which store surface is active": every own/all ternary that used to
// be repeated across this view's fetch state, pagination, GLPI save, per-row export, and initial
// filter application now reads/calls through this one computed instead of a scattered
// `mode === 'all' ? store.allX : store.x` at each call site.
const activeScope = computed(() =>
  mode.value === 'all'
    ? {
        rows: store.allRows,
        status: store.allStatus,
        error: store.allError,
        isSubmitting: store.isSubmittingAdmin,
        page: store.allPage,
        pageSize: store.allPageSize,
        totalCount: store.allTotalCount,
        setPage: store.setAllPage,
        setPageSize: store.setAllPageSize,
        setTransferNumberQuery: store.setAllTransferNumberQuery,
        updateGlpiTicket: store.updateGlpiTicketAdmin,
        downloadDifferencesReport: store.downloadDifferencesReportAdmin,
        exportCsv: store.exportAllHistoryCsv,
        applyFilters: applyAllFilters,
      }
    : {
        rows: store.rows,
        status: store.status,
        error: store.error,
        isSubmitting: store.isSubmitting,
        page: store.page,
        pageSize: store.pageSize,
        totalCount: store.totalCount,
        setPage: store.setPage,
        setPageSize: store.setPageSize,
        setTransferNumberQuery: store.setTransferNumberQuery,
        updateGlpiTicket: store.updateGlpiTicket,
        downloadDifferencesReport: store.downloadDifferencesReport,
        exportCsv: store.exportHistoryCsv,
        applyFilters: applyOwnFilters,
      }
)

onMounted(() => {
  // Applies the pre-filled today's-date value as a real active filter on load, so the view
  // opens already scoped to today (empty state if nothing happened today) instead of silently
  // showing the full unfiltered history while the date field just LOOKS pre-filled with today.
  activeScope.value.applyFilters()
})

// Per-row "Exportar Diferencias" — matches legacy sc22's Acción column exactly (replaces the
// prior "Ver" detail-navigation button per explicit product decision). One-shot axios-blob
// download, same pattern as handleExportCsv below, scoped per row/transferId rather than a
// single "active transfer" (there is no such concept on a history list).
// A "Ver detalle" eye-icon button now lives alongside it again (explicit product decision,
// reversing part of the above) — but as a read-only MODAL over data already in memory
// (HistoryRow.lines), not the old navigation-to-another-screen behavior.
async function handleExportRowDifferences(transferId: number): Promise<void> {
  const blob = await activeScope.value.downloadDifferencesReport(transferId)
  if (!blob) return
  triggerBlobDownload(blob, `diferencias-${transferId}.xlsx`)
}

const detailRow = ref<HistoryRow | null>(null)

function openDetail(row: HistoryRow): void {
  detailRow.value = row
}

function closeDetail(): void {
  detailRow.value = null
}

// Real server-side pagination AND filtering (verified HistoryController: dateFrom/dateTo/
// transferNumber + pageNumber/pageSize all accepted together) — rows/allRows are already
// exactly the current page's filtered results, no client-side slicing needed anymore.
const pagedRows = computed(() => activeScope.value.rows)
const activeStatus = computed(() => activeScope.value.status)
const activeError = computed(() => activeScope.value.error)
const activeIsSubmitting = computed(() => activeScope.value.isSubmitting)

const page = computed(() => activeScope.value.page)
const pageSize = computed(() => activeScope.value.pageSize)
const total = computed(() => activeScope.value.totalCount)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const pageStart = computed(() => (total.value === 0 ? 0 : (page.value - 1) * pageSize.value + 1))
const pageEnd = computed(() => Math.min(page.value * pageSize.value, total.value))

function goToPage(newPage: number): void {
  activeScope.value.setPage(newPage)
}

function changePageSize(newSize: number): void {
  activeScope.value.setPageSize(newSize)
}

// Debounced: setTransferNumberQuery/setAllTransferNumberQuery now trigger a real server GET
// (the backend filters, not a client-side predicate anymore) — firing one per keystroke would
// hammer the endpoint on every character typed.
let transferNumberDebounce: ReturnType<typeof setTimeout> | undefined
function onTransferNumberChange(value: string): void {
  if (transferNumberDebounce) clearTimeout(transferNumberDebounce)
  transferNumberDebounce = setTimeout(() => {
    activeScope.value.setTransferNumberQuery(value)
  }, 300)
}

const editingGlpiId = ref<number | null>(null)
const glpiInput = ref('')

function startEditGlpi(transferId: number, currentTicket: string | null | undefined): void {
  editingGlpiId.value = transferId
  glpiInput.value = currentTicket ?? ''
}

async function saveGlpi(transferId: number): Promise<void> {
  await activeScope.value.updateGlpiTicket(transferId, glpiInput.value)
  editingGlpiId.value = null
}

// History export (backend now serves xlsx, not csv): axios blob download (design's resolved
// decision) — auth is a Bearer header a raw <a href> cannot attach, so the request goes
// through the shared axios instance and its interceptors, and the browser download is
// triggered from the resulting Blob.
async function handleExportCsv(): Promise<void> {
  const blob = await activeScope.value.exportCsv()
  if (!blob) return
  triggerBlobDownload(blob, 'historial-recepcion.xlsx')
}
</script>

<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-4">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <RouterLink
            data-testid="back-btn"
            to="/recepcion-mercaderia"
            class="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shrink-0"
            aria-label="Volver a Recepción Mercadería"
          >
            <ArrowLeftIcon class="w-5 h-5" />
          </RouterLink>
          <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Historial de Recepciones</h1>
            <span
              v-if="mode === 'all'"
              class="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider"
            >
              Administrador
            </span>
          </div>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ mode === 'all' ? 'Transferencias recibidas en todos los almacenes.' : 'Transferencias recibidas en tu almacén.' }}
          </p>
          </div>
        </div>
      </div>

      <!-- Filters: fixed per role — Desde/Hasta range for both, admin/supervisor additionally gets N° transferencia + export -->
      <div v-if="mode === 'own'" class="flex flex-wrap items-end gap-3">
          <div>
            <label for="date-from-input" class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Desde</label>
            <div class="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 transition-shadow focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <CalendarIcon class="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                id="date-from-input"
                data-testid="date-from-input"
                v-model="dateFromInput"
                type="date"
                class="border-none outline-none focus:ring-0 focus:outline-none p-0 text-sm bg-transparent text-gray-900 dark:text-white"
                @change="applyOwnFilters"
              />
            </div>
          </div>
          <div>
            <label for="date-to-input" class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Hasta</label>
            <div class="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 transition-shadow focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <CalendarIcon class="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                id="date-to-input"
                data-testid="date-to-input"
                v-model="dateToInput"
                type="date"
                class="border-none outline-none focus:ring-0 focus:outline-none p-0 text-sm bg-transparent text-gray-900 dark:text-white"
                @change="applyOwnFilters"
              />
            </div>
          </div>
          <button
            data-testid="history-search-btn"
            type="button"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
            @click="applyOwnFilters"
          >
            Buscar
          </button>
          <button
            type="button"
            data-testid="export-csv-btn"
            class="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            @click="handleExportCsv"
          >
            <ArrowDownTrayIcon class="w-4 h-4" />
            Exportar Excel
          </button>
        </div>

        <div v-else class="space-y-1">
          <div class="flex flex-wrap items-end gap-3">
            <div>
              <label for="date-from-input" class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Desde</label>
              <div class="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 transition-shadow focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                <CalendarIcon class="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  id="date-from-input"
                  data-testid="date-from-input"
                  v-model="dateFromInput"
                  type="date"
                  class="border-none outline-none focus:ring-0 focus:outline-none p-0 text-sm bg-transparent text-gray-900 dark:text-white"
                  @change="applyAllFilters"
                />
              </div>
            </div>
            <div>
              <label for="date-to-input" class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Hasta</label>
              <div class="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 transition-shadow focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                <CalendarIcon class="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  id="date-to-input"
                  data-testid="date-to-input"
                  v-model="dateToInput"
                  type="date"
                  class="border-none outline-none focus:ring-0 focus:outline-none p-0 text-sm bg-transparent text-gray-900 dark:text-white"
                  @change="applyAllFilters"
                />
              </div>
            </div>
            <div>
              <label for="transfer-number-input" class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">O N° transferencia</label>
              <input
                id="transfer-number-input"
                data-testid="transfer-number-input"
                type="text"
                placeholder="N° transferencia"
                class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none"
                :value="store.allTransferNumberQuery"
                @input="onTransferNumberChange(($event.target as HTMLInputElement).value)"
              />
            </div>
            <button
              data-testid="history-search-btn"
              type="button"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
              @click="applyAllFilters"
            >
              Buscar
            </button>
            <button
              type="button"
              data-testid="export-csv-btn"
              class="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              @click="handleExportCsv"
            >
              <ArrowDownTrayIcon class="w-4 h-4" />
              Exportar Excel
            </button>
          </div>
          <p class="text-xs text-gray-400 dark:text-gray-500">
            Si ingresa un N° de transferencia, se ignora el rango de fechas (coincide con el comportamiento de la vista legada).
          </p>
        </div>

      <div
        v-if="activeError"
        role="alert"
        class="py-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 border border-red-200 dark:border-red-800"
      >
        {{ activeError }}
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div class="text-sm text-gray-600 dark:text-gray-300 font-medium">
            Total encontrados: <span class="font-bold text-gray-900 dark:text-white">{{ total }}</span>
          </div>
        </div>

        <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Id</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transferencia</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nueva Transferencia</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cant.</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Escaneados</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Diferencia</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sobrantes</th>
                <th v-if="mode === 'all'" class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha creación</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Movimiento</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Responsable</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Guía courier</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ticket GLPI</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              <template v-if="activeStatus === 'loading'">
                <tr v-for="i in 5" :key="i" class="animate-pulse">
                  <td v-for="j in 12" :key="j" class="px-4 py-3"><div class="h-4 bg-gray-100 dark:bg-gray-700 rounded w-full"></div></td>
                </tr>
              </template>
              <tr v-else-if="pagedRows.length === 0">
                <td colspan="12" class="px-8 py-16 text-center text-gray-400 dark:text-gray-500">
                  <svg class="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  <p class="text-base font-medium">No hay datos para el rango seleccionado.</p>
                </td>
              </tr>
              <tr v-else v-for="row in pagedRows" :key="row.transferId" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{{ row.transferId }}</td>
                <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{{ row.documentNumber }}</td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ row.sapStockTransferDocNum ?? '—' }}</td>
                <td class="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">{{ requestedTotal(row) }}</td>
                <td class="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">{{ scannedTotal(row) }}</td>
                <td class="px-4 py-3 text-sm text-right" :class="quantityDifference(row) !== 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-gray-600 dark:text-gray-300'">
                  {{ quantityDifference(row) }}
                </td>
                <td class="px-4 py-3 text-sm text-right" :class="row.differencesCount > 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-gray-600 dark:text-gray-300'">
                  {{ row.differencesCount }}
                </td>
                <td v-if="mode === 'all'" class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ row.materializedAtUtc }}</td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ row.originWarehouseCode ?? '—' }} → {{ row.transitWarehouseCode ?? row.destinationWarehouseCode ?? row.warehouseCode }}</td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ row.responsibleName || '—' }}</td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ row.courierWaybillNumber || '—' }}</td>
                <td class="px-4 py-3 text-sm">
                  <div class="flex items-center gap-2">
                    <template v-if="editingGlpiId === row.transferId">
                      <label :for="`glpi-input-${row.transferId}`" class="sr-only">Ticket GLPI</label>
                      <input
                        :id="`glpi-input-${row.transferId}`"
                        :data-testid="`glpi-input-${row.transferId}`"
                        v-model="glpiInput"
                        type="text"
                        class="w-24 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2 py-1 text-sm text-gray-900 dark:text-white outline-none transition-all"
                      />
                      <button
                        type="button"
                        :data-testid="`glpi-save-btn-${row.transferId}`"
                        :disabled="activeIsSubmitting"
                        class="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        @click="saveGlpi(row.transferId)"
                      >
                        Guardar
                      </button>
                    </template>
                    <template v-else>
                      <span class="text-gray-600 dark:text-gray-300">{{ row.glpiTicket || 'Sin ticket' }}</span>
                      <button
                        type="button"
                        :data-testid="`glpi-edit-btn-${row.transferId}`"
                        class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        @click="startEditGlpi(row.transferId, row.glpiTicket)"
                      >
                        <PencilIcon class="w-4 h-4" />
                      </button>
                    </template>
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      :data-testid="`view-detail-btn-${row.transferId}`"
                      title="Ver detalle"
                      class="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      @click="openDetail(row)"
                    >
                      <EyeIcon class="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      :data-testid="`export-differences-btn-${row.transferId}`"
                      class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors text-xs"
                      @click="handleExportRowDifferences(row.transferId)"
                    >
                      Exportar Diferencias
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="total > 0" class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-700 dark:text-gray-300">
              Mostrando <span class="font-medium">{{ pageStart }}</span> a <span class="font-medium">{{ pageEnd }}</span> de <span class="font-medium">{{ total }}</span>
            </span>
            <label for="history-page-size" class="sr-only">Filas por página</label>
            <select
              id="history-page-size"
              data-testid="pagination-page-size"
              :value="pageSize"
              class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none transition-all cursor-pointer"
              @change="changePageSize(Number(($event.target as HTMLSelectElement).value))"
            >
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              data-testid="pagination-prev"
              class="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              :disabled="page === 1"
              @click="goToPage(page - 1)"
            >
              Anterior
            </button>
            <PageJumpInput :page="page" :total-pages="totalPages" @go="goToPage" />
            <button
              type="button"
              data-testid="pagination-next"
              class="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              :disabled="page >= totalPages"
              @click="goToPage(page + 1)"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <HistoryDetailModal :open="!!detailRow" :row="detailRow" @close="closeDetail" />
</template>
