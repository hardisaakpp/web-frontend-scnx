<template>
  <section class="space-y-6">
    <header class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div class="min-w-0">
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Importador PYG</h1>
        <p class="text-sm text-gray-600 dark:text-gray-300">Carga plantilla y revisa el historial de importación.</p>
      </div>
      <button
        type="button"
        class="shrink-0 rounded-md border border-sky-600 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800 shadow-sm hover:bg-sky-100 dark:border-sky-500 dark:bg-sky-950/40 dark:text-sky-100 dark:hover:bg-sky-900/60"
        @click="handleDownloadTemplate"
      >
        Descargar plantilla
      </button>
    </header>

    <div class="space-y-3">
      <input
        ref="fileInputRef"
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        class="sr-only"
        :disabled="loadingUpload"
        @change="onFileChange"
      />
      <div
        class="rounded-lg border-2 border-dashed border-emerald-200/90 bg-gradient-to-b from-emerald-50/90 to-white p-8 text-center transition-colors hover:border-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-emerald-800 dark:from-emerald-950/50 dark:to-gray-900/50 dark:hover:border-emerald-600"
        :class="[
          uploadDragActive ? 'border-emerald-500 bg-emerald-50 shadow-inner dark:border-emerald-400 dark:bg-emerald-950/70' : '',
          loadingUpload ? 'cursor-wait opacity-70' : 'cursor-pointer'
        ]"
        role="button"
        :tabindex="loadingUpload ? -1 : 0"
        :aria-busy="loadingUpload"
        aria-label="Subir archivo Excel: arrastra un .xlsx o haz clic para elegir"
        @click="openFilePicker"
        @keydown.enter.prevent="openFilePicker"
        @keydown.space.prevent="openFilePicker"
        @dragover.prevent="onUploadDragOver"
        @dragleave.prevent="onUploadDragLeave"
        @drop.prevent="onUploadDrop"
      >
        <div class="pointer-events-none flex flex-col items-center gap-3">
          <div class="relative">
            <div
              class="rounded-2xl bg-emerald-100 p-4 shadow-sm ring-1 ring-emerald-200/80 dark:bg-emerald-900/50 dark:ring-emerald-700/60"
            >
              <TableCellsIcon class="h-12 w-12 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            </div>
            <span
              class="absolute -bottom-1 -right-1 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm dark:bg-emerald-500"
            >
              xlsx
            </span>
          </div>
          <div class="space-y-1.5">
            <h2 class="text-lg font-semibold text-emerald-900 dark:text-emerald-100">Subir hoja de cálculo Excel</h2>
            <p class="text-sm text-emerald-800/90 dark:text-emerald-200/90">
              {{ loadingUpload ? 'Procesando…' : 'Arrastra tu archivo .xlsx aquí o haz clic para elegir' }}
            </p>
            <p class="text-xs font-medium text-emerald-700/80 dark:text-emerald-300/80">
              Formato requerido: libro Excel <span class="tabular-nums">(.xlsx)</span>
            </p>
          </div>
        </div>
      </div>
      <p v-if="selectedFile" class="text-xs text-gray-500 dark:text-gray-400">
        Archivo seleccionado: {{ selectedFile.name }}
      </p>
      <p v-if="uploadMessage" class="text-sm" :class="uploadOk ? 'text-green-600' : 'text-red-600'">{{ uploadMessage }}</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm p-6">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Historial de cargas</h2>
        <button
          type="button"
          class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 text-sm px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          :disabled="loadingUploads"
          @click="loadUploads"
        >
          Refrescar
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
          <thead>
            <tr class="text-left text-gray-600 dark:text-gray-300">
              <th class="w-10 px-2 py-2 text-right tabular-nums">#</th>
              <th class="px-3 py-2">Archivo</th>
              <th class="px-3 py-2">Periodo</th>
              <th class="px-3 py-2">Estado</th>
              <th class="px-3 py-2">Filas</th>
              <th class="px-3 py-2 whitespace-nowrap">Fecha ingreso</th>
              <th class="px-3 py-2 whitespace-nowrap">Última actualización</th>
              <th class="px-3 py-2">Usuario últ. act.</th>
              <th class="px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="(item, index) in paginatedUploads" :key="item.id" class="text-gray-800 dark:text-gray-200">
              <td class="px-2 py-2 text-right tabular-nums text-gray-500 dark:text-gray-400">{{ uploadsHistoryOffset + index + 1 }}</td>
              <td class="px-3 py-2">{{ item.fileName }}</td>
              <td class="px-3 py-2">{{ item.year }}-{{ String(item.month).padStart(2, '0') }}</td>
              <td class="px-3 py-2" :class="uploadStatusClass(item.status)">{{ item.status }}</td>
              <td class="px-3 py-2">{{ item.validRows }}/{{ item.totalRows }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ formatAuditDate(item.uploadedAt) }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">—</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-400">{{ item.uploadedBy?.trim() || '—' }}</td>
              <td class="px-3 py-2">
                <button
                  type="button"
                  class="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                  :disabled="loadingDetail && selectedBatchId === item.id"
                  @click="openBatchDetail(item.id)"
                >
                  {{ selectedBatchId === item.id ? 'Detalle abierto' : 'Ver detalle' }}
                </button>
              </td>
            </tr>
            <tr v-if="uploads.length === 0 && !loadingUploads">
              <td colspan="9" class="px-3 py-3 text-center text-gray-500">Sin cargas registradas.</td>
            </tr>
            <tr v-if="loadingUploads && uploads.length === 0">
              <td colspan="9" class="px-3 py-3 text-center text-gray-500">Cargando historial…</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="uploads.length > 0 && !loadingUploads" class="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Mostrando {{ uploadsHistoryOffset + 1 }} - {{ uploadsHistoryRangeEnd }} de {{ uploads.length }} resultados
          </div>
          <QuickTablePagination
            v-model="uploadsHistoryCurrentPage"
            :total-pages="uploadsHistoryTotalPages"
            :disabled="loadingUploads"
            aria-label="Paginación del historial de cargas PYG"
          />
        </div>
      </div>
    </div>

    <p v-if="queryMessage" class="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
      {{ queryMessage }}
    </p>
  </section>

  <Teleport to="body">
    <div v-if="showDetailPanel" class="fixed inset-0 z-[100]">
      <div class="absolute inset-0 bg-black/40" @click="closeBatchDetail"></div>
      <aside class="absolute right-0 top-0 h-full w-full sm:w-[620px] bg-white dark:bg-gray-800 shadow-2xl flex flex-col">
        <div class="flex items-start justify-between gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="min-w-0">
            <div class="text-xs text-gray-500 dark:text-gray-400">Detalle de carga PYG</div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">Lote #{{ selectedBatchId }}</h3>
            <div v-if="selectedBatchDetail" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ selectedBatchDetail.fileName }} · {{ selectedBatchDetail.year }}-{{ String(selectedBatchDetail.month).padStart(2, '0') }}
            </div>
          </div>
          <button
            type="button"
            class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @click="closeBatchDetail"
          >
            Cerrar
          </button>
        </div>

        <div class="p-4 overflow-y-auto space-y-4">
          <p v-if="loadingDetail" class="text-sm text-gray-500">Cargando detalle…</p>

          <template v-else-if="selectedBatchDetail">
            <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-3">Archivos</div>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="rounded-lg border border-sky-500 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-50 disabled:opacity-50 dark:border-sky-400 dark:text-sky-300 dark:hover:bg-sky-900/30 transition-colors"
                  :disabled="!selectedBatchDetail.originalFileAvailable || downloadingOriginal"
                  @click="handleDownloadOriginal(selectedBatchDetail)"
                >
                  {{ downloadingOriginal ? 'Descargando…' : 'Descargar Excel original' }}
                </button>
              </div>
            </div>

            <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Filas procesadas por hoja</div>
              </div>

              <div class="space-y-2">
                <div class="text-xs font-semibold text-gray-700 dark:text-gray-200">MATRIZ</div>
                <div class="overflow-x-auto">
                  <table class="min-w-full text-xs">
                    <thead class="bg-gray-50 dark:bg-gray-700/50">
                      <tr class="text-left font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300 text-[10px]">
                        <th class="px-2 py-2">Periodo</th>
                        <th class="px-2 py-2">Empresa</th>
                        <th class="px-2 py-2">Marca</th>
                        <th class="px-2 py-2">% Matriz</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-600">
                      <tr v-for="row in selectedRowsBySheet.matriz.items" :key="`m-${row.id}`" class="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                        <td class="px-2 py-1.5">{{ row.year && row.month ? `${row.year}-${String(row.month).padStart(2, '0')}` : '—' }}</td>
                        <td class="px-2 py-1.5">{{ resolveRowEmpresa(row) }}</td>
                        <td class="px-2 py-1.5">{{ row.marca || '—' }}</td>
                        <td class="px-2 py-1.5">{{ row.percentMatriz ?? '—' }}</td>
                      </tr>
                      <tr v-if="selectedRowsBySheet.matriz.total > 0" class="bg-gray-100/70 font-semibold dark:bg-gray-700/40">
                        <td class="px-2 py-1.5 text-right" colspan="3">Total</td>
                        <td class="px-2 py-1.5">{{ sheetTotal('matriz', 'matriz') }}</td>
                      </tr>
                      <tr v-if="!loadingRows && selectedRowsBySheet.matriz.items.length === 0">
                        <td colspan="4" class="px-2 py-3 text-center text-gray-500">Sin filas MATRIZ para este lote/filtro.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-if="selectedRowsBySheet.matriz.total > 0" class="flex flex-wrap items-center justify-between gap-3">
                  <div class="text-xs text-gray-600 dark:text-gray-300">
                    Mostrando {{ selectedRowsRangeStart('matriz') }} - {{ selectedRowsRangeEnd('matriz') }} de {{ selectedRowsBySheet.matriz.total }} filas
                  </div>
                  <QuickTablePagination
                    v-model="selectedRowsCurrentPageMatriz"
                    :total-pages="selectedRowsTotalPages('matriz')"
                    :disabled="loadingRows"
                    aria-label="Paginación filas MATRIZ"
                  />
                </div>
              </div>

              <div class="space-y-2 border-t border-gray-200 pt-3 dark:border-gray-700">
                <div class="text-xs font-semibold text-gray-700 dark:text-gray-200">TIENDAS</div>
                <div class="overflow-x-auto">
                  <table class="min-w-full text-xs">
                    <thead class="bg-gray-50 dark:bg-gray-700/50">
                      <tr class="text-left font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300 text-[10px]">
                        <th class="px-2 py-2">Periodo</th>
                        <th class="px-2 py-2">Empresa</th>
                        <th class="px-2 py-2">Marca</th>
                        <th class="px-2 py-2">Bodega</th>
                        <th class="px-2 py-2">% General</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-600">
                      <tr v-for="row in selectedRowsBySheet.tiendas.items" :key="`t-${row.id}`" class="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                        <td class="px-2 py-1.5">{{ row.year && row.month ? `${row.year}-${String(row.month).padStart(2, '0')}` : '—' }}</td>
                        <td class="px-2 py-1.5">{{ resolveRowEmpresa(row) }}</td>
                        <td class="px-2 py-1.5">{{ row.marca || '—' }}</td>
                        <td class="px-2 py-1.5">{{ row.codigoBodega || '—' }}</td>
                        <td class="px-2 py-1.5">{{ row.percentGeneral ?? '—' }}</td>
                      </tr>
                      <tr v-if="selectedRowsBySheet.tiendas.total > 0" class="bg-gray-100/70 font-semibold dark:bg-gray-700/40">
                        <td class="px-2 py-1.5 text-right" colspan="4">Total</td>
                        <td class="px-2 py-1.5">{{ sheetTotal('tiendas', 'tiendas') }}</td>
                      </tr>
                      <tr v-if="!loadingRows && selectedRowsBySheet.tiendas.items.length === 0">
                        <td colspan="5" class="px-2 py-3 text-center text-gray-500">Sin filas TIENDAS para este lote/filtro.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-if="selectedRowsBySheet.tiendas.total > 0" class="flex flex-wrap items-center justify-between gap-3">
                  <div class="text-xs text-gray-600 dark:text-gray-300">
                    Mostrando {{ selectedRowsRangeStart('tiendas') }} - {{ selectedRowsRangeEnd('tiendas') }} de {{ selectedRowsBySheet.tiendas.total }} filas
                  </div>
                  <QuickTablePagination
                    v-model="selectedRowsCurrentPageTiendas"
                    :total-pages="selectedRowsTotalPages('tiendas')"
                    :disabled="loadingRows"
                    aria-label="Paginación filas TIENDAS"
                  />
                </div>
              </div>

              <div v-if="loadingRows" class="text-xs text-gray-500">Cargando filas…</div>
            </div>
          </template>
        </div>
      </aside>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { lastNotification } from '@/composables/useNotificaciones'
import QuickTablePagination from '@/modules/mba3-consultas/components/QuickTablePagination.vue'
import { TableCellsIcon } from '@heroicons/vue/24/outline'
import {
  downloadErrors,
  downloadOriginalFile,
  downloadTemplate,
  getUploadRows,
  getUploads,
  uploadExcel,
  type UploadBatchDetailDto,
  type UploadBatchSummary,
  type UploadRowHistoryItemDto,
  type UploadRowHistoryPageDto
} from '../services/pygApi'

const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const loadingUpload = ref(false)
const uploadDragActive = ref(false)
const uploadMessage = ref('')
const uploadOk = ref(false)

const uploads = ref<UploadBatchSummary[]>([])
const loadingUploads = ref(false)
const loadingDetail = ref(false)
const loadingRows = ref(false)
const downloadingOriginal = ref(false)
const downloadingErrors = ref(false)
const selectedBatchId = ref<number | null>(null)
const showDetailPanel = ref(false)
const selectedBatchDetail = ref<UploadBatchDetailDto | null>(null)
const EMPTY_UPLOAD_ROWS_PAGE: UploadRowHistoryPageDto = { batchId: 0, total: 0, page: 1, pageSize: 50, items: [] }
type UploadSheetKey = 'matriz' | 'tiendas'
const SHEET_NAME_BY_KEY: Record<UploadSheetKey, string> = {
  matriz: 'Matriz',
  tiendas: 'Tiendas'
}
const selectedRowsBySheet = ref<{ matriz: UploadRowHistoryPageDto; tiendas: UploadRowHistoryPageDto }>({
  matriz: { ...EMPTY_UPLOAD_ROWS_PAGE },
  tiendas: { ...EMPTY_UPLOAD_ROWS_PAGE }
})
const rowsFilters = ref<{ isValid: '' | 'true' | 'false' }>({ isValid: '' })

/** Misma lógica que Cargar plantilla (MBA3): 10 filas por página. */
const UPLOADS_PAGE_SIZE = 10
const uploadsHistoryPage = ref(1)

const uploadsHistoryTotalPages = computed(() => {
  const total = uploads.value.length
  return total > 0 ? Math.max(1, Math.ceil(total / UPLOADS_PAGE_SIZE)) : 1
})

const uploadsHistoryOffset = computed(() => (uploadsHistoryPage.value - 1) * UPLOADS_PAGE_SIZE)

const paginatedUploads = computed(() => {
  const start = uploadsHistoryOffset.value
  return uploads.value.slice(start, start + UPLOADS_PAGE_SIZE)
})

const uploadsHistoryRangeEnd = computed(() =>
  uploads.value.length === 0 ? 0 : Math.min(uploadsHistoryOffset.value + UPLOADS_PAGE_SIZE, uploads.value.length)
)

function selectedRowsTotalPages(key: UploadSheetKey): number {
  const rows = selectedRowsBySheet.value[key]
  const total = rows.total
  const size = rows.pageSize || 1
  return total > 0 ? Math.max(1, Math.ceil(total / size)) : 1
}

function selectedRowsRangeStart(key: UploadSheetKey): number {
  const rows = selectedRowsBySheet.value[key]
  if (rows.total === 0) return 0
  return (rows.page - 1) * rows.pageSize + 1
}

function selectedRowsRangeEnd(key: UploadSheetKey): number {
  const rows = selectedRowsBySheet.value[key]
  if (rows.total === 0) return 0
  return Math.min(selectedRowsRangeStart(key) + rows.pageSize - 1, rows.total)
}

const uploadsHistoryCurrentPage = computed({
  get() {
    return uploadsHistoryPage.value
  },
  set(p: number) {
    const max = uploadsHistoryTotalPages.value
    uploadsHistoryPage.value = Math.min(max, Math.max(1, Math.round(p)))
  }
})

const selectedRowsCurrentPageMatriz = computed({
  get() {
    return selectedRowsBySheet.value.matriz.page
  },
  set(p: number) {
    const max = selectedRowsTotalPages('matriz')
    selectedRowsBySheet.value.matriz.page = Math.min(max, Math.max(1, Math.round(p)))
  }
})

const selectedRowsCurrentPageTiendas = computed({
  get() {
    return selectedRowsBySheet.value.tiendas.page
  },
  set(p: number) {
    const max = selectedRowsTotalPages('tiendas')
    selectedRowsBySheet.value.tiendas.page = Math.min(max, Math.max(1, Math.round(p)))
  }
})

watch(uploadsHistoryTotalPages, (max) => {
  if (uploadsHistoryPage.value > max) uploadsHistoryPage.value = max
})
const queryMessage = ref('')
const UPLOADS_REFRESH_FAST_MS = 5000
const UPLOADS_REFRESH_SLOW_MS = 60000
const UPLOADS_REFRESH_HIDDEN_MS = 120000
const ACTIVE_UPLOAD_STATUS_KEYWORDS = ['processing', 'proces', 'pend', 'queue', 'en cola', 'running']
let uploadsAutoRefreshTimer: ReturnType<typeof setTimeout> | null = null
const isPygViewMounted = ref(false)

function uploadStatusClass(status: string | undefined): string {
  const s = String(status || '').toUpperCase()
  if (s === 'PROCESSED') return 'font-medium text-green-600 dark:text-green-400'
  if (s === 'REJECTED') return 'font-medium text-red-600 dark:text-red-400'
  if (s === 'PROCESSING' || s.includes('PROCESSING')) {
    return 'font-medium text-sky-600 dark:text-sky-400'
  }
  const lower = String(status || '').toLowerCase()
  if (
    ACTIVE_UPLOAD_STATUS_KEYWORDS.some((k) => lower.includes(k)) &&
    !lower.includes('processed') &&
    !lower.includes('procesado')
  ) {
    return 'font-medium text-sky-600 dark:text-sky-400'
  }
  return ''
}

/** Misma convención que otros módulos (p. ej. gestión de usuarios). */
function formatAuditDate(value: string | undefined): string {
  const s = (value || '').trim()
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' })
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  const response = (error as { response?: { data?: unknown; status?: number } })?.response
  const data = response?.data
  const status = response?.status

  if (typeof data === 'string' && data.trim()) return data
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    if (typeof o.message === 'string' && o.message.trim()) return o.message
    if (typeof o.detail === 'string' && o.detail.trim()) return o.detail
    if (typeof o.title === 'string' && o.title.trim()) return o.title
  }

  if (status === 403) {
    return (
      'El API PYG respondió 403 (prohibido): el microservicio no autoriza esta petición con tu token. ' +
      'Revisa políticas y permisos en el backend Docker, que el JWT sea el que PYG valida (mismo issuer/firma), ' +
      'y en desarrollo que no estés entrando al módulo sin permisos (VITE_ALLOW_UNAUTHENTICATED=false alinea router y API).'
    )
  }

  return fallback
}

function buildDetailFallbackFromSummary(batchId: number): UploadBatchDetailDto | null {
  const summary = uploads.value.find((item) => item.id === batchId)
  if (!summary) return null
  return {
    ...summary,
    // Some backends do not expose /uploads/:id detail and only return list + rows.
    // Allow downloads to attempt and let endpoint-level errors be handled gracefully.
    originalFileAvailable: true,
    errorLogAvailable: summary.errorRows > 0
  }
}

function resolveRowEmpresa(row: UploadRowHistoryItemDto): string {
  return row.nombreEmpresa || row.empresa || row.codigoEmpresa || '—'
}

function sheetTotal(sheet: UploadSheetKey, type: 'matriz' | 'tiendas'): number {
  const page = selectedRowsBySheet.value[sheet] as UploadRowHistoryPageDto & {
    TotalPercentMatriz?: number
    TotalPercentGeneral?: number
  }
  if (type === 'matriz') {
    return page.totalPercentMatriz ?? page.TotalPercentMatriz ?? 0
  }
  return page.totalPercentGeneral ?? page.TotalPercentGeneral ?? 0
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  selectedFile.value = target.files?.[0] ?? null
  if (!selectedFile.value) return
  void handleUpload()
}

function openFilePicker() {
  if (loadingUpload.value) return
  if (!fileInputRef.value) return
  fileInputRef.value.value = ''
  fileInputRef.value.click()
}

function onUploadDragOver(event: DragEvent) {
  event.preventDefault()
  if (loadingUpload.value) return
  uploadDragActive.value = true
}

function onUploadDragLeave() {
  uploadDragActive.value = false
}

function onUploadDrop(event: DragEvent) {
  event.preventDefault()
  uploadDragActive.value = false
  if (loadingUpload.value) return
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  const nameOk = file.name.toLowerCase().endsWith('.xlsx')
  const typeOk =
    file.type === '' ||
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  if (!nameOk && !typeOk) {
    uploadOk.value = false
    uploadMessage.value = 'Solo se admiten archivos Excel (.xlsx).'
    return
  }
  selectedFile.value = file
  void handleUpload()
}

function saveBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

function resolveServerFileName(fallback: string, detail?: UploadBatchDetailDto | null): string {
  if (detail?.fileName?.trim()) return detail.fileName
  return fallback
}

async function handleDownloadTemplate() {
  const blob = await downloadTemplate()
  saveBlob(blob, 'Plantilla porcentajes.xlsx')
}

async function handleDownloadOriginal(detail: UploadBatchDetailDto) {
  if (!detail.originalFileAvailable) return
  try {
    downloadingOriginal.value = true
    const blob = await downloadOriginalFile(detail.id)
    saveBlob(blob, resolveServerFileName(`upload-${detail.id}.xlsx`, detail))
  } catch (error: unknown) {
    queryMessage.value = getApiErrorMessage(error, 'No se pudo descargar el archivo original.')
  } finally {
    downloadingOriginal.value = false
  }
}

async function handleDownloadErrors(detail: UploadBatchDetailDto) {
  if (!detail.errorLogAvailable) return
  try {
    downloadingErrors.value = true
    const blob = await downloadErrors(detail.id)
    const safeBaseName = resolveServerFileName(`upload-${detail.id}`, detail).replace(/\.xlsx$/i, '')
    saveBlob(blob, `${safeBaseName}-errores.txt`)
  } catch (error: unknown) {
    queryMessage.value = getApiErrorMessage(error, 'No se pudo descargar el log de errores.')
  } finally {
    downloadingErrors.value = false
  }
}

async function handleUpload() {
  if (!selectedFile.value) return

  loadingUpload.value = true
  uploadMessage.value = ''
  try {
    const result = await uploadExcel(selectedFile.value)
    uploadOk.value = result.success
    uploadMessage.value = result.message || 'Carga procesada.'
    await loadUploads()
    scheduleUploadsAutoRefresh(true)
  } catch (error: unknown) {
    uploadOk.value = false
    uploadMessage.value = getApiErrorMessage(error, 'Error al subir archivo.')
  } finally {
    loadingUpload.value = false
  }
}

function clearUploadsAutoRefreshTimer() {
  if (!uploadsAutoRefreshTimer) return
  clearTimeout(uploadsAutoRefreshTimer)
  uploadsAutoRefreshTimer = null
}

function hasActiveUploadProcessing(rows: UploadBatchSummary[]): boolean {
  return rows.some((row) => {
    const status = String(row.status || '').toLowerCase()
    return ACTIVE_UPLOAD_STATUS_KEYWORDS.some((keyword) => status.includes(keyword))
  })
}

function scheduleUploadsAutoRefresh(forceFast = false) {
  clearUploadsAutoRefreshTimer()
  if (!isPygViewMounted.value) return

  const hasActiveProcessing = hasActiveUploadProcessing(uploads.value)
  let waitMs = hasActiveProcessing || forceFast ? UPLOADS_REFRESH_FAST_MS : UPLOADS_REFRESH_SLOW_MS
  if (typeof document !== 'undefined' && document.hidden) {
    waitMs = UPLOADS_REFRESH_HIDDEN_MS
  }

  uploadsAutoRefreshTimer = setTimeout(() => {
    uploadsAutoRefreshTimer = null
    void loadUploads()
  }, waitMs)
}

async function loadUploads() {
  if (loadingUploads.value) return
  loadingUploads.value = true
  queryMessage.value = ''
  try {
    uploads.value = await getUploads()
  } catch (error: unknown) {
    uploads.value = []
    queryMessage.value = getApiErrorMessage(
      error,
      'No se pudo cargar el historial de cargas PYG. Revisa proxy (VITE_PYG_PROXY_TARGET), permisos del contenedor y logs del backend.'
    )
  } finally {
    loadingUploads.value = false
    scheduleUploadsAutoRefresh()
  }
}

async function loadSheetRows(sheet: UploadSheetKey, resetPage = false) {
  if (!selectedBatchId.value) return
  const current = selectedRowsBySheet.value[sheet]
  const page = resetPage ? 1 : current.page
  selectedRowsBySheet.value[sheet] = await getUploadRows(selectedBatchId.value, {
    page,
    pageSize: current.pageSize,
    sheetName: SHEET_NAME_BY_KEY[sheet],
    isValid:
      rowsFilters.value.isValid === ''
        ? undefined
        : rowsFilters.value.isValid === 'true'
  })
}

async function reloadSheetRows(resetPage = false) {
  if (!selectedBatchId.value) return
  loadingRows.value = true
  try {
    await Promise.all([loadSheetRows('matriz', resetPage), loadSheetRows('tiendas', resetPage)])
  } catch (error: unknown) {
    queryMessage.value = getApiErrorMessage(error, 'No se pudo cargar el historial de filas del lote.')
  } finally {
    loadingRows.value = false
  }
}

async function openBatchDetail(batchId: number) {
  selectedBatchId.value = batchId
  showDetailPanel.value = true
  loadingDetail.value = true
  queryMessage.value = ''
  try {
    const fallbackDetail = buildDetailFallbackFromSummary(batchId)
    if (!fallbackDetail) throw new Error('No existe el lote seleccionado en el historial.')
    selectedBatchDetail.value = fallbackDetail
    selectedRowsBySheet.value = {
      matriz: { ...EMPTY_UPLOAD_ROWS_PAGE, batchId },
      tiendas: { ...EMPTY_UPLOAD_ROWS_PAGE, batchId }
    }
    await reloadSheetRows(true)
  } catch (error: unknown) {
    selectedBatchDetail.value = null
    queryMessage.value = getApiErrorMessage(error, 'No se pudo cargar el detalle de la carga.')
  } finally {
    loadingDetail.value = false
  }
}

function closeBatchDetail() {
  showDetailPanel.value = false
  selectedBatchId.value = null
  selectedBatchDetail.value = null
  selectedRowsBySheet.value = {
    matriz: { ...EMPTY_UPLOAD_ROWS_PAGE },
    tiendas: { ...EMPTY_UPLOAD_ROWS_PAGE }
  }
}

function onDetailKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeBatchDetail()
}

watch(showDetailPanel, (open) => {
  if (typeof document === 'undefined') return
  if (open) {
    document.addEventListener('keydown', onDetailKeydown)
    document.body.classList.add('overflow-hidden')
  } else {
    document.removeEventListener('keydown', onDetailKeydown)
    document.body.classList.remove('overflow-hidden')
  }
})

watch(
  () => selectedRowsBySheet.value.matriz.page,
  (next, prev) => {
    if (!selectedBatchId.value || next === prev) return
    void loadSheetRows('matriz', false)
  }
)

watch(
  () => selectedRowsBySheet.value.tiendas.page,
  (next, prev) => {
    if (!selectedBatchId.value || next === prev) return
    void loadSheetRows('tiendas', false)
  }
)

onMounted(async () => {
  isPygViewMounted.value = true
  await loadUploads()
})

watch(lastNotification, (notification) => {
  if (!notification) return
  if (notification.target_permission !== 'pyg.edit') return
  if (notification.metadata?.accion !== 'pyg_upload_completed') return
  void loadUploads()
})

onBeforeUnmount(() => {
  isPygViewMounted.value = false
  clearUploadsAutoRefreshTimer()
  if (typeof document !== 'undefined') {
    document.removeEventListener('keydown', onDetailKeydown)
    document.body.classList.remove('overflow-hidden')
  }
})
</script>
